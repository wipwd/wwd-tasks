import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Ledger, TaskItem, TaskLedgerEntry } from './task-service.service';


const ledger_backlog: Ledger = {
  name: "backlog", label: "Backlog", icon: "assignment", tasks: {}
};
const ledger_next: Ledger = {
  name: "next", label: "Next", icon: "label_important", tasks: {}
};
const ledger_inprogress: Ledger = {
  name: "inprogress", label: "In Progress", icon: "sync", tasks: {}
};
const ledger_done: Ledger = {
  name: "done", label: "Done", icon: "done_alt", tasks: {}
};

export declare type LedgerMap = {[id: string]: Ledger};


@Injectable({
  providedIn: 'root'
})
export class LedgerService {

  private _ledgers: LedgerMap = {};
  private _ledgers_subjects: {[id: string]: BehaviorSubject<Ledger>} = {};


  public constructor() {

    ledger_backlog.next = ledger_next;
    ledger_next.previous = ledger_backlog;
    ledger_next.next = ledger_inprogress;
    ledger_inprogress.previous = ledger_next;
    ledger_inprogress.next = ledger_done;

    this._ledgers[ledger_backlog.name] = ledger_backlog;
    this._ledgers[ledger_next.name] = ledger_next;
    this._ledgers[ledger_inprogress.name] = ledger_inprogress;
    this._ledgers[ledger_done.name] = ledger_done;

    Object.values(this._ledgers).forEach( (ledger: Ledger) => {
      this._ledgers_subjects[ledger.name] =
        new BehaviorSubject<Ledger>(ledger);
    });
  }

  private _updatedLedger(ledgername: string): void {
    if (!ledgername || ledgername === "") {
      throw new Error("undefined ledgername");
    } else if (!(ledgername in this._ledgers_subjects)) {
      throw new Error(`unable to find ledger ${ledgername} subject`);
    }
    this._ledgers_subjects[ledgername].next(this._ledgers[ledgername]);
  }

  public addTask(task: TaskItem): TaskLedgerEntry {
    const _ledger: Ledger = this._ledgers[task.ledger];
    if (!_ledger) {
      throw new Error(`undefined ledger for task ${task.id}`);
    } else if (task.id in _ledger.tasks) {
      return;
    }

    const entry = {
      id: task.id,
      item: task,
      ledger: _ledger,
      last_modified: new Date().getTime()
    };
    _ledger.tasks[task.id] = entry;
    this._updatedLedger(_ledger.name);
    return entry;
  }

  public addToBacklog(task: TaskItem): TaskLedgerEntry {
    task.ledger = ledger_backlog.name;
    return this.addTask(task);
  }

  public removeTask(task: TaskLedgerEntry): void {
    const _ledger: Ledger = this._ledgers[task.item.ledger];
    if (!_ledger) {
      throw new Error(`undefined ledger for task ${task.item.id}`);
    } else if (_ledger.name !== task.ledger.name) {
      throw new Error(`ledger mismatch for task ${task.item.id}`);
    } else if (!(task.item.id in _ledger.tasks)) {
      throw new Error(`unable to find task ${task.item.id} in ledger`);
    }
    task.item.ledger = undefined;
    task.ledger = undefined;
    delete _ledger.tasks[task.item.id];
    this._updatedLedger(_ledger.name);
  }

  public moveTask(task: TaskLedgerEntry, dest: Ledger): void {
    const _ledger: Ledger = this._ledgers[task.item.ledger];
    if (!_ledger) {
      throw new Error(`undefined ledger for task ${task.item.id}`);
    } else if (_ledger.name !== task.ledger.name) {
      throw new Error(`ledger mismatch for task ${task.item.id}`);
    } else if (!(task.item.id in _ledger.tasks)) {
      throw new Error(`unable to find task ${task.item.id} in ledger`);
    } else if (!dest) {
      throw new Error("undefined destination ledger");
    }
    if (_ledger.name === dest.name) {
      // nothing dest do.
      return;
    }
    task.ledger = dest;
    task.item.ledger = dest.name;
    dest.tasks[task.item.id] = task;
    delete _ledger.tasks[task.item.id];
  }

  public moveNext(task: TaskLedgerEntry): void {
    this.moveTask(task, task.ledger.next);
  }

  public movePrev(task: TaskLedgerEntry): void {
    this.moveTask(task, task.ledger.previous);
  }

  public moveToBacklog(task: TaskLedgerEntry): void {
    this.moveTask(task, ledger_backlog);
  }

  public moveToInProgress(task: TaskLedgerEntry): void {
    this.moveTask(task, ledger_inprogress);
  }

  public moveToDone(task: TaskLedgerEntry): void {
    this.moveTask(task, ledger_done);
  }

  public getLedger(name: string): BehaviorSubject<Ledger> {
    if (!(name in this._ledgers_subjects)) {
      throw new Error(`unable to find ledger ${name}`);
    }
    return this._ledgers_subjects[name];
  }

  public getRawLedger(name: string): Ledger {
    if (!(name in this._ledgers)) {
      throw new Error(`unable to find ledger '${name}'`);
    }
    return this._ledgers[name];
  }

  public getLedgersNames(): string[] {
    return Object.keys(this._ledgers);
  }

}
