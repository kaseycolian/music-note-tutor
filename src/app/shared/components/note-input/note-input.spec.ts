import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NoteInputComponent } from './note-input';

describe('NoteInput', () => {
  let component: NoteInputComponent;
  let fixture: ComponentFixture<NoteInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NoteInputComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NoteInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('keyboard shortcuts', () => {
    let selected: string[];

    beforeEach(() => {
      selected = [];
      component.noteSelected.subscribe((note) => selected.push(note));
    });

    function pressFrom(target: EventTarget, key: string): void {
      target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
    }

    it('answers with number keys pressed on the page', () => {
      pressFrom(document.body, '3');
      expect(selected).toEqual(['E']);
    });

    it('ignores number keys typed into a form control such as the theme picker', () => {
      const select = document.createElement('select');
      document.body.appendChild(select);
      try {
        pressFrom(select, '7');
        expect(selected).toEqual([]);
      } finally {
        select.remove();
      }
    });

    it("ignores number keys typed into the theme picker's listbox and its trigger", () => {
      const trigger = document.createElement('button');
      trigger.setAttribute('aria-haspopup', 'listbox');
      const listbox = document.createElement('div');
      listbox.setAttribute('role', 'listbox');
      const row = document.createElement('div');
      listbox.appendChild(row);
      document.body.append(trigger, listbox);
      try {
        pressFrom(trigger, '2');
        pressFrom(row, '5');
        expect(selected).toEqual([]);
      } finally {
        trigger.remove();
        listbox.remove();
      }
    });
  });
});
