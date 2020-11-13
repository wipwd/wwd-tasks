import { Component, Input, OnInit } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import {
  Ledger, TaskLedgerEntry, TaskLedgerMap, TaskService
} from '../../services/task-service.service';

@Component({
  selector: 'app-task-ledger',
  templateUrl: './task-ledger.component.html',
  styleUrls: ['./task-ledger.component.scss']
})
export class TaskLedgerComponent implements OnInit {

  @Input() ledger: string = "backlog";

  public priorities = [
    {
      name: "high", label: "High",
      size: new BehaviorSubject<string>(""),
      enabled: new BehaviorSubject<boolean>(false)
    },
    {
      name: "medium", label: "Medium",
      size: new BehaviorSubject<string>(""),
      enabled: new BehaviorSubject<boolean>(false)
    },
    {
      name: "low", label: "Low",
      size: new BehaviorSubject<string>(""),
      enabled: new BehaviorSubject<boolean>(false)
    }
  ];

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
    let high_str: string = "";
    let medium_str: string = "";
    let low_str: string = "";
    if (total_high > 0) {
      high_str = `(${total_high})`;
    }
    if (total_medium > 0) {
      medium_str = `(${total_medium})`;
    }
    if (total_low > 0) {
      low_str = `(${total_low})`;
    }
    this.priorities[0].size.next(high_str);
    this.priorities[0].enabled.next((total_high > 0));
    this.priorities[1].size.next(medium_str);
    this.priorities[1].enabled.next((total_medium > 0));
    this.priorities[2].size.next(low_str);
    this.priorities[2].enabled.next((total_low > 0));
  }

}
