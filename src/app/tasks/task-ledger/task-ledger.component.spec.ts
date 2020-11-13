import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TaskLedgerComponent } from './task-ledger.component';

describe('TaskLedgerComponent', () => {
  let component: TaskLedgerComponent;
  let fixture: ComponentFixture<TaskLedgerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TaskLedgerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TaskLedgerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
