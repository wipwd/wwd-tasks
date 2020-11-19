import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SettingsDeviceSyncDialogComponent } from './settings-device-sync-dialog.component';

describe('SettingsDeviceSyncDialogComponent', () => {
  let component: SettingsDeviceSyncDialogComponent;
  let fixture: ComponentFixture<SettingsDeviceSyncDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SettingsDeviceSyncDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SettingsDeviceSyncDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
