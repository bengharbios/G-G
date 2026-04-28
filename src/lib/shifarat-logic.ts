// ============================================================
// SHIFARAT LOGIC - Pure game logic functions (no state)
// ============================================================

import type { WordEntry } from './shifarat-types';
import { SHIFARAT_WORDS } from './shifarat-words';

/**
 * Pick a random word from the selected categories, avoiding already-used words.
 * Returns { word, category } or null if no words are available.
 * If all words are used, returns null (the caller should reset usedWords).
 */
export function getRandomWord(
  selectedCategories: string[],
  usedWords: Set<string>
): WordEntry | null {
  // Collect all available (unused) words with their category
  const available: Array<{ word: WordEntry; category: string }> = [];

  for (const category of selectedCategories) {
    const wordsInCategory = SHIFARAT_WORDS[category];
    if (!wordsInCategory) continue;

    for (const entry of wordsInCategory) {
      if (!usedWords.has(entry.w)) {
        available.push({ word: entry, category });
      }
    }
  }

  if (available.length === 0) {
    return null;
  }

  // Pick a random entry
  const randomIndex = Math.floor(Math.random() * available.length);
  return available[randomIndex].word;
}

/**
 * Get the category for a given word across the selected categories
 */
export function getWordCategory(
  word: string,
  selectedCategories: string[]
): string | null {
  for (const category of selectedCategories) {
    const wordsInCategory = SHIFARAT_WORDS[category];
    if (!wordsInCategory) continue;

    const found = wordsInCategory.find((entry) => entry.w === word);
    if (found) return category;
  }
  return null;
}

/**
 * Check if a team has reached the target score to win
 */
export function checkGameWin(score: number, target: number): boolean {
  return score >= target;
}

/**
 * Get the index of the opposing team (0 → 1, 1 → 0)
 */
export function getOpponentTeam(index: 0 | 1): 0 | 1 {
  return index === 0 ? 1 : 0;
}

/**
 * Format seconds into MM:SS display string
 */
export function formatTimer(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Calculate how many unused words remain across selected categories
 */
export function getRemainingWordsCount(
  selectedCategories: string[],
  usedWords: Set<string>
): number {
  let count = 0;
  for (const category of selectedCategories) {
    const wordsInCategory = SHIFARAT_WORDS[category];
    if (!wordsInCategory) continue;
    for (const entry of wordsInCategory) {
      if (!usedWords.has(entry.w)) {
        count++;
      }
    }
  }
  return count;
}

/**
 * Get all words from selected categories (used for resetting)
 */
export function getAllWordsInCategories(
  selectedCategories: string[]
): string[] {
  const words: string[] = [];
  for (const category of selectedCategories) {
    const wordsInCategory = SHIFARAT_WORDS[category];
    if (!wordsInCategory) continue;
    for (const entry of wordsInCategory) {
      words.push(entry.w);
    }
  }
  return words;
}
