import { DataSource } from '@angular/cdk/collections';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { map } from 'rxjs/operators';
import { Observable, merge, Subscription, BehaviorSubject } from 'rxjs';
import { PeopleItem, PeopleMap, PeopleService } from '../../services/people-service.service';

// TODO: Replace this with your own data model type
export interface PeopleListItem {
  id: number;
  name: string;
  team?: string;
  num_tasks: number;
}

/**
 * Data source for the PeopleList view. This class should
 * encapsulate all logic for fetching and manipulating the displayed data
 * (including sorting, pagination, and filtering).
 */
export class PeopleListDataSource extends DataSource<PeopleListItem> {

  private _people_observer_subscription: Subscription;
  private _people_updated_subject: BehaviorSubject<boolean> =
    new BehaviorSubject<boolean>(false);

  public data: PeopleListItem[] = [];
  public paginator: MatPaginator;
  public sort: MatSort;

  public constructor(
    private _people_svc: PeopleService
  ) {
    super();
  }

  public connect(): Observable<PeopleListItem[]> {

    this._people_observer_subscription =
      this._people_svc.getPeople().subscribe({
        next: (people: PeopleMap) => {
          const updated_data: PeopleListItem[] = [];
          Object.values(people).forEach( (item: PeopleItem) => {
            updated_data.push({
              id: item.id,
              name: item.name,
              team: `${item.teamid}`,
              num_tasks: 0
            });
          });
          this.data = [...updated_data];
          this._people_updated_subject.next(true);
        }
    });

    const dataMutations = [
      this._people_updated_subject,
      this.paginator.page,
      this.sort.sortChange
    ];

    return merge(...dataMutations).pipe(map(() => {
      return this.getPagedData(this.getSortedData([...this.data]));
    }));
  }

  public disconnect(): void {
    this._people_observer_subscription.unsubscribe();
  }

  /**
   * Paginate the data (client-side). If you're using server-side pagination,
   * this would be replaced by requesting the appropriate data from the server.
   */
  private getPagedData(data: PeopleListItem[]): PeopleListItem[] {
    const startIndex = this.paginator.pageIndex * this.paginator.pageSize;
    return data.splice(startIndex, this.paginator.pageSize);
  }

  /**
   * Sort the data (client-side). If you're using server-side sorting,
   * this would be replaced by requesting the appropriate data from the server.
   */
  private getSortedData(data: PeopleListItem[]): PeopleListItem[] {
    if (!this.sort.active || this.sort.direction === '') {
      return data;
    }

    return data.sort((a, b) => {
      const isAsc = this.sort.direction === 'asc';
      switch (this.sort.active) {
        case 'name': return compare(a.name, b.name, isAsc);
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
