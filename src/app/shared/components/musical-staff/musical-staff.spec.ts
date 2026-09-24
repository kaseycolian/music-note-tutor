import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MusicalStaffComponent } from './musical-staff';

describe('MusicalStaff', () => {
  let component: MusicalStaffComponent;
  let fixture: ComponentFixture<MusicalStaffComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MusicalStaffComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MusicalStaffComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
