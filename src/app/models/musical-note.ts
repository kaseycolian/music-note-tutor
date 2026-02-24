export interface MusicalNote {
  readonly name: NoteName;
  readonly octave: number;
  readonly clef: Clef;
  readonly position: StaffPosition;
  readonly id: string;
}

export type NoteName = 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B';
export type Clef = 'treble' | 'bass';
export type DifficultyLevel = 'easy' | 'hard' | 'mixed';
export type StaffPosition = 'line' | 'space' | 'ledger-above' | 'ledger-below';

export interface WeightedNote extends MusicalNote {
  readonly weight: number;
}

export interface OctaveRange {
  readonly min: number;
  readonly max: number;
}

export interface ClefDistribution {
  readonly trebleWeight: number;
  readonly bassWeight: number;
}

export interface ProgressionCriteria {
  readonly minAccuracy: number;
  readonly minQuestions: number;
  readonly consecutiveCorrect: number;
}

export interface SessionContext {
  readonly sessionStartTime: Date;
  readonly questionsThisSession: number;
  readonly accuracyThisSession: number;
}

export interface UserPreferences {
  readonly preferredClef?: Clef;
  readonly customNoteRange?: OctaveRange;
  readonly responseTimeLimit?: number;
}

export interface AnswerFeedback {
  readonly type: 'correct' | 'incorrect' | 'hint';
  readonly message: string;
  readonly correctAnswer?: string;
}
