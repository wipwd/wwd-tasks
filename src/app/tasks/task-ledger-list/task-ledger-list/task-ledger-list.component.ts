import { Component, Input, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ColumnMode } from '@swimlane/ngx-datatable';
import { BehaviorSubject, interval } from 'rxjs';
import { FilteredTasksService } from 'src/app/services/filtered-tasks-service.service';
import { PeopleMap, PeopleService } from 'src/app/services/people-service.service';
import { ProjectsMap, ProjectsService } from 'src/app/services/projects-service.service';
import {
  getTimeDiffStr,
  TaskLedgerEntry,
  TaskService
} from 'src/app/services/task-service.service';
import { TeamsMap, TeamsService } from 'src/app/services/teams-service.service';
import { TaskDeleteComponent } from '../../task-delete/task-delete.component';
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
  created_on_ms: number;
  finished_on: Date;
  is_done: boolean;
  raw_task: TaskLedgerEntry;
}

declare type CreatedOnMap = {[id: string]: string};
declare type TimeSpentMap = {[id: string]: string};

@Component({
  selector: 'app-task-ledger-list',
  templateUrl: './task-ledger-list.component.html',
  styleUrls: ['./task-ledger-list.component.scss']
})
export class TaskLedgerListComponent implements OnInit {

  @Input() public ledger: string = "backlog";
  @Input() public prio: string = "medium";
  @Input() public sorting: BehaviorSubject<TaskSortItem>;


  public has_next_ledger: boolean = true;
  public has_backlog_ledger: boolean = true;

  public column_mode = ColumnMode.force;
  public rows: TaskListItem[] = [];
  public created_on: BehaviorSubject<CreatedOnMap> =
    new BehaviorSubject<CreatedOnMap>({});
  public time_spent: BehaviorSubject<TimeSpentMap> =
    new BehaviorSubject<TimeSpentMap>({});
  public has_timer: {[id: string]: boolean} = {};
  public has_running_timer: {[id: string]: boolean} = {};

  private _teams_map: TeamsMap = {};
  private _projects_map: ProjectsMap = {};
  private _people_map: PeopleMap = {};
  private _wanted_tasks: TaskLedgerEntry[] = [];
  private _has_started_loop: boolean = false;


  public constructor(
    private _tasks_svc: TaskService,
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

    if (this.ledger.toLowerCase() === "backlog") {
      this.has_backlog_ledger = false;
    } else if (this.ledger.toLowerCase() === "done") {
      this.has_next_ledger = false;
    }

  }

  private _getTimeStr(ms: number, with_secs: boolean): string {
    const diff: number = Math.floor(ms / 1000);
    return getTimeDiffStr(diff, with_secs);
  }

  private _getCreatedOn(row: TaskListItem): string {
    if (!row.created_on) {
      return "";
    }
    const now: number = new Date().getTime();
    const ts: number = row.created_on.getTime();
    return this._getTimeStr((now - ts), false);
  }

  private _updateCreatedOn(): void {

    const created_on: CreatedOnMap = {};
    const now: number = new Date().getTime();
    this.rows.forEach( (row: TaskListItem) => {
      const createdon: string = this._getCreatedOn(row);
      created_on[row.id] = createdon;
    });
    this.created_on.next(created_on);
  }

  private _updateTimers(): void {
    const time_spent: TimeSpentMap = {};
    const has_timer: {[id: string]: boolean} = {};
    const running_timer: {[id: string]: boolean} = {};
    this.rows.forEach( (row: TaskListItem) => {
      const running: boolean = this._tasks_svc.isTimerRunning(row.raw_task);
      const timer_total: number = this._tasks_svc.getTimerTotal(row.raw_task);
      has_timer[row.id] = (timer_total > 0);
      running_timer[row.id] = running;
      if (!has_timer[row.id]) {
        if (running_timer[row.id]) {
          throw new Error("task has running timer yet no timer");
        }
        return;
      }
      time_spent[row.id] = this._getTimeStr(timer_total, true);
    });
    this.time_spent.next(time_spent);
    this.has_timer = has_timer;
    this.has_running_timer = running_timer;
  }

  private _startUpdateLoop(): void {
    if (this._has_started_loop) {
      return;
    }

    interval(1000).subscribe({
      next: () => {
        this._updateCreatedOn();
        this._updateTimers();
      }
    });
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

      const row: TaskListItem = {
        id: task.id,
        title: task.item.title,
        assignee: person,
        team: teamname,
        project: prj,
        url: task.item.url,
        created_on: task.item.date,
        created_on_ms: (!!task.item.date ? task.item.date.getTime() : 0),
        finished_on: task.item.done,
        is_done: !!task.item.done,
        raw_task: task
      };
      rows.push(row);
    });

    this.rows = [...rows];

    this._startUpdateLoop();
  }

  public showTaskInfo(row: TaskListItem): void {
    this._dialog.open(TaskInfoComponent, {
      data: { task: row.raw_task }
    });
  }

  public moveTaskForward(row: TaskListItem): void {
    this._tasks_svc.moveNext(row.raw_task);
  }

  public moveTaskToBacklog(row: TaskListItem): void {
    this._tasks_svc.movePrevious(row.raw_task);
  }

  public deleteTask(row: TaskListItem): void {

    const dialogref: MatDialogRef<TaskDeleteComponent> =
      this._dialog.open(TaskDeleteComponent);
    dialogref.afterClosed().subscribe({
      next: (result: boolean) => {
        if (result) {
          this._tasks_svc.remove(row.raw_task);
        }
      }
    });
  }

  public markDone(row: TaskListItem): void {
    this._tasks_svc.markDone(row.raw_task);
  }

  public startTimer(row: TaskListItem): void {
    this._tasks_svc.timerStart(row.raw_task);
  }

  public pauseTimer(row: TaskListItem): void {
    this._tasks_svc.timerPause(row.raw_task);
  }
}
