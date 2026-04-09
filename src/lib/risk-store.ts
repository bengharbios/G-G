// ============================================================
// المجازفة (Risk) - Zustand Store (العراب / Classic mode)
// ============================================================
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { RiskTeam, RiskGamePhase, RiskCard, RiskLogEntry, RiskTurnState, RiskGameConfig, CardType } from './risk-types';
import { generateCardDeck, getGridCols, getCardStats, isGameOver, findWinner, TEAM_COLORS, DEFAULT_TEAM_NAMES } from './risk-types';

export type RiskGameMode = 'classic' | 'diwaniya';

interface RiskState {
  // Game Phase
  phase: RiskGamePhase;

  // Game Mode
  gameMode: RiskGameMode;

  // Diwaniya
  roomCode: string | null;
  hostName: string | null;

  // Teams
  teams: RiskTeam[];
  currentTeamIndex: number;

  // Cards
  cards: RiskCard[];
  config: RiskGameConfig;

  // Turn state
  turnState: RiskTurnState;
  lastDrawnCard: RiskCard | null;

  // Game Log
  gameLog: RiskLogEntry[];
  logCounter: number;

  // Game Over
  winner: RiskTeam | 'draw' | null;
  winReason: string;

  // Actions
  setPhase: (phase: RiskGamePhase) => void;
  setGameMode: (mode: RiskGameMode) => void;
  setRoomCode: (code: string | null) => void;
  setHostName: (name: string | null) => void;

  startGame: (config: RiskGameConfig) => void;
  drawCard: (cardId: string) => void;
  continueTurn: () => void;
  bankPoints: () => void;
  advanceTurn: () => void;
  closeModal: () => void;
  resetGame: () => void;

  // Helpers
  getCurrentTeam: () => RiskTeam;
  getGridCols: () => number;
}

const initialState = {
  phase: 'landing' as RiskGamePhase,
  gameMode: 'classic' as RiskGameMode,
  roomCode: null as string | null,
  hostName: null as string | null,
  teams: [] as RiskTeam[],
  currentTeamIndex: 0,
  cards: [] as RiskCard[],
  config: {
    teamCount: 2,
    bombCount: 3,
    skipCount: 2,
    totalCards: 40,
    teamNames: DEFAULT_TEAM_NAMES,
  } as RiskGameConfig,
  turnState: 'waiting_for_draw' as RiskTurnState,
  lastDrawnCard: null as RiskCard | null,
  gameLog: [] as RiskLogEntry[],
  logCounter: 0,
  winner: null as RiskTeam | 'draw' | null,
  winReason: '',
};

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function createTeams(config: RiskGameConfig): RiskTeam[] {
  return config.teamNames.slice(0, config.teamCount).map((name, i) => ({
    id: `team_${i}`,
    name: name || DEFAULT_TEAM_NAMES[i],
    score: 0,
    roundScore: 0,
    color: TEAM_COLORS[i].color,
    colorHex: TEAM_COLORS[i].colorHex,
    emoji: TEAM_COLORS[i].emoji,
  }));
}

function addLog(
  state: Pick<RiskState, 'logCounter'>,
  team: RiskTeam,
  action: string,
  cardType: CardType,
  cardValue: number
): RiskLogEntry {
  return {
    id: state.logCounter + 1,
    teamId: team.id,
    teamName: team.name,
    action,
    cardType,
    cardValue,
    timestamp: Date.now(),
  };
}

// ============================================================
// Room sync helper
// ============================================================
function syncToRoom(state: RiskState, updates: Record<string, unknown>) {
  if (state.gameMode !== 'diwaniya' || !state.roomCode) return;
  fetch(`/api/risk-room/${state.roomCode}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      teams: state.teams,
      currentTeamIndex: state.currentTeamIndex,
      cards: state.cards,
      config: state.config,
      turnState: state.turnState,
      lastDrawnCard: state.lastDrawnCard,
      gameLog: state.gameLog,
      winner: state.winner,
      winReason: state.winReason,
      phase: state.phase,
      ...updates,
    }),
  }).catch(() => {});
}

export const useRiskStore = create<RiskState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setPhase: (phase) => set({ phase }),
      setGameMode: (gameMode) => set({ gameMode }),
      setRoomCode: (roomCode) => set({ roomCode }),
      setHostName: (hostName) => set({ hostName }),

      startGame: (config: RiskGameConfig) => {
        const state = get();
        const teams = createTeams(config);
        const cards = generateCardDeck(config);
        const code = state.gameMode === 'diwaniya' ? generateRoomCode() : null;

        if (state.gameMode === 'diwaniya' && code) {
          const fullState = {
            teams,
            cards,
            config,
            turnState: 'waiting_for_draw' as RiskTurnState,
            lastDrawnCard: null,
            gameLog: [] as RiskLogEntry[],
            winner: null,
            winReason: '',
            currentTeamIndex: 0,
            phase: 'playing' as RiskGamePhase,
          };

          fetch('/api/risk-room', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, hostName: 'العراب' }),
          }).then(() => {
            return fetch(`/api/risk-room/${code}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(fullState),
            });
          }).catch(() => {});
        }

        set({
          phase: 'playing',
          teams,
          cards,
          config,
          turnState: 'waiting_for_draw',
          lastDrawnCard: null,
          currentTeamIndex: 0,
          gameLog: [],
          logCounter: 0,
          winner: null,
          winReason: '',
          roomCode: code,
        });
      },

      drawCard: (cardId: string) => {
        const state = get();
        if (state.phase !== 'playing') return;
        if (state.turnState !== 'waiting_for_draw') return;

        const cardIndex = state.cards.findIndex(c => c.id === cardId);
        if (cardIndex === -1) return;
        if (state.cards[cardIndex].revealed) return;

        const card = state.cards[cardIndex];
        const newCards = [...state.cards];
        newCards[cardIndex] = { ...card, revealed: true };

        const currentTeam = state.teams[state.currentTeamIndex];
        const newTeams = [...state.teams];
        let newLog: RiskLogEntry;
        let newTurnState: RiskTurnState;
        let newWinner: RiskTeam | 'draw' | null = null;
        let newWinReason = '';

        switch (card.type) {
          case 'safe': {
            // Add value to round score
            newTeams[state.currentTeamIndex] = {
              ...newTeams[state.currentTeamIndex],
              roundScore: currentTeam.roundScore + card.value,
            };
            newLog = addLog(state, currentTeam, `سحب بطاقة آمنة (+${card.value})`, 'safe', card.value);
            newTurnState = 'waiting_for_decision';
            break;
          }
          case 'bomb': {
            // Lose all round score
            newTeams[state.currentTeamIndex] = {
              ...newTeams[state.currentTeamIndex],
              roundScore: 0,
            };
            newLog = addLog(state, currentTeam, `💣 قنبلة! خسر ${currentTeam.roundScore} نقطة من الجولة`, 'bomb', 0);
            newTurnState = 'bomb_exploded';

            // Check game over
            if (isGameOver(newCards)) {
              const winnerResult = findWinner(newTeams);
              newWinner = winnerResult;
              newWinReason = winnerResult === 'draw' ? 'تعادل بين الفرق!' : `${winnerResult.name} فاز بأعلى نقاط!`;
            }
            break;
          }
          case 'skip': {
            newLog = addLog(state, currentTeam, '⏭️ تخطي! انتقل الدور', 'skip', 0);
            newTurnState = 'showing_result';
            break;
          }
        }

        const newState: Partial<RiskState> = {
          cards: newCards,
          teams: newTeams,
          lastDrawnCard: newCards[cardIndex],
          turnState: newTurnState,
          gameLog: [...state.gameLog, newLog],
          logCounter: state.logCounter + 1,
        };

        if (newWinner !== null) {
          newState.winner = newWinner;
          newState.winReason = newWinReason;
        }

        set(newState);
        syncToRoom(get(), newState);
      },

      continueTurn: () => {
        const state = get();
        if (state.turnState !== 'waiting_for_decision') return;
        set({ turnState: 'waiting_for_draw' });
        syncToRoom(get(), { turnState: 'waiting_for_draw' });
      },

      bankPoints: () => {
        const state = get();
        if (state.turnState !== 'waiting_for_decision') return;

        const currentTeam = state.teams[state.currentTeamIndex];
        const newTeams = [...state.teams];
        newTeams[state.currentTeamIndex] = {
          ...currentTeam,
          score: currentTeam.score + currentTeam.roundScore,
          roundScore: 0,
        };

        const newLog = addLog(state, currentTeam, `💰 حفظ ${currentTeam.roundScore} نقاط! (المجموع: ${currentTeam.score + currentTeam.roundScore})`, 'safe', currentTeam.roundScore);

        set({
          teams: newTeams,
          turnState: 'showing_result',
          gameLog: [...state.gameLog, newLog],
          logCounter: state.logCounter + 1,
        });

        syncToRoom(get(), {
          teams: newTeams,
          turnState: 'showing_result',
        });
      },

      advanceTurn: () => {
        const state = get();
        if (state.turnState !== 'showing_result' && state.turnState !== 'bomb_exploded') return;

        // Check game over
        if (state.winner !== null) {
          set({
            phase: 'game_over',
            turnState: 'waiting_for_draw',
            lastDrawnCard: null,
          });
          syncToRoom(get(), {
            phase: 'game_over',
            turnState: 'waiting_for_draw',
          });
          return;
        }

        if (isGameOver(state.cards)) {
          const winnerResult = findWinner(state.teams);
          set({
            phase: 'game_over',
            winner: winnerResult,
            winReason: winnerResult === 'draw' ? 'تعادل بين الفرق!' : `${winnerResult.name} فاز بأعلى نقاط!`,
            turnState: 'waiting_for_draw',
            lastDrawnCard: null,
          });
          syncToRoom(get(), {
            phase: 'game_over',
            winner: winnerResult,
            winReason: winnerResult === 'draw' ? 'تعادل!' : `${(winnerResult as RiskTeam).name} فاز!`,
          });
          return;
        }

        // Advance to next team
        const nextTeamIndex = (state.currentTeamIndex + 1) % state.teams.length;
        set({
          currentTeamIndex: nextTeamIndex,
          lastDrawnCard: null,
          turnState: 'waiting_for_draw',
        });

        syncToRoom(get(), {
          currentTeamIndex: nextTeamIndex,
          lastDrawnCard: null,
          turnState: 'waiting_for_draw',
        });
      },

      closeModal: () => {
        set({ lastDrawnCard: null });
      },

      resetGame: () => {
        const state = get();
        if (state.gameMode === 'diwaniya' && state.roomCode) {
          fetch(`/api/risk-room/${state.roomCode}`, { method: 'DELETE' }).catch(() => {});
        }
        set({
          ...initialState,
          cards: [],
          gameLog: [],
          teams: [],
          logCounter: 0,
          lastDrawnCard: null,
          gameMode: 'classic',
          roomCode: null,
          hostName: null,
        });
      },

      getCurrentTeam: () => {
        const state = get();
        return state.teams[state.currentTeamIndex];
      },

      getGridCols: () => {
        const state = get();
        return getGridCols(state.config.totalCards);
      },
    }),
    {
      name: 'risk-game-storage',
      version: 1,
      migrate: () => ({
        ...initialState,
        cards: [] as RiskCard[],
        gameLog: [] as RiskLogEntry[],
        teams: [] as RiskTeam[],
        logCounter: 0,
        lastDrawnCard: null,
        gameMode: 'classic' as RiskGameMode,
        roomCode: null,
        hostName: null,
      }) as RiskState,
      partialize: (state) => ({
        phase: state.phase,
        gameMode: state.gameMode,
        roomCode: state.roomCode,
        hostName: state.hostName,
        teams: state.teams,
        currentTeamIndex: state.currentTeamIndex,
        cards: state.cards,
        config: state.config,
        turnState: state.turnState,
        lastDrawnCard: state.lastDrawnCard,
        gameLog: state.gameLog,
        logCounter: state.logCounter,
        winner: state.winner,
        winReason: state.winReason,
      }),
    }
  )
);
