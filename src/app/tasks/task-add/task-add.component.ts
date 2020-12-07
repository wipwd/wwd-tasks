import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import { ProjectsService } from 'src/app/services/projects-service.service';
import { TaskItem, TaskService } from '../../services/task-service.service';

@Component({
  selector: 'app-task-add',
  templateUrl: './task-add.component.html',
  styleUrls: ['./task-add.component.scss']
})
export class TaskAddComponent implements OnInit {

  @Output() finished: EventEmitter<boolean> =
    new EventEmitter<boolean>();

  public constructor() { }

  public ngOnInit(): void { }

  public mayClose(event: boolean): void {
    if (typeof event !== "boolean") {
      throw new Error("expected boolean for mayClose");
    } else if (event === undefined || event === null) {
      throw new Error("expected defined event");
    }
    if (event) {
      this.finished.next(true);
    }
  }
}
