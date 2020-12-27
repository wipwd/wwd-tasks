import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { BaseStorageService } from './base-storage-service';
import { LedgerService } from './ledger-service.service';
import { ProjectItem, ProjectsService } from './projects-service.service';


export interface TaskTimerItem {
  start: Date;
  end?: Date;
}

export interface TaskTimerState {
  state: string;
  intervals: TaskTimerItem[];
}

export interface TaskNoteItem {
  date: Date;
  text: string;
}

export interface TaskItem {
  id?: string;
  title: string;
  priority: string;
  ledger?: string;
  project: string[] | string | number;
  url: string;
  date?: Date;
  timer?: TaskTimerState;
  notes?: TaskNoteItem[];
  done?: Date;
}

export interface TaskLedgerEntry {
  id: string;
  item: TaskItem;
  ledger: Ledger;
}

export interface TaskArchiveEntry {
  id: string;
  item: TaskItem;
}

export interface Ledger {
  previous?: Ledger;
  next?: Ledger;
  name: string;
  label: string;
  icon?: string;
  tasks: TaskLedgerMap;
}

export interface IDBTaskItem {
  id: string;
  item: TaskItem;
  ledger: string;
}

export declare type IDBTaskArchiveType = {[id: string]: TaskArchiveEntry};

export declare type TaskLedgerMap = {[id: string]: TaskLedgerEntry};

export interface TasksStorageDataItem {
  tasks: IDBTaskItem[];
  archives: IDBTaskArchiveType;
}

export declare type TaskItemMap = {[id: string]: TaskItem};

@Injectable({
  providedIn: 'root'
})
export class TaskService
  extends BaseStorageService<TasksStorageDataItem>{

  private _archived_tasks: {[id: string]: TaskArchiveEntry} = {};
  private _tasks: TaskLedgerMap = {};
  private _all_tasks: TaskItemMap = {};

  private _archive_subject: BehaviorSubject<TaskArchiveEntry[]> =
    new BehaviorSubject<TaskArchiveEntry[]>([]);

  private _storage_subject: BehaviorSubject<TasksStorageDataItem|undefined> =
    new BehaviorSubject<TasksStorageDataItem|undefined>(undefined);

  private _all_tasks_subject: BehaviorSubject<TaskItemMap> =
    new BehaviorSubject<TaskItemMap>({});

  private _tasks_subject: BehaviorSubject<TaskLedgerEntry[]> =
    new BehaviorSubject<TaskLedgerEntry[]>([]);


  public constructor(
    private _ledger_svc: LedgerService
  ) {
    super();
  }

  public getStorageObserver(): BehaviorSubject<TasksStorageDataItem|undefined> {
    return this._storage_subject;
  }

  public getInitState(): TasksStorageDataItem {
    return this._getCurrentState();
  }

  private _getCurrentState(): TasksStorageDataItem {
    const _tasks: IDBTaskItem[] = [];

    Object.values(this._tasks).forEach( (task: TaskLedgerEntry) => {
      _tasks.push({
        id: task.id,
        item: task.item,
        ledger: task.ledger.name
      });
    });

    const new_state: TasksStorageDataItem = {
      archives: this._archived_tasks,
      tasks: _tasks
    };
    return new_state;
  }

  private _stateSave(): void {
    const new_state: TasksStorageDataItem = this._getCurrentState();
    this._storage_subject.next(new_state);
  }

  public stateLoad(data: TasksStorageDataItem): void {
    this._loadTasks(data.tasks);
    this._loadArchive(data.archives);

    this._loadAllTasks(data);
  }

  private _loadTasks(tasks: IDBTaskItem[]): void {
    const ledgertasks: TaskLedgerMap = {};

    tasks.forEach( (task: IDBTaskItem) => {
      this._convertStrToDate(task.item);
      this._convertProjectFormat(task.item);
      this._convertToTaskWithID(task.id, task.item);
      this._convertToTaskWithLedger(task.ledger, task.item);

      const entry = this._ledger_svc.addTask(task.item);
      ledgertasks[entry.id] = entry;
    });

    this._tasks = ledgertasks;
    this._updateTasksSubject();
  }

  private _loadArchive(archive: IDBTaskArchiveType): void {
    this._archived_tasks = {};
    Object.keys(archive).forEach( (key: string) => {
      const entry: TaskArchiveEntry = archive[key];
      this._convertStrToDate(entry.item);
      this._convertProjectFormat(entry.item);
      this._convertToTaskWithID(entry.id, entry.item);
      this._archived_tasks[key] = entry;
    });
    this._updateArchiveSubject();
  }

  private _loadAllTasks(data: TasksStorageDataItem): void {
    const tasks_data: IDBTaskItem[] = data.tasks;
    const archives_data: IDBTaskArchiveType = data.archives;

    this._all_tasks = {};
    tasks_data.forEach( (task_item: IDBTaskItem) => {
      this._all_tasks[task_item.id] = task_item.item;
    });

    Object.keys(archives_data).forEach( (task_id: string) => {
      this._all_tasks[task_id] = archives_data[task_id].item;
    });

    const num_tasks: number = Object.keys(this._all_tasks).length;
    console.log(`loaded ${num_tasks} tasks`);
    this._updateAllTasksSubject();
  }

  private _updateArchiveSubject(): void {
    this._archive_subject.next(
      Object.values(this._archived_tasks).reverse()
    );
  }

  private _updateAllTasksSubject(): void {
    this._all_tasks_subject.next(this._all_tasks);
  }

  private _updateTasksSubject(): void {
    this._tasks_subject.next(Object.values(this._tasks));
  }

  private _remove(task: TaskLedgerEntry): void {
    const ledger: Ledger = task.ledger;
    this._ledger_svc.removeTask(task);
    this._stateSave();
  }

  // tasks are always added to the backlog.
  public add(task: TaskItem): void {
    // we're making the task's entry id the current time, because right now we
    // can't easily add multiple tasks at the same point in time. And we thus
    // avoid adding a new dependency on a uuid library.
    const taskid: string = new Date().getTime().toString();
    task.id = taskid;
    const entry = this._ledger_svc.addToBacklog(task);
    this._tasks[taskid] = entry;
    this._stateSave();

    // adding a new task, add to all tasks as well.
    this._all_tasks[taskid] = task;
    this._updateAllTasksSubject();
  }

  public remove(task: TaskLedgerEntry): void {
    if (typeof task === "string") {
      throw new Error("task can't be of type string!");
    }
    this._remove(task);
    // we are actively removing a task through this path, so remove it from all
    // tasks too.
    delete this._all_tasks[task.id];
    this._updateAllTasksSubject();
  }

  public archive(task: TaskLedgerEntry): void {
    if (task.id in this._archived_tasks) {
      return;
    }
    task.item.ledger = undefined;
    this._archived_tasks[task.id] = {
      id: task.id,
      item: task.item
    };
    this._ledger_svc.removeTask(task);
    this._stateSave();
    this._updateArchiveSubject();
  }

  public moveNext(task: TaskLedgerEntry): void {
    this._ledger_svc.moveNext(task);
    this._stateSave();
  }

  public movePrevious(task: TaskLedgerEntry): void {
    this._ledger_svc.movePrev(task);
    this._stateSave();
  }

  public canMarkDone(task: TaskLedgerEntry): boolean {
    return !this.isDone(task);
  }

  public isDone(task: TaskLedgerEntry): boolean {
    return (task.ledger.name === "done");
  }

  public markDone(task: TaskLedgerEntry): void {
    if (!this.canMarkDone(task)) {
      return;
    }
    console.assert(!task.item.done);
    task.item.done = new Date();
    if (this.isTimerRunning(task)) {
      this.timerStop(task);
    }
    this._ledger_svc.moveToDone(task);
    this._stateSave();
  }

  public getLedger(name: string): BehaviorSubject<Ledger> {
    return this._ledger_svc.getLedger(name);
  }

  public getRawLedger(name: string): Ledger {
    return this._ledger_svc.getRawLedger(name);
  }

  public getRawLedgerSize(name: string): number {
    return Object.keys(this.getRawLedger(name).tasks).length;
  }

  public getLedgersNames(): string[] {
    return this._ledger_svc.getLedgersNames();
  }

  public getLedgerLabel(ledgername: string): string {
    const ledger: Ledger = this.getRawLedger(ledgername);
    return ledger.label;
  }

  public getLedgerIcon(ledgername: string): string {
    const ledger: Ledger = this.getRawLedger(ledgername);
    return ledger.icon;
  }

  public getArchive(): BehaviorSubject<TaskArchiveEntry[]> {
    return this._archive_subject;
  }

  public getAllTasksRaw(): TaskItemMap {
    return this._all_tasks;
  }

  public getAllTasks(): BehaviorSubject<TaskItemMap> {
    return this._all_tasks_subject;
  }

  public getTasks(): BehaviorSubject<TaskLedgerEntry[]> {
    return this._tasks_subject;
  }

  public updateTask(task: TaskLedgerEntry, item: TaskItem): void {
    const actual_task: TaskLedgerEntry = this._tasks[item.id];
    actual_task.item = item;
    this._stateSave();
  }

  public updateTaskInBulk(tasklst: TaskItem[]): void {
    if (tasklst.length === 0) {
      return;
    }

    const updated_ledgers: Ledger[] = [];
    tasklst.forEach( (task: TaskItem) => {
      if (!("id" in task) || !task.id || task.id === "") {
        return;
      }

      const actual_task: TaskLedgerEntry = this._tasks[task.id];
      actual_task.item = task;
    });

    this._stateSave();
  }


  public addTimerEntry(task: TaskLedgerEntry, from: Date, until: Date): void {
    if (!task.item.timer) {
      task.item.timer = { state: "stopped", intervals: [] };
    }
    task.item.timer.intervals.push({
      start: from, end: until
    });
    this._stateSave();
  }

  public timerStart(task: TaskLedgerEntry): void {
    if (!task.item.timer) {
      task.item.timer = { state: "stopped", intervals: [] };
    }
    const timer_state: TaskTimerState = task.item.timer;
    if (timer_state.state !== "stopped" && timer_state.state !== "paused") {
      console.error(
        "unable to start time for task because it's not stopped nor paused",
        task);
      return;
    }

    if (this.hasRunningTimerTask()) {
      const cur_running: TaskLedgerEntry = this.getRunningTimerTask();
      this._timerPause(cur_running);
    }

    timer_state.state = "running";
    timer_state.intervals.push({start: new Date(), end: undefined});
    if (task.ledger.name !== "inprogress") {
      // move task to in-progress.
      this._ledger_svc.moveToInProgress(task);
    }
    this._stateSave();
  }

  private _timerPause(task: TaskLedgerEntry): void {
    if (!task.item.timer || !this.isTimerRunning(task)) {
      console.error("task-svc > can't pause task that has not been started");
      // can't pause a task that has not been started.
      return;
    }
    const timer_state: TaskTimerState = task.item.timer;
    timer_state.state = "paused";
    const cur_interval: TaskTimerItem[] = this.getCurrentTimerIntervals(task);
    cur_interval.forEach( (entry: TaskTimerItem) => {
      entry.end = new Date();
    });
  }

  public timerPause(task: TaskLedgerEntry): void {
    this._timerPause(task);
    this._stateSave();
  }

  public timerStop(task: TaskLedgerEntry): void {
    if (!task.item.timer || this.isTimerStopped(task)) {
      console.error("task-svc > can't stop task that has not been started");
      return;
    }
    const timer_state: TaskTimerState = task.item.timer;
    const cur_interval: TaskTimerItem[] = this.getCurrentTimerIntervals(task);
    timer_state.state = "stopped";
    cur_interval.forEach( (entry: TaskTimerItem) => {
      entry.end = new Date();
    });
    if (task.ledger.name !== "backlog") {
      this._ledger_svc.moveToBacklog(task);
    }
    this._stateSave();
  }

  public isTimerRunning(task: TaskLedgerEntry): boolean {
    return !!task.item.timer && task.item.timer.state === "running";
  }

  public isTimerPaused(task: TaskLedgerEntry): boolean {
    return !!task.item.timer && task.item.timer.state === "paused";
  }

  public isTimerStopped(task: TaskLedgerEntry): boolean {
    return !!task.item.timer && task.item.timer.state === "stopped";
  }

  public getCurrentTimerIntervals(
    task: TaskLedgerEntry
  ): TaskTimerItem[]|undefined {
    if (!task.item.timer || task.item.timer.intervals.length === 0) {
      return undefined;
    }

    const current: TaskTimerItem[] = [];
    task.item.timer.intervals.forEach( (entry: TaskTimerItem) => {
      if (!!entry.start && !entry.end) {
        current.push(entry);
      }
    });

    return current;
  }

  public getTimerTotal(task: TaskLedgerEntry): number {
    if (!task.item.timer) {
      return -1;
    }
    let total_milisec: number = 0;
    task.item.timer.intervals.forEach( (interval: TaskTimerItem) => {
      const end: Date = (interval.end ? interval.end : new Date());
      const diff: number = end.getTime() - interval.start.getTime();
      total_milisec += diff;
    });
    return total_milisec;
  }

  public getRunningTimerTask(): TaskLedgerEntry|undefined {
    let running_task: TaskLedgerEntry|undefined = undefined;
    const ledger: Ledger = this._ledger_svc.getRawLedger("inprogress");
    Object.values(ledger.tasks).forEach(
      (task: TaskLedgerEntry) => {
        if (!task.item.timer || task.item.timer.state !== "running") {
          return;
        }
        console.assert(!running_task);
        running_task = task;
      }
    );
    return running_task;
  }

  public hasRunningTimerTask(): boolean {
    return !!this.getRunningTimerTask();
  }

  public noteAdd(task: TaskLedgerEntry, note: TaskNoteItem): void {
    if (!task.item.notes) {
      task.item.notes = [];
    }
    task.item.notes.push(note);
    this._stateSave();
  }

  public getNoteSize(task: TaskLedgerEntry): number {
    if (!task.item.notes) {
      return 0;
    }
    return task.item.notes.length;
  }

  public hasNotes(task: TaskLedgerEntry): boolean {
    return this.getNoteSize(task) > 0;
  }

  private _convertStrToDate(task: TaskItem): void {
    if (typeof task.date === "string") {
      const date: Date = new Date(task.date);
      task.date = date;
    }
    if (!!task.done && typeof task.done === "string") {
      const date: Date = new Date(task.done);
      task.done = date;
    }
    if (!!task.timer) {
      task.timer.intervals.forEach( (item: TaskTimerItem) => {
        if (!!item.start && typeof item.start === "string") {
          item.start = new Date(item.start);
        }
        if (!!item.end && typeof item.end === "string") {
          item.end = new Date(item.end);
        }
      });
    }
  }

  private _convertProjectFormat(task: TaskItem): void {
    if (typeof task.project === "string" || typeof task.project === "number") {
      return; // nothing to do.
    } else if (!Array.isArray(task.project)) {
      throw new Error("task projects is not an array nor a string");
    }
    const project: string = (
      (task.project as string[]).length === 0 ? "" : task.project[0]
    );
    task.project = project;
  }

  private _convertTaskProjectToID(
    taskitem: TaskItem,
    projects_svc: ProjectsService
  ): void {

    if (typeof taskitem.project === "number") {
      return;
    } else if (typeof taskitem.project !== "string") {
      throw new Error("task project is not a number nor a string");
    }
    const pname: string = taskitem.project;
    if (!pname || pname === "") {
      taskitem.project = 0;
      return;
    }
    const project: ProjectItem = projects_svc.getProjectByName(pname);
    let pid: number = 0;
    if (!project) {
      console.error(`projects-svc > can't find project ${pname}'s id`);
    } else {
      pid = project.id;
    }
    taskitem.project = pid;
  }

  private _convertToTaskWithID(taskid: string, task: TaskItem): void {
    if (task.id !== undefined && task.id !== "") {
      return;
    }
    task.id = taskid;
  }

  private _convertToTaskWithLedger(ledgername: string, task: TaskItem): void {
    if ((!!task.ledger && task.ledger !== "") ||
        (!ledgername || ledgername === "")) {
      return;
    }
    task.ledger = ledgername;
  }

  public convertProjectsToIDs(projects_svc: ProjectsService): void {

    const data: TasksStorageDataItem = this._getCurrentState();
    data.tasks.forEach( (taskitem: IDBTaskItem) => {
      this._convertTaskProjectToID(taskitem.item, projects_svc);
    });

    Object.values(data.archives).forEach( (entry: TaskArchiveEntry) => {
      this._convertTaskProjectToID(entry.item, projects_svc);
    });

    this._stateSave();
  }

}

export function getTimeDiffStr(
  diff: number, with_secs: boolean = false
): string {

  const month_secs = 2.628e+6; // months in seconds
  const week_secs = 604800; // weeks in seconds
  const day_secs = 86400; // 24h in seconds
  const hour_secs = 3600;
  const min_secs = 60;

  const months = Math.floor(diff / month_secs);
  diff -= months * month_secs;

  const weeks = Math.floor(diff / week_secs);
  diff -= weeks * week_secs;

  const days = Math.floor(diff / day_secs);
  diff -= days * day_secs;

  const hours = Math.floor(diff / hour_secs);
  diff -= hours * hour_secs;

  const mins = Math.floor(diff / min_secs);
  diff -= mins * min_secs;


  const time_lst = [];
  if (months > 0) {
      time_lst.push(`${months}mo`);
  }

  if (weeks > 0) {
      time_lst.push(`${weeks}wk`);
  }

  if (days > 0) {
      time_lst.push(`${days}d`);
  }

  if (hours > 0) {
      time_lst.push(`${hours}h`);
  }

  if (mins > 0) {
      time_lst.push(`${mins}m`);
  }

  if (time_lst.length === 0 && !with_secs) {
      if (diff > 0 && diff < 30) {
        return "less than a minute";
      } else if (diff > 0 && diff >= 30) {
        return "about a minute";
      } else {
        return "just a second";
      }
  } else if (with_secs) {
    time_lst.push(`${diff}s`);
  }
  return `${time_lst.join(', ')}`;
}
