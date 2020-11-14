import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import {
  set as idbset,
  get as idbget
} from 'idb-keyval';


export interface TaskItem {
  title: string;
  priority: string;
  project: string[];
  url: string;
}

export interface TaskLedgerEntry {
  id: string;
  item: TaskItem;
  ledger: Ledger;
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
  }

  private _stateLoad(): void {
    idbget("_wwd_tasks").then( (value: IDBTaskItem[]|undefined) => {
      if (!value) {
        return;
      }
      this._loadTasks(value);
    });
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

  private _updateLedgerSubjects(ledger: Ledger): void {
    this._ledger_subjects[ledger.name].next(ledger);
    this._ledger_size_subjects[ledger.name].next(
      Object.keys(ledger.tasks).length
    );
  }

  private _remove(task: TaskLedgerEntry): void {
    const ledger: Ledger = task.ledger;
    delete ledger.tasks[task.id];
    delete this._ledger_by_taskid[task.id];
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
}
