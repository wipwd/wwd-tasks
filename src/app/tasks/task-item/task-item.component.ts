import { Component, Input, OnInit } from '@angular/core';
import { TaskLedgerEntry } from 'src/app/services/task-service.service';

@Component({
  selector: 'app-task-item',
  templateUrl: './task-item.component.html',
  styleUrls: ['./task-item.component.scss']
})
export class TaskItemComponent implements OnInit {

  @Input() task: TaskLedgerEntry;

  public constructor() { }

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

}
