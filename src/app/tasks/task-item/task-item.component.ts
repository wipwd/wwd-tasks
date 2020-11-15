import { Component, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { TaskLedgerEntry, TaskService } from 'src/app/services/task-service.service';
import { TaskEditComponent } from '../task-edit/task-edit.component';

@Component({
  selector: 'app-task-item',
  templateUrl: './task-item.component.html',
  styleUrls: ['./task-item.component.scss']
})
export class TaskItemComponent implements OnInit {

  @Input() task: TaskLedgerEntry;

  public constructor(
    private _tasks_svc: TaskService,
    private _edit_task_dialog: MatDialog,
  ) { }

  public ngOnInit(): void { }

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

  public editTask(): void {
    this._edit_task_dialog.open(TaskEditComponent, {
      data: {
        task: this.task
      }
    });
  }
}
