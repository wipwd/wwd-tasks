import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { TaskItem, TaskService } from '../../services/task-service.service';

@Component({
  selector: 'app-task-add',
  templateUrl: './task-add.component.html',
  styleUrls: ['./task-add.component.scss']
})
export class TaskAddComponent implements OnInit {

  @Output() finished: EventEmitter<boolean> =
    new EventEmitter<boolean>();

  public add_task_form_group: FormGroup;
  public form_ctrl_title: FormControl;
  public form_ctrl_priority: FormControl;
  public form_ctrl_project: FormControl;
  public form_ctrl_url: FormControl;

  public constructor(
    private _fb: FormBuilder,
    private _tasks_svc: TaskService
  ) {
    this.form_ctrl_title = new FormControl('');
    this.form_ctrl_priority = new FormControl("medium");
    this.form_ctrl_project = new FormControl('');
    this.form_ctrl_url = new FormControl('');
    this.add_task_form_group = this._fb.group({
      title: this.form_ctrl_title,
      priority: this.form_ctrl_priority,
      project: this.form_ctrl_project,
      url: this.form_ctrl_url
    });
  }

  public ngOnInit(): void {
  }


  public addNewTask(): void {
    if (!this.add_task_form_group.valid) {
      // ignore form submission: invalid.
      return;
    }
    const project_lst: string[] = [];
    if (!!this.form_ctrl_project && !!this.form_ctrl_project.value) {
      const tmp: string[] = this.form_ctrl_project.value as string[];
      tmp.forEach( (project: string) => {
        if (!!project) {
          project_lst.push(project);
        }
      });
    }
    const task: TaskItem = {
      title: this.form_ctrl_title.value,
      priority: this.form_ctrl_priority.value,
      project: project_lst,
      url: this.form_ctrl_url.value
    };
    this._tasks_svc.add(task);
    console.log("add new task > ", task);
    this.finished.next(true);
  }
}
