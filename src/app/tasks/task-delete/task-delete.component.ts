import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';


@Component({
  selector: 'app-task-delete',
  templateUrl: './task-delete.component.html',
  styleUrls: ['./task-delete.component.scss']
})
export class TaskDeleteComponent implements OnInit {

  public constructor(
    private _dialog_ref: MatDialogRef<TaskDeleteComponent>
  ) { }

  public ngOnInit(): void { }

  private _close(confirmed: boolean): void {
    this._dialog_ref.close(confirmed);
  }

  public confirm(): void {
    this._close(true);
  }

  public cancel(): void {
    this._close(false);
  }
}
