import {
  afterNextRender,
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { ThemeService } from '../../../core/services/theme';

/** The instance theme-service's dropdown.js returns for an enhanced <select>. */
interface Dropdown {
  sync(): void;
  destroy(): void;
}

// dropdown.js (loaded as a global script, see angular.json) registers itself as
// window.ThemeService: the theme-service's namespace, unrelated to this app's ThemeService.
declare global {
  interface Window {
    ThemeService?: { createDropdown(select: HTMLSelectElement): Dropdown | null };
  }
}

/**
 * The theme console from the A11Y Way pages: a "Theme" cap, four lamps showing the
 * current palette, and theme-service's accessible listbox (dropdown.js), grouped by
 * theme family with each theme's accents as dots. The closed control shows the full
 * name. If dropdown.js doesn't load, the native <select> still switches themes.
 *
 * Unencapsulated: dropdown.js builds part of this control, and Angular's emulated
 * encapsulation wouldn't reach those elements. Every rule is scoped to app-theme-picker.
 */
@Component({
  selector: 'app-theme-picker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <!-- The A11Y Way pages' switch: the checkbox stays a real, focusable input, drawn
         as a track and thumb. -->
    <label class="switch motion" [class.is-disabled]="themes.systemReducedMotion()">
      <input
        type="checkbox"
        [checked]="themes.reducedMotion() || themes.systemReducedMotion()"
        [disabled]="themes.systemReducedMotion()"
        (change)="onMotionChange($event)" />
      <span class="track"><span class="thumb"></span></span>
      Reduce motion
      @if (themes.systemReducedMotion()) {
        <span class="motion-note">(set by your device)</span>
      }
    </label>
    <!-- A <div>, not a <label>: once enhanced, the real control is a <button>, which a
         wrapping label would not name. aria-labelledby names it "Theme, <current>". -->
    <div class="theme-console">
      <span class="tc-cap" id="theme-console-cap">Theme</span>
      <span class="tc-lamps" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
      <select
        #themeSelect
        aria-labelledby="theme-console-cap"
        data-dropdown-anchor=".theme-console"
        data-dropdown-swatch-style="dots"
        (change)="onThemeChange($event)">
        @for (group of themes.groups; track group.name) {
          <optgroup [label]="group.name">
            @for (option of group.options; track option.id) {
              <option
                [value]="option.id"
                [selected]="option.id === themes.theme()"
                [attr.data-dropdown-full-label]="option.label"
                [attr.data-dropdown-swatch]="option.swatch"
                [attr.data-dropdown-secondary]="option.secondary ?? null">
                {{ option.row }}
              </option>
            }
          </optgroup>
        }
      </select>
    </div>
  `,
  styleUrl: './theme-picker.scss',
})
export class ThemePicker {
  protected readonly themes = inject(ThemeService);
  private readonly select = viewChild.required<ElementRef<HTMLSelectElement>>('themeSelect');
  private dropdown: Dropdown | null = null;

  constructor() {
    afterNextRender(() => {
      this.dropdown = window.ThemeService?.createDropdown(this.select().nativeElement) ?? null;
    });
    // Keep the enhanced control's label in step when the theme changes from code.
    afterRenderEffect(() => {
      this.themes.theme();
      this.dropdown?.sync();
    });
    inject(DestroyRef).onDestroy(() => this.dropdown?.destroy());
  }

  protected onThemeChange(event: Event): void {
    this.themes.setTheme((event.target as HTMLSelectElement).value);
  }

  protected onMotionChange(event: Event): void {
    this.themes.setReducedMotion((event.target as HTMLInputElement).checked);
  }
}
