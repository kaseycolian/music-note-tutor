import { DifficultyLevel, UserPreferences } from './musical-note';

export interface UserProgress {
  readonly currentLevel: DifficultyLevel;
  totalQuestionsAnswered: number;
  overallAccuracy: number;
  sessionStartTime: Date;
  levelProgression: LevelProgressionData[];
  customSettings?: UserPreferences;
}

export interface LevelProgressionData {
  readonly level: DifficultyLevel;
  unlockedAt: Date;
  questionsAtLevel: number;
  accuracyAtLevel: number;
}

export interface ProgressSnapshot {
  readonly timestamp: Date;
  readonly level: DifficultyLevel;
  readonly questionsAnswered: number;
  readonly accuracy: number;
  readonly sessionDuration: number;
}

export interface LevelUnlockCriteria {
  readonly requiredAccuracy: number;
  readonly minimumQuestions: number;
  readonly consecutiveCorrectAnswers: number;
  readonly timeSpentAtLevel: number;
}

export interface UserAchievement {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly unlockedAt: Date;
  readonly category: 'accuracy' | 'speed' | 'consistency' | 'milestone';
}

export interface StudySession {
  readonly sessionId: string;
  readonly startTime: Date;
  readonly endTime?: Date;
  readonly questionsAnswered: number;
  readonly correctAnswers: number;
  readonly averageResponseTime: number;
  readonly notesEncountered: string[];
}
