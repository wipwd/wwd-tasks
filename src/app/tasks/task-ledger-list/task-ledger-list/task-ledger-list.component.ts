import { Component, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ColumnMode } from '@swimlane/ngx-datatable';
import { BehaviorSubject, interval } from 'rxjs';
import { FilteredTasksService } from 'src/app/services/filtered-tasks-service.service';
import { PeopleMap, PeopleService } from 'src/app/services/people-service.service';
import { ProjectsMap, ProjectsService } from 'src/app/services/projects-service.service';
import {
  getTimeDiffStr,
  TaskLedgerEntry
} from 'src/app/services/task-service.service';
import { TeamsMap, TeamsService } from 'src/app/services/teams-service.service';
import { TaskInfoComponent } from '../../task-info/task-info.component';
import { TaskSortItem } from '../../task-organizer/task-list-options';


interface TaskListItem {
  id: string;
  title: string;
  assignee: string;
  team: string;
  project: string;
  url: string;
  created_on: Date;
  finished_on: Date;
  raw_task: TaskLedgerEntry;
}

declare type CreatedOnMap = {[id: string]: string};

@Component({
  selector: 'app-task-ledger-list',
  templateUrl: './task-ledger-list.component.html',
  styleUrls: ['./task-ledger-list.component.scss']
})
export class TaskLedgerListComponent implements OnInit {

  @Input() public ledger: string = "backlog";
  @Input() public prio: string = "medium";
  @Input() public sorting: BehaviorSubject<TaskSortItem>;


  public column_mode = ColumnMode.force;
  public rows: TaskListItem[] = [];
  public created_on: BehaviorSubject<CreatedOnMap> =
    new BehaviorSubject<CreatedOnMap>({});

  private _teams_map: TeamsMap = {};
  private _projects_map: ProjectsMap = {};
  private _people_map: PeopleMap = {};
  private _wanted_tasks: TaskLedgerEntry[] = [];
  private _has_started_timer: boolean = false;


  public constructor(
    private _filtered_tasks_svc: FilteredTasksService,
    private _teams_svc: TeamsService,
    private _projects_svc: ProjectsService,
    private _people_svc: PeopleService,
    private _dialog: MatDialog,
  ) { }

  public ngOnInit(): void {

    this._teams_svc.getTeams().subscribe({
      next: (teams: TeamsMap) => {
        this._teams_map = teams;
        this._update();
      }
    });

    this._projects_svc.getProjects().subscribe({
      next: (projects: ProjectsMap) => {
        this._projects_map = projects;
        this._update();
      }
    });

    this._people_svc.getPeople().subscribe({
      next: (people: PeopleMap) => {
        this._people_map = people;
        this._update();
      }
    });

    this._filtered_tasks_svc.getLedger(this.ledger).subscribe({
      next: (filtered_tasks: TaskLedgerEntry[]) => {
        const wanted_tasks: TaskLedgerEntry[] = [];
        filtered_tasks.forEach( (task: TaskLedgerEntry) => {
          if (task.item.priority === this.prio) {
            wanted_tasks.push(task);
          }
        });

        this._wanted_tasks = wanted_tasks;
        this._update();
      }
    });
  }


  private _getCreatedOn(row: TaskListItem): string {
    if (!row.created_on) {
      return "";
    }
    const now: number = new Date().getTime();
    const diff: number = Math.floor((now - row.created_on.getTime()) / 1000);
    return getTimeDiffStr(diff, false);
  }

  private _updateCreatedOn(): void {

    const created_on: CreatedOnMap = {};
    const now: number = new Date().getTime();
    this.rows.forEach( (row: TaskListItem) => {
      const createdon: string = this._getCreatedOn(row);
      created_on[row.id] = createdon;
    });
    this.created_on.next(created_on);

    if (!this._has_started_timer) {
      interval(1000).subscribe({
        next: () => this._updateCreatedOn()
      });
      this._has_started_timer = true;
    }

  }

  private _update(): void {

    const rows: TaskListItem[] = [];
    this._wanted_tasks.forEach( (task: TaskLedgerEntry) => {

      if (typeof task.item.project !== "number") {
        throw new Error(`expected number project id for task ${task.id}`);
      }

      const prjid: number = task.item.project;
      const peopleid: number = (!!task.item.assignee ? task.item.assignee : 0);
      const teamid: number = (!!task.item.team ? task.item.team : 0);

      const prj: string =
        (prjid in this._projects_map ? this._projects_map[prjid].name : "");
      const person: string =
        (peopleid in this._people_map ? this._people_map[peopleid].name : "");
      const teamname: string =
        (teamid in this._teams_map ? this._teams_map[teamid].name : "");

      console.log(`task title ${task.item.title} created ${task.item.date}`);

      const row: TaskListItem = {
        id: task.id,
        title: task.item.title,
        assignee: person,
        team: teamname,
        project: prj,
        url: task.item.url,
        created_on: task.item.date,
        finished_on: task.item.done,
        raw_task: task
      };
      rows.push(row);
    });

    this.rows = [...rows];

    this._updateCreatedOn();
  }

  public showTaskInfo(row: TaskListItem): void {
    this._dialog.open(TaskInfoComponent, {
      data: { task: row.raw_task }
    });
  }
}
