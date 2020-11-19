import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SettingsDeviceSyncComponent } from './settings-device-sync.component';

describe('SettingsDeviceSyncComponent', () => {
  let component: SettingsDeviceSyncComponent;
  let fixture: ComponentFixture<SettingsDeviceSyncComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SettingsDeviceSyncComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SettingsDeviceSyncComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
