import {
  ClefDistribution,
  DifficultyLevel,
  NoteName,
  OctaveRange,
  ProgressionCriteria
} from './musical-note';
import { NotePerformance } from './performance-tracking';
import { UserProgress } from './user-progress';

export interface LevelConfiguration {
  readonly level: DifficultyLevel;
  readonly noteRange: NoteRange;
  readonly clefDistribution: ClefDistribution;
  readonly baseWeights: Map<string, number>;
  readonly progressionCriteria: ProgressionCriteria;
}

export interface NoteRange {
  readonly trebleRange: OctaveRange;
  readonly bassRange: OctaveRange;
  readonly allowedNotes: NoteName[];
}

export interface SelectionContext {
  readonly currentLevel: DifficultyLevel;
  readonly userProgress: UserProgress;
  readonly performanceMap: Map<string, NotePerformance>;
  readonly recentHistory: import('./musical-note').MusicalNote[];
  readonly sessionContext: import('./musical-note').SessionContext;
}

export interface AdaptiveWeighting {
  readonly performanceWeight: number;
  readonly recencyWeight: number;
  readonly difficultyWeight: number;
  readonly randomnessWeight: number;
}

export interface LevelThresholds {
  readonly accuracyThreshold: number;
  readonly speedThreshold: number;
  readonly consistencyThreshold: number;
  readonly masteryThreshold: number;
}

export interface GameConfiguration {
  readonly maxConsecutiveRepeats: number;
  readonly historyWindowSize: number;
  readonly adaptationRate: number;
  readonly difficultyAdjustmentFactor: number;
}

export interface NoteDifficultyMap {
  readonly [noteId: string]: number;
}

export interface LevelTransition {
  readonly fromLevel: DifficultyLevel;
  readonly toLevel: DifficultyLevel;
  readonly requirements: ProgressionCriteria;
  readonly unlockMessage: string;
}
