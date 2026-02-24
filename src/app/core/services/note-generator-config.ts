import { Injectable } from '@angular/core';
import { LevelConfiguration, NoteRange } from '../../models/level-configuration';
import {
  ClefDistribution,
  DifficultyLevel,
  ProgressionCriteria
} from '../../models/musical-note';

@Injectable({
  providedIn: 'root',
})
export class NoteGeneratorConfigService {
  private readonly levelConfigurations: Map<DifficultyLevel, LevelConfiguration> = new Map();

  constructor() {
    this.initializeLevelConfigurations();
  }

  /**
   * Get configuration for a specific difficulty level
   */
  getLevelConfiguration(level: DifficultyLevel): LevelConfiguration {
    const config = this.levelConfigurations.get(level);
    if (!config) {
      throw new Error(`No configuration found for level: ${level}`);
    }
    return config;
  }

  /**
   * Get all available difficulty levels
   */
  getAvailableLevels(): DifficultyLevel[] {
    return Array.from(this.levelConfigurations.keys());
  }

  /**
   * Get the next level after the current one
   */
  getNextLevel(currentLevel: DifficultyLevel): DifficultyLevel | null {
    const levels: DifficultyLevel[] = ['easy', 'hard', 'mixed'];
    const currentIndex = levels.indexOf(currentLevel);

    if (currentIndex >= 0 && currentIndex < levels.length - 1) {
      return levels[currentIndex + 1];
    }

    return null; // Already at highest level
  }

  /**
   * Check if a level can be unlocked based on current progress
   */
  canUnlockLevel(
    targetLevel: DifficultyLevel,
    currentAccuracy: number,
    questionsAnswered: number
  ): boolean {
    const config = this.getLevelConfiguration(targetLevel);
    return (
      currentAccuracy >= config.progressionCriteria.minAccuracy &&
      questionsAnswered >= config.progressionCriteria.minQuestions
    );
  }

  /**
   * Get base note weights for a level
   */
  getBaseWeights(level: DifficultyLevel): Map<string, number> {
    const config = this.getLevelConfiguration(level);
    return new Map(config.baseWeights);
  }

  /**
   * Update base weights for a level (for customization)
   */
  updateBaseWeights(level: DifficultyLevel, weights: Map<string, number>): void {
    const config = this.levelConfigurations.get(level);
    if (config) {
      const updatedConfig: LevelConfiguration = {
        ...config,
        baseWeights: new Map(weights),
      };
      this.levelConfigurations.set(level, updatedConfig);
    }
  }

  // Private initialization methods
  private initializeLevelConfigurations(): void {
    this.levelConfigurations.set('easy', this.createEasyConfig());
    this.levelConfigurations.set('hard', this.createHardConfig());
    this.levelConfigurations.set('mixed', this.createMixedConfig());
  }

  private createEasyConfig(): LevelConfiguration {
    // Easy combines Beginner and Intermediate levels
    const noteRange: NoteRange = {
      trebleRange: { min: 1, max: 7 },
      bassRange: { min: 1, max: 5 },
      allowedNotes: ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
    };

    const clefDistribution: ClefDistribution = {
      trebleWeight: 0.7,
      bassWeight: 0.3,
    };

    const progressionCriteria: ProgressionCriteria = {
      minAccuracy: 0.78,
      minQuestions: 35,
      consecutiveCorrect: 7,
    };

    const baseWeights = this.generateBaseWeights(noteRange, 1.0);

    return {
      level: 'easy',
      noteRange,
      clefDistribution,
      baseWeights,
      progressionCriteria,
    };
  }

  private createHardConfig(): LevelConfiguration {
    // Hard combines Advanced and Expert levels
    const noteRange: NoteRange = {
      trebleRange: { min: 3, max: 7 },
      bassRange: { min: 1, max: 5 },
      allowedNotes: ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
    };

    const clefDistribution: ClefDistribution = {
      trebleWeight: 0.5,
      bassWeight: 0.5,
    };

    const progressionCriteria: ProgressionCriteria = {
      minAccuracy: 0.88,
      minQuestions: 150,
      consecutiveCorrect: 12,
    };

    const baseWeights = this.generateBaseWeights(noteRange, 1.0);

    return {
      level: 'hard',
      noteRange,
      clefDistribution,
      baseWeights,
      progressionCriteria,
    };
  }

  private createMixedConfig(): LevelConfiguration {
    // Mixed combines both Easy and Hard levels
    const noteRange: NoteRange = {
      trebleRange: { min: 3, max: 7 },
      bassRange: { min: 1, max: 5 },
      allowedNotes: ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
    };

    const clefDistribution: ClefDistribution = {
      trebleWeight: 0.5,
      bassWeight: 0.5,
    };

    const progressionCriteria: ProgressionCriteria = {
      minAccuracy: 0.83,
      minQuestions: 100,
      consecutiveCorrect: 10,
    };

    const baseWeights = this.generateBaseWeights(noteRange, 1.0);

    return {
      level: 'mixed',
      noteRange,
      clefDistribution,
      baseWeights,
      progressionCriteria,
    };
  }

  private generateBaseWeights(noteRange: NoteRange, baseWeight: number): Map<string, number> {
    const weights = new Map<string, number>();
    const clefs = ['treble', 'bass'];

    clefs.forEach((clef) => {
      const range = clef === 'treble' ? noteRange.trebleRange : noteRange.bassRange;

      for (let octave = range.min; octave <= range.max; octave++) {
        noteRange.allowedNotes.forEach((noteName) => {
          const noteId = `${noteName}${octave}-${clef}`;
          weights.set(noteId, baseWeight);
        });
      }
    });

    return weights;
  }

  /**
   * Get difficulty-specific note priorities
   */
  getNotePriorities(level: DifficultyLevel): { [noteId: string]: number } {
    const priorities: { [key: string]: { [noteId: string]: number } } = {
      easy: {
        // Focus on middle C and nearby notes, balanced distribution
        'C4-treble': 1.4,
        'D4-treble': 1.3,
        'E4-treble': 1.3,
        'F4-treble': 1.2,
        'G4-treble': 1.2,
        'A4-treble': 1.2,
        'B4-treble': 1.2,
        'C5-treble': 1.1,
        'C3-bass': 1.3,
        'D3-bass': 1.2,
        'E3-bass': 1.2,
      },
      hard: {
        // Full range with ledger lines
        'C6-treble': 1.1,
        'C7-treble': 1.0,
        'B2-bass': 1.1,
        'C1-bass': 1.0,
      },
    };

    return priorities[level] || {};
  }

  /**
   * Get adaptive weighting parameters for a level
   */
  getAdaptiveWeightingParams(level: DifficultyLevel): {
    performanceWeight: number;
    recencyWeight: number;
    difficultyWeight: number;
    randomnessWeight: number;
  } {
    const params = {
      easy: {
        performanceWeight: 0.45,
        recencyWeight: 0.28,
        difficultyWeight: 0.17,
        randomnessWeight: 0.1,
      },
      hard: {
        performanceWeight: 0.65,
        recencyWeight: 0.18,
        difficultyWeight: 0.1,
        randomnessWeight: 0.07,
      },
      mixed: {
        performanceWeight: 0.55,
        recencyWeight: 0.23,
        difficultyWeight: 0.13,
        randomnessWeight: 0.09,
      },
    };

    return params[level];
  }
}
