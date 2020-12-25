import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SettingsLabelsComponent } from './settings-labels.component';

describe('SettingsLabelsComponent', () => {
  let component: SettingsLabelsComponent;
  let fixture: ComponentFixture<SettingsLabelsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SettingsLabelsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SettingsLabelsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
