export type Choice = 'rock' | 'paper' | 'scissors';

export interface Player {
  clientId: string;
  displayName: string;
  avatarColor: string;
  isHost: boolean;
  isReady: boolean;
  connected: boolean;
  status: 'alive' | 'eliminated';
  score: number;
}

export interface RoundRecord {
  roundNumber: number;
  choices: Record<string, Choice | null>;
  outcome: 'draw' | 'resolved';
  winners: string[];
  losers: string[];
}

export interface RoomState {
  roomId: string;
  mode: 'elimination' | 'points';
  pointsTarget?: number;
  state: 'LOBBY' | 'COUNTDOWN' | 'PICKING' | 'REVEALING' | 'ROUND_RESULT' | 'MATCH_OVER';
  players: Player[];
  currentRoundChoices: Record<string, Choice>;
  history: RoundRecord[];
  pickDeadline: number | null;
  createdAt: number;
}
