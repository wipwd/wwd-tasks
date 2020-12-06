import { DataSource } from '@angular/cdk/collections';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { map } from 'rxjs/operators';
import { Observable, merge, BehaviorSubject, Subscription } from 'rxjs';
import { TaskItem, TaskItemMap, TaskService, TaskTimerItem } from '../../services/task-service.service';

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
  private _total_time_spent: number = 0;

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
        this._processTasks(all_tasks);
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
        case 'status': return compareStatus(a, b, isAsc);
        case 'prio': return comparePrio(a, b, isAsc);
        default: return 0;
      }
    });
  }

  private _processTasks(taskmap: TaskItemMap): void {

    const monday: Date = new Date();
    const sunday: Date = new Date();
    monday.setDate(0);
    sunday.setDate(6);

    const tasks: WeeklyTaskItem[] = [];
    let total_time_spent: number = 0;

    Object.values(taskmap).forEach( (taskitem: TaskItem) => {

      const _spent: number =
        this._calcTimeSpent(taskitem, monday, sunday);
      const _created: boolean =
        this._wasCreatedBetween(taskitem, monday, sunday);
      const _finished: boolean =
        this._wasFinishedBetween(taskitem, monday, sunday);

      if (!_created && !_finished && _spent <= 0) {
        // we don't want this task.
        return;
      }

      const task: WeeklyTaskItem = {
        task: taskitem,
        spent_seconds: _spent,
        created: _created,
        finished: _finished,
        workedon: (_spent > 0)
      };
      tasks.push(task);
      total_time_spent += _spent;
    });

    this._weekly_tasks = [...tasks];
    this._weekly_tasks_subject.next(tasks);
    this._total_time_spent = total_time_spent;
  }

  private _wasCreatedBetween(item: TaskItem, start: Date, end: Date): boolean {
    return (!!item.date && item.date >= start && item.date <= end);
  }

  private _wasFinishedBetween(item: TaskItem, start: Date, end: Date): boolean {
    return (!!item.done && item.done >= start && item.done <= end);
  }

  private _calcTimeSpent(item: TaskItem, start: Date, end: Date): number {
    if (!item.timer) {
      return 0;
    }
    const now: Date = new Date();
    const nowish: Date = (end > now ? now : end);
    let spent: number = 0;
    item.timer.intervals.forEach( (interval: TaskTimerItem) => {
      if (!interval.start) {
        return;
      }

      if (!!interval.end && (interval.end < start || interval.end > end)) {
        return;
      }

      if (!!interval.start && typeof interval.start === "string") {
        console.error("wrong date format -- string found!");
        console.error("task: ", item);
      }

      const interval_end: Date = (!!interval.end ? interval.end : nowish);
      if (!!interval.start) {
        spent += interval_end.getTime() - interval.start.getTime();
      }
    });
    return Math.floor(spent / 1000);
  }

  public getSize(): number {
    return this._weekly_tasks.length;
  }

  public getTotalSpentTime(): number {
    return this._total_time_spent;
  }
}

function compare(
  a: string | number,
  b: string | number,
  isAsc: boolean
): number {
  return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
}

enum PrioEnum {
  none = 0,
  low = 1,
  medium = 2,
  high = 3
}

enum RAGEnum {
  none = 0,
  green = 1,
  amber = 2,
  red = 3
}

function getPrio(v: string): number {
  switch (v) {
    case "high": return PrioEnum.high;
    case "medium": return PrioEnum.medium;
    case "low": return PrioEnum.low;
  }
  return PrioEnum.none;
}

function getRAG(item: WeeklyTaskItem): number {
  const prio: PrioEnum = getPrio(item.task.priority);
  if (prio === PrioEnum.high && !item.finished && !item.workedon) {
    return RAGEnum.red;
  } else if (
    (prio === PrioEnum.high && item.workedon && !item.finished) ||
    (prio === PrioEnum.medium && !item.finished && !item.workedon)
  ) {
    return RAGEnum.amber;
  } else {
    return RAGEnum.green;
  }
}

enum StatusEnum {
  none = 0,
  finished = 1,
  inprogress = 2,
  created = 3
}

function getStatus(item: WeeklyTaskItem): number {
  if (item.created && !item.finished && !item.workedon) {
    return StatusEnum.created;
  } else if (item.finished) {
    return StatusEnum.finished;
  } else if (item.workedon && !item.finished) {
    return StatusEnum.inprogress;
  }
  return StatusEnum.none;
}

function compareStatus(
  a: WeeklyTaskItem,
  b: WeeklyTaskItem,
  isAsc: boolean
): number {
  const a_status: number = getStatus(a);
  const b_status: number = getStatus(b);
  return compare(a_status, b_status, isAsc);
}

function comparePrio(
  a: WeeklyTaskItem,
  b: WeeklyTaskItem,
  isAsc: boolean
): number {
  const a_prio: number = getRAG(a);
  const b_prio: number = getRAG(b);
  return compare(a_prio, b_prio, isAsc);
}
