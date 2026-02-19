// Difficulty Mode Type
export type DifficultyMode = 'default' | 'easy' | 'hard';

// Difficulty Mode Configuration
export interface DifficultyConfig {
  mode: DifficultyMode;
  label: string;
  description: string;
}

export const DIFFICULTY_MODES: DifficultyConfig[] = [
  {
    mode: 'default',
    label: 'Default',
    description: 'All note positions for treble and bass clefs'
  },
  {
    mode: 'easy',
    label: 'Easy',
    description: 'Only notes on the staff lines and spaces'
  },
  {
    mode: 'hard',
    label: 'Hard',
    description: 'Only notes on ledger lines above and below staff'
  }
];

// Note ranges for each difficulty mode
export const DIFFICULTY_NOTE_RANGES = {
  treble: {
    easy: ['E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F5'], // On staff
    hard: ['C4', 'D4', 'G5', 'A5', 'B5', 'C6', 'D6', 'E6', 'F6', 'G6', 'A6', 'B6', 'C7'], // Ledger lines
    default: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F5', 'G5', 'A5', 'B5', 'C6', 'D6', 'E6', 'F6', 'G6', 'A6', 'B6', 'C7'] // All
  },
  bass: {
    easy: ['G2', 'A2', 'B2', 'C3', 'D3', 'E3', 'F3', 'G3', 'A3'], // On staff
    hard: ['C1', 'D1', 'E1', 'F1', 'G1', 'A1', 'B1', 'C2', 'D2', 'E2', 'F2', 'B3', 'C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'], // Ledger lines
    default: ['C1', 'D1', 'E1', 'F1', 'G1', 'A1', 'B1', 'C2', 'D2', 'E2', 'F2', 'G2', 'A2', 'B2', 'C3', 'D3', 'E3', 'F3', 'G3', 'A3', 'B3', 'C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'] // All
  }
};
