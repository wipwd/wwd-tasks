import { DataSource } from '@angular/cdk/collections';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { map } from 'rxjs/operators';
import {
  Observable, merge, BehaviorSubject, Subscription
} from 'rxjs';
import { Ledger, TaskItem, TaskLedgerEntry, TaskService } from '../../../services/task-service.service';

/**
 * Data source for the TaskLedgerList view. This class should
 * encapsulate all logic for fetching and manipulating the displayed data
 * (including sorting, pagination, and filtering).
 */
export class TaskLedgerListDataSource extends DataSource<TaskLedgerEntry> {

  public paginator: MatPaginator;
  public sort: MatSort;

  private _tasks: TaskLedgerEntry[] = [];
  private _tasks_subject: BehaviorSubject<TaskLedgerEntry[]> =
    new BehaviorSubject<TaskLedgerEntry[]>([]);
  private _ledger_subscription: Subscription;

  constructor(
    private _tasks_svc: TaskService,
    private _ledgername: string,
    private _ledgerprio: string
  ) {
    super();
  }

  /**
   * Connect this data source to the table. The table will only update when
   * the returned stream emits new items.
   * @returns A stream of the items to be rendered.
   */
  public connect(): Observable<TaskLedgerEntry[]> {

    this._ledger_subscription =
      this._tasks_svc.getLedger(this._ledgername).subscribe({
        next: (ledger: Ledger) => {
          if (!ledger || Object.keys(ledger).length === 0) {
            return;
          }
          this._updateLedger(ledger);
        }
      }
    );

    // Combine everything that affects the rendered data into one update
    // stream for the data-table to consume.
    const dataMutations = [
      this._tasks_subject,
      this.paginator.page,
      this.sort.sortChange
    ];

    return merge(...dataMutations).pipe(map(() => {
      return this._getPagedData(this._getSortedData([...this._tasks]));
    }));
  }

  /**
   * Called when the table is being destroyed. Use this function, to clean up
   * any open connections or free any held resources that were set up during
   * connect.
   */
  public disconnect(): void {
    this._ledger_subscription.unsubscribe();
  }

  /**
   * Paginate the data (client-side). If you're using server-side pagination,
   * this would be replaced by requesting the appropriate data from the server.
   */
  private _getPagedData(data: TaskLedgerEntry[]): TaskLedgerEntry[] {
    const startIndex = this.paginator.pageIndex * this.paginator.pageSize;
    return data.splice(startIndex, this.paginator.pageSize);
  }

  /**
   * Sort the data (client-side). If you're using server-side sorting,
   * this would be replaced by requesting the appropriate data from the server.
   */
  private _getSortedData(data: TaskLedgerEntry[]): TaskLedgerEntry[] {
    if (!this.sort.active || this.sort.direction === '') {
      return data;
    }

    return data.sort((a, b) => {
      const isAsc = this.sort.direction === 'asc';
      switch (this.sort.active) {
        case 'title': return compare(a.item.title, b.item.title, isAsc);
        default: return 0;
      }
    });
  }

  private _updateLedger(ledger: Ledger): void {
    const new_entries: TaskLedgerEntry[] = [];
    Object.values(ledger.tasks).forEach( (entry: TaskLedgerEntry) => {
      if (entry.item.priority === this._ledgerprio) {
        new_entries.push(entry);
      }
    });
    this._tasks = [...new_entries];
    this._tasks_subject.next(this._tasks);
  }

  public getLength(): number {
    return this._tasks.length;
  }
}

function compare(
  a: string | number,
  b: string | number,
  isAsc: boolean
): number {
  return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
}
