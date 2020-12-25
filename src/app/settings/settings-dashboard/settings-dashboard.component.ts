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

  public settings_items: SettingsEntryItem[] = [
    { id: "projects", label: "Projects & Labels", icon: "book" },
    { id: "importexport", label: "Import/Export Data", icon: "import_export" },
    { id: "sync", label: "Device Sync", icon: "sync_alt" },
    { id: "appinfo", label: "Application Information", icon: "info" }
  ];

  public selected_item: string = "projects";


  public constructor(
    private _projects_svc: ProjectsService,
  ) { }

  public ngOnInit(): void { }


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
