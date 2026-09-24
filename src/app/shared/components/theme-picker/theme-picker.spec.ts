import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ORIGINAL_THEME, ThemeService } from '../../../core/services/theme';
import { ThemePicker } from './theme-picker';

// dropdown.js is a global script in the test target (angular.json), so the picker
// is enhanced here the same way it is in the app.
describe('ThemePicker', () => {
  let fixture: ComponentFixture<ThemePicker>;
  let service: ThemeService;

  function reset(): void {
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.removeAttribute('data-motion');
    localStorage.removeItem('theme');
    localStorage.removeItem('motion');
  }

  beforeEach(async () => {
    reset();
    await TestBed.configureTestingModule({
      imports: [ThemePicker],
    }).compileComponents();

    service = TestBed.inject(ThemeService);
    fixture = TestBed.createComponent(ThemePicker);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  afterEach(() => {
    fixture.destroy();
    reset();
  });

  const query = <T extends Element>(selector: string) =>
    fixture.nativeElement.querySelector(selector) as T;

  const trigger = () => query<HTMLButtonElement>('.dropdown-toggle');
  const checkbox = () => query<HTMLInputElement>('input[type="checkbox"]');

  it('groups Auto, the Original and the 7 theme-service families', () => {
    const groups = Array.from(
      fixture.nativeElement.querySelectorAll('optgroup') as NodeListOf<HTMLOptGroupElement>,
    ).map((group) => group.label);
    expect(groups.slice(0, 2)).toEqual(['Automatic', 'Note and Seek']);
    expect(groups.length).toBe(9);
    expect(query<HTMLSelectElement>('select').options.length).toBe(26);
  });

  it('gives rows short text, the full name and a four-accent swatch', () => {
    const option = query<HTMLOptionElement>('option[value="rink-classic-dark-no-background"]');
    expect(option.textContent?.trim()).toBe('Dark · No Background');
    expect(option.dataset['dropdownFullLabel']).toBe('Rink Classic · Dark · No Background');
    expect(option.dataset['dropdownSwatch']?.split(',').length).toBe(4);
  });

  it('upgrades to the accessible listbox, named by the Theme cap', () => {
    expect(trigger()).toBeTruthy();
    expect(trigger().getAttribute('aria-labelledby')).toContain('theme-console-cap');
    expect(trigger().textContent).toContain('Auto (Rink Classic)');
  });

  it('applies a theme picked from the listbox', () => {
    const row = Array.from(
      fixture.nativeElement.querySelectorAll('[role="option"]') as NodeListOf<HTMLElement>,
    ).find((option) => option.textContent?.includes('Original'));
    row?.click();
    expect(service.theme()).toBe(ORIGINAL_THEME.id);
    expect(document.documentElement.getAttribute('data-theme')).toBe(ORIGINAL_THEME.id);
  });

  it('shows the full name of a theme set from code', async () => {
    service.setTheme('rfg-light');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(trigger().textContent).toContain('RFG · Light');
  });

  it('toggles Reduce motion', () => {
    checkbox().click();
    expect(service.reducedMotion()).toBeTrue();
    expect(document.documentElement.getAttribute('data-motion')).toBe('off');
  });

  it('shows Reduce motion as on, and locked, when the device asks for it', () => {
    service.systemReducedMotion.set(true);
    fixture.detectChanges();
    expect(checkbox().checked).toBeTrue();
    expect(checkbox().disabled).toBeTrue();
    expect(fixture.nativeElement.textContent).toContain('(set by your device)');
  });
});
