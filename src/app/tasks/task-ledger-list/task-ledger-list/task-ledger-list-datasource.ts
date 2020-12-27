import { DataSource } from '@angular/cdk/collections';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { map } from 'rxjs/operators';
import {
  Observable, merge, BehaviorSubject, Subscription
} from 'rxjs';
import { TaskItem, TaskLedgerEntry, TaskService } from '../../../services/task-service.service';
import { TaskSortItem } from '../../task-organizer/task-list-options';
import { ProjectsService } from '../../../services/projects-service.service';
import { FilteredTasksService } from '../../../services/filtered-tasks-service.service';

/**
 * Data source for the TaskLedgerList view. This class should
 * encapsulate all logic for fetching and manipulating the displayed data
 * (including sorting, pagination, and filtering).
 */
export class TaskLedgerListDataSource extends DataSource<TaskLedgerEntry> {

  public paginator: MatPaginator;
  public sort: MatSort;

  public tasks: TaskLedgerEntry[] = [];

  private _tasks_subject: BehaviorSubject<TaskLedgerEntry[]> =
    new BehaviorSubject<TaskLedgerEntry[]>([]);

  private _sorting: TaskSortItem = {
    sortby: "creation", ascending: false
  };

  constructor(
    private _filtered_tasks_svc: FilteredTasksService,
    private _tasks_svc: TaskService,
    private _projects_svc: ProjectsService,
    private _ledgername: string,
    private _ledgerprio: string,
    private _sorting_subject: BehaviorSubject<TaskSortItem>
  ) {
    super();

    this._sorting_subject.subscribe({
      next: (sort: TaskSortItem) => {
        console.log("updated sort: ", sort);
        this._sorting = sort;
      }
    });
  }

  /**
   * Connect this data source to the table. The table will only update when
   * the returned stream emits new items.
   * @returns A stream of the items to be rendered.
   */
  public connect(): Observable<TaskLedgerEntry[]> {

    this._filtered_tasks_svc.getLedger(this._ledgername).subscribe({
      next: (filtered_tasks: TaskLedgerEntry[]) => {
        const wanted_tasks: TaskLedgerEntry[] = [];
        filtered_tasks.forEach( (task: TaskLedgerEntry) => {
          if (task.item.priority === this._ledgerprio) {
            wanted_tasks.push(task);
          }
        });
        this._tasks_subject.next(wanted_tasks);
      }
    });

    this._tasks_subject.subscribe({
      next: (filtered_tasks: TaskLedgerEntry[]) => {
        this.tasks = [...filtered_tasks];
      }
    });

    // Combine everything that affects the rendered data into one update
    // stream for the data-table to consume.
    const dataMutations = [
      this._tasks_subject,
      this.paginator.page,
      this._sorting_subject
    ];

    return merge(...dataMutations).pipe(map(() => {
      return this._getPagedData(this._getSortedData([...this.tasks]));
    }));
  }

  /**
   * Called when the table is being destroyed. Use this function, to clean up
   * any open connections or free any held resources that were set up during
   * connect.
   */
  public disconnect(): void { }

  /**
   * Paginate the data (client-side). If you're using server-side pagination,
   * this would be replaced by requesting the appropriate data from the server.
   */
  private _getPagedData(data: TaskLedgerEntry[]): TaskLedgerEntry[] {
    const startIndex = this.paginator.pageIndex * this.paginator.pageSize;
    return data.splice(startIndex, this.paginator.pageSize);
  }

  private _getSortedData(data: TaskLedgerEntry[]): TaskLedgerEntry[] {
    console.log("sort data");
    return data.sort((a, b) => {
      const isAsc = this._sorting.ascending;
      switch (this._sorting.sortby) {
        case "title": return compare(a.item.title, b.item.title, !isAsc);
        case "creation": return compare(a.item.date, b.item.date, !isAsc);
        case "duration": return this._compareDurations(a, b, isAsc);
        case "project": return this._compareProject(a.item, b.item, isAsc);
      }
    });
  }

  private _compareDurations(
    a: TaskLedgerEntry,
    b: TaskLedgerEntry,
    isAsc: boolean
  ): number {
    const duration_a = (!!a.item.timer ? this._tasks_svc.getTimerTotal(a) : 0);
    const duration_b = (!!b.item.timer ? this._tasks_svc.getTimerTotal(b) : 0);
    return compare(duration_a, duration_b, isAsc);
  }

  private _compareProject(a: TaskItem, b: TaskItem, isAsc: boolean): number {
    const proj_a: string|number = (
      (typeof a.project === "string" || typeof a.project === "number") ?
        a.project : a.project[0]
    );
    const proj_b: string|number = (
      (typeof b.project === "string" || typeof b.project === "number") ?
        b.project : b.project[0]
    );
    return compare(proj_a, proj_b, isAsc);
  }
}

function compare(
  a: string | number | Date,
  b: string | number | Date,
  isAsc: boolean
): number {
  return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
}
