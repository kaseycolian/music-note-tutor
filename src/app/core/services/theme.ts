import { DOCUMENT } from '@angular/common';
import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import themesIndex from '../../../theme/themes.index.json';
import themeTokens from '../../../theme/tokens.json';

/** A choice in the theme picker. The empty id is Auto. */
export interface ThemeOption {
  id: string;
  /** The row under its group heading, e.g. "Dark · No Background". */
  row: string;
  /** The full name, for the closed control, e.g. "Rink Classic · Dark · No Background". */
  label: string;
  /** The theme's accents in pink, green, blue, purple order, comma-separated. */
  swatch: string;
  /** An optional second line under the row. */
  secondary?: string;
}

/** A heading in the picker and the themes listed under it. */
export interface ThemeGroup {
  name: string;
  options: readonly ThemeOption[];
}

const ACCENTS = ['--accent-pink', '--accent-green', '--accent-blue', '--accent-purple'];
const tokensById = themeTokens.themes as Record<string, { tokens: Record<string, string> }>;

function swatchOf(id: string): string {
  const tokens = tokensById[id]?.tokens ?? {};
  return ACCENTS.map((accent) => tokens[accent]).join(',');
}

/** Follows the OS: Rink Classic dark, or light when the OS prefers light. */
export const AUTO_THEME: ThemeOption = {
  id: '',
  row: 'Auto (Rink Classic)',
  label: 'Auto (Rink Classic)',
  swatch: swatchOf('rink-classic-dark'),
  secondary: 'follows your OS',
};

/** The app's look from before the theme-service, kept alongside (src/original-theme.css). */
export const ORIGINAL_THEME: ThemeOption = {
  id: 'note-and-seek-original',
  row: 'Original',
  label: 'Note and Seek Original',
  swatch: '#ff00aa,#00ffcc,#00ffcc,#9a68cd',
};

/** Auto, then the Original, then the theme-service families A→Z (index order within each). */
function buildGroups(): ThemeGroup[] {
  const families = new Map<string, ThemeOption[]>();
  for (const theme of themesIndex.themes) {
    const family = families.get(theme.name) ?? [];
    family.push({
      id: theme.id,
      row: [theme.group, theme.description].filter(Boolean).join(' · '),
      label: theme.label,
      swatch: swatchOf(theme.id),
    });
    families.set(theme.name, family);
  }
  return [
    { name: 'Automatic', options: [AUTO_THEME] },
    { name: 'Note and Seek', options: [ORIGINAL_THEME] },
    ...[...families]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, options]) => ({ name, options })),
  ];
}

// The localStorage keys theme-init.js reads before first paint. Values are raw strings.
const THEME_KEY = 'theme';
const MOTION_KEY = 'motion';

/**
 * Applies and persists the theme and reduce-motion choices on <html>
 * (data-theme / data-motion). theme-init.js restores them before first paint;
 * this service keeps them in sync with the picker afterwards.
 */
@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly root = this.document.documentElement;

  /** The picker's headings and rows. */
  readonly groups: readonly ThemeGroup[] = buildGroups();

  /** Every choice, in picker order. */
  readonly options: readonly ThemeOption[] = this.groups.flatMap((group) => group.options);

  /** The applied theme id; '' is Auto. */
  readonly theme = signal(this.resolveInitialTheme());

  /** The app's own Reduce motion choice. */
  readonly reducedMotion = signal(this.root.getAttribute('data-motion') === 'off');

  /** Whether the OS already asks for reduced motion (CSS honors it on its own). */
  readonly systemReducedMotion = signal(false);

  constructor() {
    const query = this.document.defaultView?.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (query) {
      const update = (event: MediaQueryListEvent) => this.systemReducedMotion.set(event.matches);
      this.systemReducedMotion.set(query.matches);
      query.addEventListener('change', update);
      inject(DestroyRef).onDestroy(() => query.removeEventListener('change', update));
    }
  }

  setTheme(id: string): void {
    if (!this.isKnown(id)) return;

    this.applyTheme(id);
    if (id) {
      this.write(THEME_KEY, id);
    } else {
      this.remove(THEME_KEY);
    }
    this.theme.set(id);
  }

  setReducedMotion(off: boolean): void {
    if (off) {
      this.root.setAttribute('data-motion', 'off');
      this.write(MOTION_KEY, 'off');
    } else {
      this.root.removeAttribute('data-motion');
      this.remove(MOTION_KEY);
    }
    this.reducedMotion.set(off);
  }

  /**
   * theme-init.js applies whatever id it finds. If that id is unknown (a bad ?theme=
   * link, or a theme since removed), fall back to a valid saved theme, else Auto.
   */
  private resolveInitialTheme(): string {
    const applied = this.root.getAttribute('data-theme') ?? '';
    if (this.isKnown(applied)) return applied;

    const saved = this.read(THEME_KEY) ?? '';
    if (saved === applied) this.remove(THEME_KEY);

    const fallback = saved !== applied && this.isKnown(saved) ? saved : '';
    this.applyTheme(fallback);
    return fallback;
  }

  private isKnown(id: string): boolean {
    return this.options.some((option) => option.id === id);
  }

  private applyTheme(id: string): void {
    if (id) {
      this.root.setAttribute('data-theme', id);
    } else {
      this.root.removeAttribute('data-theme');
    }
  }

  private read(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  private write(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Storage unavailable (e.g. blocked): the choice still applies for this visit.
    }
  }

  private remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch {
      // Storage unavailable: nothing to clear.
    }
  }
}
