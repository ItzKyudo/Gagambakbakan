import { createClient, type User, type SupabaseClient } from '@supabase/supabase-js';
import {
  getLooks,
  getProgress,
  saveLooks,
  saveProgress,
  registerDataPersistHook,
  type OnlineMatchReward,
  type ProgressData,
  type SpiderLook
} from './gb';
import { getRankFromRating, type SpiderRankId } from './ui/menu/rankTitle';

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export interface UserProfile {
  id: string;
  username: string;
  rating: number;
  rank: SpiderRankId;
  wins: number;
  losses: number;
  played: number;
  winRate: number;
  onlineExp: number;
  unlockedSkills?: string[];
}

let currentUser: User | null = null;
let currentProfile: UserProfile | null = null;
export type AuthListener = (event?: string) => void;
const listeners = new Set<AuthListener>();

export function getAuthUser(): User | null {
  return currentUser;
}

export function getUserProfile(): UserProfile | null {
  return currentProfile;
}

export function subscribeAuth(fn: AuthListener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

function notify(event?: string) {
  listeners.forEach(fn => fn(event));
}

export async function fetchProfile(userId: string): Promise<UserProfile | null> {
  if (!supabase) return null;

  try {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    const meta = currentUser?.user_metadata || {};
    const metaUsername = meta.username;
    const username = data?.username || metaUsername || 'Player';
    const rating = typeof data?.rating === 'number' ? data.rating : (typeof meta.rating === 'number' ? meta.rating : 0);
    const wins = typeof data?.wins === 'number' ? data.wins : (typeof meta.wins === 'number' ? meta.wins : 0);
    const losses = typeof data?.losses === 'number' ? data.losses : (typeof meta.losses === 'number' ? meta.losses : 0);
    const played = typeof data?.matches === 'number' ? data.matches : (typeof meta.played === 'number' ? meta.played : wins + losses);
    const winRate = played > 0 ? Math.round((wins / played) * 100) : 0;
    const onlineExp = typeof data?.online_exp === 'number' ? data.online_exp : (typeof meta.onlineExp === 'number' ? meta.onlineExp : 0);
    const unlockedSkills = Array.isArray(data?.unlocked_skills) ? data.unlocked_skills : (Array.isArray(meta.unlockedSkills) ? meta.unlockedSkills : undefined);
    const rank = (data?.rank || meta.rank || getRankFromRating(rating).id) as SpiderRankId;

    // Restore database data into game state (authenticated account data is authoritative)
    const localProg = getProgress();
    const finalProg: ProgressData = {
      ...localProg,
      rating: typeof rating === 'number' ? rating : 0,
      rank: rank || 'wolf-spider',
      wins: wins || 0,
      losses: losses || 0,
      played: played || 0,
      winRate: winRate || 0,
      onlineExp: onlineExp || 0,
      onlinePlayed: played || 0,
      onlineWins: wins || 0,
      onlineLosses: losses || 0,
      unlockedSkills: (unlockedSkills && unlockedSkills.length > 0) ? unlockedSkills : ['dash']
    };
    saveProgress(finalProg);

    const looksData = meta.looks || data?.looks;
    if (looksData?.p1) {
      saveLooks(looksData);
    }

    const profile: UserProfile = {
      id: userId,
      username,
      rating,
      rank,
      wins,
      losses,
      played,
      winRate,
      onlineExp,
      unlockedSkills: finalProg.unlockedSkills
    };
    return profile;
  } catch (err) {
    console.warn('fetchProfile error:', err);
    return null;
  }
}

export async function syncBattleResultToDatabase(
  reward: OnlineMatchReward,
  looks?: { p1: SpiderLook; p2: SpiderLook }
): Promise<void> {
  if (!supabase || !currentUser) return;

  try {
    const profileUpdate: Record<string, any> = {
      rating: reward.newRating,
      wins: reward.totalWins,
      losses: reward.totalLosses,
      updated_at: new Date().toISOString()
    };

    // 1. Update public profiles table
    const { error: fullUpdateErr } = await supabase
      .from('profiles')
      .update({
        ...profileUpdate,
        rank: reward.rank,
        matches: reward.totalPlayed,
        win_rate: reward.winRate,
        online_exp: reward.progress.totalExp
      })
      .eq('id', currentUser.id);

    // If extended columns do not exist in profiles table yet (PGRST204), update base columns
    if (fullUpdateErr && fullUpdateErr.code === 'PGRST204') {
      await supabase.from('profiles').update(profileUpdate).eq('id', currentUser.id);
    }

    // 2. Persist full state to auth.users raw_user_meta_data JSONB in Postgres
    await supabase.auth.updateUser({
      data: {
        rating: reward.newRating,
        rank: reward.rank,
        wins: reward.totalWins,
        losses: reward.totalLosses,
        played: reward.totalPlayed,
        winRate: reward.winRate,
        onlineExp: reward.progress.totalExp,
        unlockedSkills: getProgress().unlockedSkills,
        looks: looks || getLooks()
      }
    });

    if (currentProfile) {
      currentProfile.rating = reward.newRating;
      currentProfile.rank = reward.rank;
      currentProfile.wins = reward.totalWins;
      currentProfile.losses = reward.totalLosses;
      currentProfile.played = reward.totalPlayed;
      currentProfile.winRate = reward.winRate;
      currentProfile.onlineExp = reward.progress.totalExp;
    }
    notify();
  } catch (err) {
    console.warn('Failed to sync match result to database:', err);
  }
}

export async function syncUserDataToDatabase(): Promise<void> {
  if (!supabase || !currentUser) return;
  try {
    const prog = getProgress();
    const looks = getLooks();
    await supabase.auth.updateUser({
      data: {
        rating: prog.rating,
        rank: prog.rank,
        wins: prog.wins,
        losses: prog.losses,
        played: prog.played,
        winRate: prog.winRate,
        onlineExp: prog.onlineExp,
        unlockedSkills: prog.unlockedSkills,
        looks
      }
    });
  } catch (err) {
    console.warn('Failed to sync user data to database:', err);
  }
}

function syncNameWithProfile() {
  if (currentProfile?.username) {
    const looks = getLooks();
    if (looks.p1.name !== currentProfile.username) {
      looks.p1.name = currentProfile.username;
      saveLooks(looks);
    }
  }
}

let authInitialized = false;

registerDataPersistHook(() => {
  if (currentUser) {
    syncUserDataToDatabase().catch(() => {});
  }
});

export async function initAuth(): Promise<void> {
  if (!supabase || authInitialized) return;
  authInitialized = true;

  try {
    const { data } = await supabase.auth.getSession();
    currentUser = data.session?.user || null;
    if (currentUser) {
      currentProfile = await fetchProfile(currentUser.id);
      syncNameWithProfile();
    }
  } catch (err) {
    console.warn('Supabase getSession error:', err);
  }

  supabase.auth.onAuthStateChange(async (event, session) => {
    const newUser = session?.user || null;
    const sameUser = Boolean(currentUser?.id && newUser?.id && currentUser.id === newUser.id);

    if (event === 'TOKEN_REFRESHED' && sameUser) {
      // Token refreshed silently in background; session user hasn't changed.
      // Do not re-fetch profile or trigger UI re-renders on window blur/focus.
      currentUser = newUser;
      return;
    }

    currentUser = newUser;
    if (currentUser) {
      currentProfile = await fetchProfile(currentUser.id);
      syncNameWithProfile();
    } else {
      currentProfile = null;
      cachedPodiumStatus = null;
    }
    notify(event);
  });
}

export function validateUsername(username: string): { ok: boolean; message?: string; clean?: string } {
  const clean = (username || '').trim();
  if (clean.length < 3 || clean.length > 10) {
    return { ok: false, message: 'Username must be between 3 and 10 characters.' };
  }
  if (!/^[a-zA-Z0-9_]+$/.test(clean)) {
    return { ok: false, message: 'Username can only contain letters, numbers, and underscores.' };
  }
  return { ok: true, clean };
}

export async function signUpUser(
  email: string,
  pass: string,
  username: string,
  captchaToken?: string
): Promise<{ ok: boolean; message?: string; needsConfirmation?: boolean }> {
  if (!supabase) {
    return { ok: false, message: 'Supabase configuration is missing in .env.' };
  }

  const userCheck = validateUsername(username);
  if (!userCheck.ok || !userCheck.clean) {
    return { ok: false, message: userCheck.message };
  }
  const cleanUser = userCheck.clean;

  // Pre-check if username is already taken in public profiles
  try {
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', cleanUser)
      .maybeSingle();

    if (existing) {
      return { ok: false, message: 'This username is already taken. Please pick another.' };
    }
  } catch {
    // If profiles table has restricted select or doesn't exist yet, continue to signUp
  }

  const looks = getLooks();
  // New accounts always start in the lowest rank (wolf-spider) with 0 rating
  const options: { data: Record<string, any>; captchaToken?: string } = {
    data: {
      username: cleanUser,
      rating: 0,
      rank: 'wolf-spider',
      wins: 0,
      losses: 0,
      played: 0,
      winRate: 0,
      onlineExp: 0,
      unlockedSkills: ['dash'],
      looks
    }
  };
  if (captchaToken) {
    options.captchaToken = captchaToken;
  }

  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password: pass,
    options
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  // Reset local state to lowest rank with 0 rating for the new account
  saveProgress({
    rating: 0,
    rank: 'wolf-spider',
    wins: 0,
    losses: 0,
    played: 0,
    winRate: 0,
    onlineExp: 0,
    onlinePlayed: 0,
    onlineWins: 0,
    onlineLosses: 0,
    unlockAll: false,
    unlockedSkills: ['dash']
  });

  currentUser = data.user;
  if (data.session) {
    currentProfile = await fetchProfile(data.user!.id);
    syncNameWithProfile();
    notify();
    return { ok: true, needsConfirmation: false };
  }

  // Session is null -> Email verification required
  return { ok: true, needsConfirmation: true };
}

export async function signInUser(
  email: string,
  pass: string,
  captchaToken?: string
): Promise<{ ok: boolean; message?: string }> {
  if (!supabase) {
    return { ok: false, message: 'Supabase configuration is missing in .env.' };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password: pass,
    options: captchaToken ? { captchaToken } : undefined
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  currentUser = data.user;
  currentProfile = await fetchProfile(data.user.id);
  syncNameWithProfile();
  notify();
  return { ok: true };
}

export async function signOutUser(): Promise<void> {
  if (!supabase) return;
  await supabase.auth.signOut();
  currentUser = null;
  currentProfile = null;
  notify();
}

let cachedPodiumStatus: { isTop1Rank: boolean; isTop1Level: boolean; timestamp: number } | null = null;

export async function fetchPodiumChampionStatus(force = false): Promise<{ isTop1Rank: boolean; isTop1Level: boolean }> {
  const p = getProgress();
  if (p.unlockAll) return { isTop1Rank: true, isTop1Level: true };

  const now = Date.now();
  if (!force && cachedPodiumStatus && (now - cachedPodiumStatus.timestamp < 30000)) {
    return { isTop1Rank: cachedPodiumStatus.isTop1Rank, isTop1Level: cachedPodiumStatus.isTop1Level };
  }

  const user = getAuthUser();
  if (!user || !supabase) {
    return { isTop1Rank: false, isTop1Level: false };
  }

  try {
    const [levelRes, rankRes] = await Promise.all([
      supabase.from('profiles').select('id').order('online_exp', { ascending: false, nullsFirst: false }).order('username', { ascending: true }).limit(1),
      supabase.from('profiles').select('id').order('rating', { ascending: false, nullsFirst: false }).order('username', { ascending: true }).limit(1)
    ]);
    const isTop1Level = levelRes.data?.[0]?.id === user.id;
    const isTop1Rank = rankRes.data?.[0]?.id === user.id;
    cachedPodiumStatus = { isTop1Rank, isTop1Level, timestamp: now };
    return { isTop1Rank, isTop1Level };
  } catch (err) {
    console.warn('fetchPodiumChampionStatus error:', err);
    return { isTop1Rank: false, isTop1Level: false };
  }
}

export function getCachedPodiumChampionStatus(): { isTop1Rank: boolean; isTop1Level: boolean } {
  const p = getProgress();
  if (p.unlockAll) return { isTop1Rank: true, isTop1Level: true };
  if (!cachedPodiumStatus) return { isTop1Rank: false, isTop1Level: false };
  return { isTop1Rank: cachedPodiumStatus.isTop1Rank, isTop1Level: cachedPodiumStatus.isTop1Level };
}
