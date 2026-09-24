import { TestBed } from '@angular/core/testing';

import { NoteGeneratorConfigService } from './note-generator-config';

describe('NoteGeneratorConfig', () => {
  let service: NoteGeneratorConfigService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NoteGeneratorConfigService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
