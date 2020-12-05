import { DataSource } from '@angular/cdk/collections';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { map } from 'rxjs/operators';
import { Observable, merge, BehaviorSubject, Subscription } from 'rxjs';
import { TaskItem, TaskItemMap, TaskService } from '../../services/task-service.service';

export interface WeeklyTaskItem {
  task: TaskItem;
  spent_seconds: number;
  created: boolean;
  finished: boolean;
  workedon: boolean;
}


export class WeeklyReportDataSource extends DataSource<WeeklyTaskItem> {
  public paginator: MatPaginator;
  public sort: MatSort;

  private _weekly_tasks: WeeklyTaskItem[] = [];
  private _weekly_tasks_subject: BehaviorSubject<WeeklyTaskItem[]> =
    new BehaviorSubject<WeeklyTaskItem[]>([]);
  private _all_tasks_subscription: Subscription;

  constructor(
    private _tasks_svc: TaskService
  ) {
    super();
  }

  /**
   * Connect this data source to the table. The table will only update when
   * the returned stream emits new items.
   * @returns A stream of the items to be rendered.
   */
  public connect(): Observable<WeeklyTaskItem[]> {

    this._all_tasks_subscription = this._tasks_svc.getAllTasks().subscribe({
      next: (all_tasks: TaskItemMap) => {
        const new_tasks: WeeklyTaskItem[] = [];
        Object.values(all_tasks).forEach( (item: TaskItem) => {
          new_tasks.push({
            task: item,
            spent_seconds: 0,
            created: false,
            finished: false,
            workedon: true
          });
        });
        this._weekly_tasks = [...new_tasks];
        this._weekly_tasks_subject.next(this._weekly_tasks);
      }
    });

    // Combine everything that affects the rendered data into one update
    // stream for the data-table to consume.
    const dataMutations = [
      this._weekly_tasks_subject,
      this.paginator.page,
      this.sort.sortChange
    ];

    return merge(...dataMutations).pipe(map(() => {
      return this.getPagedData(this.getSortedData([...this._weekly_tasks]));
    }));
  }

  public disconnect(): void {
    this._all_tasks_subscription?.unsubscribe();
  }

  /**
   * Paginate the data (client-side). If you're using server-side pagination,
   * this would be replaced by requesting the appropriate data from the server.
   */
  private getPagedData(data: WeeklyTaskItem[]): WeeklyTaskItem[] {
    const startIndex = this.paginator.pageIndex * this.paginator.pageSize;
    return data.splice(startIndex, this.paginator.pageSize);
  }

  /**
   * Sort the data (client-side). If you're using server-side sorting,
   * this would be replaced by requesting the appropriate data from the server.
   */
  private getSortedData(data: WeeklyTaskItem[]): WeeklyTaskItem[] {
    if (!this.sort.active || this.sort.direction === '') {
      return data;
    }

    return data.sort((a, b) => {
      const isAsc = this.sort.direction === 'asc';
      switch (this.sort.active) {
        case 'title': return compare(a.task.title, b.task.title, isAsc);
        case 'spent': return compare(a.spent_seconds, b.spent_seconds, isAsc);
        default: return 0;
      }
    });
  }

  public getSize(): number {
    return this._weekly_tasks.length;
  }
}

function compare(
  a: string | number,
  b: string | number,
  isAsc: boolean
): number {
  return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
}
