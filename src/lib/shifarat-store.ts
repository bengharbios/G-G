// ============================================================
// SHIFARAT STORE - Zustand State Management for Codenames Game
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  ShifaratGameMode,
  ShifaratGamePhase,
  ShifaratRoundStatus,
  ShifaratTeam,
  WordEntry,
} from './shifarat-types';
import {
  getRandomWord,
  getWordCategory,
  checkGameWin,
  getOpponentTeam,
} from './shifarat-logic';
import { syncRoomState, endRoomSession } from './room-sync';

// ─── Persist-friendly state shape ───────────────────────────
// Set<string> cannot survive JSON round-trip, so we serialize
// usedWords to an array in the persisted snapshot.

interface ShifaratPersistState {
  gameMode: ShifaratGameMode;
  hostName: string | null;
  roomCode: string | null;
  phase: ShifaratGamePhase;
  teams: [ShifaratTeam, ShifaratTeam];
  currentTeamIndex: 0 | 1;
  currentWord: WordEntry | null;
  currentCategory: string;
  usedWords: string[];          // array for JSON persistence
  selectedCategories: string[];
  timerMax: number;
  timerLeft: number;
  skipsLeft: number;
  roundActive: boolean;
  roundNumber: number;
  roundStatus: ShifaratRoundStatus;
  roundMessage: string;
  targetScore: number;
  gameLog: Array<{
    round: number;
    team: string;
    word: string;
    result: string;
    timestamp: number;
  }>;
  players: Array<{
    id: string;
    name: string;
    team: 0 | 1;
    hasJoined: boolean;
  }>;
}

// ─── Runtime store interface (Set<string> in memory) ────────

export interface ShifaratStore extends ShifaratPersistState {
  /** Runtime Set — derived from usedWords[] on load */
  usedWordsSet: Set<string>;

  // ── Actions ──
  setGameMode: (mode: ShifaratGameMode) => void;
  setHostName: (name: string | null) => void;
  setRoomCode: (code: string | null) => void;

  startGame: (
    team1Name: string,
    team2Name: string,
    categories: string[],
    timerSeconds: number,
    targetScore?: number
  ) => void;

  newRound: () => void;
  markCorrect: () => void;
  markWrong: () => void;
  skipWord: () => void;
  tickTimer: () => void;
  timeUp: () => void;
  nextTurn: () => void;
  resetGame: () => void;
  syncToRoom: () => void;
}

// ─── Initial state ──────────────────────────────────────────

const initialState: ShifaratPersistState = {
  gameMode: null,
  hostName: null,
  roomCode: null,
  phase: 'setup',
  teams: [
    { name: 'الفريق الأول', score: 0 },
    { name: 'الفريق الثاني', score: 0 },
  ],
  currentTeamIndex: 0,
  currentWord: null,
  currentCategory: '',
  usedWords: [],
  selectedCategories: [],
  timerMax: 60,
  timerLeft: 60,
  skipsLeft: 2,
  roundActive: false,
  roundNumber: 1,
  roundStatus: 'active',
  roundMessage: '',
  targetScore: 10,
  gameLog: [],
  players: [],
};

// ─── Store definition ───────────────────────────────────────

export const useShifaratStore = create<ShifaratStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      usedWordsSet: new Set<string>(),

      // ── Game mode & host ──

      setGameMode: (mode) => set({ gameMode: mode }),
      setHostName: (name) => set({ hostName: name }),
      setRoomCode: (code) => set({ roomCode: code }),

      // ── Start game ──

      startGame: (
        team1Name,
        team2Name,
        categories,
        timerSeconds,
        targetScore = 10
      ) => {
        const usedSet = new Set<string>();
        const word = getRandomWord(categories, usedSet);

        set({
          phase: 'playing',
          teams: [
            { name: team1Name, score: 0 },
            { name: team2Name, score: 0 },
          ],
          currentTeamIndex: 0,
          currentWord: word,
          currentCategory: word
            ? getWordCategory(word.w, categories) ?? ''
            : '',
          usedWords: Array.from(usedSet),
          usedWordsSet: usedSet,
          selectedCategories: categories,
          timerMax: timerSeconds,
          timerLeft: timerSeconds,
          skipsLeft: 2,
          roundActive: true,
          roundNumber: 1,
          roundStatus: 'active',
          roundMessage: '',
          targetScore,
          gameLog: [
            {
              round: 1,
              team: team1Name,
              word: word?.w ?? '',
              result: 'بدأت اللعبة',
              timestamp: Date.now(),
            },
          ],
        });
        get().syncToRoom();
      },

      // ── New round ──

      newRound: () => {
        const state = get();
        let usedSet = new Set(state.usedWords);

        let word = getRandomWord(state.selectedCategories, usedSet);

        // If all words are used, reset the used set and try again
        if (!word) {
          usedSet = new Set<string>();
          word = getRandomWord(state.selectedCategories, usedSet);
        }

        const nextRound = state.roundNumber + 1;

        set({
          currentWord: word,
          currentCategory: word
            ? getWordCategory(word.w, state.selectedCategories) ?? ''
            : '',
          usedWords: Array.from(usedSet),
          usedWordsSet: usedSet,
          timerLeft: state.timerMax,
          skipsLeft: 2,
          roundActive: true,
          roundNumber: nextRound,
          roundStatus: 'active',
          roundMessage: '',
          phase: 'playing',
        });
        get().syncToRoom();
      },

      // ── Mark correct (+1 point, end round) ──

      markCorrect: () => {
        const state = get();
        if (!state.roundActive || !state.currentWord) return;

        const teamIndex = state.currentTeamIndex;
        const updatedTeams: [ShifaratTeam, ShifaratTeam] = [
          { ...state.teams[0] },
          { ...state.teams[1] },
        ];
        updatedTeams[teamIndex].score += 1;

        const newScore = updatedTeams[teamIndex].score;
        const isWin = checkGameWin(newScore, state.targetScore);

        const logEntry = {
          round: state.roundNumber,
          team: state.teams[teamIndex].name,
          word: state.currentWord.w,
          result: 'صحيح ✓',
          timestamp: Date.now(),
        };

        set({
          teams: updatedTeams,
          roundActive: false,
          roundStatus: 'correct',
          roundMessage: `إجابة صحيحة! +1 نقطة لـ${state.teams[teamIndex].name}`,
          phase: isWin ? 'game_over' : 'round_end',
          gameLog: [...state.gameLog, logEntry],
        });
        get().syncToRoom();
      },

      // ── Mark wrong (switch team, end round) ──

      markWrong: () => {
        const state = get();
        if (!state.roundActive || !state.currentWord) return;

        const currentTeam = state.teams[state.currentTeamIndex];
        const opponentIndex = getOpponentTeam(state.currentTeamIndex);

        const logEntry = {
          round: state.roundNumber,
          team: currentTeam.name,
          word: state.currentWord.w,
          result: 'خطأ ✗',
          timestamp: Date.now(),
        };

        set({
          currentTeamIndex: opponentIndex,
          roundActive: false,
          roundStatus: 'wrong',
          roundMessage: `إجابة خاطئة! دور ${state.teams[opponentIndex].name}`,
          phase: 'round_end',
          gameLog: [...state.gameLog, logEntry],
        });
        get().syncToRoom();
      },

      // ── Skip word (get new word, decrement skips) ──

      skipWord: () => {
        const state = get();
        if (!state.roundActive || state.skipsLeft <= 0) return;

        const newSkipsLeft = state.skipsLeft - 1;
        let usedSet = new Set(state.usedWords);

        let word = getRandomWord(state.selectedCategories, usedSet);

        // If all words are used, reset and try again
        if (!word) {
          usedSet = new Set<string>();
          word = getRandomWord(state.selectedCategories, usedSet);
        }

        set({
          currentWord: word,
          currentCategory: word
            ? getWordCategory(word.w, state.selectedCategories) ?? ''
            : '',
          usedWords: Array.from(usedSet),
          usedWordsSet: usedSet,
          skipsLeft: newSkipsLeft,
        });
        get().syncToRoom();
      },

      // ── Tick timer (called every second) ──

      tickTimer: () => {
        const state = get();
        if (!state.roundActive || state.timerLeft <= 0) return;

        const newTimerLeft = state.timerLeft - 1;

        if (newTimerLeft <= 0) {
          // Time is up
          get().timeUp();
          return;
        }

        set({ timerLeft: newTimerLeft });
      },

      // ── Time up (switch team, end round) ──

      timeUp: () => {
        const state = get();
        if (!state.roundActive) return;

        const currentTeam = state.teams[state.currentTeamIndex];
        const opponentIndex = getOpponentTeam(state.currentTeamIndex);

        const logEntry = {
          round: state.roundNumber,
          team: currentTeam.name,
          word: state.currentWord?.w ?? '',
          result: 'انتهى الوقت ⏱',
          timestamp: Date.now(),
        };

        set({
          timerLeft: 0,
          roundActive: false,
          roundStatus: 'time_up',
          roundMessage: `انتهى الوقت! دور ${state.teams[opponentIndex].name}`,
          currentTeamIndex: opponentIndex,
          phase: 'round_end',
          gameLog: [...state.gameLog, logEntry],
        });
        get().syncToRoom();
      },

      // ── Next turn (start new round for current team) ──

      nextTurn: () => {
        const state = get();
        let usedSet = new Set(state.usedWords);

        let word = getRandomWord(state.selectedCategories, usedSet);

        // If all words are used, reset and try again
        if (!word) {
          usedSet = new Set<string>();
          word = getRandomWord(state.selectedCategories, usedSet);
        }

        set({
          currentWord: word,
          currentCategory: word
            ? getWordCategory(word.w, state.selectedCategories) ?? ''
            : '',
          usedWords: Array.from(usedSet),
          usedWordsSet: usedSet,
          timerLeft: state.timerMax,
          skipsLeft: 2,
          roundActive: true,
          roundNumber: state.roundNumber + 1,
          roundStatus: 'active',
          roundMessage: '',
          phase: 'playing',
        });
        get().syncToRoom();
      },

      // ── Reset game ──

      resetGame: () => {
        const state = get();
        if (state.roomCode && state.gameMode === 'diwaniya') {
          endRoomSession(state.roomCode);
        }
        set({
          ...initialState,
          usedWordsSet: new Set<string>(),
          roomCode: null,
          gameMode: null,
          hostName: null,
        });
      },

      // ── Room sync (Diwaniya mode) ──

      syncToRoom: () => {
        const state = get();
        if (!state.roomCode) return;

        const syncData = {
          teams: state.teams,
          currentTeamIndex: state.currentTeamIndex,
          currentWord: state.currentWord,
          currentCategory: state.currentCategory,
          timerLeft: state.timerLeft,
          timerMax: state.timerMax,
          skipsLeft: state.skipsLeft,
          roundActive: state.roundActive,
          roundNumber: state.roundNumber,
          roundStatus: state.roundStatus,
          roundMessage: state.roundMessage,
          gameLog: state.gameLog,
        };

        syncRoomState(state.roomCode, {
          phase: state.phase,
          round: state.roundNumber,
          stateJson: JSON.stringify(syncData),
          players: state.players.map((p) => ({
            name: p.name,
            role: p.team === 0 ? 'team1' : 'team2',
            isAlive: true,
            isSilenced: false,
            hasRevealedMayor: false,
          })),
        });
      },
    }),
    {
      name: 'shifarat-game-storage',
      version: 1,
      // Re-derive Set from array on rehydration
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.usedWordsSet = new Set(state.usedWords);
        }
      },
      // Serialize/deserialize for JSON-safe persistence
      partialize: (state) => {
        const { usedWordsSet, ...rest } = state;
        return rest;
      },
      merge: (persisted, current) => {
        const merged = { ...current, ...(persisted as Partial<ShifaratStore>) } as ShifaratStore;
        // Re-derive the Set from the persisted array
        merged.usedWordsSet = new Set(merged.usedWords ?? []);
        return merged;
      },
    }
  )
);
