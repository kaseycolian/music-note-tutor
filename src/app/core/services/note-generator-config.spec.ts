import { TestBed } from '@angular/core/testing';

import { NoteGeneratorConfig } from './note-generator-config';

describe('NoteGeneratorConfig', () => {
  let service: NoteGeneratorConfig;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NoteGeneratorConfig);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
