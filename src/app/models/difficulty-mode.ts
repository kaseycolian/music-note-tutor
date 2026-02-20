// Difficulty Mode Type
export type DifficultyMode = 'default' | 'easy' | 'hard';

// Clef Filter Type
export type ClefFilter = 'both' | 'treble' | 'bass';

// Note Filter Type
export type NoteFilter = 'all' | 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B';

// Difficulty Mode Configuration
export interface DifficultyConfig {
  mode: DifficultyMode;
  label: string;
  description: string;
}

// Clef Filter Configuration
export interface ClefFilterConfig {
  filter: ClefFilter;
  label: string;
  description: string;
}

// Note Filter Configuration
export interface NoteFilterConfig {
  filter: NoteFilter;
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

export const CLEF_FILTERS: ClefFilterConfig[] = [
  {
    filter: 'both',
    label: 'Both',
    description: 'Show notes from both treble and bass clefs'
  },
  {
    filter: 'treble',
    label: 'Treble',
    description: 'Show only treble clef notes'
  },
  {
    filter: 'bass',
    label: 'Bass',
    description: 'Show only bass clef notes'
  }
];

export const NOTE_FILTERS: NoteFilterConfig[] = [
  {
    filter: 'all',
    label: 'All',
    description: 'Practice all notes'
  },
  {
    filter: 'C',
    label: 'C',
    description: 'Practice only C notes'
  },
  {
    filter: 'D',
    label: 'D',
    description: 'Practice only D notes'
  },
  {
    filter: 'E',
    label: 'E',
    description: 'Practice only E notes'
  },
  {
    filter: 'F',
    label: 'F',
    description: 'Practice only F notes'
  },
  {
    filter: 'G',
    label: 'G',
    description: 'Practice only G notes'
  },
  {
    filter: 'A',
    label: 'A',
    description: 'Practice only A notes'
  },
  {
    filter: 'B',
    label: 'B',
    description: 'Practice only B notes'
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
