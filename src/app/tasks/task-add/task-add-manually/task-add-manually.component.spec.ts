import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TaskAddManuallyComponent } from './task-add-manually.component';

describe('TaskAddManuallyComponent', () => {
  let component: TaskAddManuallyComponent;
  let fixture: ComponentFixture<TaskAddManuallyComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TaskAddManuallyComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TaskAddManuallyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
