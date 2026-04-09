// ════════════════════════════════════════════════════════════════
// PRISON GAME — STATE MANAGEMENT (v1.0 — Room Sync for Diwaniya)
// Zustand Store with Persist
// ════════════════════════════════════════════════════════════════

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  GamePhase,
  PrisonTeam,
  PrisonPlayer,
  Cell,
  RevealResult,
  GameLogEntry,
  CellType,
  createCells,
  createPlayer,
  checkGameOver,
  getOpposingTeam,
  getActiveMembers,
  getImprisonedMembers,
  hasImprisonedPlayers,
  shuffleArray,
  CELL_CONFIG,
  GRID_CONFIGS,
} from './prison-types';
import { syncPrisonRoomState, endPrisonRoomSession } from './prison-sync';

// ── Store Interface ────────────────────────────────────────────

export interface PrisonStore {
  // Phase
  phase: GamePhase;

  // Grid
  gridSize: number;

  // Teams
  teamAlphaName: string;
  teamBetaName: string;

  // Players
  players: PrisonPlayer[];
  currentTeam: PrisonTeam;

  // Cells
  cells: Cell[];
  lastRevealedCell: Cell | null;
  revealResult: RevealResult | null;

  // Rounds & Log
  currentRound: number;
  roundLog: GameLogEntry[];
  winner: PrisonTeam | 'draw' | null;
  winReason: string;

  // Diwaniya mode
  gameMode: 'local' | 'diwaniya' | null;
  roomCode: string | null;

  // ── Actions ──────────────────────────────────────────────────
  setPhase: (phase: GamePhase) => void;
  setGameMode: (mode: 'local' | 'diwaniya' | null) => void;
  setRoomCode: (code: string | null) => void;
  setupGame: (
    gridSize: number,
    alphaName: string,
    betaName: string,
    alphaPlayers: { name: string; role: string }[],
    betaPlayers: { name: string; role: string }[],
    firstTeam: PrisonTeam
  ) => void;
  revealCell: (cellId: number) => void;
  advanceTurn: () => void;
  resetGame: () => void;
  syncToRoom: () => void;
}

// ── Initial State ──────────────────────────────────────────────

const initialState = {
  phase: 'landing' as GamePhase,
  gridSize: 9,
  teamAlphaName: '',
  teamBetaName: '',
  players: [] as PrisonPlayer[],
  currentTeam: 'alpha' as PrisonTeam,
  cells: [] as Cell[],
  lastRevealedCell: null as Cell | null,
  revealResult: null as RevealResult | null,
  currentRound: 1,
  roundLog: [] as GameLogEntry[],
  winner: null as PrisonTeam | 'draw' | null,
  winReason: '',
  gameMode: null as 'local' | 'diwaniya' | null,
  roomCode: null as string | null,
};

// ── Helpers ────────────────────────────────────────────────────

function makeLog(round: number, message: string, type: GameLogEntry['type'] = 'info'): GameLogEntry {
  return { round, message, timestamp: Date.now(), type };
}

function pickRandom<T>(arr: T[]): T | null {
  if (arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── Store ──────────────────────────────────────────────────────

export const usePrisonStore = create<PrisonStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setPhase: (phase) => {
        set({ phase });
        get().syncToRoom();
      },

      setGameMode: (mode) => set({ gameMode: mode }),
      setRoomCode: (code) => set({ roomCode: code }),

      syncToRoom: () => {
        const state = get();
        if (!state.roomCode) return;

        const syncData = {
          phase: state.phase,
          round: state.currentRound,
          stateJson: JSON.stringify({
            gridSize: state.gridSize,
            teamAlphaName: state.teamAlphaName,
            teamBetaName: state.teamBetaName,
            players: state.players,
            currentTeam: state.currentTeam,
            cells: state.cells,
            lastRevealedCell: state.lastRevealedCell,
            revealResult: state.revealResult,
            currentRound: state.currentRound,
            roundLog: state.roundLog,
            winner: state.winner,
            winReason: state.winReason,
          }),
        };

        syncPrisonRoomState(state.roomCode, syncData);
      },

      setupGame: (gridSize, alphaName, betaName, alphaPlayers, betaPlayers, firstTeam) => {
        const alpha: PrisonPlayer[] = alphaPlayers.map((p, i) =>
          createPlayer(p.name, 'alpha', i, p.role as PrisonPlayer['role'])
        );
        const beta: PrisonPlayer[] = betaPlayers.map((p, i) =>
          createPlayer(p.name, 'beta', i + alphaPlayers.length, p.role as PrisonPlayer['role'])
        );

        const aName = alphaName || 'فريق السجناء';
        const bName = betaName || 'فريق الحراس';
        const startTeamName = firstTeam === 'alpha' ? aName : bName;
        const cells = createCells(gridSize);

        set({
          phase: 'playing',
          gridSize,
          teamAlphaName: aName,
          teamBetaName: bName,
          players: [...alpha, ...beta],
          currentTeam: firstTeam,
          cells,
          lastRevealedCell: null,
          revealResult: null,
          currentRound: 1,
          winner: null,
          winReason: '',
          roundLog: [
            makeLog(1, `🔒 بدأت لعبة السجن! "${aName}" ضد "${bName}"`, 'system'),
            makeLog(1, `🎯 الفريق البادئ: "${startTeamName}" — اختروا زنزانة... 👑`, 'action'),
          ],
        });
        get().syncToRoom();
      },

      revealCell: (cellId: number) => {
        const state = get();
        if (state.phase !== 'playing') return;

        const cellIndex = state.cells.findIndex(c => c.id === cellId);
        if (cellIndex === -1) return;

        const cell = state.cells[cellIndex];
        if (cell.status !== 'hidden') return;

        const team = state.currentTeam;
        const enemyTeam = getOpposingTeam(team);
        const teamName = team === 'alpha' ? state.teamAlphaName : state.teamBetaName;
        const enemyTeamName = enemyTeam === 'alpha' ? state.teamAlphaName : state.teamBetaName;
        const round = state.currentRound;

        // Mark cell as revealed
        const updatedCells = state.cells.map(c =>
          c.id === cellId ? { ...c, status: 'revealed' as const } : c
        );

        let updatedPlayers = [...state.players];
        let targetPlayer: PrisonPlayer | null = null;
        let message = '';
        let logType: GameLogEntry['type'] = 'info';

        const config = CELL_CONFIG[cell.type];

        switch (cell.type) {
          case 'open': {
            // Imprison a random active enemy
            const activeEnemies = getActiveMembers(updatedPlayers, enemyTeam);
            if (activeEnemies.length > 0) {
              targetPlayer = pickRandom(activeEnemies);
              if (targetPlayer) {
                updatedPlayers = updatedPlayers.map(p =>
                  p.id === targetPlayer!.id ? { ...p, status: 'imprisoned' as const } : p
                );
                // Update the reference in targetPlayer to reflect new status
                targetPlayer = { ...targetPlayer, status: 'imprisoned' };
                message = `${config.emoji} زنزانة فارغة! تم سجن ${targetPlayer.name} من "${enemyTeamName}"`;
                logType = 'danger';
              }
            } else {
              message = `${config.emoji} زنزانة فارغة! لكن لا يوجد خصم نشط ليُسجن`;
              logType = 'info';
            }
            break;
          }

          case 'uniform': {
            // Convert a random active enemy to current team
            const activeEnemies = getActiveMembers(updatedPlayers, enemyTeam);
            if (activeEnemies.length > 0) {
              targetPlayer = pickRandom(activeEnemies);
              if (targetPlayer) {
                updatedPlayers = updatedPlayers.map(p =>
                  p.id === targetPlayer!.id
                    ? { ...p, team, status: 'converted' as const, originalTeam: targetPlayer!.team }
                    : p
                );
                targetPlayer = { ...targetPlayer, team, status: 'converted', originalTeam: enemyTeam };
                message = `${config.emoji} ملابس السجن! ${targetPlayer.name} من "${enemyTeamName}" انضم لفريق "${teamName}"`;
                logType = 'danger';
              }
            } else {
              message = `${config.emoji} ملابس السجن! لكن لا يوجد خصم نشط لتحويله`;
              logType = 'info';
            }
            break;
          }

          case 'skull': {
            // Kill a random active enemy
            const activeEnemies = getActiveMembers(updatedPlayers, enemyTeam);
            if (activeEnemies.length > 0) {
              targetPlayer = pickRandom(activeEnemies);
              if (targetPlayer) {
                updatedPlayers = updatedPlayers.map(p =>
                  p.id === targetPlayer!.id ? { ...p, status: 'killed' as const } : p
                );
                targetPlayer = { ...targetPlayer, status: 'killed' };
                message = `${config.emoji} إعدام! ${targetPlayer.name} من "${enemyTeamName}" قُتل`;
                logType = 'danger';
              }
            } else {
              message = `${config.emoji} إعدام! لكن لا يوجد خصم نشط ليُقتل`;
              logType = 'info';
            }
            break;
          }

          case 'key': {
            // Free a random imprisoned teammate
            const imprisonedTeammates = getImprisonedMembers(updatedPlayers, team);
            if (imprisonedTeammates.length > 0) {
              targetPlayer = pickRandom(imprisonedTeammates);
              if (targetPlayer) {
                updatedPlayers = updatedPlayers.map(p =>
                  p.id === targetPlayer!.id ? { ...p, status: 'active' as const } : p
                );
                targetPlayer = { ...targetPlayer, status: 'active' };
                message = `${config.emoji} مفتاح الحرية! تم تحرير ${targetPlayer.name} من "${teamName}"`;
                logType = 'success';
              }
            } else {
              message = `${config.emoji} مفتاح الحرية! لكن لا يوجد زميل محبوس في فريق "${teamName}"`;
              logType = 'info';
            }
            break;
          }

          case 'skip': {
            // Nothing happens
            message = `${config.emoji} زنزانة ممتلئة... تخطي! لا شيء يحدث`;
            logType = 'info';
            break;
          }

          default:
            message = `${config.emoji} حدث غير معروف`;
            logType = 'info';
            break;
        }

        // Build reveal result
        const revealResult: RevealResult = {
          cellId: cell.id,
          cellType: cell.type,
          targetPlayer: targetPlayer
            ? { id: targetPlayer.id, name: targetPlayer.name, team: targetPlayer.team, role: targetPlayer.role, status: targetPlayer.status, avatar: targetPlayer.avatar }
            : null,
          targetTeam: team,
          message,
        };

        // Check game over
        const { over, winner, reason } = checkGameOver(updatedPlayers);

        // Check if all cells revealed
        const allCellsRevealed = updatedCells.every(c => c.status === 'revealed');

        if (over) {
          set({
            cells: updatedCells,
            players: updatedPlayers,
            lastRevealedCell: updatedCells[cellIndex],
            revealResult,
            phase: 'game_over' as GamePhase,
            winner,
            winReason: reason,
            roundLog: [
              ...state.roundLog,
              makeLog(round, message, logType),
              makeLog(round, `🏆 انتهت اللعبة! ${reason}`, 'system'),
            ],
          });
        } else if (allCellsRevealed) {
          // All cells revealed but no team eliminated — decide by active members
          const alphaActive = getActiveMembers(updatedPlayers, 'alpha').length;
          const betaActive = getActiveMembers(updatedPlayers, 'beta').length;
          let finalWinner: PrisonTeam | 'draw' = 'draw';
          let finalReason = 'انتهت جميع الزنزانات!';
          if (alphaActive > betaActive) {
            finalWinner = 'alpha';
            finalReason = `انتهت جميع الزنزانات! فريق "${state.teamAlphaName}" فاز بأكثر الأعضاء النشطين`;
          } else if (betaActive > alphaActive) {
            finalWinner = 'beta';
            finalReason = `انتهت جميع الزنزانات! فريق "${state.teamBetaName}" فاز بأكثر الأعضاء النشطين`;
          } else {
            finalWinner = 'draw';
            finalReason = 'انتهت جميع الزنزانات! تعادل بالأعضاء النشطين';
          }

          set({
            cells: updatedCells,
            players: updatedPlayers,
            lastRevealedCell: updatedCells[cellIndex],
            revealResult,
            phase: 'game_over' as GamePhase,
            winner: finalWinner,
            winReason: finalReason,
            roundLog: [
              ...state.roundLog,
              makeLog(round, message, logType),
              makeLog(round, `🏆 انتهت اللعبة! ${finalReason}`, 'system'),
            ],
          });
        } else {
          set({
            cells: updatedCells,
            players: updatedPlayers,
            lastRevealedCell: updatedCells[cellIndex],
            revealResult,
            roundLog: [
              ...state.roundLog,
              makeLog(round, message, logType),
            ],
          });
        }

        get().syncToRoom();
      },

      advanceTurn: () => {
        const state = get();
        if (state.phase !== 'playing') return;

        // Check if all cells revealed
        const allCellsRevealed = state.cells.every(c => c.status === 'revealed');
        if (allCellsRevealed) return; // Game over already handled in revealCell

        // Check game over from current state
        const { over } = checkGameOver(state.players);
        if (over) return; // Game over already handled in revealCell

        const nextTeam = getOpposingTeam(state.currentTeam);
        const nextRound = state.currentTeam === 'beta' ? state.currentRound + 1 : state.currentRound;

        // Check if next team has active members
        const nextActive = getActiveMembers(state.players, nextTeam);
        if (nextActive.length === 0) {
          // Stay on current team — skip to next round
          const currentTeamName = state.currentTeam === 'alpha' ? state.teamAlphaName : state.teamBetaName;
          set({
            currentRound: nextRound,
            lastRevealedCell: null,
            revealResult: null,
            roundLog: [
              ...state.roundLog,
              makeLog(nextRound, `⏭️ لا يوجد أعضاء نشطون في الفريق الخصم — دور "${currentTeamName}" مرة أخرى`, 'info'),
            ],
          });
          get().syncToRoom();
          return;
        }

        const teamName = nextTeam === 'alpha' ? state.teamAlphaName : state.teamBetaName;

        set({
          currentTeam: nextTeam,
          currentRound: nextRound,
          lastRevealedCell: null,
          revealResult: null,
          roundLog: [
            ...state.roundLog,
            makeLog(nextRound, `🔄 دور فريق "${teamName}" — اختروا زنزانة... 👑`, 'info'),
          ],
        });
        get().syncToRoom();
      },

      resetGame: () => {
        const state = get();
        // End room session if in diwaniya mode
        if (state.roomCode && state.gameMode === 'diwaniya') {
          endPrisonRoomSession(state.roomCode);
        }
        if (typeof window !== 'undefined') {
          localStorage.removeItem('prison-game-storage');
        }
        set({ ...initialState });
      },
    }),
    {
      name: 'prison-game-storage',
      version: 1,
      migrate: (persisted: unknown, version: number) => {
        if (version < 1) return { ...initialState } as PrisonStore;
        return persisted as PrisonStore;
      },
    }
  )
);
