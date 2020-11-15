import { DataSource } from '@angular/cdk/collections';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { map } from 'rxjs/operators';
import { Observable, of as observableOf, merge, BehaviorSubject } from 'rxjs';
import { TaskArchiveEntry, TaskService } from 'src/app/services/task-service.service';


/**
 * Data source for the ArchivesList view. This class should
 * encapsulate all logic for fetching and manipulating the displayed data
 * (including sorting, pagination, and filtering).
 */
export class ArchivesListDataSource extends DataSource<TaskArchiveEntry> {
  public tasks: TaskArchiveEntry[] = [];
  public paginator: MatPaginator;
  public sort: MatSort;

  private _archive_list_subject: BehaviorSubject<TaskArchiveEntry[]> =
    new BehaviorSubject<TaskArchiveEntry[]>([]);

  public constructor(
    private _tasks_svc: TaskService
  ) {
    super();
  }

  /**
   * Connect this data source to the table. The table will only update when
   * the returned stream emits new items.
   * @returns A stream of the items to be rendered.
   */
  public connect(): Observable<TaskArchiveEntry[]> {

    this._tasks_svc.getArchive().subscribe({
      next: (archived_tasks: TaskArchiveEntry[]) => {
        this.tasks = [...archived_tasks];
        this._archive_list_subject.next(this.tasks);
      }
    });

    // Combine everything that affects the rendered data into one update
    // stream for the data-table to consume.
    const dataMutations = [
      this._archive_list_subject,
      this.paginator.page,
      this.sort.sortChange
    ];

    return merge(...dataMutations).pipe(map(() => {
      return this.getPagedData(this.getSortedData([...this.tasks]));
    }));
  }

  /**
   * Called when the table is being destroyed. Use this function, to clean up
   * any open connections or free any held resources that were set up during
   * connect.
   */
  public disconnect(): void {}

  /**
   * Paginate the data (client-side). If you're using server-side pagination,
   * this would be replaced by requesting the appropriate data from the server.
   */
  private getPagedData(data: TaskArchiveEntry[]): TaskArchiveEntry[] {
    const startIndex = this.paginator.pageIndex * this.paginator.pageSize;
    return data.splice(startIndex, this.paginator.pageSize);
  }

  /**
   * Sort the data (client-side). If you're using server-side sorting,
   * this would be replaced by requesting the appropriate data from the server.
   */
  private getSortedData(data: TaskArchiveEntry[]): TaskArchiveEntry[] {
    if (!this.sort.active || this.sort.direction === '') {
      return data;
    }

    return data.sort((a, b) => {
      const isAsc = this.sort.direction === 'asc';
      switch (this.sort.active) {
        case 'id': return compare(+a.id, +b.id, isAsc);
        default: return 0;
      }
    });
  }
}

function compare(
  a: string | number,
  b: string | number,
  isAsc: boolean
): number {
  return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
}
