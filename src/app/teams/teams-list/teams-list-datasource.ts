import { DataSource } from '@angular/cdk/collections';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { map } from 'rxjs/operators';
import { Observable, merge, Subscription, BehaviorSubject } from 'rxjs';
import { TeamItem, TeamsMap, TeamsService } from 'src/app/services/teams-service.service';


export interface TeamsListItem {
  id: number;
  name: string;
  desc: string;
}

/**
 * Data source for the TeamsList view. This class should
 * encapsulate all logic for fetching and manipulating the displayed data
 * (including sorting, pagination, and filtering).
 */
export class TeamsListDataSource extends DataSource<TeamsListItem> {


  private _teams_observer_subscription: Subscription;
  // private _teams_update_subject: BehaviorSubject<TeamsListItem[]> =
  //   new BehaviorSubject<TeamsListItem[]>([]);
  private _teams_updated_subject: BehaviorSubject<boolean> =
    new BehaviorSubject<boolean>(false);


  public data: TeamsListItem[] = [];
  public paginator: MatPaginator;
  public sort: MatSort;

  public constructor(
    private _teams_svc: TeamsService
  ) {
    super();
  }

  public connect(): Observable<TeamsListItem[]> {

    this._teams_observer_subscription = this._teams_svc.getTeams().subscribe({
      next: (teams: TeamsMap) => {
        const updated_data: TeamsListItem[] = [];
        Object.values(teams).forEach( (item: TeamItem) => {
          updated_data.push({
            id: item.id,
            name: item.name,
            desc: item.desc
          });
        });
        this.data = [...updated_data];
        this._teams_updated_subject.next(true);
        console.log("teams-ds > updated teams: ", this.data);
      }
    });

    // Combine everything that affects the rendered data into one update
    // stream for the data-table to consume.
    const dataMutations = [
      this._teams_updated_subject,
      this.paginator.page,
      this.sort.sortChange
    ];

    return merge(...dataMutations).pipe(map(() => {
      return this.getPagedData(this.getSortedData([...this.data]));
    }));
  }

  public disconnect(): void {
    this._teams_observer_subscription.unsubscribe();
  }

  /**
   * Paginate the data (client-side). If you're using server-side pagination,
   * this would be replaced by requesting the appropriate data from the server.
   */
  private getPagedData(data: TeamsListItem[]): TeamsListItem[] {
    const startIndex = this.paginator.pageIndex * this.paginator.pageSize;
    return data.splice(startIndex, this.paginator.pageSize);
  }

  /**
   * Sort the data (client-side). If you're using server-side sorting,
   * this would be replaced by requesting the appropriate data from the server.
   */
  private getSortedData(data: TeamsListItem[]): TeamsListItem[] {
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
