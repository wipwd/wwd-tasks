import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ProjectsService } from '../../services/projects-service.service';
import { ENTER, COMMA } from '@angular/cdk/keycodes';
import { FormControl } from '@angular/forms';
import { MatChipInputEvent } from '@angular/material/chips';
import { WWDTASKS_BUILD_COMMIT, WWDTASKS_BUILD_DATE } from '../../build-info';
import { InOutAnimation } from '../../animations';


interface SettingsEntryItem {
  id: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-settings-dashboard',
  templateUrl: './settings-dashboard.component.html',
  styleUrls: ['./settings-dashboard.component.scss'],
  animations: [
    InOutAnimation
  ]
})
export class SettingsDashboardComponent implements OnInit {

  public chip_separator_codes: number[] = [ ENTER, COMMA ];
  public project_form_ctrl: FormControl = new FormControl();

  public settings_items: SettingsEntryItem[] = [
    { id: "projects", label: "Projects", icon: "book" },
    { id: "importexport", label: "Import/Export Data", icon: "import_export" },
    { id: "sync", label: "Device Sync", icon: "sync_alt" },
    { id: "appinfo", label: "Application Information", icon: "info" }
  ];

  public selected_item: string = "projects";


  public constructor(
    private _projects_svc: ProjectsService,
  ) { }

  public ngOnInit(): void { }

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

  public selectedEntry(entry: SettingsEntryItem): void {
    if (entry.id === this.selected_item) {
      return;
    }
    this.selected_item = entry.id;
  }
}
