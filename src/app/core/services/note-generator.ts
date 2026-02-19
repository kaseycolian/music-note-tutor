import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { ClefFilter, DIFFICULTY_NOTE_RANGES, DifficultyMode } from '../../models/difficulty-mode';
import { LevelConfiguration, SelectionContext } from '../../models/level-configuration';
import {
  Clef,
  DifficultyLevel,
  MusicalNote,
  NoteName,
  StaffPosition,
  WeightedNote,
} from '../../models/musical-note';
import { NotePerformance } from '../../models/performance-tracking';
import { NoteGeneratorConfigService } from './note-generator-config';
import { StorageService } from './storage';
import { UserProgressService } from './user-progress';

@Injectable({
  providedIn: 'root',
})
export class NoteGeneratorService {
  // Signal-based reactive state for RooCode optimization
  private performanceData = signal(new Map<string, NotePerformance>());
  private currentLevel = signal<DifficultyLevel>('easy');
  private recentHistory = signal<MusicalNote[]>([]);
  private difficultyMode = signal<DifficultyMode>('default');
  private clefFilter = signal<ClefFilter>('both');

  // Computed signals for RooCode intellisense
  readonly overallAccuracy = computed(() => {
    const performances = Array.from(this.performanceData().values());
    if (performances.length === 0) return 0;
    const totalCorrect = performances.reduce((sum, p) => sum + p.correctAnswers, 0);
    const totalAttempts = performances.reduce((sum, p) => sum + p.attempts, 0);
    return totalAttempts > 0 ? totalCorrect / totalAttempts : 0;
  });

  // Dependency injection with RooCode auto-completion
  private configService = inject(NoteGeneratorConfigService);
  private progressService = inject(UserProgressService);
  private storageService = inject(StorageService);

  constructor() {
    // Auto-persistence with effects
    effect(() => {
      this.persistPerformanceData();
    });

    // Load existing data
    this.loadPerformanceData();
  }

  /**
   * Generate next note using adaptive algorithm
   * RooCode will provide parameter suggestions and return type inference
   */
  public generateNextNote(context?: Partial<SelectionContext>): MusicalNote {
    const fullContext = this.buildSelectionContext(context);
    const candidateNotes = this.buildCandidatePool(fullContext);
    const weightedNotes = this.calculateWeights(candidateNotes, fullContext);
    const selectedNote = this.performWeightedSelection(weightedNotes);

    this.updateHistory(selectedNote);
    return selectedNote;
  }

  /**
   * Record user answer and update performance metrics
   * RooCode will validate parameter types automatically
   */
  public recordAnswer(
    note: MusicalNote,
    userAnswer: string,
    isCorrect: boolean,
    responseTimeMs: number,
  ): void {
    this.updatePerformanceData(note, isCorrect, responseTimeMs);
    this.checkLevelProgression();
  }

  /**
   * Get current level configuration
   */
  public getCurrentLevelConfig(): LevelConfiguration {
    return this.configService.getLevelConfiguration(this.currentLevel());
  }

  /**
   * Get performance statistics
   */
  public getPerformanceStats(): Map<string, NotePerformance> {
    return new Map(this.performanceData());
  }

  /**
   * Reset all progress data
   */
  public resetProgress(): void {
    this.performanceData.set(new Map());
    this.recentHistory.set([]);
    this.currentLevel.set('easy');
    this.storageService.clear('performance-data');
    this.storageService.clear('recent-history');
    this.storageService.clear('current-level');
  }

  /**
   * Set difficulty mode to filter available notes
   */
  public setDifficultyMode(mode: DifficultyMode): void {
    this.difficultyMode.set(mode);
  }

  /**
   * Get current difficulty mode
   */
  public getDifficultyMode(): DifficultyMode {
    return this.difficultyMode();
  }

  /**
   * Set clef filter to show only specific clef notes
   */
  public setClefFilter(filter: ClefFilter): void {
    this.clefFilter.set(filter);
  }

  /**
   * Get current clef filter
   */
  public getClefFilter(): ClefFilter {
    return this.clefFilter();
  }

  // Private methods for algorithm implementation
  private buildSelectionContext(partial?: Partial<SelectionContext>): SelectionContext {
    const userProgress = this.progressService.getCurrentProgress();
    return {
      currentLevel: partial?.currentLevel ?? this.currentLevel(),
      userProgress: partial?.userProgress ?? userProgress,
      performanceMap: partial?.performanceMap ?? this.performanceData(),
      recentHistory: partial?.recentHistory ?? this.recentHistory(),
      sessionContext: partial?.sessionContext ?? {
        sessionStartTime: userProgress.sessionStartTime,
        questionsThisSession: userProgress.totalQuestionsAnswered,
        accuracyThisSession: userProgress.overallAccuracy,
      },
    };
  }

  private buildCandidatePool(context: SelectionContext): MusicalNote[] {
    const config = this.getCurrentLevelConfig();
    const candidates: MusicalNote[] = [];

    // Generate all possible notes for current level
    const clefs: Clef[] = ['treble', 'bass'];

    clefs.forEach((clef) => {
      const range = clef === 'treble' ? config.noteRange.trebleRange : config.noteRange.bassRange;

      for (let octave = range.min; octave <= range.max; octave++) {
        config.noteRange.allowedNotes.forEach((noteName) => {
          const noteId = `${noteName}${octave}-${clef}`;
          const position = this.determineStaffPosition(noteName, octave, clef);

          candidates.push({
            name: noteName,
            octave,
            clef,
            position,
            id: noteId,
          });

          // Add accidentals if enabled
          if (config.noteRange.includeAccidentals) {
            candidates.push({
              name: noteName,
              octave,
              clef,
              accidental: 'sharp',
              position,
              id: `${noteId}-sharp`,
            });
            candidates.push({
              name: noteName,
              octave,
              clef,
              accidental: 'flat',
              position,
              id: `${noteId}-flat`,
            });
          }
        });
      }
    });

    // Filter candidates based on difficulty mode and clef filter
    let filteredCandidates = candidates;

    // Apply difficulty mode filter
    const mode = this.difficultyMode();
    if (mode !== 'default') {
      filteredCandidates = filteredCandidates.filter((note) => {
        const noteKey = `${note.name}${note.octave}`;
        const clefRanges =
          note.clef === 'treble' ? DIFFICULTY_NOTE_RANGES.treble : DIFFICULTY_NOTE_RANGES.bass;
        return clefRanges[mode].includes(noteKey);
      });
    }

    // Apply clef filter
    const clefFilter = this.clefFilter();
    if (clefFilter !== 'both') {
      filteredCandidates = filteredCandidates.filter((note) => note.clef === clefFilter);
    }

    return filteredCandidates;
  }

  private calculateWeights(notes: MusicalNote[], context: SelectionContext): WeightedNote[] {
    const config = this.getCurrentLevelConfig();

    return notes.map((note) => {
      let weight = config.baseWeights.get(note.id) ?? 1.0;

      // Performance-based weighting (struggling notes get higher weight)
      const performance = context.performanceMap.get(note.id);
      if (performance) {
        const accuracyFactor = 1.0 - performance.accuracy;
        weight *= 1.0 + accuracyFactor * 2.0; // Boost struggling notes

        // Recent incorrect answers boost weight more
        if (performance.consecutiveIncorrect > 0) {
          weight *= 1.0 + performance.consecutiveIncorrect * 0.5;
        }

        // Reduce weight for recently mastered notes
        if (performance.consecutiveCorrect > 3) {
          weight *= 0.7;
        }
      } else {
        // New notes get moderate boost
        weight *= 1.3;
      }

      // Recency penalty (avoid immediate repeats)
      const recentIndex = context.recentHistory.findIndex((recent) => recent.id === note.id);
      if (recentIndex !== -1) {
        const recencyPenalty = Math.max(0.1, 1.0 - (recentIndex + 1) * 0.3);
        weight *= recencyPenalty;
      }

      // Clef distribution weighting
      const clefWeight =
        note.clef === 'treble'
          ? config.clefDistribution.trebleWeight
          : config.clefDistribution.bassWeight;
      weight *= clefWeight;

      return {
        ...note,
        weight: Math.max(0.01, weight), // Ensure minimum weight
      };
    });
  }

  private performWeightedSelection(weightedNotes: WeightedNote[]): MusicalNote {
    const totalWeight = weightedNotes.reduce((sum, note) => sum + note.weight, 0);
    let random = Math.random() * totalWeight;

    for (const note of weightedNotes) {
      random -= note.weight;
      if (random <= 0) {
        const { weight, ...selectedNote } = note;
        return selectedNote;
      }
    }

    // Fallback to last note if rounding errors occur
    const { weight, ...fallbackNote } = weightedNotes[weightedNotes.length - 1];
    return fallbackNote;
  }

  private updatePerformanceData(note: MusicalNote, isCorrect: boolean, responseTime: number): void {
    const currentData = this.performanceData();
    const existing = currentData.get(note.id);

    const newAttempts = (existing?.attempts ?? 0) + 1;
    const newCorrect = (existing?.correctAnswers ?? 0) + (isCorrect ? 1 : 0);
    const newAccuracy = newCorrect / newAttempts;

    // Update response time (moving average)
    const avgResponseTime = existing
      ? (existing.averageResponseTime * existing.attempts + responseTime) / newAttempts
      : responseTime;

    // Update consecutive counters
    const consecutiveCorrect = isCorrect ? (existing?.consecutiveCorrect ?? 0) + 1 : 0;
    const consecutiveIncorrect = !isCorrect ? (existing?.consecutiveIncorrect ?? 0) + 1 : 0;

    // Calculate difficulty score (0-100, higher = more difficult for user)
    const difficultyScore = Math.round((1 - newAccuracy) * 100);

    const updatedPerformance: NotePerformance = {
      noteId: note.id,
      attempts: newAttempts,
      correctAnswers: newCorrect,
      accuracy: newAccuracy,
      lastSeen: new Date(),
      averageResponseTime: avgResponseTime,
      consecutiveCorrect,
      consecutiveIncorrect,
      difficultyScore,
    };

    const newData = new Map(currentData);
    newData.set(note.id, updatedPerformance);
    this.performanceData.set(newData);
  }

  private updateHistory(note: MusicalNote): void {
    const current = this.recentHistory();
    const maxHistorySize = 10;

    const updated = [note, ...current.slice(0, maxHistorySize - 1)];
    this.recentHistory.set(updated);
  }

  private checkLevelProgression(): void {
    const config = this.getCurrentLevelConfig();
    const userProgress = this.progressService.getCurrentProgress();

    // Check if user meets progression criteria
    const meetsAccuracy = userProgress.overallAccuracy >= config.progressionCriteria.minAccuracy;
    const meetsQuestions =
      userProgress.totalQuestionsAnswered >= config.progressionCriteria.minQuestions;

    // Check consecutive correct answers for current session
    const recentCorrect = this.countRecentCorrectAnswers();
    const meetsConsecutive = recentCorrect >= config.progressionCriteria.consecutiveCorrect;

    if (meetsAccuracy && meetsQuestions && meetsConsecutive) {
      this.advanceLevel();
    }
  }

  private countRecentCorrectAnswers(): number {
    // This would need to track recent answers - simplified for now
    return 0; // TODO: Implement proper tracking
  }

  private advanceLevel(): void {
    const currentLevel = this.currentLevel();
    const levels: DifficultyLevel[] = ['easy', 'hard'];
    const currentIndex = levels.indexOf(currentLevel);

    if (currentIndex < levels.length - 1) {
      const newLevel = levels[currentIndex + 1];
      this.currentLevel.set(newLevel);
      this.progressService.updateLevel(newLevel);
    }
  }

  private determineStaffPosition(noteName: NoteName, octave: number, clef: Clef): StaffPosition {
    const noteKey = `${noteName}${octave}`;

    if (clef === 'treble') {
      // Treble clef: Lines are E4, G4, B4, D5, F5
      // Spaces are F4, A4, C5, E5
      const trebleLines = ['E4', 'G4', 'B4', 'D5', 'F5'];
      const trebleSpaces = ['F4', 'A4', 'C5', 'E5'];

      if (trebleLines.includes(noteKey)) return 'line';
      if (trebleSpaces.includes(noteKey)) return 'space';

      // Notes outside the staff
      if (octave < 4 || (octave === 4 && ['C', 'D'].includes(noteName))) {
        return 'ledger-below';
      }
      if (octave > 5 || (octave === 5 && ['G', 'A', 'B'].includes(noteName)) || octave >= 6) {
        return 'ledger-above';
      }
    } else {
      // Bass clef: Lines are G2, B2, D3, F3, A3
      // Spaces are A2, C3, E3, G3
      const bassLines = ['G2', 'B2', 'D3', 'F3', 'A3'];
      const bassSpaces = ['A2', 'C3', 'E3', 'G3'];

      if (bassLines.includes(noteKey)) return 'line';
      if (bassSpaces.includes(noteKey)) return 'space';

      // Notes outside the staff
      if (octave < 2 || (octave === 2 && ['E', 'F'].includes(noteName))) {
        return 'ledger-below';
      }
      if (octave > 3 || (octave === 3 && ['B'].includes(noteName)) || octave >= 4) {
        return 'ledger-above';
      }
    }

    // Default fallback
    return 'space';
  }

  private persistPerformanceData(): void {
    this.storageService.save('performance-data', Array.from(this.performanceData().entries()));
    this.storageService.save('recent-history', this.recentHistory());
    this.storageService.save('current-level', this.currentLevel());
  }

  private loadPerformanceData(): void {
    const savedData = this.storageService.load<[string, NotePerformance][]>('performance-data');
    if (savedData) {
      this.performanceData.set(new Map(savedData));
    }

    const savedHistory = this.storageService.load<MusicalNote[]>('recent-history');
    if (savedHistory) {
      this.recentHistory.set(savedHistory);
    }

    const savedLevel = this.storageService.load<DifficultyLevel>('current-level');
    if (savedLevel) {
      this.currentLevel.set(savedLevel);
    }
  }
}
