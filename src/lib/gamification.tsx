import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type QuestId = 'sit_upright' | 'send_sticker' | 'win_duel';
export type StampId =
  | 'first_session'
  | 'streak_7'
  | 'first_duel'
  | 'gems_100'
  | 'streak_30'
  | 'perfect_week'
  | 'send_10'
  | 'rank_1'
  | 'gems_1000'
  | 'perfect_day'
  | 'level_20'
  | 'rare_sticker';

export interface Quest {
  id: QuestId;
  title: string;
  goal: number;
  progress: number;
  reward: number;
  completed: boolean;
  claimed: boolean;
}

export interface GamificationState {
  gems: number;
  xp: number;
  level: number;
  streak: number;
  lastSessionDate: string;
  todayPostureMinutes: number;
  todayDate: string;
  todayScore: number;
  quests: Record<QuestId, Quest>;
  ownedStickers: string[];
  earnedStamps: StampId[];
  stickersSent: number;
  duelsWon: number;
  activeDuel: boolean;
}

const STORAGE_KEY = 'spineSquad.v1';
const MAX_LEVEL = 20;
const XP_PER_LEVEL = 1000;

const todayStr = () => new Date().toISOString().slice(0, 10);

const defaultQuests = (): Record<QuestId, Quest> => ({
  sit_upright: {
    id: 'sit_upright',
    title: 'Sit upright for 30 mins',
    goal: 30,
    progress: 0,
    reward: 30,
    completed: false,
    claimed: false,
  },
  send_sticker: {
    id: 'send_sticker',
    title: 'Send a sticker to a friend',
    goal: 1,
    progress: 0,
    reward: 15,
    completed: false,
    claimed: false,
  },
  win_duel: {
    id: 'win_duel',
    title: 'Win a posture duel',
    goal: 1,
    progress: 0,
    reward: 50,
    completed: false,
    claimed: false,
  },
});

const defaultState = (): GamificationState => ({
  gems: 0,
  xp: 0,
  level: 1,
  streak: 0,
  lastSessionDate: '',
  todayPostureMinutes: 0,
  todayDate: todayStr(),
  todayScore: 0,
  quests: defaultQuests(),
  ownedStickers: [],
  earnedStamps: [],
  stickersSent: 0,
  duelsWon: 0,
  activeDuel: false,
});

const load = (): GamificationState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = { ...defaultState(), ...JSON.parse(raw) } as GamificationState;
    // Daily reset
    if (parsed.todayDate !== todayStr()) {
      parsed.todayDate = todayStr();
      parsed.todayPostureMinutes = 0;
      parsed.todayScore = 0;
      parsed.quests = defaultQuests();
    }
    return parsed;
  } catch {
    return defaultState();
  }
};

const save = (s: GamificationState) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
};

const STAMP_RULES: { id: StampId; check: (s: GamificationState) => boolean }[] = [
  { id: 'first_session', check: s => s.todayPostureMinutes >= 1 || s.lastSessionDate !== '' },
  { id: 'streak_7', check: s => s.streak >= 7 },
  { id: 'streak_30', check: s => s.streak >= 30 },
  { id: 'first_duel', check: s => s.duelsWon >= 1 },
  { id: 'gems_100', check: s => s.gems >= 100 },
  { id: 'gems_1000', check: s => s.gems >= 1000 },
  { id: 'perfect_week', check: s => s.streak >= 7 && s.todayScore >= 90 },
  { id: 'send_10', check: s => s.stickersSent >= 10 },
  { id: 'rank_1', check: s => s.todayScore >= 80 },
  { id: 'perfect_day', check: s => s.todayScore >= 95 },
  { id: 'level_20', check: s => s.level >= MAX_LEVEL },
  { id: 'rare_sticker', check: s => s.ownedStickers.includes('sleeping') },
];

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface Ctx {
  state: GamificationState;
  addGems: (n: number) => void;
  addXp: (n: number) => void;
  spendGems: (n: number) => boolean;
  buySticker: (id: string, cost: number) => boolean;
  sendSticker: () => void;
  winDuel: () => void;
  acceptDuel: () => void;
  claimQuest: (id: QuestId) => void;
  setTodayScore: (n: number) => void;
  newStamp: StampId | null;
  dismissStamp: () => void;
}

const GamificationCtx = createContext<Ctx | null>(null);

export const GamificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<GamificationState>(() => load());
  const [newStamp, setNewStamp] = useState<StampId | null>(null);
  const ws = (() => { try { return useWebSocket(); } catch { return null; } })();

  // Persist
  useEffect(() => { save(state); }, [state]);

  const updateAndCheckStamps = useCallback((updater: (s: GamificationState) => GamificationState) => {
    setState(prev => {
      let next = updater(prev);
      // Level
      const newLevel = Math.min(MAX_LEVEL, 1 + Math.floor(next.xp / XP_PER_LEVEL));
      if (newLevel !== next.level) next = { ...next, level: newLevel };
      // Stamps
      for (const rule of STAMP_RULES) {
        if (!next.earnedStamps.includes(rule.id) && rule.check(next)) {
          next = { ...next, earnedStamps: [...next.earnedStamps, rule.id] };
          setNewStamp(rule.id);
          break;
        }
      }
      return next;
    });
  }, []);

  const addGems = useCallback((n: number) => {
    updateAndCheckStamps(s => ({ ...s, gems: Math.max(0, s.gems + n) }));
  }, [updateAndCheckStamps]);

  const addXp = useCallback((n: number) => {
    updateAndCheckStamps(s => ({ ...s, xp: Math.max(0, s.xp + n) }));
  }, [updateAndCheckStamps]);

  const spendGems = useCallback((n: number) => {
    let ok = false;
    setState(s => {
      if (s.gems >= n) { ok = true; return { ...s, gems: s.gems - n }; }
      return s;
    });
    return ok;
  }, []);

  const buySticker = useCallback((id: string, cost: number) => {
    let ok = false;
    setState(s => {
      if (s.ownedStickers.includes(id)) { ok = true; return s; }
      if (s.gems < cost) return s;
      ok = true;
      return { ...s, gems: s.gems - cost, ownedStickers: [...s.ownedStickers, id] };
    });
    return ok;
  }, []);

  const sendSticker = useCallback(() => {
    updateAndCheckStamps(s => {
      const q = { ...s.quests };
      q.send_sticker = { ...q.send_sticker, progress: 1, completed: true };
      return { ...s, stickersSent: s.stickersSent + 1, quests: q };
    });
  }, [updateAndCheckStamps]);

  const winDuel = useCallback(() => {
    updateAndCheckStamps(s => {
      const q = { ...s.quests };
      q.win_duel = { ...q.win_duel, progress: 1, completed: true };
      return { ...s, duelsWon: s.duelsWon + 1, quests: q, activeDuel: false };
    });
  }, [updateAndCheckStamps]);

  const acceptDuel = useCallback(() => {
    setState(s => ({ ...s, activeDuel: true }));
  }, []);

  const claimQuest = useCallback((id: QuestId) => {
    updateAndCheckStamps(s => {
      const q = s.quests[id];
      if (!q.completed || q.claimed) return s;
      return {
        ...s,
        gems: s.gems + q.reward,
        xp: s.xp + q.reward * 2,
        quests: { ...s.quests, [id]: { ...q, claimed: true } },
      };
    });
  }, [updateAndCheckStamps]);

  const setTodayScore = useCallback((n: number) => {
    setState(s => s.todayScore === n ? s : { ...s, todayScore: n });
  }, []);

  const dismissStamp = useCallback(() => setNewStamp(null), []);

  // ---- Live tracking from WebSocket ----
  const lastAlertRef = useRef(false);
  const lastTickRef = useRef<number>(Date.now());
  const goodAccumRef = useRef<number>(0); // ms of good posture

  useEffect(() => {
    const msg = ws?.lastMessage;
    if (!msg) return;
    // Score
    if (typeof msg.good_posture_pct === 'number') {
      setTodayScore(Math.round(msg.good_posture_pct));
    }
    // Alert rising edge
    if (msg.alert_active && !lastAlertRef.current) {
      addGems(-1);
    }
    lastAlertRef.current = !!msg.alert_active;

    // Accumulate good posture time between updates
    const now = Date.now();
    const dt = now - lastTickRef.current;
    lastTickRef.current = now;
    if (msg.posture === 'UPRIGHT' && dt < 5000) {
      goodAccumRef.current += dt;
      while (goodAccumRef.current >= 60_000) {
        goodAccumRef.current -= 60_000;
        updateAndCheckStamps(s => {
          const minutes = s.todayPostureMinutes + 1;
          const q = { ...s.quests };
          const sit = q.sit_upright;
          const prog = Math.min(sit.goal, minutes);
          q.sit_upright = { ...sit, progress: prog, completed: prog >= sit.goal };
          // Streak: bump on first minute of a new day
          let streak = s.streak;
          let lastDate = s.lastSessionDate;
          if (lastDate !== s.todayDate) {
            const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
            streak = lastDate === yesterday ? streak + 1 : 1;
            lastDate = s.todayDate;
          }
          return {
            ...s,
            todayPostureMinutes: minutes,
            quests: q,
            gems: s.gems + 2,
            xp: s.xp + 5,
            streak,
            lastSessionDate: lastDate,
          };
        });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ws?.lastMessage]);

  return (
    <GamificationCtx.Provider value={{
      state, addGems, addXp, spendGems, buySticker, sendSticker, winDuel,
      acceptDuel, claimQuest, setTodayScore, newStamp, dismissStamp,
    }}>
      {children}
    </GamificationCtx.Provider>
  );
};

export const useGamification = () => {
  const ctx = useContext(GamificationCtx);
  if (!ctx) throw new Error('useGamification must be used within GamificationProvider');
  return ctx;
};

export const levelInfo = (xp: number) => {
  const level = Math.min(MAX_LEVEL, 1 + Math.floor(xp / XP_PER_LEVEL));
  const xpInLevel = xp % XP_PER_LEVEL;
  const pct = Math.min(100, Math.round((xpInLevel / XP_PER_LEVEL) * 100));
  return { level, xpInLevel, pct, xpToNext: XP_PER_LEVEL - xpInLevel };
};

export const evolutionName = (level: number) => {
  if (level < 5) return 'Capy Pup';
  if (level < 10) return 'Relaxed Capy';
  if (level < 15) return 'Wise Capy';
  if (level < 20) return 'Capy Master';
  return 'Legendary Capy';
};

export const STAMP_INFO: Record<StampId, { title: string; icon: string; sticker: string }> = {
  first_session: { title: 'First Session', icon: 'play_circle', sticker: 'sparkles' },
  streak_7: { title: '7-Day Streak', icon: 'local_fire_department', sticker: 'flex' },
  first_duel: { title: 'First Duel Won', icon: 'swords', sticker: 'crown' },
  gems_100: { title: '100 Gems Earned', icon: 'diamond', sticker: 'dumbbell' },
  streak_30: { title: '30-Day Streak', icon: 'whatshot', sticker: 'crown' },
  perfect_week: { title: 'Perfect Week', icon: 'star', sticker: 'sparkles' },
  send_10: { title: 'Send 10 Stickers', icon: 'send', sticker: 'running' },
  rank_1: { title: 'Squad Rank 1', icon: 'workspace_premium', sticker: 'flex' },
  gems_1000: { title: '1000 Gems Total', icon: 'auto_awesome', sticker: 'crown' },
  perfect_day: { title: 'Perfect Posture Day', icon: 'verified', sticker: 'sparkles' },
  level_20: { title: 'Level 20', icon: 'military_tech', sticker: 'crown' },
  rare_sticker: { title: 'Iceberg Capy Unlocked', icon: 'ac_unit', sticker: 'sleeping' },
};
