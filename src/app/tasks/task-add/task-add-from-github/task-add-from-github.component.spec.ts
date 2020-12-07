import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TaskAddFromGithubComponent } from './task-add-from-github.component';

describe('TaskAddFromGithubComponent', () => {
  let component: TaskAddFromGithubComponent;
  let fixture: ComponentFixture<TaskAddFromGithubComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TaskAddFromGithubComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TaskAddFromGithubComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
