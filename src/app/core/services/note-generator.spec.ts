import { TestBed } from '@angular/core/testing';

import { NoteGenerator } from './note-generator';

describe('NoteGenerator', () => {
  let service: NoteGenerator;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NoteGenerator);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
