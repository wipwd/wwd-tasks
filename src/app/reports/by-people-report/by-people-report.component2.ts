import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import {
  PeopleItem, PeopleMap, PeopleService
} from 'src/app/services/people-service.service';
import {
  ProjectItem,
  ProjectsMap, ProjectsService
} from 'src/app/services/projects-service.service';
import { TaskItem, TaskLedgerEntry, TaskService } from 'src/app/services/task-service.service';
import { TaskByPeopleMap, TaskByPeopleService, TasksByPerson } from '../../services/task-by-people-service.service';

export interface PeopleTask {
  task: TaskLedgerEntry;
  project: string;
}

interface PersonTaskItem {
  person_name: string;
  per_project: {[id: string]: number};
}

@Component({
  selector: 'app-by-people-report',
  templateUrl: './by-people-report.component.html',
  styleUrls: ['./by-people-report.component.scss']
})
export class ByPeopleReportComponent implements OnInit, OnDestroy {

  public projects: ProjectsMap = {};
  public data: PersonTaskItem[] = [];

  private _tasks_by_people: TaskByPeopleMap = {};

  private _projects_subscription: Subscription;
  private _tasks_by_people_subscription: Subscription;

  public constructor(
    private _projects_svc: ProjectsService,
    private _task_by_people_svc: TaskByPeopleService
  ) { }

  public ngOnInit(): void {

    this._projects_subscription = this._projects_svc.getProjects().subscribe({
      next: (projects: ProjectsMap) => {
        this.projects = projects;
        this._update();
      }
    });

    this._tasks_by_people_subscription =
        this._task_by_people_svc.getTasksByPeople().subscribe({
      next: (tasks_by_people: TaskByPeopleMap) => {
        this._tasks_by_people = tasks_by_people;
        this._update();
      }
    });

  }

  public ngOnDestroy(): void {

    if (!!this._tasks_by_people_subscription) {
      this._tasks_by_people_subscription.unsubscribe();
    }
  }

  private _update(): void {

    const data: PersonTaskItem[] = [];

    Object.values(this._tasks_by_people).forEach( (value: TasksByPerson) => {

      const person_item: PersonTaskItem = {
        person_name: value.person.name,
        per_project: {}
      };

      Object.values(this.projects).forEach( (prj: ProjectItem) => {
        person_item.per_project[prj.name] = 0;
      });

      value.tasks.forEach( (entry: TaskLedgerEntry) => {
        const prjid: number = (entry.item.project as number);
        if (prjid === 0 || !(prjid in this.projects)) {
          return;
        }
        const prjname: string = this.projects[prjid].name;
        person_item.per_project[prjname] ++;
      });

      data.push(person_item);
    });

    this.data = [...data];
  }

}
