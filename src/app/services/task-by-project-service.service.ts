import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ProjectItem, ProjectsMap, ProjectsService } from './projects-service.service';
import { TaskItem, TaskItemMap, TaskService } from './task-service.service';


export interface ProjectTasks {
  project_id: number;
  project: ProjectItem;
  num_tasks: number;
  tasks: TaskItem[];
}

declare type ProjectObserversMap =
  {[id: number]: BehaviorSubject<ProjectTasks>};

@Injectable({
  providedIn: 'root'
})
export class TaskByProjectService {

  private _tasks: TaskItemMap = {};
  private _projects: ProjectsMap = {};

  private _tasks_by_project: {[id: number]: TaskItem[]} = {};
  private _project_by_task: {[id: string]: number} = {};

  private _project_observers: ProjectObserversMap = {};

  public constructor(
    private _tasks_svc: TaskService,
    private _projects_svc: ProjectsService
  ) {
    this._tasks_svc.getAllTasks().subscribe({
      next: (tasks: TaskItemMap) => {
        if (!tasks) {
          return;
        }
        this._handleTasks(tasks);
      }
    });

    this._projects_svc.getProjects().subscribe({
      next: (projects: ProjectsMap) => {
        if (!projects) {
          return;
        }
        this._handleProjects(projects);
      }
    });
  }

  private _handleTasks(tasks: TaskItemMap): void {

    this._tasks = tasks;
    this._tasks_by_project = {};
    this._project_by_task = {};

    this._updateTasks();
  }

  private _updateTasks(): void {

    Object.keys(this._tasks).forEach( (key: string) => {
      // obtain task item
      const item: TaskItem = this._tasks[key];
      if (typeof item.project !== "number") {
        throw new Error(`project type for task ${key} is not a number: ${typeof item.project}`);
      }
      // obtain task's project id and project
      const projid: number = item.project;
      if (projid === 0) {
        return;
      }

      if (!(projid in this._tasks_by_project)) {
        this._tasks_by_project[projid] = [];
      }
      this._tasks_by_project[projid].push(item);
      this._project_by_task[key] = projid;
    });

    Object.keys(this._tasks_by_project).forEach( (key: string) => {
      const projid: number = +key;
      this._createObserverFor(projid);
    });

    this._updateObservers();
  }

  private _handleProjects(projects: ProjectsMap): void {

    const cur_projects: string[] = Object.keys(this._projects);
    const new_projects: string[] = Object.keys(projects);

    const existing: number[] = [];
    const removed: number[] = [];
    const added: number[] = [];

    new_projects.forEach( (projid: string) => {
      if (cur_projects.includes(projid)) {
        existing.push(+projid);
      } else {
        added.push(+projid);
      }
    });

    cur_projects.forEach( (projid: string) => {
      if (!new_projects.includes(projid)) {
        removed.push(+projid);
      }
    });

    this._projects = projects;

    this._handleRemovedProjects(removed);
    this._handleAddedProjects(added);

    this._updateObservers();
  }

  private _handleRemovedProjects(removed: number[]): void {

    const updated_tasks: TaskItem[] = [];
    removed.forEach( (projid: number) => {
      if (!(projid in this._tasks_by_project)) {
        return;
      }
      const tasklst: TaskItem[] = this._tasks_by_project[projid];
      tasklst.forEach( (task: TaskItem) => {
        task.project = 0;
        updated_tasks.push(task);
        delete this._project_by_task[task.id];
      });
      delete this._tasks_by_project[projid];
      this._project_observers[projid].complete();
      delete this._project_observers[projid];
    });
    this._tasks_svc.updateTaskInBulk(updated_tasks);
  }

  private _handleAddedProjects(added: number[]): void {

    added.forEach( (projid: number) => {
      if (!(projid in this._tasks_by_project)) {
        this._tasks_by_project[projid] = [];
      }
      this._createObserverFor(projid);
    });
  }

  private _createProjectTasks(projid: number): ProjectTasks|undefined {

    if (!(projid in this._projects)) {
      return undefined;
    }

    const projtasks: TaskItem[] = this._tasks_by_project[projid];
    return {
      project_id: projid,
      project: this._projects[projid],
      num_tasks: projtasks.length,
      tasks: projtasks
    };
  }

  private _createObserverFor(projid: number): void {
    if (!(projid in this._project_observers)) {
      this._project_observers[projid] =
        new BehaviorSubject<ProjectTasks>(this._createProjectTasks(projid));
    }
  }

  private _updateObservers(): void {
    Object.keys(this._tasks_by_project).forEach( (key: string) => {
      const projid: number = +key;
      if (!(projid in this._project_observers)) {
        throw new Error(`observer DNE for project ${projid}`);
      }

      this._project_observers[projid].next(
        this._createProjectTasks(projid)
      );
    });
  }

  public getProjectTasks(projid: number): BehaviorSubject<ProjectTasks> {
    if (!(projid in this._project_observers)) {
      throw new Error(`observer DNE for project ${projid}`);
    }
    return this._project_observers[projid];
  }
}
