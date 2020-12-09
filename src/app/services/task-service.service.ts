import { Injectable } from '@angular/core';
import { BehaviorSubject, timer } from 'rxjs';
import {
  set as idbset,
  get as idbget
} from 'idb-keyval';


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
  title: string;
  priority: string;
  project: string[];
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
export class TaskService {

  private _ledger_by_name: {[id: string]: Ledger} = {
    backlog: { name: "backlog", label: "Backlog", tasks: {} },
    next: { name: "next", label: "Next", tasks: {} },
    inprogress: { name: "inprogress", label: "In Progress", tasks: {} },
    done: { name: "done", label: "Done", tasks: {} }
  };
  private _ledger_by_taskid: {[id: string]: Ledger} = {};
  private _archived_tasks: {[id: string]: TaskArchiveEntry} = {};

  private _all_tasks: TaskItemMap = {};

  private _ledger_subjects: {[id: string]: BehaviorSubject<Ledger>} = {
    backlog: new BehaviorSubject<Ledger>({} as Ledger),
    next: new BehaviorSubject<Ledger>({} as Ledger),
    inprogress: new BehaviorSubject<Ledger>({} as Ledger),
    done: new BehaviorSubject<Ledger>({} as Ledger)
  };

  private _ledger_size_subjects: {[id: string]: BehaviorSubject<number>} = {
    backlog: new BehaviorSubject<number>(0),
    next: new BehaviorSubject<number>(0),
    inprogress: new BehaviorSubject<number>(0),
    done: new BehaviorSubject<number>(0)
  };

  private _archive_subject: BehaviorSubject<TaskArchiveEntry[]> =
    new BehaviorSubject<TaskArchiveEntry[]>([]);

  private _storage_subject: BehaviorSubject<TasksStorageDataItem|undefined> =
    new BehaviorSubject<TasksStorageDataItem|undefined>(undefined);

  private _all_tasks_subject: BehaviorSubject<TaskItemMap> =
    new BehaviorSubject<TaskItemMap>({});

  public constructor() {
    this._ledger_by_name.backlog.next = this._ledger_by_name.next;
    this._ledger_by_name.next.next = this._ledger_by_name.inprogress;
    this._ledger_by_name.next.previous = this._ledger_by_name.backlog;
    this._ledger_by_name.inprogress.next = this._ledger_by_name.done;
    this._ledger_by_name.inprogress.previous = this._ledger_by_name.backlog;
    // 'done' tasks are not movable.
  }

  public getStorageObserver(): BehaviorSubject<TasksStorageDataItem|undefined> {
    return this._storage_subject;
  }

  public getInitState(): TasksStorageDataItem {
    return this._getCurrentState();
  }

  private _getCurrentState(): TasksStorageDataItem {
    const _tasks: IDBTaskItem[] = [];
    Object.values(this._ledger_by_name).forEach( (ledger: Ledger) => {
      const ledgername: string = ledger.name;
      Object.values(ledger.tasks).forEach( (entry: TaskLedgerEntry) => {
        _tasks.push({
          id: entry.id,
          item: entry.item,
          ledger: ledgername
        });
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
    console.log("tasks-svc > notify new state: ", new_state);
    this._storage_subject.next(new_state);
  }

  public stateLoad(data: TasksStorageDataItem): void {
    this._loadTasks(data.tasks);
    this._loadArchive(data.archives);

    this._loadAllTasks(data);
  }

  private _loadTasks(tasks: IDBTaskItem[]): void {
    const updated_ledgers: {[id: string]: boolean} = {};
    tasks.forEach( (task: IDBTaskItem) => {
      console.log("task > ", task);
      console.assert(task.ledger in this._ledger_by_name);
      if (!(task.ledger in this._ledger_by_name)) {
        return;
      }
      this._convertStrToDate(task.item);
      this._ledger_by_name[task.ledger].tasks[task.id] = {
        id: task.id,
        item: task.item,
        ledger: this._ledger_by_name[task.ledger]
      };
      this._ledger_by_taskid[task.id] = this._ledger_by_name[task.ledger];
      updated_ledgers[task.ledger] = true;
    });

    Object.keys(updated_ledgers).forEach( (ledgername: string) => {
      this._updateLedgerSubjects(this._ledger_by_name[ledgername]);
    });
  }

  private _loadArchive(archive: IDBTaskArchiveType): void {
    this._archived_tasks = {};
    Object.keys(archive).forEach( (key: string) => {
      const entry: TaskArchiveEntry = archive[key];
      this._convertStrToDate(entry.item);
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

  private _updateLedgerSubjects(ledger: Ledger): void {
    this._ledger_subjects[ledger.name].next(ledger);
    this._ledger_size_subjects[ledger.name].next(
      Object.keys(ledger.tasks).length
    );
  }

  private _updateArchiveSubject(): void {
    this._archive_subject.next(
      Object.values(this._archived_tasks).reverse()
    );
  }

  private _updateAllTasksSubject(): void {
    this._all_tasks_subject.next(this._all_tasks);
  }

  private _removeFromLedgers(task: TaskLedgerEntry): void {
    const ledger: Ledger = task.ledger;
    delete ledger.tasks[task.id];
    delete this._ledger_by_taskid[task.id];
  }

  private _remove(task: TaskLedgerEntry): void {
    const ledger: Ledger = task.ledger;
    this._removeFromLedgers(task);
    this._stateSave();
    this._updateLedgerSubjects(ledger);
  }

  // tasks are always added to the backlog.
  public add(task: TaskItem): void {
    // we're making the task's entry id the current time, because right now we
    // can't easily add multiple tasks at the same point in time. And we thus
    // avoid adding a new dependency on a uuid library.
    const taskid: string = new Date().getTime().toString();
    this._ledger_by_name.backlog.tasks[taskid] = {
      id: taskid,
      item: task,
      ledger: this._ledger_by_name.backlog
    };
    this._ledger_by_taskid[taskid] = this._ledger_by_name.backlog;
    this._stateSave();
    this._updateLedgerSubjects(this._ledger_by_name.backlog);

    // adding a new task, add to all tasks as well.
    this._all_tasks[taskid] = task;
    this._updateAllTasksSubject();
  }

  public remove(task: TaskLedgerEntry): void {
    if (typeof task === "string") {
      throw new Error("task can't be of type string!");
    }
    /*
    if (typeof task === "string") {
      if (!(task in this._ledger_by_taskid)) {
        return;  // assume task does not exist.
      }
      const ledger: Ledger = this._ledger_by_taskid[task];
      console.assert(task in ledger.tasks);
      this._remove(ledger.tasks[task]);
    } else {
      this._remove(task);
    }
    */
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
    this._archived_tasks[task.id] = {
      id: task.id,
      item: task.item
    };
    this._removeFromLedgers(task);
    this._stateSave();
    this._updateLedgerSubjects(task.ledger);
    this._updateArchiveSubject();
  }

  private _moveTo(task: TaskLedgerEntry, dest: Ledger|undefined): void {
    if (!dest) {
      return;
    }
    const cur_ledger: Ledger = task.ledger;
    dest.tasks[task.id] = task;
    delete cur_ledger.tasks[task.id];
    task.ledger = dest;
    this._stateSave();
    this._updateLedgerSubjects(cur_ledger);
    this._updateLedgerSubjects(dest);
  }

  public moveNext(task: TaskLedgerEntry): void {
    this._moveTo(task, task.ledger.next);
  }

  public movePrevious(task: TaskLedgerEntry): void {
    this._moveTo(task, task.ledger.previous);
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
    this._moveTo(task, this._ledger_by_name.done);
  }

  public getLedger(name: string): BehaviorSubject<Ledger> {
    console.assert(name in this._ledger_by_name);
    return this._ledger_subjects[name];
  }

  public getLedgerSize(name: string): BehaviorSubject<number> {
    console.assert(name in this._ledger_by_name);
    return this._ledger_size_subjects[name];
  }

  public getRawLedger(name: string): Ledger {
    console.assert(name in this._ledger_by_name);
    return this._ledger_by_name[name];
  }

  public getRawLedgerSize(name: string): number {
    console.assert(name in this._ledger_by_name);
    return Object.keys(this._ledger_by_name[name].tasks).length;
  }

  public getLedgersNames(): string[] {
    return Object.keys(this._ledger_by_name);
  }

  public getLedgerLabel(ledgername: string): string {
    if (!(ledgername in this._ledger_by_name)) {
      return "";
    }
    return this._ledger_by_name[ledgername].label;
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

  public updateTask(task: TaskLedgerEntry, item: TaskItem): void {
    // ensure we are editing the actual task entry. While we expect angular to
    // be smart about it, and that we are receiving the actual task reference
    // via the argument, lets not trust 100% on angular and be paranoid.
    if (!(task.id in this._ledger_by_taskid)) {
      return;
    }
    const ledger: Ledger = this._ledger_by_taskid[task.id];
    const actual_task: TaskLedgerEntry = ledger.tasks[task.id];
    actual_task.item = item;
    this._stateSave();
    this._updateLedgerSubjects(ledger);
  }


  public addTimerEntry(task: TaskLedgerEntry, from: Date, until: Date): void {
    console.log("task-svc > add timer entry on ", task);
    console.log("task-svc > from: ", from, " until: ", until);

    if (!task.item.timer) {
      task.item.timer = { state: "stopped", intervals: [] };
    }
    task.item.timer.intervals.push({
      start: from, end: until
    });
    this._stateSave();
  }

  public timerStart(task: TaskLedgerEntry): void {
    console.log("task-svc > timer start on ", task);
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
      this._moveTo(task, this._ledger_by_name.inprogress);
    } else {
      // _moveTo() will save state
      this._stateSave();
    }
  }

  private _timerPause(task: TaskLedgerEntry): void {
    console.log("task-svc > timer pause on ", task);
    if (!task.item.timer || !this.isTimerRunning(task)) {
      console.error("task-svc > can't pause task that has not been started");
      // can't pause a task that has not been started.
      return;
    }
    const timer_state: TaskTimerState = task.item.timer;
    timer_state.state = "paused";
    const cur_interval: TaskTimerItem = this.getCurrentTimerInterval(task);
    cur_interval.end = new Date();
  }

  public timerPause(task: TaskLedgerEntry): void {
    this._timerPause(task);
    this._stateSave();
  }

  public timerStop(task: TaskLedgerEntry): void {
    console.log("task-svc > timer stop on ", task);
    if (!task.item.timer || this.isTimerStopped(task)) {
      console.error("task-svc > can't stop task that has not been started");
      return;
    }
    const timer_state: TaskTimerState = task.item.timer;
    const cur_interval: TaskTimerItem = this.getCurrentTimerInterval(task);
    timer_state.state = "stopped";
    cur_interval.end = new Date();
    if (task.ledger.name !== "backlog") {
      this._moveTo(task, this._ledger_by_name.backlog);
    } else {
      // _moveTo() will save state
      this._stateSave();
    }
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

  public getCurrentTimerInterval(
    task: TaskLedgerEntry
  ): TaskTimerItem|undefined {
    if (!task.item.timer || task.item.timer.intervals.length === 0) {
      return undefined;
    }
    return task.item.timer.intervals[task.item.timer.intervals.length - 1];
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
    Object.values(this._ledger_by_name.inprogress.tasks).forEach(
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
