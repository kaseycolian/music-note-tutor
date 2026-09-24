import { TestBed } from '@angular/core/testing';

import themesIndex from '../../../theme/themes.index.json';
import themeTokens from '../../../theme/tokens.json';
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

  it('follows the OS reduce-motion setting, including changes while open', () => {
    const query = Object.assign(new EventTarget(), { matches: true });
    spyOn(window, 'matchMedia').and.returnValue(query as unknown as MediaQueryList);

    const service = TestBed.inject(ThemeService);
    expect(window.matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
    expect(service.systemReducedMotion()).toBeTrue();

    query.dispatchEvent(Object.assign(new Event('change'), { matches: false }));
    expect(service.systemReducedMotion()).toBeFalse();
  });

  it('gives every choice a four-color swatch for the picker', () => {
    for (const option of TestBed.inject(ThemeService).options) {
      expect(option.swatch).withContext(option.label).toMatch(/^(#[0-9a-f]{6},){3}#[0-9a-f]{6}$/i);
    }
  });

  it('describes Auto as following the OS', () => {
    expect(TestBed.inject(ThemeService).options[0].secondary).toBe('follows your OS');
  });

  // The rest read the global stylesheets the test target loads (angular.json).
  describe('stylesheets', () => {
    const cssVar = (name: string, el: Element = root) =>
      getComputedStyle(el).getPropertyValue(name).trim();

    it('matches the Original theme id to its stylesheet', () => {
      TestBed.inject(ThemeService).setTheme(ORIGINAL_THEME.id);
      expect(cssVar('--bg')).toBe('#0d0020');
    });

    it("applies every theme-service theme's own tokens", () => {
      const service = TestBed.inject(ThemeService);
      for (const [id, theme] of Object.entries(themeTokens.themes)) {
        service.setTheme(id);
        expect(cssVar('--bg')).withContext(id).toBe(theme.tokens['--bg']);
        expect(cssVar('--accent-pink')).withContext(id).toBe(theme.tokens['--accent-pink']);
      }
    });

    it("takes the app's line color from each theme, and the Original pins its own", () => {
      const service = TestBed.inject(ThemeService);
      service.setTheme('rink-classic-dark');
      expect(cssVar('--app-line')).toBe(themeTokens.themes['rink-classic-dark'].tokens['--border-strong']);
      service.setTheme(ORIGINAL_THEME.id);
      expect(cssVar('--app-line')).toBe('#663399');
    });

    describe('game-area backdrop (.fx-grid)', () => {
      let el: HTMLElement;
      const backdrop = () => getComputedStyle(el, '::before');

      beforeEach(() => {
        el = document.createElement('div');
        el.className = 'fx-grid';
        document.body.appendChild(el);
      });

      afterEach(() => el.remove());

      it('shows on a grid theme and hides on its No Background variant', () => {
        const service = TestBed.inject(ThemeService);
        service.setTheme('rink-classic-dark');
        expect(parseFloat(backdrop().opacity)).toBeGreaterThan(0);
        service.setTheme('rink-classic-dark-no-background');
        expect(parseFloat(backdrop().opacity)).toBe(0);
      });

      it("draws the Original's own 40px grid", () => {
        TestBed.inject(ThemeService).setTheme(ORIGINAL_THEME.id);
        expect(parseFloat(backdrop().opacity)).toBe(1);
        expect(backdrop().backgroundSize).toContain('40px 40px');
      });
    });

    describe('Reduce motion', () => {
      let el: HTMLElement;

      beforeEach(() => {
        el = document.createElement('div');
        el.style.animation = 'glow 5s ease-in-out infinite';
        el.style.transition = 'color 0.3s ease';
        document.body.appendChild(el);
      });

      afterEach(() => el.remove());

      it("leaves the app's animations running while it is off", () => {
        if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
          pending('this machine asks for reduced motion, so animations are already stopped');
        }
        TestBed.inject(ThemeService);
        expect(getComputedStyle(el).animationDuration).toBe('5s');
        expect(getComputedStyle(el).transitionDuration).toBe('0.3s');
      });

      it("stops the app's own animations when it is on", () => {
        TestBed.inject(ThemeService).setReducedMotion(true);
        expect(getComputedStyle(el).animationIterationCount).toBe('1');
        expect(parseFloat(getComputedStyle(el).animationDuration)).toBeLessThan(0.001);
      });

      it("stops the app's own transitions when it is on", () => {
        TestBed.inject(ThemeService).setReducedMotion(true);
        expect(parseFloat(getComputedStyle(el).transitionDuration)).toBeLessThan(0.001);
      });
    });
  });
});
