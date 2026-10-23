import { createClient, type User, type SupabaseClient } from '@supabase/supabase-js';
import { getLooks, saveLooks } from './gb';

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export interface UserProfile {
  id: string;
  username: string;
  rating?: number;
  wins?: number;
  losses?: number;
}

let currentUser: User | null = null;
let currentProfile: UserProfile | null = null;
type AuthListener = () => void;
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

function notify() {
  listeners.forEach(fn => fn());
}

export async function fetchProfile(userId: string): Promise<UserProfile | null> {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, rating, wins, losses')
      .eq('id', userId)
      .maybeSingle();

    if (error || !data) {
      const metaUsername = currentUser?.user_metadata?.username;
      if (metaUsername) {
        return { id: userId, username: metaUsername, rating: 1000, wins: 0, losses: 0 };
      }
      return null;
    }
    return data as UserProfile;
  } catch {
    return null;
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

  supabase.auth.onAuthStateChange(async (_event, session) => {
    currentUser = session?.user || null;
    if (currentUser) {
      currentProfile = await fetchProfile(currentUser.id);
      syncNameWithProfile();
    } else {
      currentProfile = null;
    }
    notify();
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

  const options: { data: { username: string }; captchaToken?: string } = {
    data: { username: cleanUser }
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
