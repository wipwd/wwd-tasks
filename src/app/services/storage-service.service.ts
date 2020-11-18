import { Injectable } from '@angular/core';
import {
  ProjectsExportItem, ProjectsService
} from './projects-service.service';
import {
  TaskExportItem, TaskService
} from './task-service.service';

export interface WWDTasksExportDataItem {
  tasks: TaskExportItem;
  projects: ProjectsExportItem;
}

@Injectable({
  providedIn: 'root'
})
export class StorageService {

  public constructor(
    private _tasks_svc: TaskService,
    private _projects_svc: ProjectsService
  ) { }

  async exportData(): Promise<WWDTasksExportDataItem> {
    return new Promise<WWDTasksExportDataItem>( async (resolve) => {
      const export_data: WWDTasksExportDataItem = {
        tasks: await this._tasks_svc.exportData(),
        projects: await this._projects_svc.exportData()
      };
      resolve(export_data);
    });
  }
}
