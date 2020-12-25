import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SettingsProjectsLabelsComponent } from './settings-projects-labels.component';

describe('SettingsProjectsLabelsComponent', () => {
  let component: SettingsProjectsLabelsComponent;
  let fixture: ComponentFixture<SettingsProjectsLabelsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SettingsProjectsLabelsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SettingsProjectsLabelsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
