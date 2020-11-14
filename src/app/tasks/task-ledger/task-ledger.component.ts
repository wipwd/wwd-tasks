import { Component, Input, OnInit } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import {
  Ledger, TaskLedgerEntry, TaskLedgerMap, TaskService
} from '../../services/task-service.service';


declare interface Priority {
  name: string;
  label: string;
  size: BehaviorSubject<string>;
  enabled: BehaviorSubject<boolean>;
  expanded: BehaviorSubject<boolean>;
}

@Component({
  selector: 'app-task-ledger',
  templateUrl: './task-ledger.component.html',
  styleUrls: ['./task-ledger.component.scss']
})
export class TaskLedgerComponent implements OnInit {

  @Input() ledger: string = "backlog";

  public priorities: {[id: string]: Priority} = {
    high: {
      name: "high", label: "High",
      size: new BehaviorSubject<string>(""),
      enabled: new BehaviorSubject<boolean>(false),
      expanded: new BehaviorSubject<boolean>(false),
    },
    medium: {
      name: "medium", label: "Medium",
      size: new BehaviorSubject<string>(""),
      enabled: new BehaviorSubject<boolean>(false),
      expanded: new BehaviorSubject<boolean>(false),
    },
    low: {
      name: "low", label: "Low",
      size: new BehaviorSubject<string>(""),
      enabled: new BehaviorSubject<boolean>(false),
      expanded: new BehaviorSubject<boolean>(false),
    }
  };

  public constructor(
    private _tasks_svc: TaskService
  ) { }

  public ngOnInit(): void {
    this._tasks_svc.getLedger(this.ledger).subscribe({
      next: (task_ledger: Ledger) => {
        if (!task_ledger || Object.keys(task_ledger).length === 0) {
          return;
        }
        this._updateSizes(task_ledger.tasks);
      }
    });
  }

  private _updateSize(prio: string, total: number): void {
    let str = "";
    if (total > 0) {
      str = `(${total})`;
    }
    this.priorities[prio].size.next(str);
    // this.priorities[prio].has_tasks = (total > 0);
    this.priorities[prio].enabled.next(total > 0);
    console.log(`(${this.ledger}) total prio ${prio}: ${total}`);
    if (total === 0) {
      this.priorities[prio].expanded.next(false);
      console.log(`(${this.ledger}) collapse panel: ${prio}`);
    }
  }

  private _updateSizes(tasks: TaskLedgerMap): void {
    let total_high: number = 0;
    let total_medium: number = 0;
    let total_low: number = 0;

    Object.values(tasks).forEach( (entry: TaskLedgerEntry) => {
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
