import { TestBed } from '@angular/core/testing';

import { TaskByProjectService } from './task-by-project-service.service';

describe('TaskByProjectService', () => {
  let service: TaskByProjectService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TaskByProjectService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
