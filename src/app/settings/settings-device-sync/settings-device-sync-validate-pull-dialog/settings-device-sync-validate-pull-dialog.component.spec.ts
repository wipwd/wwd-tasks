import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SettingsDeviceSyncValidatePullDialogComponent } from './settings-device-sync-validate-pull-dialog.component';

describe('SettingsDeviceSyncValidatePullDialogComponent', () => {
  let component: SettingsDeviceSyncValidatePullDialogComponent;
  let fixture: ComponentFixture<SettingsDeviceSyncValidatePullDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SettingsDeviceSyncValidatePullDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SettingsDeviceSyncValidatePullDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
