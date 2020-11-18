import { Component, OnInit } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ProjectsService } from '../../services/projects-service.service';
import { ENTER, COMMA } from '@angular/cdk/keycodes';
import { FormControl } from '@angular/forms';
import { MatChipInputEvent } from '@angular/material/chips';
import {
  StorageService,
  WWDTasksExportDataItem
} from '../../services/storage-service.service';
import { WWDTASKS_BUILD_COMMIT, WWDTASKS_BUILD_DATE } from '../../build-info';
import * as triplesec from 'triplesec/browser/triplesec';

interface ImportExportStatistics {
  name: string;
  size: number;
}

@Component({
  selector: 'app-settings-dashboard',
  templateUrl: './settings-dashboard.component.html',
  styleUrls: ['./settings-dashboard.component.scss']
})
export class SettingsDashboardComponent implements OnInit {

  public chip_separator_codes: number[] = [ ENTER, COMMA ];
  public project_form_ctrl: FormControl = new FormControl();

  private _is_exporting: boolean = false;
  private _exported_data: WWDTasksExportDataItem;
  private _statistics: ImportExportStatistics[];
  private _export_ready: boolean = false;
  private _encrypted: string;
  private _decrypted: string;

  public constructor(
    private _projects_svc: ProjectsService,
    private _storage_svc: StorageService
  ) { }

  public ngOnInit(): void {
  }

  public getProjects(): BehaviorSubject<string[]> {
    return this._projects_svc.getProjects();
  }

  public removeProject(name: string): void {
    this._projects_svc.remove(name);
  }

  public addProject(event: MatChipInputEvent): void {
    const value: string = event.value.trim();
    const input: HTMLInputElement = event.input;
    if (!value || value === "") {
      return;
    }
    this._projects_svc.add(value);
    if (input) {
      input.value = "";
    }

    this.project_form_ctrl.setValue(null);
    console.log("add project: ", event.value);
  }

  public getBuildCommit(): string {
    return WWDTASKS_BUILD_COMMIT;
  }

  public getBuildDate(): string {
    return WWDTASKS_BUILD_DATE;
  }

  public isExporting(): boolean {
    return this._is_exporting;
  }

  public isExportReady(): boolean {
    return this._export_ready;
  }

  public downloadExport(): void {
    const blob: Blob = new Blob(
      [JSON.stringify(this._exported_data)],
      { type: "application/json"}
    );
    const url: string = window.URL.createObjectURL(blob);
    window.open(url);

    this._export_ready = false;
    this._exported_data = undefined;
    this._statistics = undefined;
    this._is_exporting = false;
  }

  public exportData(): void {
    this._is_exporting = true;

    this._storage_svc.exportData().then( (data: WWDTasksExportDataItem) => {
      this._exported_data = data;
      this._statistics = [
        { name: "Projects", size: data.projects.projects.length },
        { name: "Tasks", size: data.tasks.tasks.length },
        { name: "Archived", size: Object.keys(data.tasks.archive).length }
      ];
      this._export_ready = true;

      triplesec.encrypt({
        data: triplesec.Buffer.from(JSON.stringify(data)),
        key: triplesec.Buffer.from("foobar")
      }, (err, buff) => {
        this._encrypted = buff.toString("hex");

        triplesec.decrypt({
          data: triplesec.Buffer.from(this._encrypted, "hex"),
          key: triplesec.Buffer.from("foobar")
        }, (err2, buff2) => {
          console.log("dec err: ", err2);
          this._decrypted = buff2.toString();
        });
      });

    });
  }

  public getStatistics(): ImportExportStatistics[] {
    return this._statistics;
  }

  public getEncrypted(): string {
    return this._encrypted;
  }

  public getDecrypted(): string {
    return this._decrypted;
  }

  public importData(): void {

  }
}
