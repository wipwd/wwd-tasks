import { Component, OnInit } from '@angular/core';
import { ProjectsStorageDataItem } from 'src/app/services/projects-service.service';
import { ImportExportDataItem, ImportExportStorageItem, StorageItem, StorageService } from 'src/app/services/storage-service.service';
import { TasksStorageDataItem } from 'src/app/services/task-service.service';

interface ImportExportStatistics {
  name: string;
  size: number;
}

@Component({
  selector: 'app-import-export-data',
  templateUrl: './import-export-data.component.html',
  styleUrls: ['./import-export-data.component.scss']
})
export class ImportExportDataComponent implements OnInit {

  private _is_exporting: boolean = false;
  private _exported_data: ImportExportStorageItem;
  private _statistics: ImportExportStatistics[] = [];
  private _is_export_ready: boolean = false;

  public constructor(
    private _storage_svc: StorageService,
  ) { }

  public ngOnInit(): void { }

  public export(): void {
    this._is_exporting = true;

    this._storage_svc.exportData().then(
      (exported: ImportExportStorageItem) => {
        const state: StorageItem = exported.state;
        const _tasks: TasksStorageDataItem = state.data.tasks;
        const _projects: ProjectsStorageDataItem = state.data.projects;
        this._exported_data = exported;
        this._statistics = [
          {
            name: "Projects",
            size: (!!_projects ? _projects.projects.length : 0)
          },
          {
            name: "Tasks",
            size: (!!_tasks ? _tasks.tasks.length : 0)
          },
          {
            name: "Archived",
            size: (!!_tasks ? Object.keys(_tasks.archives).length : 0)
          }
        ];
        this._is_export_ready = true;
      }
    );
  }

  public import(): void { }

  public isExporting(): boolean {
    return this._is_exporting;
  }

  public isExportReady(): boolean {
    return this._is_export_ready;
  }

  public getStatistics(): ImportExportStatistics[] {
    return this._statistics;
  }

  public downloadExportedData(): void {
    const json_data: string = JSON.stringify(this._exported_data);
    const blob = new Blob([json_data], {type: 'data:text/json'});
    const url: string = window.URL.createObjectURL(blob);
    window.open(url, "new");

    this._is_export_ready = false;
    this._is_exporting = false;
    this._statistics = [];
    this._exported_data = undefined;
  }

}
