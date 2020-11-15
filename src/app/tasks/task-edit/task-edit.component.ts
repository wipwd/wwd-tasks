import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { BehaviorSubject } from 'rxjs';
import { ProjectsService } from 'src/app/services/projects-service.service';
import { TaskItem, TaskLedgerEntry, TaskService } from 'src/app/services/task-service.service';

export interface TaskEditDialogData {
  task: TaskLedgerEntry;
}

@Component({
  selector: 'app-task-edit',
  templateUrl: './task-edit.component.html',
  styleUrls: ['./task-edit.component.scss']
})
export class TaskEditComponent implements OnInit {

  public task: TaskLedgerEntry;
  public item: TaskItem;
  public edit_task_form_group: FormGroup;
  public form_ctrl_title: FormControl;
  public form_ctrl_priority: FormControl;
  public form_ctrl_projects: FormControl;
  public form_ctrl_url: FormControl;

  public constructor(
    @Inject(MAT_DIALOG_DATA) private _data: TaskEditDialogData,
    private _fb: FormBuilder,
    private _projects_svc: ProjectsService,
    private _tasks_svc: TaskService,
    private _dialog_ref: MatDialogRef<TaskEditComponent>
  ) {
    this.task = this._data.task;
    this.item = this.task.item;

    this.form_ctrl_title = new FormControl(this.item.title);
    this.form_ctrl_priority = new FormControl(this.item.priority);
    this.form_ctrl_projects = new FormControl(this.item.project);
    this.form_ctrl_url = new FormControl(this.item.url);
    this.edit_task_form_group = this._fb.group({
      title: this.form_ctrl_title
    });
    console.log("item projects: ", this.item.project);
  }

  public ngOnInit(): void {
  }

  public save(): void {
    const new_item: TaskItem = {
      title: this.form_ctrl_title.value,
      priority: this.form_ctrl_priority.value,
      project: this.form_ctrl_projects.value,
      url: this.form_ctrl_url.value
    };
    this._tasks_svc.updateTask(this.task, new_item);
    this._dialog_ref.close();
  }

  public getProjects(): BehaviorSubject<string[]> {
    return this._projects_svc.getProjects();
  }
}
