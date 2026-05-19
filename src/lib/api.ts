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

export function isMockMode(): boolean {
  return !getApiConfig().baseUrl;
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

export async function fetchSummary(
  deviceId: string,
  date: string,
): Promise<DailySummary> {
  if (isMockMode()) return mockSummary(deviceId, date);
  return request<DailySummary>(
    `/summary?device_id=${encodeURIComponent(deviceId)}&date=${encodeURIComponent(date)}`,
  );
}

export async function fetchSummaries(
  deviceId: string,
  from: string,
  to: string,
): Promise<DailySummary[]> {
  const dates: string[] = [];
  let current = new Date(from);
  const endDate = new Date(to);
  while (current <= endDate) {
    dates.push(current.toISOString().slice(0, 10));
    current.setDate(current.getDate() + 1);
  }
  return Promise.all(dates.map((date) => fetchSummary(deviceId, date)));
}

export async function fetchSessions(
  deviceId: string,
  from: string,
  to: string,
  limit: number = 100,
  offset: number = 0
): Promise<SessionsResponse> {
  if (isMockMode()) return mockSessions(deviceId, from, to, limit, offset);
  return request<SessionsResponse>(
    `/sessions?device_id=${encodeURIComponent(deviceId)}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&limit=${limit}&offset=${offset}&sort_by=session_start&order=desc`,
  );
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

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

/** Make 9 percentages that sum to 100, deterministic per (device, date). */
function mockNineLabel(seed: number): PostureDistributionPct {
  // Pick a believable distribution: NUP dominant, LF/LFSR moderate, others small.
  const nup  = 45 + (seed       % 20);   // 45–64
  const lf   = 8  + ((seed >> 3)  % 8);  // 8–15
  const lfsr = 5  + ((seed >> 6)  % 6);  // 5–10
  const lfsl = 3  + ((seed >> 9)  % 5);  // 3–7
  const lb   = 2  + ((seed >> 12) % 4);  // 2–5
  const crl  = 2  + ((seed >> 15) % 4);
  const cll  = 2  + ((seed >> 18) % 4);
  const crll = 1  + ((seed >> 21) % 3);
  // Whatever's left to make 100 goes into clll, clamped to 0+
  const clll = Math.max(0, 100 - (nup + lf + lfsr + lfsl + lb + crl + cll + crll));
  return {
    nup_pct:  nup,
    lf_pct:   lf,
    lb_pct:   lb,
    lfsr_pct: lfsr,
    lfsl_pct: lfsl,
    crl_pct:  crl,
    cll_pct:  cll,
    crll_pct: crll,
    clll_pct: clll,
  };
}

function mockSummary(deviceId: string, date: string): DailySummary {
  const r = hash(`${deviceId}|${date}`);
  const totalMin = 60 + (r % 240); // 1–5 hours
  const totalSec = totalMin * 60;
  const poorSec  = Math.round(totalSec * (0.15 + ((r >> 4) % 30) / 100));
  return {
    schema_version: '1.0',
    device_id: deviceId,
    date,
    total_sitting_duration_sec: totalSec,
    poor_posture_duration_sec:  poorSec,
    alert_count: 2 + ((r >> 20) % 12),
    posture_distribution_pct: mockNineLabel(r),
  };
}

function mockSessions(
  deviceId: string,
  from: string,
  to: string,
  limit: number,
  offset: number,
): SessionsResponse {
  const sessions: SessionRecord[] = [];
  const start = new Date(from);
  const end = new Date(to);
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().slice(0, 10);
    const r = hash(`${deviceId}|${dateStr}`);
    const count = 1 + (r % 3);
    for (let i = 0; i < count; i++) {
      const startHour = 9 + i * 3 + ((r >> (i * 2)) % 2);
      const durMin = 30 + ((r >> (i * 3)) % 90);
      const durSec = durMin * 60;
      const startDt = new Date(d);
      startDt.setHours(startHour, (r >> 4) % 60, 0, 0);
      const endDt = new Date(startDt.getTime() + durSec * 1000);
      sessions.push({
        session_id: `mock-${dateStr}-${i}`,
        start_time_iso: startDt.toISOString(),
        end_time_iso: endDt.toISOString(),
        duration_sec: durSec,
        poor_posture_duration_sec: Math.round(durSec * (0.1 + ((r >> (i + 5)) % 30) / 100)),
        alert_count: ((r >> (i + 7)) % 10),
      });
    }
  }

  // Sort descending by start time (newest first)
  sessions.sort((a, b) => new Date(b.start_time_iso).getTime() - new Date(a.start_time_iso).getTime());

  const total_count = sessions.length;
  const paginatedSessions = sessions.slice(offset, offset + limit);

  return { 
    schema_version: '1.0', 
    device_id: deviceId, 
    total_count,
    aggregates: {
      total_duration_sec: sessions.reduce((s, x) => s + x.duration_sec, 0),
      total_poor_duration_sec: sessions.reduce((s, x) => s + x.poor_posture_duration_sec, 0),
      total_alerts: sessions.reduce((s, x) => s + x.alert_count, 0),
    },
    sessions: paginatedSessions 
  };
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function isoDaysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}
