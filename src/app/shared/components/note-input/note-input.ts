import { CommonModule } from '@angular/common';
import { Component, computed, input, output, signal } from '@angular/core';
import { NoteName } from '../../../models/musical-note';

@Component({
  selector: 'app-note-input',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './note-input.html',
  styleUrl: './note-input.scss',
})
export class NoteInputComponent {
  // Input signals
  availableNotes = input<NoteName[]>(['C', 'D', 'E', 'F', 'G', 'A', 'B']);
  disabled = input<boolean>(false);
  showAccidentals = input<boolean>(false);
  selectedNote = input<string | null>(null);

  // Output signals
  noteSelected = output<string>();

  // Internal state
  private hoveredNote = signal<string | null>(null);
  private pressedNote = signal<string | null>(null);

  // Computed properties
  readonly noteButtons = computed(() => {
    const notes = this.availableNotes();
    const buttons: Array<{ note: string; label: string; class: string }> = [];

    // Add natural notes
    notes.forEach(note => {
      buttons.push({
        note,
        label: note,
        class: 'natural-note'
      });
    });

    // Add accidentals if enabled
    if (this.showAccidentals()) {
      notes.forEach(note => {
        // Skip notes that don't typically have sharps/flats
        if (note !== 'E' && note !== 'B') {
          buttons.push({
            note: `${note}#`,
            label: `${note}♯`,
            class: 'sharp-note'
          });
        }
        if (note !== 'F' && note !== 'C') {
          buttons.push({
            note: `${note}b`,
            label: `${note}♭`,
            class: 'flat-note'
          });
        }
      });
    }

    return buttons.sort((a, b) => {
      // Sort by note order: C, C#, Db, D, D#, Eb, E, F, F#, Gb, G, G#, Ab, A, A#, Bb, B
      const noteOrder = ['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B'];
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

  constructor() {
    // Set up keyboard event listeners
    this.setupKeyboardListeners();
  }

  /**
   * Handle note button click
   */
  onNoteClick(note: string): void {
    if (this.disabled()) return;

    this.pressedNote.set(note);
    this.noteSelected.emit(note);

    // Reset pressed state after animation
    setTimeout(() => {
      this.pressedNote.set(null);
    }, 150);
  }

  /**
   * Handle note button hover
   */
  onNoteHover(note: string | null): void {
    if (this.disabled()) return;
    this.hoveredNote.set(note);
  }

  /**
   * Get CSS classes for a note button
   */
  getNoteButtonClasses(note: string): string[] {
    const classes = ['note-button'];

    // Add note type class
    if (note.includes('#')) {
      classes.push('sharp');
    } else if (note.includes('b')) {
      classes.push('flat');
    } else {
      classes.push('natural');
    }

    // Add state classes
    if (this.disabled()) {
      classes.push('disabled');
    }

    if (this.selectedNote() === note) {
      classes.push('selected');
    }

    if (this.hoveredNote() === note) {
      classes.push('hovered');
    }

    if (this.pressedNote() === note) {
      classes.push('pressed');
    }

    return classes;
  }

  /**
   * Get keyboard shortcut for a note
   */
  getKeyboardShortcut(note: string): string | null {
    const shortcuts = this.keyboardShortcuts();
    const key = Object.keys(shortcuts).find(k => shortcuts[k] === note);
    return key || null;
  }

  /**
   * Check if note is currently selected
   */
  isNoteSelected(note: string): boolean {
    return this.selectedNote() === note;
  }

  /**
   * Get ARIA label for note button
   */
  getAriaLabel(note: string): string {
    let label = `Select note ${note}`;

    if (note.includes('#')) {
      label = label.replace('#', ' sharp');
    } else if (note.includes('b')) {
      label = label.replace('b', ' flat');
    }

    const shortcut = this.getKeyboardShortcut(note);
    if (shortcut) {
      label += `, keyboard shortcut ${shortcut}`;
    }

    if (this.isNoteSelected(note)) {
      label += ', currently selected';
    }

    return label;
  }

  /**
   * Handle keyboard input
   */
  private setupKeyboardListeners(): void {
    // This would typically be handled by the parent component
    // or through a global keyboard service
  }

  /**
   * Handle keyboard shortcut
   */
  onKeyboardShortcut(key: string): void {
    const shortcuts = this.keyboardShortcuts();
    const note = shortcuts[key];

    if (note && !this.disabled()) {
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
   * Get note color for visual distinction
   */
  getNoteColor(note: string): string {
    const colors: { [key: string]: string } = {
      'C': '#e74c3c',
      'D': '#f39c12',
      'E': '#f1c40f',
      'F': '#2ecc71',
      'G': '#3498db',
      'A': '#9b59b6',
      'B': '#e91e63'
    };

    const baseName = note.charAt(0);
    return colors[baseName] || '#95a5a6';
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
