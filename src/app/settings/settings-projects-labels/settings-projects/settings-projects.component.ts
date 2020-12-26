import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { BehaviorSubject, Subscription } from 'rxjs';
import { ProjectsService, ProjectsMap, ProjectItem } from '../../../services/projects-service.service';
import { ProjectTasks, TaskByProjectService } from '../../../services/task-by-project-service.service';

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
  public num_tasks_by_project: {[id: number]: number} = {};

  private _projects_by_id: {[id: number]: ProjectItem} = {};
  private _project_task_subscriptions: {[id: number]: Subscription} = {};


  public constructor(
    private _projects_svc: ProjectsService,
    private _task_by_project_svc: TaskByProjectService
  ) { }

  public ngOnInit(): void {
    this._projects_svc.getProjects().subscribe({
      next: (projects: ProjectsMap) => {
        this.projects = [...Object.values(projects)];

        this._updateProjects();
      }
    });
  }

  private _updateProjects(): void {
    this._projects_by_id = {};
    this.projects.forEach( (project: ProjectItem) => {
      this._projects_by_id[project.id] = project;
    });

    Object.keys(this._project_task_subscriptions).forEach( (key: string) => {
      const projid: number = +key;
      if (!(projid in this._projects_by_id)) {
        this._project_task_subscriptions[projid].unsubscribe();
      }
    });

    this.projects.forEach( (project: ProjectItem) => {
      if (!(project.id in this._project_task_subscriptions)) {
        this._project_task_subscriptions[project.id] =
          this._task_by_project_svc.getProjectTasks(project.id).subscribe({
            next: (projtask: ProjectTasks) => {
              console.log("settings-projects > project tasks: ", projtask);
              this._handleProjectTask(projtask);
            }
          });
      } else {
        this.num_tasks_by_project[project.id] = 0;
      }
    });
  }

  private _handleProjectTask(projtask: ProjectTasks): void {
    this.num_tasks_by_project[projtask.project_id] = projtask.num_tasks;
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
