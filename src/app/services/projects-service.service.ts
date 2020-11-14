import { Injectable } from '@angular/core';
import { set as idbset, get as idbget } from 'idb-keyval';
import { BehaviorSubject } from 'rxjs';

declare type ProjectsMap = {[id: string]: string};

@Injectable({
  providedIn: 'root'
})
export class ProjectsService {

  private _projects: ProjectsMap = {};
  private _projects_subject: BehaviorSubject<string[]> =
    new BehaviorSubject<string[]>([]);

  public constructor() {
    this._stateLoad();
  }

  private _stateLoad(): void {
    idbget("_wwdtasks_projects").then(
      (value: string[]|undefined) => {
        if (!value) {
          return;
        }
        this._projects = {};
        value.forEach( (name: string) => {
          this._projects[name] = name;
        });
        this._updateSubjects();
      }
    );
  }

  private _stateSave(): void {
    const projects: string[] = Object.values(this._projects);
    idbset("_wwdtasks_projects", projects);
  }

  private _updateSubjects(): void {
    this._projects_subject.next(Object.values(this._projects));
  }

  public getProjects(): BehaviorSubject<string[]> {
    return this._projects_subject;
  }

  public add(name: string): void {
    if (!name || name === "") {
      return;
    }
    this._projects[name] = name;
    this._stateSave();
    this._updateSubjects();
  }

  public remove(name: string): void {
    if (!name || name === "" || !(name in this._projects)) {
      return;
    }
    delete this._projects[name];
    this._stateSave();
    this._updateSubjects();
  }
}
