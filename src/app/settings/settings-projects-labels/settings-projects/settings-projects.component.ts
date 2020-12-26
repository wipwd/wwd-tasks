import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import { ProjectsService, ProjectsMap, ProjectItem } from '../../../services/projects-service.service';

@Component({
  selector: 'app-settings-projects',
  templateUrl: './settings-projects.component.html',
  styleUrls: ['./settings-projects.component.scss']
})
export class SettingsProjectsComponent implements OnInit {

  public project_add_form_ctrl: FormControl = new FormControl();
  public project_rename_form_ctrl: FormControl = new FormControl();
  public projects: ProjectItem[] = [];
  public edit_project_id: number = 0;

  private _projects_by_name: {[id: string]: ProjectItem} = {};

  public constructor(
    private _projects_svc: ProjectsService
  ) { }

  public ngOnInit(): void {
    this._projects_svc.getProjects().subscribe({
      next: (projects: ProjectsMap) => {
        this.projects = [...Object.values(projects)];
      }
    });
  }

  public removeProject(project: ProjectItem): void {
    this._projects_svc.remove(project.name);
    this.project_rename_form_ctrl.setValue("");
    this.edit_project_id = 0;
  }

  public addProject(): void {
    const value: string = this.project_add_form_ctrl.value?.trim();
    if (!value || value === "") {
      return;
    }
    this._projects_svc.add(value);
    this.project_add_form_ctrl.setValue("");
  }

  public toggleRenameProject(project: ProjectItem): void {
    this.edit_project_id = (this.edit_project_id > 0 ? 0 : project.id);
    if (this.edit_project_id >= 0) {
      this.project_rename_form_ctrl.setValue(project.name);
    } else {
      this.project_rename_form_ctrl.setValue("");
    }
  }

  public submitProjectRename(project: ProjectItem): void {
    const value: string = this.project_rename_form_ctrl.value?.trim();
    if (!value || value === "") {
      return;
    }
    const old_name: string = project.name;
    const new_name: string = value;
    this.edit_project_id = 0;
    this.project_rename_form_ctrl.setValue("");
    this._projects_svc.rename(old_name, new_name);
  }

}
