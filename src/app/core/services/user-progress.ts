import { computed, inject, Injectable, signal } from '@angular/core';
import { DifficultyLevel } from '../../models/musical-note';
import { LevelProgressionData, StudySession, UserProgress } from '../../models/user-progress';
import { StorageService } from './storage';

@Injectable({
  providedIn: 'root',
})
export class UserProgressService {
  private storageService = inject(StorageService);

  // Signal-based state management
  private userProgress = signal<UserProgress>(this.getDefaultProgress());
  private currentSession = signal<StudySession | null>(null);

  // Computed values
  readonly currentLevel = computed(() => this.userProgress().currentLevel);
  readonly overallAccuracy = computed(() => this.userProgress().overallAccuracy);
  readonly totalQuestions = computed(() => this.userProgress().totalQuestionsAnswered);
  readonly sessionDuration = computed(() => {
    const session = this.currentSession();
    if (!session || !session.endTime) return 0;
    return session.endTime.getTime() - session.startTime.getTime();
  });

  constructor() {
    this.loadProgress();
    this.startNewSession();
  }

  /**
   * Get current user progress
   */
  getCurrentProgress(): UserProgress {
    return this.userProgress();
  }

  /**
   * Update user level
   */
  updateLevel(newLevel: DifficultyLevel): void {
    const current = this.userProgress();
    const existingProgression = current.levelProgression.find(p => p.level === newLevel);

    if (!existingProgression) {
      // Add new level progression data
      const newProgression: LevelProgressionData = {
        level: newLevel,
        unlockedAt: new Date(),
        questionsAtLevel: 0,
        accuracyAtLevel: 0
      };

      const updatedProgress: UserProgress = {
        ...current,
        currentLevel: newLevel,
        levelProgression: [...current.levelProgression, newProgression]
      };

      this.userProgress.set(updatedProgress);
      this.saveProgress();
    } else {
      // Just update current level
      const updatedProgress: UserProgress = {
        ...current,
        currentLevel: newLevel
      };

      this.userProgress.set(updatedProgress);
      this.saveProgress();
    }
  }

  /**
   * Record a question attempt
   */
  recordQuestionAttempt(isCorrect: boolean, responseTime: number): void {
    const current = this.userProgress();
    const session = this.currentSession();

    // Update overall progress
    const newTotalQuestions = current.totalQuestionsAnswered + 1;
    const currentCorrect = Math.round(current.overallAccuracy * current.totalQuestionsAnswered);
    const newCorrect = currentCorrect + (isCorrect ? 1 : 0);
    const newAccuracy = newTotalQuestions > 0 ? newCorrect / newTotalQuestions : 0;

    // Update level-specific progress
    const updatedLevelProgression = current.levelProgression.map(progression => {
      if (progression.level === current.currentLevel) {
        const levelQuestions = progression.questionsAtLevel + 1;
        const levelCorrect = Math.round(progression.accuracyAtLevel * progression.questionsAtLevel);
        const newLevelCorrect = levelCorrect + (isCorrect ? 1 : 0);
        const newLevelAccuracy = levelQuestions > 0 ? newLevelCorrect / levelQuestions : 0;

        return {
          ...progression,
          questionsAtLevel: levelQuestions,
          accuracyAtLevel: newLevelAccuracy
        };
      }
      return progression;
    });

    const updatedProgress: UserProgress = {
      ...current,
      totalQuestionsAnswered: newTotalQuestions,
      overallAccuracy: newAccuracy,
      levelProgression: updatedLevelProgression
    };

    this.userProgress.set(updatedProgress);

    // Update current session
    if (session) {
      const updatedSession: StudySession = {
        ...session,
        questionsAnswered: session.questionsAnswered + 1,
        correctAnswers: session.correctAnswers + (isCorrect ? 1 : 0),
        averageResponseTime: this.calculateNewAverageResponseTime(
          session.averageResponseTime,
          session.questionsAnswered,
          responseTime
        )
      };

      this.currentSession.set(updatedSession);
      this.saveSession(updatedSession);
    }

    this.saveProgress();
  }

  /**
   * Start a new study session
   */
  startNewSession(): void {
    const sessionId = this.generateSessionId();
    const newSession: StudySession = {
      sessionId,
      startTime: new Date(),
      questionsAnswered: 0,
      correctAnswers: 0,
      averageResponseTime: 0,
      notesEncountered: []
    };

    this.currentSession.set(newSession);
    this.saveSession(newSession);
  }

  /**
   * End current study session
   */
  endCurrentSession(): void {
    const session = this.currentSession();
    if (session) {
      const endedSession: StudySession = {
        ...session,
        endTime: new Date()
      };

      this.currentSession.set(endedSession);
      this.saveSession(endedSession);
    }
  }

  /**
   * Get session statistics
   */
  getSessionStats(): {
    questionsAnswered: number;
    accuracy: number;
    averageResponseTime: number;
    duration: number;
  } {
    const session = this.currentSession();
    if (!session) {
      return {
        questionsAnswered: 0,
        accuracy: 0,
        averageResponseTime: 0,
        duration: 0
      };
    }

    const accuracy = session.questionsAnswered > 0
      ? session.correctAnswers / session.questionsAnswered
      : 0;

    const duration = session.endTime
      ? session.endTime.getTime() - session.startTime.getTime()
      : Date.now() - session.startTime.getTime();

    return {
      questionsAnswered: session.questionsAnswered,
      accuracy,
      averageResponseTime: session.averageResponseTime,
      duration
    };
  }

  /**
   * Reset all progress
   */
  resetProgress(): void {
    const defaultProgress = this.getDefaultProgress();
    this.userProgress.set(defaultProgress);
    this.currentSession.set(null);
    this.storageService.clear('user-progress');
    this.storageService.clear('current-session');
    this.startNewSession();
  }

  /**
   * Export progress data
   */
  exportProgress(): string {
    return JSON.stringify({
      progress: this.userProgress(),
      session: this.currentSession()
    }, null, 2);
  }

  /**
   * Import progress data
   */
  importProgress(data: string): boolean {
    try {
      const parsed = JSON.parse(data);
      if (parsed.progress) {
        this.userProgress.set(parsed.progress);
        this.saveProgress();
      }
      if (parsed.session) {
        this.currentSession.set(parsed.session);
        this.saveSession(parsed.session);
      }
      return true;
    } catch (error) {
      console.error('Failed to import progress data:', error);
      return false;
    }
  }

  // Private methods
  private getDefaultProgress(): UserProgress {
    return {
      currentLevel: 'easy',
      totalQuestionsAnswered: 0,
      overallAccuracy: 0,
      sessionStartTime: new Date(),
      levelProgression: [{
        level: 'easy',
        unlockedAt: new Date(),
        questionsAtLevel: 0,
        accuracyAtLevel: 0
      }]
    };
  }

  private calculateNewAverageResponseTime(
    currentAverage: number,
    questionCount: number,
    newResponseTime: number
  ): number {
    if (questionCount === 0) return newResponseTime;
    return (currentAverage * questionCount + newResponseTime) / (questionCount + 1);
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public saveProgress(): void {
    this.storageService.save('user-progress', this.userProgress());
  }

  private loadProgress(): void {
    const saved = this.storageService.load<UserProgress>('user-progress');
    if (saved) {
      // Convert date strings back to Date objects
      const progress: UserProgress = {
        ...saved,
        sessionStartTime: new Date(saved.sessionStartTime),
        levelProgression: saved.levelProgression.map(p => ({
          ...p,
          unlockedAt: new Date(p.unlockedAt)
        }))
      };
      this.userProgress.set(progress);
    }
  }

  private saveSession(session: StudySession): void {
    this.storageService.save('current-session', session);
  }
}
