import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
  TaskItem, TaskLedgerEntry, TaskTimerItem
} from '../../services/task-service.service';
import { getTimeDiffStr } from '../task-item/task-item.component';

export interface TaskInfoDialogData {
  task: TaskLedgerEntry;
}


@Component({
  selector: 'app-task-info',
  templateUrl: './task-info.component.html',
  styleUrls: ['./task-info.component.scss']
})
export class TaskInfoComponent implements OnInit {

  public task: TaskLedgerEntry;
  public item: TaskItem;

  public constructor(
    @Inject(MAT_DIALOG_DATA) private _data: TaskInfoDialogData,
    private _dialog_ref: MatDialogRef<TaskInfoComponent>
  ) {
    this.task = this._data.task;
    this.item = this.task.item;
  }

  public ngOnInit(): void {
  }

  public _timeSpent(interval: TaskTimerItem): number {
    const start = interval.start;
    const end = (!!interval.end ? interval.end : new Date());
    return Math.floor((end.getTime() - start.getTime()) / 1000);
  }

  public timeSpent(interval: TaskTimerItem): string {
    const diff: number = this._timeSpent(interval);
    return getTimeDiffStr(diff, true);
  }

  public totalTimeSpent(): string {
    let total_diff: number = 0;
    this.item.timer?.intervals.forEach( (interval: TaskTimerItem) => {
      total_diff += this._timeSpent(interval);
    });
    return getTimeDiffStr(total_diff, true);
  }

}
