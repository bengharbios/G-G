// ============================================================
// SHIFARAT STORE - Zustand State Management for Codenames Game
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  ShifaratGameState,
  TeamColor,
  GamePhase,
  ViewMode,
  BoardCard,
  Clue,
  GameLogEntry,
  TeamInfo,
} from './shifarat-types';
import {
  generateBoard,
  createInitialState,
  giveClue as logicGiveClue,
  guessWord as logicGuessWord,
  passTurn as logicPassTurn,
  tickTimer as logicTickTimer,
  switchTurn as logicSwitchTurn,
  isValidClue,
  formatTimer,
} from './shifarat-logic';
import { getBoardWords } from './shifarat-words';
import { syncRoomState, endRoomSession } from './room-sync';

// ─── Persist-friendly state shape ───────────────────────────

interface ShifaratPersistState {
  gameMode: 'godfather' | 'diwaniya' | null;
  hostName: string | null;
  roomCode: string | null;
  phase: GamePhase;
  viewMode: ViewMode;

  // Board
  board: BoardCard[];

  // Teams
  redTeam: TeamInfo;
  blueTeam: TeamInfo;

  // Turn
  startingTeam: TeamColor;
  currentTeam: TeamColor;
  roundNumber: number;

  // Clue & guessing
  currentClue: Clue | null;
  guessesThisTurn: number;
  guessesAllowed: number;
  lastGuessResult: 'correct' | 'wrong' | 'neutral' | 'assassin' | null;

  // Timer
  timerDuration: number;
  timerRemaining: number;
  isTimerActive: boolean;

  // History
  clues: Clue[];
  gameLog: GameLogEntry[];

  // Settings
  selectedCategories: string[];

  // Result
  winner: TeamColor | null;
  winReason: string | null;

  // Players (Diwaniya mode)
  players: Array<{
    id: string;
    name: string;
    team: 'red' | 'blue';
    role: 'spymaster' | 'player';
    hasJoined: boolean;
  }>;
}

// ─── Runtime store interface ────────────────────────────────

export interface ShifaratStore extends ShifaratPersistState {
  // Actions - Setup
  setGameMode: (mode: 'godfather' | 'diwaniya' | null) => void;
  setHostName: (name: string | null) => void;
  setRoomCode: (code: string | null) => void;
  setViewMode: (mode: ViewMode) => void;

  // Actions - Game flow
  startGame: (
    redTeamName: string,
    blueTeamName: string,
    categories: string[],
    timerSeconds: number,
    firstTeam?: TeamColor,
    redSpymaster?: string,
    blueSpymaster?: string,
  ) => void;

  giveClue: (clueWord: string, clueNumber: number) => string | null; // returns error or null
  selectCard: (cardId: number) => { result: 'correct' | 'wrong' | 'neutral' | 'assassin'; gameEnded: boolean };
  passTurn: () => void;
  confirmTurnSwitch: () => void;
  tickTimer: () => void;
  resetGame: () => void;

  // Actions - Room sync
  syncToRoom: () => void;

  // Computed helpers
  getTeamName: (team: TeamColor) => string;
  formattedTimer: string;
}

// ─── Initial state ──────────────────────────────────────────

const initialState: ShifaratPersistState = {
  gameMode: null,
  hostName: null,
  roomCode: null,
  phase: 'setup',
  viewMode: 'spymaster',

  board: [],
  redTeam: { name: 'الفريق الأحمر', score: 0, spymaster: null, wordsRemaining: 9 },
  blueTeam: { name: 'الفريق الأزرق', score: 0, spymaster: null, wordsRemaining: 8 },

  startingTeam: 'red',
  currentTeam: 'red',
  roundNumber: 1,

  currentClue: null,
  guessesThisTurn: 0,
  guessesAllowed: 0,
  lastGuessResult: null,

  timerDuration: 60,
  timerRemaining: 60,
  isTimerActive: false,

  clues: [],
  gameLog: [],
  selectedCategories: [],

  winner: null,
  winReason: null,
  players: [],
};

// ─── Store definition ───────────────────────────────────────

export const useShifaratStore = create<ShifaratStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      formattedTimer: formatTimer(60),

      // ── Setup actions ──

      setGameMode: (mode) => set({ gameMode: mode }),
      setHostName: (name) => set({ hostName: name }),
      setRoomCode: (code) => set({ roomCode: code }),
      setViewMode: (mode) => set({ viewMode: mode }),

      // ── Start game ──

      startGame: (
        redTeamName,
        blueTeamName,
        categories,
        timerSeconds,
        firstTeam = 'red',
        redSpymaster,
        blueSpymaster,
      ) => {
        // Generate 25 random words from selected categories
        const boardWords = getBoardWords();
        if (boardWords.length < 25) {
          console.error('Not enough words to generate board');
          return;
        }

        // Generate the board with color assignments
        const board = generateBoard(boardWords, firstTeam);

        // Create initial state with the board
        const state = createInitialState({
          gameMode: get().gameMode ?? 'godfather',
          timerDuration: timerSeconds,
          selectedCategories: categories,
          firstTeam,
          redTeamName,
          blueTeamName,
          roomCode: get().roomCode ?? undefined,
          hostName: get().hostName ?? undefined,
        });

        // Override board
        state.board = board;

        // Set spymasters
        if (redSpymaster) state.redTeam.spymaster = redSpymaster;
        if (blueSpymaster) state.blueTeam.spymaster = blueSpymaster;

        // Set phase to spymaster_view for the first turn
        state.phase = 'spymaster_view';

        // In godfather mode, start with spymaster view
        const viewMode = get().gameMode === 'godfather' ? 'spymaster' : 'team';

        set({
          ...state,
          viewMode,
          players: get().players,
        });

        get().syncToRoom();
      },

      // ── Give clue (spymaster action) ──

      giveClue: (clueWord, clueNumber) => {
        const state = get();
        if (state.phase !== 'spymaster_view') {
          return 'ليست مرحلة إعطاء الدليل';
        }

        // Validate clue
        if (!isValidClue(clueWord, state.board)) {
          return 'كلمة الدليل غير صالحة (موجودة على اللوحة أو مشابهة لكلمة عليها)';
        }

        try {
          const newState = logicGiveClue(state, clueWord, clueNumber);

          set({
            ...newState,
            // In godfather mode, switch to team view after giving clue
            viewMode: state.gameMode === 'godfather' ? 'transition' : 'team',
          });

          get().syncToRoom();
          return null; // success
        } catch (e: unknown) {
          return (e as Error).message;
        }
      },

      // ── Select/guess a card (team action) ──

      selectCard: (cardId) => {
        const state = get();
        if (state.phase !== 'clue_given' && state.phase !== 'team_guessing') {
          return { result: 'neutral', gameEnded: false };
        }

        try {
          const { state: newState, result, gameEnded } = logicGuessWord(state, cardId);

          set({
            ...newState,
            lastGuessResult: result,
            // If game ended or turn ended, we need to show result
            viewMode: gameEnded ? 'team' : state.gameMode === 'godfather' ? 'team' : 'team',
          });

          get().syncToRoom();
          return { result, gameEnded };
        } catch (e: unknown) {
          console.error('Guess error:', e);
          return { result: 'neutral', gameEnded: false };
        }
      },

      // ── Pass turn (team gives up remaining guesses) ──

      passTurn: () => {
        const state = get();
        if (state.phase !== 'clue_given' && state.phase !== 'team_guessing') return;

        const newState = logicPassTurn(state);
        set({
          ...newState,
          viewMode: state.gameMode === 'godfather' ? 'transition' : 'team',
        });

        get().syncToRoom();
      },

      // ── Confirm turn switch (after seeing result) ──

      confirmTurnSwitch: () => {
        const state = get();
        if (state.phase === 'game_over') return;

        if (state.phase === 'turn_result' || state.phase === 'turn_switch') {
          const newState = logicSwitchTurn(state);
          set({
            ...newState,
            viewMode: state.gameMode === 'godfather' ? 'spymaster' : 'team',
            lastGuessResult: null,
          });
          get().syncToRoom();
        } else if (state.phase === 'clue_given' || state.phase === 'team_guessing') {
          // If team hasn't guessed yet, just switch
          const newState = logicPassTurn(state);
          const switchedState = logicSwitchTurn(newState);
          set({
            ...switchedState,
            viewMode: state.gameMode === 'godfather' ? 'spymaster' : 'team',
            lastGuessResult: null,
          });
          get().syncToRoom();
        }
      },

      // ── Tick timer ──

      tickTimer: () => {
        const state = get();
        const newState = logicTickTimer(state);
        set({
          ...newState,
          formattedTimer: formatTimer(newState.timerRemaining),
        });
      },

      // ── Reset game ──

      resetGame: () => {
        const state = get();
        if (state.roomCode && state.gameMode === 'diwaniya') {
          endRoomSession(state.roomCode);
        }
        set({
          ...initialState,
          viewMode: 'spymaster',
        });
      },

      // ── Room sync ──

      syncToRoom: () => {
        const state = get();
        if (!state.roomCode) return;

        const syncData = {
          board: state.board,
          redTeam: state.redTeam,
          blueTeam: state.blueTeam,
          currentTeam: state.currentTeam,
          phase: state.phase,
          currentClue: state.currentClue,
          guessesThisTurn: state.guessesThisTurn,
          guessesAllowed: state.guessesAllowed,
          lastGuessResult: state.lastGuessResult,
          timerRemaining: state.timerRemaining,
          roundNumber: state.roundNumber,
          clues: state.clues,
          gameLog: state.gameLog,
          winner: state.winner,
          winReason: state.winReason,
        };

        syncRoomState(state.roomCode, {
          phase: state.phase,
          round: state.roundNumber,
          stateJson: JSON.stringify(syncData),
          players: state.players.map((p) => ({
            name: p.name,
            role: p.team === 'red' ? 'team1' : 'team2',
            isAlive: true,
            isSilenced: false,
            hasRevealedMayor: false,
          })),
        });
      },

      // ── Computed helpers ──

      getTeamName: (team) => {
        const state = get();
        return team === 'red' ? state.redTeam.name : state.blueTeam.name;
      },
    }),
    {
      name: 'shifarat-game-storage',
      version: 3,
      // If loaded state is invalid, reset to initial state
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Fix invalid game states
          const needsReset =
            !state.board ||
            state.board.length === 0 ||
            (state.phase !== 'setup' && !state.currentClue &&
              (state.phase === 'clue_given' || state.phase === 'team_guessing')) ||
            (state.phase !== 'setup' && state.guessesAllowed === 0 &&
              (state.phase === 'clue_given' || state.phase === 'team_guessing'));

          if (needsReset) {
            // Use setTimeout to avoid setting state during hydration
            setTimeout(() => {
              useShifaratStore.getState().resetGame();
            }, 0);
          }
        }
      },
      partialize: (state) => {
        const { formattedTimer, getTeamName, giveClue, selectCard, passTurn, confirmTurnSwitch, tickTimer, resetGame, startGame, setGameMode, setHostName, setRoomCode, setViewMode, syncToRoom, ...rest } = state;
        return rest as ShifaratPersistState;
      },
    }
  )
);
