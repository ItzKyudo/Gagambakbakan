import { getAuthUser, supabase } from './auth';

export const MATCH_MODES = { cpu: 'vs AI', '2p': 'Local PvP', online: 'Casual online', ranked: 'Ranked' } as const;
export type MatchMode = keyof typeof MATCH_MODES;
export interface MatchRecord {
  id: string;
  player_slot: 'p1' | 'p2';
  mode: MatchMode;
  opponent: string;
  won: boolean;
  rounds_won: number;
  rounds_lost: number;
  played_at: string;
}

export async function saveMatchHistory(records: Omit<MatchRecord, 'id' | 'played_at'>[]) {
  const user = getAuthUser();
  if (!user || !supabase) return;
  const played_at = new Date().toISOString();
  try {
    const { error } = await supabase.from('match_history').insert(records.map(record => ({
      ...record, id: crypto.randomUUID(), user_id: user.id, played_at
    })));
    if (error) throw error;
  } catch (error) {
    console.warn('Match history could not be saved:', error);
  }
}

export async function fetchMatchHistory(slot: 'p1' | 'p2'): Promise<MatchRecord[]> {
  const user = getAuthUser();
  if (!user || !supabase) throw new Error('Sign in to view match history.');
  const records: MatchRecord[] = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await supabase.from('match_history')
      .select('id, player_slot, mode, opponent, won, rounds_won, rounds_lost, played_at')
      .eq('user_id', user.id).eq('player_slot', slot)
      .order('played_at', { ascending: false }).order('id', { ascending: false })
      .range(offset, offset + 999);
    if (error) throw error;
    records.push(...(data ?? []));
    if (!data || data.length < 1000) return records;
  }
}

export function summarizeMatches(records: MatchRecord[]) {
  const wins = records.filter(record => record.won).length;
  return { played: records.length, wins, losses: records.length - wins,
    winRate: records.length ? Math.round(wins / records.length * 100) : 0 };
}
