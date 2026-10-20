import { Client, Room } from 'colyseus.js';

export interface NetworkCallbacks {
  onAssigned?: (data: { id: number; name: string }) => void;
  onStateChange?: (state: any) => void;
  onFx?: (fx: any) => void;
  onSnd?: (snd: { name: string }) => void;
  onShake?: (shake: { amount: number }) => void;
  onRoundStart?: (data: { round: number }) => void;
  onRoundWon?: (data: { winner: number; round: number; p1Wins: number; p2Wins: number }) => void;
  onMatchEnd?: (data: { winner: number; winnerName: string; p1Wins: number; p2Wins: number }) => void;
  onPlayerLeft?: (data: { winner: number }) => void;
  onError?: (err: any) => void;
  onDisconnect?: () => void;
}

export interface PlayerProfile {
  name: string;
  color?: string;
  colorDark?: string;
  colorLight?: string;
  pattern?: string;
  acc?: string;
  level?: number;
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
      return (import.meta as any).env.SERVER_URL;
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

  private pendingCallbacks: NetworkCallbacks | null = null;

  private initClient(): Client {
    if (!this.client) {
      this.client = new Client(this.serverUrl);
      // Colyseus 0.18 response shim for colyseus.js 0.16
      const origConsume = (this.client as any).consumeSeatReservation.bind(this.client);
      (this.client as any).consumeSeatReservation = function (response: any, rootSchema?: any, reuseRoomInstance?: any) {
        if (response && !response.room && response.roomId) {
          response.room = {
            name: response.name,
            roomId: response.roomId,
            processId: response.processId
          };
        }
        return origConsume(response, rootSchema, reuseRoomInstance);
      };

      const origCreateRoom = (this.client as any).createRoom.bind(this.client);
      (this.client as any).createRoom = (roomName: string, rootSchema?: any) => {
        const room = origCreateRoom(roomName, rootSchema);
        if (this.pendingCallbacks) {
          this.setupRoom(room, this.pendingCallbacks);
        }
        return room;
      };
    }
    return this.client;
  }

  public async quickMatch(profile: string | PlayerProfile, callbacks: NetworkCallbacks): Promise<Room> {
    this.pendingCallbacks = callbacks;
    const client = this.initClient();
    const opts = typeof profile === 'string' ? { name: profile, roomCode: 'QUICK' } : { ...profile, roomCode: 'QUICK' };
    const room = await client.joinOrCreate('battle', opts);
    this.setupRoom(room, callbacks);
    this.pendingCallbacks = null;
    return room;
  }

  public async createPrivateRoom(profile: string | PlayerProfile, roomCode: string, callbacks: NetworkCallbacks): Promise<Room> {
    this.pendingCallbacks = callbacks;
    const client = this.initClient();
    const opts = typeof profile === 'string' ? { name: profile, roomCode } : { ...profile, roomCode };
    const room = await client.create('battle', opts);
    this.setupRoom(room, callbacks);
    this.pendingCallbacks = null;
    return room;
  }

  public async joinByRoomCode(profile: string | PlayerProfile, roomCode: string, callbacks: NetworkCallbacks): Promise<Room> {
    this.pendingCallbacks = callbacks;
    const client = this.initClient();
    const opts = typeof profile === 'string' ? { name: profile, roomCode } : { ...profile, roomCode };
    const room = await client.joinOrCreate('battle', opts);
    this.setupRoom(room, callbacks);
    this.pendingCallbacks = null;
    return room;
  }

  private setupRoom(room: Room, callbacks: NetworkCallbacks) {
    this.room = room;

    room.onMessage('assigned', (data) => {
      this.myPlayerId = data.id;
      callbacks.onAssigned?.(data);
    });

    room.onMessage('state', (state) => {
      callbacks.onStateChange?.(state);
    });

    room.onStateChange((state) => {
      callbacks.onStateChange?.(state);
    });

    room.onMessage('fx', (data) => callbacks.onFx?.(data));
    room.onMessage('snd', (data) => callbacks.onSnd?.(data));
    room.onMessage('shake', (data) => callbacks.onShake?.(data));
    room.onMessage('roundStart', (data) => callbacks.onRoundStart?.(data));
    room.onMessage('roundWon', (data) => callbacks.onRoundWon?.(data));
    room.onMessage('matchEnd', (data) => callbacks.onMatchEnd?.(data));
    room.onMessage('playerLeft', (data) => callbacks.onPlayerLeft?.(data));

    room.onError((code, message) => {
      callbacks.onError?.({ code, message });
    });

    room.onLeave(() => {
      this.room = null;
      callbacks.onDisconnect?.();
    });
  }

  public sendInput(input: {
    left?: boolean;
    right?: boolean;
    strike?: boolean;
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
    if (this.room) {
      this.room.leave();
      this.room = null;
    }
  }
}

export const network = new NetworkManager();
