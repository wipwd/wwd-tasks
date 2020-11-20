import { Component, OnInit } from '@angular/core';
import { ImportExportDataItem, StorageService } from 'src/app/services/storage-service.service';

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
  private _exported_data: ImportExportDataItem;
  private _statistics: ImportExportStatistics[] = [];
  private _is_export_ready: boolean = false;

  public constructor(
    private _storage_svc: StorageService,
  ) { }

  public ngOnInit(): void { }

  public export(): void {
    this._is_exporting = true;

    this._storage_svc.exportData().then(
      (exported_data: ImportExportDataItem) => {
        this._exported_data = exported_data;
        this._statistics = [
          {
            name: "Projects",
            size: exported_data.data.projects.projects.length
          },
          {
            name: "Tasks",
            size: exported_data.data.tasks.tasks.length
          },
          {
            name: "Archived",
            size: Object.keys(exported_data.data.tasks.archive).length
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
