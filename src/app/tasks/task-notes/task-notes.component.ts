import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { TaskNoteItem } from 'src/app/services/task-service.service';

@Component({
  selector: 'app-task-notes',
  templateUrl: './task-notes.component.html',
  styleUrls: ['./task-notes.component.scss']
})
export class TaskNotesComponent implements OnInit {

  public add_note_form_group: FormGroup;
  public add_note_form_ctrl: FormControl = new FormControl();

  private _selected_note: TaskNoteItem|undefined;
  private _cur_tab_index: number = 0;

  public constructor(
    private _fb: FormBuilder,
    private _dialog_ref: MatDialogRef<TaskNotesComponent>
  ) {
    this.add_note_form_group = this._fb.group({
      note_text: this.add_note_form_ctrl
    });
  }

  public ngOnInit(): void { }

  public close(): void {
    this._dialog_ref.close();
  }

  public hasSelectedNote(): boolean {
    return (!!this._selected_note);
  }

  public selectNote(): void {
    this._selected_note = { date: new Date(), text: "foo bar baz" };
    this._cur_tab_index = 2;
  }

  public changedTab(index: number): void {
    this._cur_tab_index = index;
    if (index !== 2) {
      this._selected_note = undefined;
    }
  }

  public getCurrentTab(): number {
    return this._cur_tab_index;
  }
}
