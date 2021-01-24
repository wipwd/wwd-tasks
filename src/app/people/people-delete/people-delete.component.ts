import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-people-delete',
  templateUrl: './people-delete.component.html',
  styleUrls: ['./people-delete.component.scss']
})
export class PeopleDeleteComponent implements OnInit {

  public constructor(
    private _dialog_ref: MatDialogRef<PeopleDeleteComponent>
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
