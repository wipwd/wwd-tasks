import { Injectable } from '@angular/core';
import {
  ImportExportProjectsDataItem, ProjectsService
} from './projects-service.service';
import {
  ImportExportTaskDataItem, TaskService
} from './task-service.service';

export interface ImportExportDataItem {
  timestamp: number;
  data: {
    tasks: ImportExportTaskDataItem;
    projects: ImportExportProjectsDataItem;
  };
}

@Injectable({
  providedIn: 'root'
})
export class StorageService {

  public constructor(
    private _tasks_svc: TaskService,
    private _projects_svc: ProjectsService
  ) { }

  async exportData(): Promise<ImportExportDataItem> {
    return new Promise<ImportExportDataItem>( async (resolve) => {
      const export_data: ImportExportDataItem = {
        timestamp: new Date().getTime(),
        data: {
          tasks: await this._tasks_svc.exportData(),
          projects: await this._projects_svc.exportData()
        }
      };
      resolve(export_data);
    });
  }
}
