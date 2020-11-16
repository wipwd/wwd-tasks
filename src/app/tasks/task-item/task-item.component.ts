import { Component, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { BehaviorSubject, interval, Subscription } from 'rxjs';
import { TaskLedgerEntry, TaskService } from 'src/app/services/task-service.service';
import { TaskEditComponent } from '../task-edit/task-edit.component';

@Component({
  selector: 'app-task-item',
  templateUrl: './task-item.component.html',
  styleUrls: ['./task-item.component.scss']
})
export class TaskItemComponent implements OnInit {

  @Input() task: TaskLedgerEntry;

  private _running_for_observer: BehaviorSubject<string> =
    new BehaviorSubject<string>("");
  private _running_check_interval_subscription: Subscription;

  public constructor(
    private _tasks_svc: TaskService,
    private _edit_task_dialog: MatDialog,
  ) { }

  public ngOnInit(): void {
    if (this._tasks_svc.isTimerRunning(this.task)) {
      this._startTimer();
    } else {
      this._updateTimer();
    }
  }

  public hasProjects(): boolean {
    return this.task.item.project.length > 0;
  }

  public getProjects(): string {
    const str: string = this.task.item.project.join(', ');
    if (str !== "") {
      return `on ${str}`;
    }
    return "no project";
  }

  public moveNext(): void {
    this._tasks_svc.moveNext(this.task);
  }

  public movePrevious(): void {
    this._tasks_svc.movePrevious(this.task);
  }

  public markDone(): void {
    this._tasks_svc.markDone(this.task);
  }

  public remove(): void {
    this._tasks_svc.remove(this.task);
  }

  public archive(): void {
    this._tasks_svc.archive(this.task);
  }

  public hasNext(): boolean {
    return !!this.task.ledger.next;
  }

  public hasPrevious(): boolean {
    return !!this.task.ledger.previous;
  }

  public hasURL(): boolean {
    return !!this.task.item.url && (this.task.item.url !== "");
  }

  public canMarkDone(): boolean {
    return this._tasks_svc.canMarkDone(this.task);
  }

  public isMarkedDone(): boolean {
    return this._tasks_svc.isDone(this.task);
  }

  public editTask(): void {
    this._edit_task_dialog.open(TaskEditComponent, {
      data: {
        task: this.task
      }
    });
  }

  public getCreatedSince(): string {
    if (!this.task.item.date) {
      return "";
    }
    return `created ${getTimeSince(this.task.item.date)}`;
  }

  public isRunning(): boolean {
    return this._tasks_svc.isTimerRunning(this.task);
  }

  public isPaused(): boolean {
    return this._tasks_svc.isTimerPaused(this.task);
  }

  public isStopped(): boolean {
    return this._tasks_svc.isTimerStopped(this.task);
  }

  public markStart(): void {
    this._tasks_svc.timerStart(this.task);
    this._startTimer();
  }

  private _startTimer(): void {
    this._running_check_interval_subscription = interval(1000).subscribe({
      next: () => {
        this._updateTimer();
      }
    });
    this._updateTimer();
  }

  private _updateTimer(): void {
    const milisecs: number = this._tasks_svc.getTimerTotal(this.task);
    if (milisecs <= 0) {
      return;
    }
    const secs: number = Math.floor(milisecs / 1000);
    const str: string = getTimeDiffStr(secs, true);
    this._running_for_observer.next(str);
  }

  private _stopTimer(): void {
    this._running_check_interval_subscription.unsubscribe();
  }

  public markPause(): void {
    this._tasks_svc.timerPause(this.task);
    this._stopTimer();
  }

  public markStop(): void {

  }

  public getRunningFor(): BehaviorSubject<string> {
    return this._running_for_observer;
  }
}


function getTimeSince(date: Date): string {
  const now = new Date().getTime();
  const diff = Math.floor((now - date.getTime()) / 1000);
  return `${getTimeDiffStr(diff)} ago`;
}


function getTimeDiffStr(diff: number, with_secs: boolean = false): string {

  const month_secs = 2.628e+6; // months in seconds
  const week_secs = 604800; // weeks in seconds
  const day_secs = 86400; // 24h in seconds
  const hour_secs = 3600;
  const min_secs = 60;

  const months = Math.floor(diff / month_secs);
  diff -= months * month_secs;

  const weeks = Math.floor(diff / week_secs);
  diff -= weeks * week_secs;

  const days = Math.floor(diff / day_secs);
  diff -= days * day_secs;

  const hours = Math.floor(diff / hour_secs);
  diff -= hours * hour_secs;

  const mins = Math.floor(diff / min_secs);
  diff -= mins * min_secs;


  const time_lst = [];
  if (months > 0) {
      time_lst.push(`${months}mo`);
  }

  if (weeks > 0) {
      time_lst.push(`${weeks}wk`);
  }

  if (days > 0) {
      time_lst.push(`${days}d`);
  }

  if (hours > 0) {
      time_lst.push(`${hours}h`);
  }

  if (mins > 0) {
      time_lst.push(`${mins}m`);
  }

  if (time_lst.length === 0 && !with_secs) {
      if (diff > 0) {
          return "about a minute";
      } else {
          return "few seconds";
      }
  } else if (with_secs) {
    time_lst.push(`${diff}s`);
  }
  return `${time_lst.join(', ')}`;
}
