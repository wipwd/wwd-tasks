import { TestBed } from '@angular/core/testing';

import { FilteredTasksService } from './filtered-tasks-service.service';

describe('FilteredTasksService', () => {
  let service: FilteredTasksService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FilteredTasksService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
