import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NoteTutor } from './note-tutor';

describe('NoteTutor', () => {
  let component: NoteTutor;
  let fixture: ComponentFixture<NoteTutor>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NoteTutor]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NoteTutor);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows the theme picker in the header', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.game-header app-theme-picker')).toBeTruthy();
  });

  it("paints the theme's backdrop effect on the game area only", () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('main.game-area')?.classList).toContain('fx-grid');
    expect(compiled.querySelectorAll('.fx-grid').length).toBe(1);
  });
});
