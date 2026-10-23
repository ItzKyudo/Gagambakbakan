import { Client, Room } from 'colyseus.js';
import { normalizeRankId } from './ui/menu/rankTitle';

export interface NetworkCallbacks {
  onAssigned?: (data: { id: number; name: string }) => void;
  onStateChange?: (state: any) => void;
  onFx?: (fx: any) => void;
  onSnd?: (snd: { name: string }) => void;
  onShake?: (shake: { amount: number }) => void;
  onRoundStart?: (data: { round: number }) => void;
  onDraftStart?: (data: { choicesP1: string[]; choicesP2: string[] }) => void;
  onPlayerDrafted?: (data: { id: number; skill1: string; skill2: string }) => void;
  onRoundWon?: (data: { winner: number; round: number; p1Wins: number; p2Wins: number }) => void;
  onMatchEnd?: (data: { winner: number; winnerName: string; p1Wins: number; p2Wins: number; forfeit?: boolean }) => void;
  onRematchVote?: (data: { count: number; ready: boolean }) => void;
  onPlayerLeft?: (data: { winner?: number; sessionId?: string }) => void;
  onError?: (err: any) => void;
  onDisconnect?: () => void;
}

export interface PlayerProfile {
  name: string;
  color?: string;
  colorDark?: string;
  colorLight?: string;
  pattern?: string;
  customPattern?: string;
  acc?: string;
  level?: number;
  rank?: string;
  rating?: number;
  isRanked?: boolean;
  unlockedSkills?: string[];
}

export const PRODUCTION_SERVER_URL = 'https://gagambakbakan.onrender.com';
export const LOCAL_SERVER_URL = 'http://localhost:2567';

export class NetworkManager {
  private client: Client | null = null;
  public room: Room | null = null;
  public myPlayerId: number = -1; // 0 for Amber, 1 for Jade
  public serverUrl: string = PRODUCTION_SERVER_URL;

  constructor() {
    this.serverUrl = this.resolveServerUrl();
  }

  public resolveServerUrl(): string {
    // 1. URL parameter override: ?server=local or ?server=render or custom URL
    if (typeof window !== 'undefined' && window.location) {
      try {
        const params = new URLSearchParams(window.location.search);
        const serverParam = params.get('server');
        if (serverParam) {
          if (serverParam === 'local') return LOCAL_SERVER_URL;
          if (serverParam === 'render' || serverParam === 'prod') return PRODUCTION_SERVER_URL;
          return serverParam;
        }

        // 2. localStorage override
        const stored = localStorage.getItem('gb_server_url');
        if (stored) return stored;
      } catch (e) {
        // ignore storage errors
      }
    }

    // 3. Vite environment variable
    if (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SERVER_URL) {
      return (import.meta as any).env.VITE_SERVER_URL;
    }

    // 4. Default to Render production server
    return PRODUCTION_SERVER_URL;
  }

  public setServerUrl(url: string) {
    this.serverUrl = url;
    this.client = null;
    try {
      localStorage.setItem('gb_server_url', url);
    } catch {}
  }

  public async pingServer(): Promise<{ ok: boolean; status?: string; latency?: number; error?: string }> {
    const start = performance.now();
    try {
      const httpBase = this.serverUrl.replace(/^ws(s)?:/, 'http$1:');
      const res = await fetch(`${httpBase}/health`, { signal: AbortSignal.timeout(6000) });
      if (res.ok) {
        const data = await res.json();
        return { ok: true, status: data.status, latency: Math.round(performance.now() - start) };
      }
      return { ok: false, error: `HTTP ${res.status}` };
    } catch (err: any) {
      return { ok: false, error: err.message || 'Timeout' };
    }
  }

  public callbacks: NetworkCallbacks = {};

  public setCallbacks(callbacks: NetworkCallbacks) {
    this.callbacks = callbacks;
  }

  private initClient(callbacks?: NetworkCallbacks): Client {
    if (callbacks) {
      this.callbacks = callbacks;
    }
    const client = new Client(this.serverUrl);
    this.client = client;

    // shortcut: Colyseus 0.18 server response needs seat reservation restructured on colyseus.js 0.16 client, upgrade when colyseus.js 0.18 is available.
    const origConsume = (client as any).consumeSeatReservation.bind(client);
    (client as any).consumeSeatReservation = function (response: any, rootSchema?: any, reuseRoomInstance?: any) {
      if (response && !response.room && response.roomId) {
        response.room = {
          name: response.name,
          roomId: response.roomId,
          processId: response.processId
        };
      }
      return origConsume(response, rootSchema, reuseRoomInstance);
    };

    const origCreateRoom = (client as any).createRoom.bind(client);
    (client as any).createRoom = (roomName: string, rootSchema?: any) => {
      const room = origCreateRoom(roomName, rootSchema);
      if (this.client === client) {
        this.room = room;
        this.setupRoom(room);
      }
      return room;
    };
    return client;
  }

  public async quickMatch(profile: string | PlayerProfile, callbacks?: NetworkCallbacks): Promise<Room> {
    if (callbacks) {
      this.callbacks = callbacks;
    }
    const client = this.initClient(callbacks);
    const opts = typeof profile === 'string' ? { name: profile, rank: 'wolf-spider', rating: 0, isRanked: false } : { rank: 'wolf-spider', rating: 0, isRanked: false, ...profile };
    opts.rank = normalizeRankId(opts.rank);
    opts.isRanked = Boolean(opts.isRanked);
    const room = await client.joinOrCreate('battle', opts);
    if (this.client === client) this.room = room;
    return room;
  }

  private setupRoom(room: Room) {
    room.onMessage('assigned', (data) => {
      this.myPlayerId = data.id;
      this.callbacks.onAssigned?.(data);
    });

    room.onMessage('state', (state) => {
      this.callbacks.onStateChange?.(state);
    });

    room.onStateChange((state) => {
      this.callbacks.onStateChange?.(state);
    });

    room.onMessage('fx', (data) => this.callbacks.onFx?.(data));
    room.onMessage('snd', (data) => this.callbacks.onSnd?.(data));
    room.onMessage('shake', (data) => this.callbacks.onShake?.(data));
    room.onMessage('roundStart', (data) => this.callbacks.onRoundStart?.(data));
    room.onMessage('draftStart', (data) => this.callbacks.onDraftStart?.(data));
    room.onMessage('playerDrafted', (data) => this.callbacks.onPlayerDrafted?.(data));
    room.onMessage('roundWon', (data) => this.callbacks.onRoundWon?.(data));
    room.onMessage('matchEnd', (data) => this.callbacks.onMatchEnd?.(data));
    room.onMessage('rematchVote', (data) => this.callbacks.onRematchVote?.(data));
    room.onMessage('playerLeft', (data) => this.callbacks.onPlayerLeft?.(data));

    room.onError((code, message) => {
      this.callbacks.onError?.({ code, message });
    });

    room.onLeave(() => {
      if (this.room === room) {
        this.room = null;
        this.callbacks.onDisconnect?.();
      }
    });
  }

  public sendInput(input: {
    left?: boolean;
    right?: boolean;
    strike?: boolean;
    heavy?: boolean;
    block?: boolean;
    reel?: number;
    ab1?: number;
    ab2?: number;
  }) {
    if (this.room) {
      this.room.send('input', input);
    }
  }

  public sendRestart() {
    if (this.room) {
      this.room.send('restart', {});
    }
  }

  public sendSelectSkills(skills: string[]) {
    if (this.room) {
      this.room.send('selectSkills', { skills });
    }
  }

  public leave() {
    this.callbacks = {};
    this.client = null;
    if (this.room) {
      this.room.leave();
      this.room = null;
    }
  }
}

export const network = new NetworkManager();
