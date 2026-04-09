// ============================================================
// المجازفة (Risk) - Types & Constants
// ============================================================

// Card types
export type CardType = 'safe' | 'bomb' | 'skip';

// Game phases
export type RiskGamePhase = 'landing' | 'setup' | 'playing' | 'game_over';

// Turn states during play
export type RiskTurnState = 
  | 'waiting_for_draw'    // Team should draw a card
  | 'waiting_for_decision' // Team chose continue or bank
  | 'showing_result'      // Showing what was drawn
  | 'bomb_exploded';      // Bomb was drawn

// Card interface
export interface RiskCard {
  id: string;
  type: CardType;
  value: number;     // Points for safe cards (1-5)
  revealed: boolean;
  index: number;
}

// Team interface
export interface RiskTeam {
  id: string;
  name: string;
  score: number;
  roundScore: number;
  color: string;     // Tailwind color class
  colorHex: string;  // For borders/gradients
  emoji: string;
}

// Log entry
export interface RiskLogEntry {
  id: number;
  teamId: string;
  teamName: string;
  action: string;
  cardType: CardType;
  cardValue: number;
  timestamp: number;
}

// Game config for setup
export interface RiskGameConfig {
  teamCount: number;   // 2-4
  bombCount: number;   // 1-10
  skipCount: number;   // 0-5
  totalCards: number;  // 40-100
  teamNames: string[];
}

// TEAM COLORS
export const TEAM_COLORS = [
  { color: 'text-violet-400', colorHex: '#a78bfa', emoji: '🟣', bg: 'bg-violet-950/40', border: 'border-violet-500/30' },
  { color: 'text-emerald-400', colorHex: '#34d399', emoji: '🟢', bg: 'bg-emerald-950/40', border: 'border-emerald-500/30' },
  { color: 'text-amber-400', colorHex: '#fbbf24', emoji: '🟡', bg: 'bg-amber-950/40', border: 'border-amber-500/30' },
  { color: 'text-rose-400', colorHex: '#fb7185', emoji: '🔴', bg: 'bg-rose-950/40', border: 'border-rose-500/30' },
];

// Card info
export const CARD_INFO = {
  safe: { emoji: '✅', label: 'آمن', desc: 'بطاقة آمنة — حصلت على نقاط!', color: '#34d399' },
  bomb: { emoji: '💣', label: 'قنبلة', desc: 'قنبلة! خسرت جميع نقاط الجولة!', color: '#ef4444' },
  skip: { emoji: '⏭️', label: 'تخطي', desc: 'تخطي! انتقل الدور للفريق التالي.', color: '#94a3b8' },
} as const;

// Generate a shuffled deck of cards
export function generateCardDeck(config: RiskGameConfig): RiskCard[] {
  const { bombCount, skipCount, totalCards } = config;
  const safeCount = totalCards - bombCount - skipCount;

  if (safeCount < 1) {
    throw new Error('لا يوجد بطاقات آمنة كافية');
  }

  const cards: RiskCard[] = [];
  let idx = 0;

  // Generate bomb cards
  for (let i = 0; i < bombCount; i++) {
    cards.push({
      id: `card_${idx}`,
      type: 'bomb',
      value: 0,
      revealed: false,
      index: idx,
    });
    idx++;
  }

  // Generate skip cards
  for (let i = 0; i < skipCount; i++) {
    cards.push({
      id: `card_${idx}`,
      type: 'skip',
      value: 0,
      revealed: false,
      index: idx,
    });
    idx++;
  }

  // Generate safe cards with random point values (1-5)
  for (let i = 0; i < safeCount; i++) {
    cards.push({
      id: `card_${idx}`,
      type: 'safe',
      value: Math.floor(Math.random() * 5) + 1,
      revealed: false,
      index: idx,
    });
    idx++;
  }

  // Shuffle (Fisher-Yates)
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }

  // Re-index after shuffle
  cards.forEach((card, i) => {
    card.index = i;
    card.id = `card_${i}`;
  });

  return cards;
}

// Calculate grid columns based on total cards
export function getGridCols(totalCards: number): number {
  if (totalCards <= 25) return 5;
  if (totalCards <= 49) return 7;
  if (totalCards <= 70) return 8;
  return 10;
}

// Get remaining card counts by type
export function getCardStats(cards: RiskCard[]) {
  const revealed = cards.filter(c => c.revealed);
  const hidden = cards.filter(c => !c.revealed);
  return {
    total: cards.length,
    revealed: revealed.length,
    hidden: hidden.length,
    bombs: hidden.filter(c => c.type === 'bomb').length,
    safes: hidden.filter(c => c.type === 'safe').length,
    skips: hidden.filter(c => c.type === 'skip').length,
  };
}

// Check if game is over (all cards revealed)
export function isGameOver(cards: RiskCard[]): boolean {
  return cards.every(c => c.revealed);
}

// Find winner
export function findWinner(teams: RiskTeam[]): RiskTeam | 'draw' {
  const maxScore = Math.max(...teams.map(t => t.score));
  const winners = teams.filter(t => t.score === maxScore);
  if (winners.length > 1) return 'draw';
  return winners[0];
}

// Default team names
export const DEFAULT_TEAM_NAMES = ['فريق أ', 'فريق ب', 'فريق ج', 'فريق د'];
