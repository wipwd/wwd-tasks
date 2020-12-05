import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SettingsDeviceSyncValidatePushDialogComponent } from './settings-device-sync-validate-push-dialog.component';

describe('SettingsDeviceSyncValidatePushDialogComponent', () => {
  let component: SettingsDeviceSyncValidatePushDialogComponent;
  let fixture: ComponentFixture<SettingsDeviceSyncValidatePushDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SettingsDeviceSyncValidatePushDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SettingsDeviceSyncValidatePushDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
