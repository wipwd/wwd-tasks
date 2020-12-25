import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import { ProjectsService } from 'src/app/services/projects-service.service';

@Component({
  selector: 'app-settings-projects',
  templateUrl: './settings-projects.component.html',
  styleUrls: ['./settings-projects.component.scss']
})
export class SettingsProjectsComponent implements OnInit {

  public project_add_form_ctrl: FormControl = new FormControl();
  public projects: string[] = [];

  public constructor(
    private _projects_svc: ProjectsService
  ) { }

  public ngOnInit(): void {
    this._projects_svc.getProjects().subscribe({
      next: (projects: string[]) => {
        this.projects = [...projects];
      }
    });
  }


  public getProjects(): BehaviorSubject<string[]> {
    return this._projects_svc.getProjects();
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
