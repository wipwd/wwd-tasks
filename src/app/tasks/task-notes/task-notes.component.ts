import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TaskLedgerEntry, TaskNoteItem, TaskService } from 'src/app/services/task-service.service';

export interface TaskNotesDialogData {
  task: TaskLedgerEntry;
}

@Component({
  selector: 'app-task-notes',
  templateUrl: './task-notes.component.html',
  styleUrls: ['./task-notes.component.scss']
})
export class TaskNotesComponent implements OnInit {

  public add_note_form_group: FormGroup;
  public add_note_form_ctrl: FormControl = new FormControl();
  public task: TaskLedgerEntry;

  private _selected_note: TaskNoteItem|undefined;
  private _cur_tab_index: number = 0;

  public constructor(
    @Inject(MAT_DIALOG_DATA) private _data: TaskNotesDialogData,
    private _fb: FormBuilder,
    private _dialog_ref: MatDialogRef<TaskNotesComponent>,
    private _tasks_svc: TaskService,
  ) {
    this.add_note_form_group = this._fb.group({
      note_text: this.add_note_form_ctrl
    });
    this.task = this._data.task;
  }

  public ngOnInit(): void { }

  public close(): void {
    this._dialog_ref.close();
  }

  public save(): void {
    if (!this.add_note_form_ctrl.value ||
        this.add_note_form_ctrl.value === "") {
      return;
    }
    const note: TaskNoteItem = {
      date: new Date(),
      text: this.add_note_form_ctrl.value
    };
    this._tasks_svc.noteAdd(this.task, note);
    this._dialog_ref.close();
  }

  public hasSelectedNote(): boolean {
    return (!!this._selected_note);
  }

  public selectNote(entry: TaskNoteItem): void {
    this._selected_note = entry;
    this._cur_tab_index = 2;
  }

  public getSelectedNoteText(): string {
    if (!this.hasSelectedNote()) {
      return "";
    }
    return this._selected_note.text;
  }

  public getSelectedNoteDate(): string {
    if (!this.hasSelectedNote()) {
      return "";
    }
    return this._selected_note.date.toString();
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

  public hasNotes(): boolean {
    return (!!this.task.item.notes);
  }

  public getNotes(): TaskNoteItem[] {
    return (this.hasNotes() ? this.task.item.notes : []);
  }
}
