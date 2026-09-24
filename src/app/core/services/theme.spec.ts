import { TestBed } from '@angular/core/testing';

import themesIndex from '../../../theme/themes.index.json';
import { AUTO_THEME, ORIGINAL_THEME, ThemeService } from './theme';

describe('ThemeService', () => {
  const root = document.documentElement;

  function reset(): void {
    root.removeAttribute('data-theme');
    root.removeAttribute('data-motion');
    localStorage.removeItem('theme');
    localStorage.removeItem('motion');
  }

  beforeEach(() => {
    reset();
    TestBed.configureTestingModule({});
  });

  afterEach(reset);

  it('starts on Auto when nothing is applied', () => {
    const service = TestBed.inject(ThemeService);
    expect(service.theme()).toBe('');
    expect(service.reducedMotion()).toBeFalse();
  });

  it('picks up the theme and motion theme-init.js applied before paint', () => {
    root.setAttribute('data-theme', 'rfg-dark');
    root.setAttribute('data-motion', 'off');
    const service = TestBed.inject(ThemeService);
    expect(service.theme()).toBe('rfg-dark');
    expect(service.reducedMotion()).toBeTrue();
  });

  it('lists Auto, then the Original, then every theme-service theme once', () => {
    const ids = TestBed.inject(ThemeService).options.map((option) => option.id);
    expect(ids.slice(0, 2)).toEqual([AUTO_THEME.id, ORIGINAL_THEME.id]);
    expect([...ids.slice(2)].sort()).toEqual(themesIndex.themes.map((theme) => theme.id).sort());
  });

  it('applies and saves a theme, and clears both for Auto', () => {
    const service = TestBed.inject(ThemeService);

    service.setTheme('rink-classic-light');
    expect(root.getAttribute('data-theme')).toBe('rink-classic-light');
    expect(localStorage.getItem('theme')).toBe('rink-classic-light');
    expect(service.theme()).toBe('rink-classic-light');

    service.setTheme('');
    expect(root.hasAttribute('data-theme')).toBeFalse();
    expect(localStorage.getItem('theme')).toBeNull();
    expect(service.theme()).toBe('');
  });

  it('ignores an unknown theme id', () => {
    const service = TestBed.inject(ThemeService);
    service.setTheme('not-a-theme');
    expect(root.hasAttribute('data-theme')).toBeFalse();
    expect(service.theme()).toBe('');
  });

  it('falls back to a valid saved theme when the applied id is unknown', () => {
    localStorage.setItem('theme', 'hot-neon-dark');
    root.setAttribute('data-theme', 'bogus-from-a-link');
    const service = TestBed.inject(ThemeService);
    expect(service.theme()).toBe('hot-neon-dark');
    expect(root.getAttribute('data-theme')).toBe('hot-neon-dark');
    expect(localStorage.getItem('theme')).toBe('hot-neon-dark');
  });

  it('falls back to Auto and clears a saved theme that no longer exists', () => {
    localStorage.setItem('theme', 'retired-theme');
    root.setAttribute('data-theme', 'retired-theme');
    const service = TestBed.inject(ThemeService);
    expect(service.theme()).toBe('');
    expect(root.hasAttribute('data-theme')).toBeFalse();
    expect(localStorage.getItem('theme')).toBeNull();
  });

  it('applies and saves Reduce motion', () => {
    const service = TestBed.inject(ThemeService);

    service.setReducedMotion(true);
    expect(root.getAttribute('data-motion')).toBe('off');
    expect(localStorage.getItem('motion')).toBe('off');

    service.setReducedMotion(false);
    expect(root.hasAttribute('data-motion')).toBeFalse();
    expect(localStorage.getItem('motion')).toBeNull();
  });

  // These two read the global stylesheets the test target loads (angular.json).
  it('matches the Original theme id to its stylesheet', () => {
    TestBed.inject(ThemeService).setTheme(ORIGINAL_THEME.id);
    expect(getComputedStyle(root).getPropertyValue('--bg').trim()).toBe('#0d0020');
  });

  it("stops the app's own animations when Reduce motion is on", () => {
    const el = document.createElement('div');
    el.style.animation = 'glow 5s ease-in-out infinite';
    document.body.appendChild(el);
    try {
      TestBed.inject(ThemeService).setReducedMotion(true);
      expect(getComputedStyle(el).animationIterationCount).toBe('1');
      expect(parseFloat(getComputedStyle(el).animationDuration)).toBeLessThan(0.001);
    } finally {
      el.remove();
    }
  });
});
