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
});
