import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  ElementRef,
  HostListener,
  input,
  OnDestroy,
  OnInit,
  output,
  QueryList,
  ViewChildren
} from '@angular/core';
import { NoteName } from '../../../models/musical-note';

@Component({
  selector: 'app-note-input',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './note-input.html',
  styleUrl: './note-input.scss',
})
export class NoteInputComponent implements OnInit, OnDestroy {
  @ViewChildren('noteButtonElement') noteButtonElements?: QueryList<ElementRef<HTMLButtonElement>>;

  // Input signals
  availableNotes = input<NoteName[]>(['C', 'D', 'E', 'F', 'G', 'A', 'B']);
  showAccidentals = input<boolean>(false);

  // Output signals
  noteSelected = output<string>();

  // Computed properties
  readonly noteButtons = computed(() => {
    const notes = this.availableNotes();
    const buttons: Array<{ note: string; label: string; class: string }> = [];

    // Add natural notes
    notes.forEach((note) => {
      buttons.push({
        note,
        label: note,
        class: 'natural-note',
      });
    });

    // Add accidentals if enabled
    if (this.showAccidentals()) {
      notes.forEach((note) => {
        // Skip notes that don't typically have sharps/flats
        if (note !== 'E' && note !== 'B') {
          buttons.push({
            note: `${note}#`,
            label: `${note}♯`,
            class: 'sharp-note',
          });
        }
        if (note !== 'F' && note !== 'C') {
          buttons.push({
            note: `${note}b`,
            label: `${note}♭`,
            class: 'flat-note',
          });
        }
      });
    }

    return buttons.sort((a, b) => {
      // Sort by note order: C, C#, Db, D, D#, Eb, E, F, F#, Gb, G, G#, Ab, A, A#, Bb, B
      const noteOrder = [
        'C',
        'C#',
        'Db',
        'D',
        'D#',
        'Eb',
        'E',
        'F',
        'F#',
        'Gb',
        'G',
        'G#',
        'Ab',
        'A',
        'A#',
        'Bb',
        'B',
      ];
      const aIndex = noteOrder.indexOf(a.note);
      const bIndex = noteOrder.indexOf(b.note);
      return aIndex - bIndex;
    });
  });

  readonly keyboardShortcuts = computed(() => {
    const shortcuts: { [key: string]: string } = {};
    const notes = this.availableNotes();

    // Map keyboard keys to notes
    notes.forEach((note, index) => {
      const key = (index + 1).toString();
      shortcuts[key] = note;
    });

    return shortcuts;
  });

  ngOnInit(): void {
    // Keyboard listeners are handled via @HostListener
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  /**
   * Handle keyboard events using HostListener
   */
  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    // Only handle number keys 1-7
    if (event.key >= '1' && event.key <= '7') {
      event.preventDefault(); // Prevent default browser behavior
      this.onKeyboardShortcut(event.key);
    }
  }

  /**
   * Handle note button click
   */
  onNoteClick(note: string): void {
    this.noteSelected.emit(note);

  }

  /**
   * Get keyboard shortcut for a note
   */
  getKeyboardShortcut(note: string): string | null {
    const shortcuts = this.keyboardShortcuts();
    const key = Object.keys(shortcuts).find((k) => shortcuts[k] === note);
    return key || null;
  }

  /**
   * Focus the first note button
   */
  focusFirstAnswerOption(): void {
    const firstButton = this.noteButtonElements?.first;
    firstButton?.nativeElement?.focus();
  }

  /**
   * Handle keyboard shortcut
   */
  onKeyboardShortcut(key: string): void {
    const shortcuts = this.keyboardShortcuts();
    const note = shortcuts[key];

    if (note) {
      this.onNoteClick(note);
    }
  }

  /**
   * Get note display name with proper symbols
   */
  getNoteDisplayName(note: string): string {
    return note.replace('#', '♯').replace('b', '♭');
  }

  /**
   * Play note sound (placeholder for future audio implementation)
   */
  private playNoteSound(note: string): void {
    // TODO: Implement audio playback
    console.log(`Playing note: ${note}`);
  }

  /**
   * Provide haptic feedback on mobile devices
   */
  private provideHapticFeedback(): void {
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  }
}
