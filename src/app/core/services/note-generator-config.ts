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
    const levels: DifficultyLevel[] = ['beginner', 'intermediate', 'advanced', 'expert'];
    const currentIndex = levels.indexOf(currentLevel);

    if (currentIndex >= 0 && currentIndex < levels.length - 1) {
      return levels[currentIndex + 1];
    }

    return null; // Already at highest level
  }

  /**
   * Check if a level can be unlocked based on current progress
   */
  canUnlockLevel(targetLevel: DifficultyLevel, currentAccuracy: number, questionsAnswered: number): boolean {
    const config = this.getLevelConfiguration(targetLevel);
    return currentAccuracy >= config.progressionCriteria.minAccuracy &&
           questionsAnswered >= config.progressionCriteria.minQuestions;
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
        baseWeights: new Map(weights)
      };
      this.levelConfigurations.set(level, updatedConfig);
    }
  }

  // Private initialization methods
  private initializeLevelConfigurations(): void {
    this.levelConfigurations.set('beginner', this.createBeginnerConfig());
    this.levelConfigurations.set('intermediate', this.createIntermediateConfig());
    this.levelConfigurations.set('advanced', this.createAdvancedConfig());
    this.levelConfigurations.set('expert', this.createExpertConfig());
  }

  private createBeginnerConfig(): LevelConfiguration {
    const noteRange: NoteRange = {
      trebleRange: { min: 4, max: 5 },
      bassRange: { min: 3, max: 4 },
      allowedNotes: ['C', 'D', 'E', 'F', 'G'],
      includeAccidentals: false
    };

    const clefDistribution: ClefDistribution = {
      trebleWeight: 0.8,
      bassWeight: 0.2
    };

    const progressionCriteria: ProgressionCriteria = {
      minAccuracy: 0.75,
      minQuestions: 20,
      consecutiveCorrect: 5
    };

    const baseWeights = this.generateBaseWeights(noteRange, 1.0);

    return {
      level: 'beginner',
      noteRange,
      clefDistribution,
      baseWeights,
      progressionCriteria
    };
  }

  private createIntermediateConfig(): LevelConfiguration {
    const noteRange: NoteRange = {
      trebleRange: { min: 4, max: 6 },
      bassRange: { min: 2, max: 4 },
      allowedNotes: ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
      includeAccidentals: false
    };

    const clefDistribution: ClefDistribution = {
      trebleWeight: 0.6,
      bassWeight: 0.4
    };

    const progressionCriteria: ProgressionCriteria = {
      minAccuracy: 0.80,
      minQuestions: 50,
      consecutiveCorrect: 8
    };

    const baseWeights = this.generateBaseWeights(noteRange, 1.0);

    return {
      level: 'intermediate',
      noteRange,
      clefDistribution,
      baseWeights,
      progressionCriteria
    };
  }

  private createAdvancedConfig(): LevelConfiguration {
    const noteRange: NoteRange = {
      trebleRange: { min: 3, max: 6 },
      bassRange: { min: 2, max: 5 },
      allowedNotes: ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
      includeAccidentals: true
    };

    const clefDistribution: ClefDistribution = {
      trebleWeight: 0.5,
      bassWeight: 0.5
    };

    const progressionCriteria: ProgressionCriteria = {
      minAccuracy: 0.85,
      minQuestions: 100,
      consecutiveCorrect: 10
    };

    const baseWeights = this.generateBaseWeights(noteRange, 1.0);

    return {
      level: 'advanced',
      noteRange,
      clefDistribution,
      baseWeights,
      progressionCriteria
    };
  }

  private createExpertConfig(): LevelConfiguration {
    const noteRange: NoteRange = {
      trebleRange: { min: 3, max: 7 },
      bassRange: { min: 1, max: 5 },
      allowedNotes: ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
      includeAccidentals: true
    };

    const clefDistribution: ClefDistribution = {
      trebleWeight: 0.5,
      bassWeight: 0.5
    };

    const progressionCriteria: ProgressionCriteria = {
      minAccuracy: 0.90,
      minQuestions: 200,
      consecutiveCorrect: 15
    };

    const baseWeights = this.generateBaseWeights(noteRange, 1.0);

    return {
      level: 'expert',
      noteRange,
      clefDistribution,
      baseWeights,
      progressionCriteria
    };
  }

  private generateBaseWeights(noteRange: NoteRange, baseWeight: number): Map<string, number> {
    const weights = new Map<string, number>();
    const clefs = ['treble', 'bass'];

    clefs.forEach(clef => {
      const range = clef === 'treble' ? noteRange.trebleRange : noteRange.bassRange;

      for (let octave = range.min; octave <= range.max; octave++) {
        noteRange.allowedNotes.forEach(noteName => {
          const noteId = `${noteName}${octave}-${clef}`;
          weights.set(noteId, baseWeight);

          // Add accidentals if enabled
          if (noteRange.includeAccidentals) {
            weights.set(`${noteId}-sharp`, baseWeight * 0.8); // Slightly lower weight for accidentals
            weights.set(`${noteId}-flat`, baseWeight * 0.8);
          }
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
      'beginner': {
        // Focus on middle C and nearby notes
        'C4-treble': 1.5,
        'D4-treble': 1.3,
        'E4-treble': 1.3,
        'F4-treble': 1.2,
        'G4-treble': 1.2,
        'C5-treble': 1.1,
      },
      'intermediate': {
        // More balanced distribution
        'A4-treble': 1.2,
        'B4-treble': 1.2,
        'C3-bass': 1.3,
        'D3-bass': 1.2,
        'E3-bass': 1.2,
      },
      'advanced': {
        // Include ledger lines and accidentals
        'C6-treble': 1.1,
        'B2-bass': 1.1,
        'F4-treble-sharp': 1.0,
        'B4-treble-flat': 1.0,
      },
      'expert': {
        // Full range with equal emphasis
        'C7-treble': 1.0,
        'C1-bass': 1.0,
        'F3-bass-sharp': 1.0,
        'A5-treble-flat': 1.0,
      }
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
      'beginner': {
        performanceWeight: 0.4,
        recencyWeight: 0.3,
        difficultyWeight: 0.2,
        randomnessWeight: 0.1
      },
      'intermediate': {
        performanceWeight: 0.5,
        recencyWeight: 0.25,
        difficultyWeight: 0.15,
        randomnessWeight: 0.1
      },
      'advanced': {
        performanceWeight: 0.6,
        recencyWeight: 0.2,
        difficultyWeight: 0.1,
        randomnessWeight: 0.1
      },
      'expert': {
        performanceWeight: 0.7,
        recencyWeight: 0.15,
        difficultyWeight: 0.1,
        randomnessWeight: 0.05
      }
    };

    return params[level];
  }
}
