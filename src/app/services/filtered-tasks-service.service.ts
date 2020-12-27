import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { LedgerService } from './ledger-service.service';
import { ProjectItem, ProjectsService } from './projects-service.service';
import { Ledger, TaskLedgerEntry } from './task-service.service';


export interface TaskFilterOptions {
  projects?: string[];
  title?: string;
}


@Injectable({
  providedIn: 'root'
})
export class FilteredTasksService {

  private _raw_tasks: {[id: string]: TaskLedgerEntry[]} = {};

  private _filtered_tasks_by_ledger: {[id: string]: TaskLedgerEntry[]} = {};
  private _num_tasks_by_ledger: {[id: string]: number} = {};
  private _filters: TaskFilterOptions = {};

  private _subject_tasks_by_ledger:
    {[id: string]: BehaviorSubject<TaskLedgerEntry[]>} = {};
  private _subject_num_tasks_by_ledger:
    {[id: string]: BehaviorSubject<number>} = {};
  private _subject_filter_options: BehaviorSubject<TaskFilterOptions>;

  public constructor(
    private _ledger_svc: LedgerService,
    private _projects_svc: ProjectsService
  ) {
    this._ledger_svc.getLedgersNames().forEach( (name: string) => {
      this._subject_tasks_by_ledger[name] =
        new BehaviorSubject<TaskLedgerEntry[]>([]);
      this._subject_num_tasks_by_ledger[name] =
        new BehaviorSubject<number>(0);
      this._subject_filter_options =
        new BehaviorSubject<TaskFilterOptions>({});

      this._ledger_svc.getLedger(name).subscribe(this._handleLedger.bind(this));
    });
  }

  private _handleLedger(ledger: Ledger): void {
    const ledgername: string = ledger.name;
    const tasks: TaskLedgerEntry[] = Object.values(ledger.tasks);
    this._raw_tasks[ledgername] = tasks;

    this._updateLedgerTasks(ledgername);
  }

  private _updateLedgerTasks(ledgername: string): void {
    const tasks: TaskLedgerEntry[] = this._raw_tasks[ledgername];
    const filtered: TaskLedgerEntry[] = this._filter(tasks);

    this._filtered_tasks_by_ledger[ledgername] = filtered;
    this._num_tasks_by_ledger[ledgername] = filtered.length;
    this._updateObservers(ledgername);
  }

  private _updateFilteredTasks(): void {
    Object.keys(this._raw_tasks).forEach( (ledgername: string) => {
      this._updateLedgerTasks(ledgername);
    });
  }

  private _updateObservers(ledgername: string): void {
    if (!(ledgername in this._subject_tasks_by_ledger)) {
      throw new Error(`unknown ledger ${ledgername}`);
    } else if (!(ledgername in this._subject_num_tasks_by_ledger)) {
      throw new Error(`unknown ledger ${ledgername}`);
    }

    const tasks: TaskLedgerEntry[] = this._filtered_tasks_by_ledger[ledgername];
    const numtasks: number = this._num_tasks_by_ledger[ledgername];
    this._subject_tasks_by_ledger[ledgername].next(tasks);
    this._subject_num_tasks_by_ledger[ledgername].next(numtasks);
  }

  private _hasProjectFilter(): boolean {
    return (!!this._filters.projects && this._filters.projects.length > 0);
  }

  private _hasTitleFilter(): boolean {
    return (!!this._filters.title && this._filters.title !== "");
  }

  private _doFilterProject(task: TaskLedgerEntry): boolean {
    if (!this._hasProjectFilter()) {
      return true;
    }

    if (typeof task.item.project !== "number") {
      throw new Error(`task ${task.id} project type is not a number`);
    }
    const projid: number = task.item.project;
    if (projid === 0) { // no project set on task
      return false;
    }
    const project: ProjectItem = this._projects_svc.getProjectByID(projid);
    if (!project) {
      throw new Error(`unknown project '${projid}'`);
    }
    const projname: string = project.name;
    return (this._filters.projects.includes(projname));
  }

  private _doFilterTitle(task: TaskLedgerEntry): boolean {
    if (!this._hasTitleFilter()) {
      return true;
    }
    return task.item.title.includes(this._filters.title);
  }

  private _filter(tasks: TaskLedgerEntry[]): TaskLedgerEntry[] {

    if (!this._hasProjectFilter() && !this._hasTitleFilter()) {
      return tasks;
    }

    const filtered: TaskLedgerEntry[] = [];
    tasks.forEach( (task: TaskLedgerEntry) => {
      if (this._hasProjectFilter() && !this._doFilterProject(task)) {
        return;
      }
      if (this._hasTitleFilter() && !this._doFilterTitle(task)) {
        return;
      }
      filtered.push(task);
    });
    return filtered;
  }

  public getLedger(ledgername: string): BehaviorSubject<TaskLedgerEntry[]> {
    if (!(ledgername in this._subject_tasks_by_ledger)) {
      throw new Error(`unknown ledger ${ledgername}`);
    }
    return this._subject_tasks_by_ledger[ledgername];
  }

  public getLedgerLength(ledgername: string): BehaviorSubject<number> {
    if (!(ledgername in this._subject_num_tasks_by_ledger)) {
      throw new Error(`unknown ledger ${ledgername}`);
    }
    return this._subject_num_tasks_by_ledger[ledgername];
  }

  public setFilter(filter: TaskFilterOptions): void {
    this._filters = filter;
    this._updateFilteredTasks();
  }

  public getFilter(): BehaviorSubject<TaskFilterOptions> {
    return this._subject_filter_options;
  }
}
