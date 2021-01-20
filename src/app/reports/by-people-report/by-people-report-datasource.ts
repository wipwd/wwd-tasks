import { DataSource } from '@angular/cdk/collections';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { map } from 'rxjs/operators';
import { Observable, of as observableOf, merge, Subscription, BehaviorSubject } from 'rxjs';
import { ProjectItem, ProjectsMap, ProjectsService } from 'src/app/services/projects-service.service';
import { TaskByPeopleMap, TaskByPeopleService, TasksByPerson } from 'src/app/services/task-by-people-service.service';
import { TaskLedgerEntry } from 'src/app/services/task-service.service';

// TODO: Replace this with your own data model type
export interface ByPeopleReportItem {
  person_name: string;
  per_project: {[id: string]: number};
}

/**
 * Data source for the ByPeopleReport view. This class should
 * encapsulate all logic for fetching and manipulating the displayed data
 * (including sorting, pagination, and filtering).
 */
export class ByPeopleReportDataSource extends DataSource<ByPeopleReportItem> {
  public data: ByPeopleReportItem[] = [];
  public paginator: MatPaginator;
  public sort: MatSort;

  private _projects: ProjectsMap = {};
  private _tasks_by_people: TaskByPeopleMap = {};

  private _projects_subscription: Subscription;
  private _tasks_by_people_subscription: Subscription;

  private _subject: BehaviorSubject<boolean> =
    new BehaviorSubject<boolean>(false);

  public constructor(
    private _projects_svc: ProjectsService,
    private _task_by_people_svc: TaskByPeopleService
  ) {
    super();
  }

  /**
   * Connect this data source to the table. The table will only update when
   * the returned stream emits new items.
   * @returns A stream of the items to be rendered.
   */
  public connect(): Observable<ByPeopleReportItem[]> {

    this._projects_subscription = this._projects_svc.getProjects().subscribe({
      next: (projects: ProjectsMap) => {
        this._projects = projects;
        this._update();
      }
    });

    this._tasks_by_people_subscription =
        this._task_by_people_svc.getTasksByPeople().subscribe({
      next: (tasks_by_people: TaskByPeopleMap) => {
        this._tasks_by_people = tasks_by_people;
        this._update();
      }
    });

    // Combine everything that affects the rendered data into one update
    // stream for the data-table to consume.
    const dataMutations = [
      this._subject,
      this.paginator.page,
      this.sort.sortChange
    ];

    return merge(...dataMutations).pipe(map(() => {
      return this.getPagedData(this.getSortedData([...this.data]));
    }));
  }

  public disconnect(): void {
    if (!!this._projects_subscription) {
      this._projects_subscription.unsubscribe();
    }

    if (!!this._tasks_by_people_subscription) {
      this._tasks_by_people_subscription.unsubscribe();
    }
  }

  private _update(): void {

    const data: ByPeopleReportItem[] = [];

    Object.values(this._tasks_by_people).forEach( (value: TasksByPerson) => {

      const person_item: ByPeopleReportItem = {
        person_name: value.person.name,
        per_project: {}
      };

      Object.values(this._projects).forEach( (prj: ProjectItem) => {
        person_item.per_project[prj.name] = 0;
      });

      value.tasks.forEach( (entry: TaskLedgerEntry) => {
        const prjid: number = (entry.item.project as number);
        if (prjid === 0 || !(prjid in this._projects)) {
          return;
        }
        const prjname: string = this._projects[prjid].name;
        person_item.per_project[prjname] ++;
      });

      data.push(person_item);
    });

    console.log("by-people-report-ds > data: ", data);
    this.data = [...data];
    this._subject.next(true);
  }

  /**
   * Paginate the data (client-side). If you're using server-side pagination,
   * this would be replaced by requesting the appropriate data from the server.
   */
  private getPagedData(data: ByPeopleReportItem[]): ByPeopleReportItem[] {
    const startIndex = this.paginator.pageIndex * this.paginator.pageSize;
    return data.splice(startIndex, this.paginator.pageSize);
  }

  /**
   * Sort the data (client-side). If you're using server-side sorting,
   * this would be replaced by requesting the appropriate data from the server.
   */
  private getSortedData(data: ByPeopleReportItem[]): ByPeopleReportItem[] {
    if (!this.sort.active || this.sort.direction === '') {
      return data;
    }

    return data.sort((a, b) => {
      const isAsc = this.sort.direction === 'asc';
      switch (this.sort.active) {
        case 'name': return compare(a.person_name, b.person_name, isAsc);
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
