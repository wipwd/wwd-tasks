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

export interface TaskItem {
  title: string;
  priority: string;
  project: string[];
  url: string;
  date?: Date;
  timer?: TaskTimerState;
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

interface IDBTaskItem {
  id: string;
  item: TaskItem;
  ledger: string;
}

declare type IDBTaskArchiveType = {[id: string]: TaskArchiveEntry};

export declare type TaskLedgerMap = {[id: string]: TaskLedgerEntry};


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

  public constructor() {
    this._ledger_by_name.backlog.next = this._ledger_by_name.next;
    this._ledger_by_name.next.next = this._ledger_by_name.inprogress;
    this._ledger_by_name.next.previous = this._ledger_by_name.backlog;
    this._ledger_by_name.inprogress.next = this._ledger_by_name.done;
    this._ledger_by_name.inprogress.previous = this._ledger_by_name.backlog;
    // 'done' tasks are not movable.
    this._stateLoad();
  }

  private _stateSave(): void {
    const tasks: IDBTaskItem[] = [];
    Object.values(this._ledger_by_name).forEach( (ledger: Ledger) => {
      const ledgername: string = ledger.name;
      Object.values(ledger.tasks).forEach( (entry: TaskLedgerEntry) => {
        tasks.push({
          id: entry.id,
          item: entry.item,
          ledger: ledgername
        });
      });
    });
    // const tasks_json: string = JSON.stringify(tasks);
    idbset("_wwd_tasks", tasks);
    this._archiveStateSave();
  }

  private _archiveStateSave(): void {
    idbset("_wwdtasks_archive", this._archived_tasks);
  }

  private _stateLoad(): void {
    idbget("_wwd_tasks").then( (value: IDBTaskItem[]|undefined) => {
      if (!value) {
        return;
      }
      this._loadTasks(value);
    });
    idbget("_wwdtasks_archive").then(
      (value: IDBTaskArchiveType|undefined) => {
        if (!value) {
          return;
        }
        this._loadArchive(value);
      }
    );
  }

  private _loadTasks(tasks: IDBTaskItem[]): void {
    const updated_ledgers: {[id: string]: boolean} = {};
    tasks.forEach( (task: IDBTaskItem) => {
      console.log("task > ", task);
      console.assert(task.ledger in this._ledger_by_name);
      if (!(task.ledger in this._ledger_by_name)) {
        return;
      }
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
      this._archived_tasks[key] = archive[key];
    });
    this._updateArchiveSubject();
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
  }

  public remove(task: string|TaskLedgerEntry): void {
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

    timer_state.state = "running";
    timer_state.intervals.push({start: new Date(), end: undefined});
    if (task.ledger.name !== "inprogress") {
      // move task to in-progress.
      this._moveTo(task, this._ledger_by_name.inprogress);
    }
    this._stateSave();
  }

  public timerPause(task: TaskLedgerEntry): void {
    if (!task.item.timer || !this.isTimerRunning(task)) {
      // can't pause a task that has not been started.
      return;
    }
    const timer_state: TaskTimerState = task.item.timer;
    timer_state.state = "paused";
    const cur_interval: TaskTimerItem = this.getCurrentTimerInterval(task);
    cur_interval.end = new Date();
    this._stateSave();
  }

  public timerStop(task: TaskLedgerEntry): void {
    if (!task.item.timer || this.isTimerStopped(task)) {
      return;
    }
    const timer_state: TaskTimerState = task.item.timer;
    const cur_interval: TaskTimerItem = this.getCurrentTimerInterval(task);
    timer_state.state = "stopped";
    cur_interval.end = new Date();
    if (task.ledger.name !== "backlog") {
      this._moveTo(task, this._ledger_by_name.backlog);
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
}
