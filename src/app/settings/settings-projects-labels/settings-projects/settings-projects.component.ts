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
  public projects: string[] = [];
  private _projects_by_name: {[id: string]: ProjectItem} = {};

  public constructor(
    private _projects_svc: ProjectsService
  ) { }

  public ngOnInit(): void {
    this._projects_svc.getProjects().subscribe({
      next: (projects: ProjectsMap) => {
        const project_names: string[] = [];
        Object.values(projects).forEach( (item: ProjectItem) => {
          project_names.push(item.name);
          this._projects_by_name[item.name] = item;
        });
        this.projects = [...project_names];
      }
    });
  }

  public removeProject(name: string): void {
    this._projects_svc.remove(name);
  }

  public addProject(): void {
    const value: string = this.project_add_form_ctrl.value?.trim();
    if (!value || value === "") {
      return;
    }
    this._projects_svc.add(value);
    this.project_add_form_ctrl.setValue("");
  }

}
