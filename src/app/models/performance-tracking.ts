export interface NotePerformance {
  readonly noteId: string;
  attempts: number;
  correctAnswers: number;
  readonly accuracy: number;
  lastSeen: Date;
  averageResponseTime: number;
  consecutiveCorrect: number;
  consecutiveIncorrect: number;
  difficultyScore: number;
}

export interface PerformanceMetrics {
  readonly totalAttempts: number;
  readonly totalCorrect: number;
  readonly overallAccuracy: number;
  readonly averageResponseTime: number;
  readonly sessionAccuracy: number;
  readonly improvementTrend: number;
}

export interface LearningAnalytics {
  readonly strugglingNotes: string[];
  readonly masteredNotes: string[];
  readonly recommendedFocus: string[];
  readonly progressTrend: 'improving' | 'stable' | 'declining';
  readonly estimatedMasteryTime: number;
}

export interface ResponseTimeAnalysis {
  readonly fastResponses: number;
  readonly mediumResponses: number;
  readonly slowResponses: number;
  readonly averageTime: number;
  readonly medianTime: number;
}

export interface AccuracyByDifficulty {
  readonly beginner: number;
  readonly intermediate: number;
  readonly advanced: number;
  readonly expert: number;
}
