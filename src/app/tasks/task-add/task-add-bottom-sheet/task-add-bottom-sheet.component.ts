import { Component, OnInit } from '@angular/core';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';

@Component({
  selector: 'app-task-add-bottom-sheet',
  templateUrl: './task-add-bottom-sheet.component.html',
  styleUrls: ['./task-add-bottom-sheet.component.scss']
})
export class TaskAddBottomSheetComponent implements OnInit {

  public constructor(
    private _bottom_sheet_ref: MatBottomSheetRef<TaskAddBottomSheetComponent>
  ) { }

  public ngOnInit(): void {
  }

  public close(): void {
    this._bottom_sheet_ref.dismiss();
  }
}
