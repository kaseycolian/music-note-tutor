import { TestBed } from '@angular/core/testing';

import { UserProgress } from './user-progress';

describe('UserProgress', () => {
  let service: UserProgress;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UserProgress);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
