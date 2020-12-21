import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { BehaviorSubject } from 'rxjs';
import { ProjectsService } from 'src/app/services/projects-service.service';
import {
  TaskItem, TaskLedgerEntry, TaskTimerItem, getTimeDiffStr, TaskService
} from '../../services/task-service.service';

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

  // edit mode
  public edit_form_group: FormGroup;

  // timesheet add entry
  public add_entry_form_group: FormGroup;
  // date picker form group
  public date_picker_form_group: FormGroup;
  public time_from_form_group: FormGroup;
  public time_until_form_group: FormGroup;

  private _is_add_new_entry: boolean = false;

  // edit mode
  private _is_edit_mode: boolean = false;


  public constructor(
    @Inject(MAT_DIALOG_DATA) private _data: TaskInfoDialogData,
    private _dialog_ref: MatDialogRef<TaskInfoComponent>,
    private _fb: FormBuilder,
    private _tasks_svc: TaskService,
    private _projects_svc: ProjectsService
  ) {
    this.task = this._data.task;
    this.item = this.task.item;

    this.date_picker_form_group = this._fb.group({
      from: new FormControl("", Validators.required),
      to: new FormControl("", Validators.required)
    });

    const hour_validators = [
      Validators.required, Validators.min(0), Validators.max(24)
    ];
    const minutes_validators = [
      Validators.required, Validators.min(0), Validators.max(59)
    ];

    this.time_from_form_group = this._fb.group({
      hour: new FormControl("", hour_validators),
      minutes: new FormControl("", minutes_validators)
    });
    this.time_until_form_group = this._fb.group({
      hour: new FormControl("", hour_validators),
      minutes: new FormControl("", minutes_validators)
    });

    this.add_entry_form_group = this._fb.group({
      daterange: this.date_picker_form_group,
      from: this.time_from_form_group,
      until: this.time_until_form_group
    });

    this.edit_form_group = this._fb.group({
      title: new FormControl(this.task.item.title, Validators.required),
      priority: new FormControl(this.task.item.priority, Validators.required),
      projects: new FormControl(this.task.item.project)
    });
  }

  public ngOnInit(): void { }

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

  public isMarkedDone(): boolean {
    return !!this.item.done;
  }

  public toggleAddNewEntry(): void {
    this._cleanupNewEntry();
    this._is_add_new_entry = !this._is_add_new_entry;
  }

  public isAddNewEntry(): boolean {
    return this._is_add_new_entry;
  }

  public datePickerFilter(d: Date | null): boolean {
    if (!d) {
      return false;
    }
    return (d <= (new Date()));
  }

  public _cleanupNewEntry(): void {
    this.date_picker_form_group.get("from").setValue("");
    this.date_picker_form_group.get("to").setValue("");
    this.time_from_form_group.get("hour").setValue("");
    this.time_from_form_group.get("minutes").setValue("");
    this.time_until_form_group.get("hour").setValue("");
    this.time_until_form_group.get("minutes").setValue("");
  }

  public addNewEntry(): void {
    if (this.add_entry_form_group.invalid) {
      return;
    }

    const date_from: moment.Moment =
      this.date_picker_form_group.get("from").value;
    const date_to: moment.Moment =
      this.date_picker_form_group.get("to").value;
    const from_hour: number = this.time_from_form_group.get("hour").value;
    const from_min: number = this.time_from_form_group.get("minutes").value;
    const until_hour: number = this.time_until_form_group.get("hour").value;
    const until_min: number = this.time_until_form_group.get("minutes").value;

    date_from.hour(from_hour);
    date_from.minute(from_min);
    date_to.hour(until_hour);
    date_to.minute(until_min);

    console.log(`add new entry > from ${date_from} to ${date_to}`);
    this._tasks_svc.addTimerEntry(this.task,
      date_from.toDate(), date_to.toDate()
    );
    this.toggleAddNewEntry();
  }

  public cancelNewEntry(): void {
    this.toggleAddNewEntry();
  }

  public editMode(): void {
    this._is_edit_mode = true;
  }

  public saveEditValues(): void {
    this._is_edit_mode = false;

    const title: string = this.edit_form_group.get("title").value;
    const priority: string = this.edit_form_group.get("priority").value;
    const projects: string[] = this.edit_form_group.get("projects").value;

    if (!title || title === "" || !priority || priority === "" || !projects) {
      return;
    }

    if (!Array.isArray(projects)) {
      throw new Error("projects field expected to be an array");
    }

    this.task.item.title = title;
    this.task.item.priority = priority;
    this.task.item.project = projects;
    this._tasks_svc.updateTask(this.task, this.task.item);
  }

  public isEditMode(): boolean {
    return this._is_edit_mode;
  }

  public getProjects(): BehaviorSubject<string[]> {
    return this._projects_svc.getProjects();
  }
}
