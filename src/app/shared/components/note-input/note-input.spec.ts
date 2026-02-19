import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NoteInput } from './note-input';

describe('NoteInput', () => {
  let component: NoteInput;
  let fixture: ComponentFixture<NoteInput>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NoteInput]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NoteInput);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
