import { Injectable } from '@angular/core';
import { ProjectsService } from './projects-service.service';
import { TaskService } from './task-service.service';

export interface ImportExportDataItem {
  timestamp: number;
  data: {
    tasks: any,
    projects: any
  };
}

@Injectable({
  providedIn: 'root'
})
export class ImportExportService {

  public constructor(
    private _tasks_svc: TaskService,
    private _projects_svc: ProjectsService
  ) { }

  public export(): string {
    const export_data: ImportExportDataItem = {
      timestamp: new Date().getTime(),
      data: {
        tasks: this._tasks_svc.export(),
        projects: this._projects_svc.export()
      }
    };
    return JSON.stringify(export_data);
  }
}
