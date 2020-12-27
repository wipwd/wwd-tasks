import { Component, Input, OnInit } from '@angular/core';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { TaskLedgerEntry } from '../../services/task-service.service';
import { TaskFilterItem, TaskSortItem } from '../task-organizer/task-list-options';
import { FilteredTasksService } from '../../services/filtered-tasks-service.service';


declare interface Priority {
  name: string;
  label: string;
  size: BehaviorSubject<string>;
  size_n: BehaviorSubject<number>;
  enabled: BehaviorSubject<boolean>;
  expanded: BehaviorSubject<boolean>;
}

@Component({
  selector: 'app-task-ledger',
  templateUrl: './task-ledger.component.html',
  styleUrls: ['./task-ledger.component.scss']
})
export class TaskLedgerComponent implements OnInit {

  @Input() public ledger: string = "backlog";
  @Input() public filters: BehaviorSubject<TaskFilterItem>;
  @Input() public sorting: BehaviorSubject<TaskSortItem>;

  public priorities: {[id: string]: Priority} = {
    high: {
      name: "high", label: "High",
      size: new BehaviorSubject<string>(""),
      size_n: new BehaviorSubject<number>(0),
      enabled: new BehaviorSubject<boolean>(false),
      expanded: new BehaviorSubject<boolean>(false),
    },
    medium: {
      name: "medium", label: "Medium",
      size: new BehaviorSubject<string>(""),
      size_n: new BehaviorSubject<number>(0),
      enabled: new BehaviorSubject<boolean>(false),
      expanded: new BehaviorSubject<boolean>(false),
    },
    low: {
      name: "low", label: "Low",
      size: new BehaviorSubject<string>(""),
      size_n: new BehaviorSubject<number>(0),
      enabled: new BehaviorSubject<boolean>(false),
      expanded: new BehaviorSubject<boolean>(false),
    }
  };

  public constructor(
    private _filtered_tasks_svc: FilteredTasksService
  ) { }

  public ngOnInit(): void {
    this._filtered_tasks_svc.getLedger(this.ledger).subscribe({
      next: (tasks: TaskLedgerEntry[]) => {
        console.log("task-ledger > tasks: ", tasks);
        if (tasks.length === 0) {
          return;
        }
        this._updateSizes(tasks);
        this._maybeOpenPriorities();
      }
    });
  }

  public _maybeOpenPriorities(): void {

    combineLatest([
      this.priorities.high.size_n,
      this.priorities.medium.size_n,
      this.priorities.low.size_n
    ]).subscribe({
      next: (results: number[]) => {
        if (results[0] > 0) {
          this.priorities.high.expanded.next(true);
        } else if (results[1] > 0) {
          this.priorities.medium.expanded.next(true);
        } else if (results[2] > 0) {
          this.priorities.low.expanded.next(true);
        }
      }
    });

  }

  private _updateSize(prio: string, total: number): void {
    let str = "";
    if (total > 0) {
      str = `(${total})`;
    }
    this.priorities[prio].size.next(str);
    this.priorities[prio].size_n.next(total);
    this.priorities[prio].enabled.next(total > 0);
    if (total === 0) {
      this.priorities[prio].expanded.next(false);
    }
  }

  private _updateSizes(tasks: TaskLedgerEntry[]): void {
    let total_high: number = 0;
    let total_medium: number = 0;
    let total_low: number = 0;

    tasks.forEach( (entry: TaskLedgerEntry) => {
      switch (entry.item.priority) {
        case "high": total_high++; break;
        case "medium": total_medium++; break;
        case "low": total_low++; break;
      }
    });
    this._updateSize("high", total_high);
    this._updateSize("medium", total_medium);
    this._updateSize("low", total_low);
  }

  public getPriorities(): Priority[] {
    return [this.priorities.high, this.priorities.medium, this.priorities.low];
  }

  public expanded(prio: Priority): void {
    prio.expanded.next(true);
  }

  public collapsed(prio: Priority): void {
    prio.expanded.next(false);
  }
}
