import { Injectable } from '@angular/core';
import { set as idbset, get as idbget } from 'idb-keyval';
import { BehaviorSubject } from 'rxjs';

export interface ProjectsStorageDataItem {
  projects: string[];
}

declare type ProjectsMap = {[id: string]: string};

@Injectable({
  providedIn: 'root'
})
export class ProjectsService {

  private _projects: ProjectsMap = {};
  private _projects_subject: BehaviorSubject<string[]> =
    new BehaviorSubject<string[]>([]);
  private _storage_subject: BehaviorSubject<ProjectsStorageDataItem|undefined> =
    new BehaviorSubject<ProjectsStorageDataItem|undefined>(undefined);

  public constructor() { }

  public getStorageObserver(
  ): BehaviorSubject<ProjectsStorageDataItem|undefined> {
    return this._storage_subject;
  }

  public getInitState(): ProjectsStorageDataItem {
    return this._getCurrentState();
  }

  public stateLoad(data: ProjectsStorageDataItem): void {
    this._stateLoad(data.projects);
  }

  private _stateLoad(projects: string[]): void {
    projects.forEach( (name: string) => {
      this._projects[name] = name;
    });
    this._updateSubjects();
  }

  private _getCurrentState(): ProjectsStorageDataItem {
    return {
      projects: Object.values(this._projects)
    };
  }

  private _stateSave(): void {
    const cur_state: ProjectsStorageDataItem = this._getCurrentState();
    this._storage_subject.next(cur_state);
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
    if (name in this._projects) {
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
