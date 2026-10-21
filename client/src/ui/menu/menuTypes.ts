export type MenuTab = 'main' | 'customize' | 'abilities' | 'settings';

export interface MenuStartOptions {
  mode: 'online' | 'cpu' | '2p';
  diff: 'easy' | 'normal' | 'hard';
  playerName?: string;
  playerColor?: {
    main: string;
    light: string;
    dark: string;
  };
  playerPattern?: string;
  playerAcc?: string;
}

