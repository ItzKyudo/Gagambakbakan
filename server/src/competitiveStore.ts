import { ServerError } from 'colyseus';
import { validateUnlockedSkills, validateSpiderProgress, SPIDER_STARTERS, type SpiderType } from './abilities';
import { getRankFromRating } from './ranks';
import { validateUsername } from './auth';

const url = process.env.SUPABASE_URL?.replace(/\/$/, '');
const publicKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const levelThresholds = [0, 100, 250, 450, 700, 1000, 1350, 1750, 2200, 2700, 3250, 3850];

export interface BattleIdentity {
  userId: string | null;
  name: string;
  rating: number;
  rank: string;
  level: number;
  unlockedSkills: string[];
  spiderProgress: Record<SpiderType, { exp: number; skills: string[] }>;
  isRanked: boolean;
  apexCrown: boolean;
  mythicLaurel: boolean;
}

export function levelFromExp(exp: number): number {
  let level = 1;
  while (level < levelThresholds.length && exp >= levelThresholds[level]) level++;
  let next = 3850;
  while (exp >= next + 600 + (level - 11) * 50 && level < 100) {
    next += 600 + (level - 11) * 50;
    level++;
  }
  return level;
}

async function request(path: string, key: string, init: RequestInit = {}): Promise<any> {
  if (!url) throw new ServerError(503, 'Online account service is not configured.');
  const response = await fetch(`${url}${path}`, {
    ...init,
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', ...init.headers },
    signal: AbortSignal.timeout(8000)
  });
  if (!response.ok) throw new ServerError(response.status === 401 ? 401 : 503, 'Online account service is unavailable.');
  return response.status === 204 ? null : response.json();
}

export async function authenticateBattle(token: string | undefined, ranked: boolean, requestedAcc?: string): Promise<BattleIdentity> {
  if (!token) {
    if (ranked) throw new ServerError(401, 'Sign in to play ranked.');
    return {
      userId: null, name: 'Guest', rating: 0, rank: 'wolf-spider', level: 1,
      unlockedSkills: validateUnlockedSkills([], 1), spiderProgress: validateSpiderProgress(null, [], 0, 'weaver'), isRanked: false,
      apexCrown: false, mythicLaurel: false
    };
  }
  if (!url || !publicKey || !serviceKey) throw new ServerError(503, 'Online account service is not configured.');
  const userResponse = await fetch(`${url}/auth/v1/user`, {
    headers: { apikey: publicKey, Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(8000)
  });
  if (!userResponse.ok) throw new ServerError(401, 'Session expired. Sign in again.');
  const user = await userResponse.json() as { id?: string };
  if (!user.id) throw new ServerError(401, 'Session expired. Sign in again.');
  const rows = await request(`/rest/v1/profiles?id=eq.${encodeURIComponent(user.id)}&select=id,username,rating,online_exp,unlocked_skills,spider_exp,spider_skills,looks`, serviceKey);
  const profile = rows?.[0];
  if (!profile) throw new ServerError(403, 'Account profile is missing.');
  const rating = Math.max(0, Number(profile.rating) || 0);
  const level = levelFromExp(Math.max(0, Number(profile.online_exp) || 0));
  const [rankLeader, levelLeader] = requestedAcc === 'apex_crown' || requestedAcc === 'mythic_laurel'
    ? await Promise.all([
      request('/rest/v1/profiles?select=id&order=rating.desc,username.asc&limit=1', serviceKey),
      request('/rest/v1/profiles?select=id&order=online_exp.desc,username.asc&limit=1', serviceKey)
    ])
    : [[], []];
  return {
    userId: user.id,
    name: validateUsername(profile.username).clean || 'Player',
    rating,
    rank: getRankFromRating(rating).id,
    level,
    unlockedSkills: validateUnlockedSkills(profile.unlocked_skills, level),
    spiderProgress: validateSpiderProgress(
      profile.spider_exp && profile.spider_skills
        ? Object.fromEntries((Object.keys(SPIDER_STARTERS) as SpiderType[]).map(species => [species, {
            exp: profile.spider_exp[species] || 0,
            skills: profile.spider_skills[species] || []
          }]))
        : null,
      profile.unlocked_skills, Number(profile.online_exp) || 0, profile.looks?.p1?.species
    ),
    isRanked: ranked,
    apexCrown: rankLeader?.[0]?.id === user.id,
    mythicLaurel: levelLeader?.[0]?.id === user.id
  };
}

export async function recordBattleResult(
  matchId: string,
  p1Id: string | null,
  p2Id: string | null,
  winner: number,
  p1Wins: number,
  p2Wins: number,
  ranked: boolean,
  p1Species: SpiderType,
  p2Species: SpiderType
): Promise<void> {
  if (!p1Id && !p2Id) return;
  if (!serviceKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY is missing.');
  await request('/rest/v1/rpc/record_battle_result', serviceKey, {
    method: 'POST',
    body: JSON.stringify({
      p_match_id: matchId, p_p1: p1Id, p_p2: p2Id, p_winner: winner,
      p_p1_rounds: p1Wins, p_p2_rounds: p2Wins, p_ranked: ranked,
      p_p1_species: p1Species, p_p2_species: p2Species
    })
  });
}
