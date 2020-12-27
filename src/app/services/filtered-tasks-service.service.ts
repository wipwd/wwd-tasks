import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { LedgerService } from './ledger-service.service';
import { Ledger, TaskLedgerEntry } from './task-service.service';


export interface FilterOptions {
  project?: string[];
  title?: string;
}


@Injectable({
  providedIn: 'root'
})
export class FilteredTasksService {

  private _filtered_tasks_by_ledger: {[id: string]: TaskLedgerEntry[]} = {};
  private _num_tasks_by_ledger: {[id: string]: number} = {};
  private _filters: FilterOptions = {};

  private _subject_tasks_by_ledger: 
    {[id: string]: BehaviorSubject<TaskLedgerEntry[]>} = {};
  private _subject_num_tasks_by_ledger:
    {[id: string]: BehaviorSubject<number>} = {};
  private _subject_filter_options: BehaviorSubject<FilterOptions>;

  public constructor(
    private _ledger_svc: LedgerService
  ) {
    this._ledger_svc.getLedgersNames().forEach( (name: string) => {
      this._subject_tasks_by_ledger[name] =
        new BehaviorSubject<TaskLedgerEntry[]>([]);
      this._subject_num_tasks_by_ledger[name] =
        new BehaviorSubject<number>(0);
      this._subject_filter_options =
        new BehaviorSubject<FilterOptions>({});

      this._ledger_svc.getLedger(name).subscribe(this._handleLedger.bind(this));
    });
  }


  private _handleLedger(ledger: Ledger): void {
    console.log("filtered-tasks-svc > ledger: ", ledger);
    const ledgername: string = ledger.name;
    const tasks: TaskLedgerEntry[] = Object.values(ledger.tasks);
    const numtasks: number = tasks.length;

    this._filtered_tasks_by_ledger[ledgername] = tasks;
    this._num_tasks_by_ledger[ledgername] = numtasks;

    this._updateObservers(ledgername);
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

  public setFilter(filter: FilterOptions): void {

  }

  public getFilter(): BehaviorSubject<FilterOptions> {
    return this._subject_filter_options;
  }
}
