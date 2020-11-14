import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FirstTimeDialogComponent } from './first-time-dialog.component';

describe('FirstTimeDialogComponent', () => {
  let component: FirstTimeDialogComponent;
  let fixture: ComponentFixture<FirstTimeDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FirstTimeDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FirstTimeDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
