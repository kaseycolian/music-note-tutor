import { CommonModule } from '@angular/common';
import { Component, computed, effect, input, signal } from '@angular/core';
import { Clef, MusicalNote } from '../../../models/musical-note';

@Component({
  selector: 'app-musical-staff',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './musical-staff.html',
  styleUrl: './musical-staff.scss',
})
export class MusicalStaffComponent {
  // Input signals for Angular 21
  currentNote = input<MusicalNote | null>(null);
  showNote = input<boolean>(true);
  showResult = input<boolean>(false);
  clef = input<Clef>('treble');
  highlightNote = input<boolean>(false);

  // Internal state
  private staffLines = signal<number[]>([]);
  private notePosition = signal<{ x: number; y: number } | null>(null);

  // Computed properties - exposed as simple values for template performance
  readonly staffHeight = 300;
  readonly staffWidth = 330;
  readonly lineSpacing = 18;
  readonly noteRadius = 9.5;
  readonly staffCenterY = 150; // staffHeight / 2
  readonly staffCenterX = 165; // staffWidth / 2

  readonly staffLinePositions = computed(() => {
    const spacing = this.lineSpacing;
    const centerY = this.staffCenterY;
    return [
      centerY - spacing * 2, // Top line
      centerY - spacing, // Second line
      centerY, // Middle line
      centerY + spacing, // Fourth line
      centerY + spacing * 2, // Bottom line
    ];
  });

  readonly clefSymbol = computed(() => {
    return this.clef() === 'treble' ? '𝄞' : '𝄢';
  });

  readonly noteDisplayPosition = computed(() => {
    const note = this.currentNote();
    if (!note || !this.showNote()) return null;

    return this.calculateNotePosition(note);
  });

  readonly ledgerLines = computed(() => {
    const note = this.currentNote();
    if (!note || !this.showNote()) return [];

    return this.calculateLedgerLines(note);
  });

  readonly notePositionDescription = computed(() => {
    const note = this.currentNote();
    if (!note) return '';

    const staffLines = this.staffLinePositions();
    const position = this.calculateNotePosition(note);
    const spacing = this.lineSpacing;

    // Determine position relative to staff
    const topLine = staffLines[0];
    const bottomLine = staffLines[4];

    let staffPosition: string;
    let lineNumber: number;
    let lineOrSpace: string;

    if (position.y < topLine) {
      staffPosition = 'above staff';
      // Count ledger lines/spaces above (starting from 1)
      const halfSpacesAbove = Math.round((topLine - position.y) / (spacing / 2));
      lineNumber = Math.ceil(halfSpacesAbove / 2);
      // Even half-spaces are lines, odd are spaces (inverted from on-staff)
      lineOrSpace = halfSpacesAbove % 2 === 0 ? 'line' : 'space';
    } else if (position.y > bottomLine) {
      staffPosition = 'below staff';
      // Count ledger lines/spaces below (starting from 1)
      const halfSpacesBelow = Math.round((position.y - bottomLine) / (spacing / 2));
      lineNumber = Math.ceil(halfSpacesBelow / 2);
      // Even half-spaces are lines, odd are spaces (inverted from on-staff)
      lineOrSpace = halfSpacesBelow % 2 === 0 ? 'line' : 'space';
    } else {
      staffPosition = 'on staff';
      // Count from bottom line
      // Lines are numbered 1-5 (bottom to top)
      // Spaces are numbered 1-4 (bottom to top)
      const halfSpacesFromBottom = Math.round((bottomLine - position.y) / (spacing / 2));

      if (halfSpacesFromBottom % 2 === 0) {
        // Even half-spaces = on a line
        lineOrSpace = 'line';
        lineNumber = halfSpacesFromBottom / 2 + 1; // Lines 1-5
      } else {
        // Odd half-spaces = in a space
        lineOrSpace = 'space';
        lineNumber = Math.ceil(halfSpacesFromBottom / 2); // Spaces 1-4
      }
    }

    return `${lineOrSpace} ${lineNumber}, ${staffPosition}`;
  });

  constructor() {
    // Effect to update staff when clef changes
    effect(() => {
      this.updateStaffForClef();
    });
  }

  /**
   * Calculate the visual position of a note on the staff
   */
  private calculateNotePosition(note: MusicalNote): { x: number; y: number } {
    const staffLines = this.staffLinePositions();
    const spacing = this.lineSpacing;
    const centerY = this.staffCenterY;

    // Base position calculation
    let yPosition = centerY;

    if (note.clef === 'treble') {
      yPosition = this.calculateTreblePosition(note, staffLines, spacing);
    } else {
      yPosition = this.calculateBassPosition(note, staffLines, spacing);
    }

    // X position (centered on staff)
    const xPosition = this.staffCenterX;

    return { x: xPosition, y: yPosition };
  }

  private calculateTreblePosition(
    note: MusicalNote,
    staffLines: number[],
    spacing: number,
  ): number {
    // Treble clef: Lines from bottom to top are E4, G4, B4, D5, F5
    // Spaces from bottom to top are F4, A4, C5, E5
    // staffLines[0] = top line (F5), staffLines[4] = bottom line (E4)

    const noteKey = `${note.name}${note.octave}`;

    // Map each specific note to its exact staff position
    const notePositions: { [key: string]: number } = {
      // Ledger lines below staff
      C4: staffLines[4] + spacing, // Below E4 (ledger line)
      D4: staffLines[4] + spacing / 2, // Below E4 (space)

      // On staff - bottom to top
      E4: staffLines[4], // Bottom line
      F4: staffLines[4] - spacing / 2, // First space
      G4: staffLines[3], // Second line
      A4: staffLines[3] - spacing / 2, // Second space
      B4: staffLines[2], // Middle line
      C5: staffLines[2] - spacing / 2, // Third space
      D5: staffLines[1], // Fourth line (second from top)
      E5: staffLines[1] - spacing / 2, // Fourth space (top space)
      F5: staffLines[0], // Top line

      // Ledger lines above staff
      G5: staffLines[0] - spacing / 2, // Above F5 (space)
      A5: staffLines[0] - spacing, // Above F5 (first ledger line)
      B5: staffLines[0] - spacing * 1.5, // Above F5 (space)
      C6: staffLines[0] - spacing * 2, // Above F5 (second ledger line)
      D6: staffLines[0] - spacing * 2.5, // Above F5 (space)
      E6: staffLines[0] - spacing * 3, // Above F5 (third ledger line)
      F6: staffLines[0] - spacing * 3.5, // Above F5 (space)
      G6: staffLines[0] - spacing * 4, // Above F5 (fourth ledger line)
      A6: staffLines[0] - spacing * 4.5, // Above F5 (space)
      B6: staffLines[0] - spacing * 5, // Above F5 (fifth ledger line)
      C7: staffLines[0] - spacing * 5.5, // Above F5 (space)
    };

    return notePositions[noteKey] ?? staffLines[2]; // Default to middle line if not found
  }

  private calculateBassPosition(note: MusicalNote, staffLines: number[], spacing: number): number {
    // Bass clef: Lines from bottom to top are G2, B2, D3, F3, A3
    // Spaces from bottom to top are A2, C3, E3, G3
    // staffLines[0] = top line (A3), staffLines[4] = bottom line (G2)

    const noteKey = `${note.name}${note.octave}`;

    // Map each specific note to its exact staff position
    const notePositions: { [key: string]: number } = {
      // Ledger lines below staff
      C1: staffLines[4] + spacing * 5.5, // Below G2 (ledger line)
      D1: staffLines[4] + spacing * 5, // Below G2 (space)
      E1: staffLines[4] + spacing * 4.5, // Below G2 (ledger line)
      F1: staffLines[4] + spacing * 4, // Below G2 (space)
      G1: staffLines[4] + spacing * 3.5, // Below G2 (ledger line)
      A1: staffLines[4] + spacing * 3, // Below G2 (space)
      B1: staffLines[4] + spacing * 2.5, // Same as G2 but below
      C2: staffLines[4] + spacing * 2, // Below G2 (ledger line)
      D2: staffLines[4] + spacing * 1.5, // Below G2 (space)
      E2: staffLines[4] + spacing * 1, // Below G2 (space)
      F2: staffLines[4] + spacing * 0.5, // Below G2 (space)

      // On staff - bottom to top
      G2: staffLines[4], // Bottom line
      A2: staffLines[4] - spacing / 2, // First space
      B2: staffLines[3], // Second line
      C3: staffLines[3] - spacing / 2, // Second space
      D3: staffLines[2], // Middle line
      E3: staffLines[2] - spacing / 2, // Third space
      F3: staffLines[1], // Fourth line (second from top)
      G3: staffLines[1] - spacing / 2, // Fourth space (top space)
      A3: staffLines[0], // Top line

      // Ledger lines above staff
      B3: staffLines[0] - spacing / 2, // Above A3 (space)
      C4: staffLines[0] - spacing, // Above A3 (first ledger line)
      D4: staffLines[0] - spacing * 1.5, // Above A3 (space)
      E4: staffLines[0] - spacing * 2, // Above A3 (second ledger line)
      F4: staffLines[0] - spacing * 2.5, // Above A3 (space)
      G4: staffLines[0] - spacing * 3, // Above A3 (third ledger line)
      A4: staffLines[0] - spacing * 3.5, // Above A3 (space)
      B4: staffLines[0] - spacing * 4, // Above A3 (fourth ledger line)
      C5: staffLines[0] - spacing * 4.5, // Above A3 (space)
    };

    return notePositions[noteKey] ?? staffLines[2]; // Default to middle line if not found
  }

  /**
   * Calculate ledger lines needed for notes outside the staff
   */
  private calculateLedgerLines(note: MusicalNote): { y: number; x1: number; x2: number }[] {
    const position = this.calculateNotePosition(note);
    const staffLines = this.staffLinePositions();
    const spacing = this.lineSpacing;
    const ledgerLines: { y: number; x1: number; x2: number }[] = [];

    const noteY = position.y;
    const topStaffLine = staffLines[0];
    const bottomStaffLine = staffLines[4];

    // Ledger lines above staff
    if (noteY < topStaffLine) {
      let ledgerY = topStaffLine - spacing;
      while (ledgerY >= noteY - spacing / 2) {
        ledgerLines.push({
          y: ledgerY,
          x1: position.x - 25,
          x2: position.x + 25,
        });
        ledgerY -= spacing;
      }
    }

    // Ledger lines below staff
    if (noteY > bottomStaffLine) {
      let ledgerY = bottomStaffLine + spacing;
      while (ledgerY <= noteY + spacing / 2) {
        ledgerLines.push({
          y: ledgerY,
          x1: position.x - 25,
          x2: position.x + 25,
        });
        ledgerY += spacing;
      }
    }

    return ledgerLines;
  }

  private updateStaffForClef(): void {
    // Update any clef-specific styling or positioning
    const lines = [0, 1, 2, 3, 4];
    this.staffLines.set(lines);
  }

  /**
   * Get accidental symbol
   */
  getAccidentalSymbol(accidental: string): string {
    const symbols = {
      sharp: '♯',
      flat: '♭',
    };
    return symbols[accidental as keyof typeof symbols] || '';
  }

  /**
   * Check if note needs accidental display
   */
  shouldShowAccidental(): boolean {
    const note = this.currentNote();
    return !!(note?.accidental && this.showNote());
  }

  /**
   * Get accidental position
   */
  getAccidentalPosition(): { x: number; y: number } | null {
    const notePos = this.noteDisplayPosition();
    if (!notePos || !this.shouldShowAccidental()) return null;

    return {
      x: notePos.x - 20, // Position accidental to the left of note
      y: notePos.y,
    };
  }
}
