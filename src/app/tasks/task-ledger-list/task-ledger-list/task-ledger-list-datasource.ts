import { DataSource } from '@angular/cdk/collections';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { map } from 'rxjs/operators';
import {
  Observable, merge, BehaviorSubject, Subscription
} from 'rxjs';
import { Ledger, TaskItem, TaskLedgerEntry, TaskService } from '../../../services/task-service.service';
import { TaskFilterItem, TaskSortItem } from '../../task-organizer/task-list-options';
import { ProjectsMap, ProjectsService } from 'src/app/services/projects-service.service';

/**
 * Data source for the TaskLedgerList view. This class should
 * encapsulate all logic for fetching and manipulating the displayed data
 * (including sorting, pagination, and filtering).
 */
export class TaskLedgerListDataSource extends DataSource<TaskLedgerEntry> {

  public paginator: MatPaginator;
  public sort: MatSort;

  private _tasks: TaskLedgerEntry[] = [];
  private _filtered_tasks: TaskLedgerEntry[] = [];

  private _tasks_subject: BehaviorSubject<TaskLedgerEntry[]> =
    new BehaviorSubject<TaskLedgerEntry[]>([]);

  private _filtered_tasks_subject: BehaviorSubject<TaskLedgerEntry[]> =
    new BehaviorSubject<TaskLedgerEntry[]>([]);

  private _ledger_subscription: Subscription;
  private _tasks_size_subject: BehaviorSubject<number> =
    new BehaviorSubject<number>(0);

  private _filters: TaskFilterItem = { projects: [], title: "" };
  private _sorting: TaskSortItem = {
    sortby: "creation", ascending: false
  };

  private _projects: ProjectsMap = {};

  constructor(
    private _tasks_svc: TaskService,
    private _projects_svc: ProjectsService,
    private _ledgername: string,
    private _ledgerprio: string,
    private _filters_subject: BehaviorSubject<TaskFilterItem>,
    private _sorting_subject: BehaviorSubject<TaskSortItem>
  ) {
    super();

    this._filters_subject.subscribe({
      next: (filters: TaskFilterItem) => {
        console.log("updated filters: ", filters);
        this._filters = filters;
        this._filterTasks(this._tasks);
      }
    });

    this._sorting_subject.subscribe({
      next: (sort: TaskSortItem) => {
        console.log("updated sort: ", sort);
        this._sorting = sort;
      }
    });

    this._projects_svc.getProjects().subscribe({
      next: (projects: ProjectsMap) => {
        this._projects = projects;
      }
    });
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

    this._tasks_subject.subscribe({
      next: (tasks: TaskLedgerEntry[]) => {
        this._tasks = [...tasks];
        this._filterTasks(this._tasks);
      }
    });

    this._filtered_tasks_subject.subscribe({
      next: (filtered_tasks: TaskLedgerEntry[]) => {
        this._filtered_tasks = [...filtered_tasks];
        console.log("filtered tasks: ", this._filtered_tasks);
      }
    });

    // Combine everything that affects the rendered data into one update
    // stream for the data-table to consume.
    const dataMutations = [
      this._filtered_tasks_subject,
      this.paginator.page,
      this._sorting_subject
    ];

    return merge(...dataMutations).pipe(map(() => {
      return this._getPagedData(this._getSortedData([...this._filtered_tasks]));
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

  private _updateLedger(ledger: Ledger): void {
    const new_entries: TaskLedgerEntry[] = [];
    Object.values(ledger.tasks).forEach( (entry: TaskLedgerEntry) => {
      if (entry.item.priority === this._ledgerprio) {
        new_entries.push(entry);
      }
    });
    this._tasks = [...new_entries];
    this._tasks_subject.next(this._tasks);
    this._tasks_size_subject.next(this._tasks.length);
  }

  private _filterTasks(tasks: TaskLedgerEntry[]): void {
    const has_project_filter: boolean = (this._filters.projects.length !== 0);
    const has_title_filter: boolean = (this._filters.title !== "");

    if (!has_project_filter && !has_title_filter) {
      this._filtered_tasks_subject.next(tasks);
      return;
    }

    const filtered_tasks: TaskLedgerEntry[] = [];
    tasks.forEach( (task: TaskLedgerEntry) => {
      let done: boolean = false;
      if (has_project_filter) {
        if (typeof task.item.project !== "number") {
          throw new Error("project type is not a number");
        }
        const projid: number = task.item.project;
        const projname: string = this._projects[projid].name;
        if (this._filters.projects.includes(projname)) {
          filtered_tasks.push(task);
          done = true;
        }
      }
      if (done) {
        return;
      }
      if (has_title_filter) {
        if (task.item.title.includes(this._filters.title)) {
          filtered_tasks.push(task);
          done = true;
        }
      }
    });
    this._filtered_tasks_subject.next(filtered_tasks);
  }

  public getLength(): BehaviorSubject<number> {
    return this._tasks_size_subject;
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
