import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ProjectItem {
  id: number;
  name: string;
}

export interface ProjectsStorageDataItem {
  projects?: string[];
  projects_map?: {[id: number]: ProjectItem};
  latest_id?: number;
}

export declare type ProjectsMap = {[id: number]: ProjectItem};

@Injectable({
  providedIn: 'root'
})
export class ProjectsService {

  private _projects: ProjectsMap = {};
  private _projects_by_name: {[id: string]: ProjectItem} = {};
  private _latest_used_id: number = 0;

  private _projects_subject: BehaviorSubject<ProjectsMap> =
    new BehaviorSubject<ProjectsMap>({});
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
    this._convertToProjectsMap(data);
    this._stateLoad(data.projects_map, data.latest_id);
  }

  private _stateLoad(projects: ProjectsMap, latest_id: number ): void {
    this._projects = projects;
    Object.values(this._projects).forEach( (item: ProjectItem) => {
      this._projects_by_name[item.name] = item;
    });
    this._latest_used_id = latest_id;
    this._updateSubjects();
  }

  private _getCurrentState(): ProjectsStorageDataItem {
    return {
      projects_map: this._projects,
      latest_id: this._latest_used_id
    };
  }

  private _stateSave(): void {
    const cur_state: ProjectsStorageDataItem = this._getCurrentState();
    this._storage_subject.next(cur_state);
  }

  private _updateSubjects(): void {
    this._projects_subject.next(this._projects);
  }

  public getProjects(): BehaviorSubject<ProjectsMap> {
    return this._projects_subject;
  }

  public getProjectByName(name: string): ProjectItem|undefined {
    if (!(name in this._projects_by_name)) {
      return undefined;
    }
    return this._projects_by_name[name];
  }

  public add(_name: string): void {
    if (!_name || _name === "") {
      return;
    }
    if (_name in this._projects_by_name) {
      return;
    }
    const new_id = this._latest_used_id + 1;
    this._latest_used_id = new_id;
    const item: ProjectItem = { id: new_id, name: _name};
    this._projects[new_id] = item;
    this._projects_by_name[_name] = item;
    this._stateSave();
    this._updateSubjects();
  }

  public remove(name: string): void {
    if (!name || name === "" || !(name in this._projects_by_name)) {
      return;
    }
    const item: ProjectItem = this._projects_by_name[name];
    delete this._projects[item.id];
    delete this._projects_by_name[name];
    this._stateSave();
    this._updateSubjects();
  }

  public rename(old_name: string, new_name: string): void {
    const item: ProjectItem = this.getProjectByName(old_name);
    if (!item) {
      return;
    }
    item.name = new_name;
    this._stateSave();
    this._updateSubjects();
  }

  private _convertToProjectsMap(data: ProjectsStorageDataItem): void {
    if (!("projects_map" in data)) {
      data.projects_map = {};
    }
    if (!("latest_id" in data)) {
      data.latest_id = 0;
    }
    if (!("projects" in data) || !data.projects) {
      return;
    }
    data.projects.forEach( (pname: string) => {
      let exists: boolean = false;
      Object.values(data.projects_map).forEach( (item: ProjectItem) => {
        if (exists) {
          return;
        }
        if (pname === item.name) {
          exists = true;
          return;
        }
      });
      if (exists) {
        return;
      }

      const new_id: number = data.latest_id + 1;
      data.latest_id = new_id;
      data.projects_map[new_id] = { id: new_id, name: pname };
    });
    data.projects = undefined;
  }
}
