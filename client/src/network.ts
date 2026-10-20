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

export class NetworkManager {
  private client: Client | null = null;
  public room: Room | null = null;
  public myPlayerId: number = -1; // 0 for Amber, 1 for Jade
  public serverUrl: string = 'ws://localhost:2567';

  constructor() {
    // If running in browser and on a different host, derive ws URL
    if (typeof window !== 'undefined') {
      const isHttps = window.location.protocol === 'https:';
      const wsProto = isHttps ? 'wss:' : 'ws:';
      const host = window.location.hostname || 'localhost';
      // Default colyseus server port is 2567
      this.serverUrl = `${wsProto}//${host}:2567`;
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
