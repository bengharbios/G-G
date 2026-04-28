// ============================================================
// SHIFARAT TYPES - TypeScript types for the Codenames game
// ============================================================

export type ShifaratGameMode = 'godfather' | 'diwaniya' | null;
export type ShifaratGamePhase = 'setup' | 'playing' | 'round_end' | 'game_over';
export type ShifaratRoundStatus = 'active' | 'correct' | 'wrong' | 'time_up';

export interface WordEntry {
  w: string;       // The word to guess
  hint: string;    // The hint for the describer
}

export interface ShifaratTeam {
  name: string;
  score: number;
}

export interface ShifaratGameState {
  // Game mode
  gameMode: ShifaratGameMode;
  hostName: string | null;
  roomCode: string | null;

  // Game state
  phase: ShifaratGamePhase;
  teams: [ShifaratTeam, ShifaratTeam];
  currentTeamIndex: 0 | 1;  // 0 or 1
  currentWord: WordEntry | null;
  currentCategory: string;
  usedWords: Set<string>;
  selectedCategories: string[];
  timerMax: number;       // seconds
  timerLeft: number;      // seconds remaining
  skipsLeft: number;      // skips remaining this round (starts at 2)
  roundActive: boolean;
  roundNumber: number;
  roundStatus: ShifaratRoundStatus;
  roundMessage: string;

  // Settings
  targetScore: number;    // score needed to win (default 10)

  // Game log
  gameLog: Array<{
    round: number;
    team: string;
    word: string;
    result: string;
    timestamp: number;
  }>;

  // Diwaniya players
  players: Array<{
    id: string;
    name: string;
    team: 0 | 1;
    hasJoined: boolean;
  }>;
}
