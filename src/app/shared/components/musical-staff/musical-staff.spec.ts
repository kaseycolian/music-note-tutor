import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MusicalStaff } from './musical-staff';

describe('MusicalStaff', () => {
  let component: MusicalStaff;
  let fixture: ComponentFixture<MusicalStaff>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MusicalStaff]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MusicalStaff);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
