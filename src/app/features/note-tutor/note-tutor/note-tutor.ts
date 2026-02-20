import { CdkTrapFocus } from '@angular/cdk/a11y';
import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  ElementRef,
  HostListener,
  inject,
  OnDestroy,
  OnInit,
  Renderer2,
  signal,
  ViewChild,
} from '@angular/core';
import { NoteGeneratorService } from '../../../core/services/note-generator';
import { UserProgressService } from '../../../core/services/user-progress';
import {
  CLEF_FILTERS,
  ClefFilter,
  DIFFICULTY_MODES,
  DifficultyMode,
  NOTE_FILTERS,
  NoteFilter,
} from '../../../models/difficulty-mode';
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
  imports: [CommonModule, MusicalStaffComponent, NoteInputComponent, CdkTrapFocus],
  templateUrl: './note-tutor.html',
  styleUrl: './note-tutor.scss',
})
export class NoteTutor implements OnInit, OnDestroy {
  // ViewChild reference to the Next Note button
  @ViewChild('nextNoteButton') nextNoteButton?: ElementRef<HTMLButtonElement>;

  // Signal-based reactive state
  currentNote = signal<MusicalNote | null>(null);
  userProgress = signal<UserProgress | null>(null);
  feedback = signal<AnswerFeedback | null>(null);
  isProcessing = signal(false);
  hasAnswered = signal(false);
  sessionStartTime = signal<Date>(new Date());
  questionStartTime = signal<Date>(new Date());
  showAnswerHint = signal(false);

  // Difficulty mode state
  difficultyMode = signal<DifficultyMode>('default');
  showDifficultyDropdown = signal(false);
  readonly difficultyModes = DIFFICULTY_MODES;

  // Clef filter state
  clefFilter = signal<ClefFilter>('both');
  showClefDropdown = signal(false);
  readonly clefFilters = CLEF_FILTERS;

  // Note filter state
  noteFilter = signal<NoteFilter>('all');
  showNoteDropdown = signal(false);
  readonly noteFilters = NOTE_FILTERS;

  // Store pending answer data to record only when moving to next question
  private pendingAnswer = signal<{
    note: MusicalNote;
    userAnswer: string;
    isCorrect: boolean;
    responseTime: number;
  } | null>(null);

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

  constructor(private renderer: Renderer2) {}

  ngOnInit(): void {
    this.loadUserProgress();
    this.generateNewNote();
  }

  ngOnDestroy(): void {
    // Save progress on component destroy
    this.saveProgress();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const dropdown = target.closest('.difficulty-dropdown');

    if (!dropdown) {
      if (this.showDifficultyDropdown()) {
        this.enableBackground();
        this.showDifficultyDropdown.set(false);
      }
      if (this.showClefDropdown()) {
        this.enableBackground();
        this.showClefDropdown.set(false);
      }
      if (this.showNoteDropdown()) {
        this.enableBackground();
        this.showNoteDropdown.set(false);
      }
    } else {
    }
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.showDifficultyDropdown()) {
      this.enableBackground();
      this.showDifficultyDropdown.set(false);
    }
    if (this.showClefDropdown()) {
      this.enableBackground();
      this.showClefDropdown.set(false);
    }
    if (this.showNoteDropdown()) {
      this.enableBackground();
      this.showNoteDropdown.set(false);
    }
  }

  onMenuKeydown(event: KeyboardEvent): void {
    // Prevent arrow keys from scrolling the page when dropdown is open
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
      event.preventDefault();
    }
  }

  /** Enable scrolling and click/keyboard events in background. */
  enableBackground() {
    this.renderer.removeClass(document.body, 'no-scroll');
  }

  /** Disable the background from scrolling and getting click/keyboard events. */
  disableBackground() {
    this.renderer.addClass(document.body, 'no-scroll');
  }

  generateNewNote(): void {
    this.showAnswerHint.set(false);

    // Record the pending answer before generating a new note
    const pending = this.pendingAnswer();
    if (pending) {
      // Record to note generator (for note-specific performance tracking)
      this.noteGenerator.recordAnswer(
        pending.note,
        pending.userAnswer,
        pending.isCorrect,
        pending.responseTime,
      );

      // Record to progress service (for overall accuracy tracking)
      this.progressService.recordQuestionAttempt(pending.isCorrect, pending.responseTime);

      this.pendingAnswer.set(null);

      // Update progress after recording (use setTimeout to ensure signal updates have propagated)
      setTimeout(() => this.updateProgress(), 0);
    }

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
        message: 'Error generating note. Please try again.',
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

    // Store the answer data to be recorded when user clicks "Next Note"
    this.pendingAnswer.set({
      note,
      userAnswer,
      isCorrect,
      responseTime,
    });

    // Show feedback
    this.showFeedback(isCorrect, note, userAnswer);
    this.hasAnswered.set(true);

    // Focus the Next Note button after a short delay to allow UI to update
    setTimeout(() => {
      this.nextNoteButton?.nativeElement.focus();
    }, 100);
  }

  showAnswer(): void {
    const note = this.currentNote();
    if (!this.showAnswerHint()) {
      if (note) {
        const correctAnswer = `${note.name}${
          note.accidental ? (note.accidental === 'sharp' ? '#' : '♭') : ''
        }`;
        this.feedback.set({
          type: 'hint',
          message: `The correct answer is ${correctAnswer}`,
        });
      }
    } else {
      this.feedback.set(null);
    }
    this.showAnswerHint.set(!this.showAnswerHint());
  }

  resetProgress(): void {
    if (confirm('Are you sure you want to reset all progress? This cannot be undone.')) {
      this.noteGenerator.resetProgress();
      this.progressService.resetProgress();
      this.loadUserProgress();
      this.generateNewNote();
      this.feedback.set({
        type: 'hint',
        message: 'Progress has been reset. Starting over!',
      });
    }
  }

  // Computed signal for available notes based on note filter
  readonly filteredAvailableNotes = computed(() => {
    const filter = this.noteFilter();
    if (filter === 'all') {
      return this.availableNotes;
    }
    // When a specific note is selected, only show that note
    return [filter as NoteName];
  });

  // Difficulty mode methods
  toggleDifficultyDropdown(): void {
    this.showDifficultyDropdown.update((show) => !show);
    if (this.showDifficultyDropdown()) {
      this.showClefDropdown.set(false);
      this.showNoteDropdown.set(false);
      this.disableBackground();
    }
  }

  selectDifficulty(mode: DifficultyMode): void {
    this.difficultyMode.set(mode);
    this.showDifficultyDropdown.set(false);

    // Update note generator with new difficulty
    this.noteGenerator.setDifficultyMode(mode);

    // Generate a new note with the new difficulty
    this.generateNewNote();
  }

  getCurrentDifficultyLabel(): string {
    const config = this.difficultyModes.find((d) => d.mode === this.difficultyMode());
    return config?.label || 'Default';
  }

  // Clef filter methods
  toggleClefDropdown(): void {
    this.showClefDropdown.update((show) => !show);
    if (this.showClefDropdown()) {
      this.showDifficultyDropdown.set(false);
      this.showNoteDropdown.set(false);
      this.disableBackground();
    }
  }

  selectClef(filter: ClefFilter): void {
    this.clefFilter.set(filter);
    this.showClefDropdown.set(false);

    // Update note generator with new clef filter
    this.noteGenerator.setClefFilter(filter);

    // Generate a new note with the new clef filter
    this.generateNewNote();
  }

  getCurrentClefLabel(): string {
    const config = this.clefFilters.find((c) => c.filter === this.clefFilter());
    return config?.label || 'Both';
  }

  // Note filter methods
  toggleNoteDropdown(): void {
    this.showNoteDropdown.update((show) => !show);
    if (this.showNoteDropdown()) {
      this.showDifficultyDropdown.set(false);
      this.showClefDropdown.set(false);
      this.disableBackground();
    }
  }

  selectNote(filter: NoteFilter): void {
    this.noteFilter.set(filter);
    this.showNoteDropdown.set(false);

    // Update note generator with new note filter
    this.noteGenerator.setNoteFilter(filter);

    // Generate a new note with the new note filter
    this.generateNewNote();
  }

  getCurrentNoteLabel(): string {
    const config = this.noteFilters.find((n) => n.filter === this.noteFilter());
    return config?.label || 'All';
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
        'Well done! 👏',
      ];
      const randomMessage = messages[Math.floor(Math.random() * messages.length)];

      this.feedback.set({
        type: 'correct',
        message: randomMessage,
      });
    } else {
      const correctAnswer = `${note.name}${
        note.accidental ? (note.accidental === 'sharp' ? '#' : '♭') : ''
      }`;
      this.feedback.set({
        type: 'incorrect',
        message: `Not quite. You answered "${userAnswer}", but the correct answer is "${correctAnswer}".`,
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
        currentLevel: 'easy',
        totalQuestionsAnswered: 0,
        overallAccuracy: 0,
        sessionStartTime: new Date(),
        levelProgression: [],
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
