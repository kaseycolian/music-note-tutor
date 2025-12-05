import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { NoteGeneratorService } from '../../../core/services/note-generator';
import { UserProgressService } from '../../../core/services/user-progress';
import { MusicalNote, NoteName } from '../../../models/musical-note';
import { UserProgress } from '../../../models/user-progress';
import { MusicalStaffComponent } from '../../../shared/components/musical-staff/musical-staff';
import { NoteInputComponent } from '../../../shared/components/note-input/note-input';

export interface AnswerFeedback {
  type: 'correct' | 'incorrect' | 'hint';
  message: string;
}

@Component({
  selector: 'app-note-tutor',
  standalone: true,
  imports: [
    CommonModule,
    MusicalStaffComponent,
    NoteInputComponent
  ],
  templateUrl: './note-tutor.html',
  styleUrl: './note-tutor.scss'
})
export class NoteTutor implements OnInit, OnDestroy {
  // Signal-based reactive state
  currentNote = signal<MusicalNote | null>(null);
  userProgress = signal<UserProgress | null>(null);
  feedback = signal<AnswerFeedback | null>(null);
  isProcessing = signal(false);
  hasAnswered = signal(false);
  sessionStartTime = signal<Date>(new Date());
  questionStartTime = signal<Date>(new Date());

  // Computed properties
  showAnswerInput = computed(() => this.currentNote() && !this.hasAnswered());
  canGenerateNew = computed(() => !this.isProcessing());
  accuracyPercentage = computed(() => {
    const progress = this.userProgress();
    return progress ? Math.round(progress.overallAccuracy * 100) : 0;
  });

  // Available notes for input
  availableNotes: NoteName[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

  // Dependency injection
  private noteGenerator = inject(NoteGeneratorService);
  private progressService = inject(UserProgressService);

  ngOnInit(): void {
    this.loadUserProgress();
    this.generateNewNote();
  }

  ngOnDestroy(): void {
    // Save progress on component destroy
    this.saveProgress();
  }

  generateNewNote(): void {
    this.isProcessing.set(true);
    this.hasAnswered.set(false);
    this.feedback.set(null);
    this.questionStartTime.set(new Date());

    try {
      const newNote = this.noteGenerator.generateNextNote();
      this.currentNote.set(newNote);
    } catch (error) {
      console.error('Error generating note:', error);
      this.feedback.set({
        type: 'incorrect',
        message: 'Error generating note. Please try again.'
      });
    } finally {
      this.isProcessing.set(false);
    }
  }

  handleAnswer(userAnswer: string): void {
    const note = this.currentNote();
    if (!note || this.hasAnswered()) return;

    const isCorrect = this.validateAnswer(userAnswer, note);
    const responseTime = this.calculateResponseTime();

    // Record the answer
    this.noteGenerator.recordAnswer(note, userAnswer, isCorrect, responseTime);

    // Show feedback
    this.showFeedback(isCorrect, note, userAnswer);
    this.hasAnswered.set(true);

    // Update progress
    this.updateProgress();
  }

  showAnswer(): void {
    const note = this.currentNote();
    if (note) {
      const correctAnswer = `${note.name}${note.accidental ? (note.accidental === 'sharp' ? '#' : '♭') : ''}`;
      this.feedback.set({
        type: 'hint',
        message: `The correct answer is ${correctAnswer}`
      });
    }
  }

  resetProgress(): void {
    if (confirm('Are you sure you want to reset all progress? This cannot be undone.')) {
      this.noteGenerator.resetProgress();
      this.progressService.resetProgress();
      this.loadUserProgress();
      this.generateNewNote();
      this.feedback.set({
        type: 'hint',
        message: 'Progress has been reset. Starting fresh!'
      });
    }
  }

  getAvailableNotes(): NoteName[] {
    return this.availableNotes;
  }

  private validateAnswer(userAnswer: string, note: MusicalNote): boolean {
    // Normalize the answer (remove accidentals for basic comparison)
    const normalizedAnswer = userAnswer.replace(/[#♯♭b]/g, '').toUpperCase();
    return normalizedAnswer === note.name;
  }

  private calculateResponseTime(): number {
    const startTime = this.questionStartTime();
    const endTime = new Date();
    return endTime.getTime() - startTime.getTime();
  }

  private showFeedback(isCorrect: boolean, note: MusicalNote, userAnswer: string): void {
    if (isCorrect) {
      const messages = [
        'Excellent! 🎵',
        'Perfect! 🎶',
        'Great job! ✨',
        'Correct! 🎯',
        'Well done! 👏'
      ];
      const randomMessage = messages[Math.floor(Math.random() * messages.length)];

      this.feedback.set({
        type: 'correct',
        message: randomMessage
      });
    } else {
      const correctAnswer = `${note.name}${note.accidental ? (note.accidental === 'sharp' ? '#' : '♭') : ''}`;
      this.feedback.set({
        type: 'incorrect',
        message: `Not quite. You answered "${userAnswer}", but the correct answer is "${correctAnswer}".`
      });
    }
  }

  private loadUserProgress(): void {
    try {
      const progress = this.progressService.getCurrentProgress();
      this.userProgress.set(progress);
    } catch (error) {
      console.error('Error loading user progress:', error);
      // Initialize with default progress
      this.userProgress.set({
        currentLevel: 'beginner',
        totalQuestionsAnswered: 0,
        overallAccuracy: 0,
        sessionStartTime: new Date(),
        levelProgression: []
      });
    }
  }

  private updateProgress(): void {
    try {
      const updatedProgress = this.progressService.getCurrentProgress();
      this.userProgress.set(updatedProgress);
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  }

  private saveProgress(): void {
    try {
      this.progressService.saveProgress();
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  }
}
