import { TestBed } from '@angular/core/testing';

import { TaskByPeopleService } from './task-by-people-service.service';

describe('TaskByPeopleService', () => {
  let service: TaskByPeopleService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TaskByPeopleService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
