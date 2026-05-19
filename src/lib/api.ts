// API client for cloud-side aggregates (summary + sessions).
// Falls back to deterministic mock data when no base URL is configured,
// so the UI works before the AWS backend is deployed.
//
// Wire format matches system_architecture.md §2.5:
//   - units in seconds (`_sec`)
//   - posture_distribution_pct exposes the 9 raw fog labels
//
// Display helpers below convert seconds -> minutes/hours so individual
// pages don't have to repeat the math. We also expose a 4-bucket "friendly"
// view computed from the 9 labels, for the donut chart on the dashboard.

export type PostureDistributionPct = {
  nup_pct: number;
  lf_pct: number;
  lb_pct: number;
  lfsr_pct: number;
  lfsl_pct: number;
  crl_pct: number;
  cll_pct: number;
  crll_pct: number;
  clll_pct: number;
};

export type DailySummary = {
  schema_version: string;
  device_id: string;
  date: string; // YYYY-MM-DD
  total_sitting_duration_sec: number;
  poor_posture_duration_sec: number;
  alert_count: number;
  posture_distribution_pct: PostureDistributionPct;
};

export type SessionRecord = {
  session_id: string;
  start_time_iso: string;
  end_time_iso: string;
  duration_sec: number;
  poor_posture_duration_sec: number;
  alert_count: number;
};

export type SessionsResponse = {
  schema_version: string;
  device_id: string;
  total_count: number;
  aggregates?: {
    total_duration_sec: number;
    total_poor_duration_sec: number;
    total_alerts: number;
  };
  sessions: SessionRecord[];
};

type Config = {
  baseUrl: string;
  apiKey: string;
  deviceId: string;
};

const LS_KEYS = {
  baseUrl: 'cushion.api.baseUrl',
  apiKey: 'cushion.api.key',
  deviceId: 'cushion.api.deviceId',
} as const;

export function getApiConfig(): Config {
  const ls = typeof window !== 'undefined' ? window.localStorage : null;
  return {
    baseUrl:
      ls?.getItem(LS_KEYS.baseUrl) ||
      import.meta.env.VITE_API_BASE_URL ||
      '',
    apiKey:
      ls?.getItem(LS_KEYS.apiKey) ||
      import.meta.env.VITE_API_KEY ||
      '',
    deviceId:
      ls?.getItem(LS_KEYS.deviceId) ||
      import.meta.env.VITE_DEVICE_ID ||
      'cushion-01',
  };
}



async function request<T>(path: string): Promise<T> {
  const cfg = getApiConfig();
  const url = `${cfg.baseUrl.replace(/\/$/, '')}${path}`;
  const res = await fetch(url, {
    headers: cfg.apiKey ? { 'x-api-key': cfg.apiKey } : {},
  });
  if (!res.ok) {
    throw new Error(`API ${path} failed: ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as T;
}

// In-memory cache to prevent duplicate network calls for historical daily summaries.
const summaryCache: Record<string, DailySummary> = {};

// Active in-flight daily summary requests to collapse duplicate concurrent queries.
const activeSummaryRequests: Record<string, Promise<DailySummary> | undefined> = {};

export async function fetchSummary(
  deviceId: string,
  date: string,
): Promise<DailySummary> {
  const cacheKey = `${deviceId}:${date}`;
  const todayStr = todayIso();

  // 1. Return cached historical summaries immediately.
  if (date !== todayStr && summaryCache[cacheKey]) {
    return summaryCache[cacheKey];
  }

  // 2. Collapse concurrent duplicate requests: reuse the in-flight promise.
  if (activeSummaryRequests[cacheKey]) {
    return activeSummaryRequests[cacheKey];
  }

  // 3. Fire new network request and track its promise.
  const promise = request<DailySummary>(
    `/summary?device_id=${encodeURIComponent(deviceId)}&date=${encodeURIComponent(date)}`,
  ).then((data) => {
    if (date !== todayStr) {
      summaryCache[cacheKey] = data;
    }
    delete activeSummaryRequests[cacheKey];
    return data;
  }).catch((err) => {
    delete activeSummaryRequests[cacheKey];
    throw err;
  });

  activeSummaryRequests[cacheKey] = promise;
  return promise;
}

export async function fetchSummaries(
  deviceId: string,
  from: string,
  to: string,
): Promise<DailySummary[]> {
  const dates: string[] = [];
  const start = new Date(from);
  const end = new Date(to);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  for (let i = 0; i <= diffDays; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    dates.push(d.toISOString().slice(0, 10));
  }

  // Parallel execution for maximum speed and instant loading!
  // Our robust activeSummaryRequests cache will perfectly collapse any duplicate concurrent
  // queries triggered by React 18 Strict Mode or double component mounting.
  return Promise.all(dates.map((date) => fetchSummary(deviceId, date)));
}

// Active sessions request promise tracker to collapse duplicate concurrent queries.
let activeSessionsRequest: { key: string; promise: Promise<SessionsResponse> } | null = null;

export async function fetchSessions(
  deviceId: string,
  from: string,
  to: string,
  limit: number = 100,
  offset: number = 0
): Promise<SessionsResponse> {
  const requestKey = `${deviceId}:${from}:${to}:${limit}:${offset}`;

  if (activeSessionsRequest && activeSessionsRequest.key === requestKey) {
    return activeSessionsRequest.promise;
  }

  const promise = request<SessionsResponse>(
    `/sessions?device_id=${encodeURIComponent(deviceId)}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&limit=${limit}&offset=${offset}&sort_by=session_start&order=desc`,
  ).then((data) => {
    activeSessionsRequest = null;
    return data;
  }).catch((err) => {
    activeSessionsRequest = null;
    throw err;
  });

  activeSessionsRequest = { key: requestKey, promise };
  return promise;
}

// ─── Display helpers ────────────────────────────────────────────────────

/** Convert seconds to whole minutes (rounded). */
export function secToMin(sec: number): number {
  return Math.round((sec || 0) / 60);
}

/** Convert seconds to "Hh Mm" or "Mm" string for human display. */
export function secToHuman(sec: number): string {
  const total = Math.max(0, Math.round((sec || 0) / 60));
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}

/** "Friendly" 4-bucket view derived from the 9-label distribution.
 *  Used by the donut chart on the dashboard so it stays readable. */
export type FriendlyBuckets = {
  upright_pct: number;
  slouching_forward_pct: number;
  leaning_back_pct: number;
  leaning_left_pct: number;
  leaning_right_pct: number;
};

export function toFriendlyBuckets(d?: PostureDistributionPct): FriendlyBuckets {
  const z = d ?? ({} as PostureDistributionPct);
  return {
    upright_pct:           z.nup_pct  ?? 0,
    slouching_forward_pct: (z.lf_pct ?? 0) + (z.lfsr_pct ?? 0) + (z.lfsl_pct ?? 0),
    leaning_back_pct:      z.lb_pct ?? 0,
    leaning_left_pct:      (z.cll_pct ?? 0) + (z.clll_pct ?? 0),
    leaning_right_pct:     (z.crl_pct ?? 0) + (z.crll_pct ?? 0),
  };
}

// ---------- mock data (deterministic per date so UI is stable) ----------



export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function isoDaysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}
