import { Component, Input, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { BehaviorSubject, interval, Subscription } from 'rxjs';
import { PeopleMap, PeopleService } from 'src/app/services/people-service.service';
import { ProjectsMap, ProjectsService } from 'src/app/services/projects-service.service';
import { TeamsMap, TeamsService } from 'src/app/services/teams-service.service';
import {
  TaskLedgerEntry, TaskService, getTimeDiffStr
} from '../../services/task-service.service';
import { TaskDeleteComponent } from '../task-delete/task-delete.component';
import { TaskInfoComponent } from '../task-info/task-info.component';
import { TaskNotesComponent } from '../task-notes/task-notes.component';

@Component({
  selector: 'app-task-item',
  templateUrl: './task-item.component.html',
  styleUrls: ['./task-item.component.scss']
})
export class TaskItemComponent implements OnInit {

  public team: string = "";
  public assignee: string = "";
  public has_team: boolean = false;
  public has_assignee: boolean = false;

  private _task: TaskLedgerEntry;
  private _running_for_observer: BehaviorSubject<string> =
    new BehaviorSubject<string>("");
  private _running_check_interval_subscription: Subscription;

  private _projects: ProjectsMap = {};
  private _teams_map: TeamsMap = {};
  private _people_map: PeopleMap = {};

  private last_modified: number = 0;

  public constructor(
    private _tasks_svc: TaskService,
    private _projects_svc: ProjectsService,
    private _task_info_dialog: MatDialog,
    private _task_delete_dialog: MatDialog,
    private _task_notes_dialog: MatDialog,
    private _teams_svc: TeamsService,
    private _people_svc: PeopleService
  ) { }

  public ngOnInit(): void {
    if (this._tasks_svc.isTimerRunning(this.task)) {
      this._startTimer();
    } else {
      this._updateTimer();
    }

    this._tasks_svc.getTasks().subscribe({
      next: (entries: TaskLedgerEntry[]) => {
        const our_id = this._task.id;
        entries.forEach( (entry: TaskLedgerEntry) => {
          if (entry.id !== our_id ||
              entry.last_modified <= this.last_modified) {
            console.log("ignore update");
            return;
          }
          console.log("item > update fields");
          this._updateFields();
          this.last_modified = entry.last_modified;
        });
      }
    });

    this._projects_svc.getProjects().subscribe({
      next: (projects: ProjectsMap) => {
        this._projects = projects;
      }
    });

    this._teams_svc.getTeams().subscribe({
      next: (teams: TeamsMap) => {
        this._teams_map = teams;
        this._updateTeamField();
      }
    });

    this._people_svc.getPeople().subscribe({
      next: (people: PeopleMap) => {
        this._people_map = people;
        this._updateAssigneeField();
      }
    });
  }

  @Input() public set task(value: TaskLedgerEntry) {
    this._task = value;
    this.has_assignee =
      (!!this._task.item.assignee && this._task.item.assignee > 0);
    this.has_team =
      (!!this._task.item.team && this._task.item.team > 0);

    this.last_modified = this._task.last_modified;
  }

  public get task(): TaskLedgerEntry {
    return this._task;
  }

  public hasProject(): boolean {
    return this.task.item.project > 0;
  }

  public getProject(): string {
    let str: string = "";
    if (typeof this.task.item.project === "string") {
      str = this.task.item.project;
    } else if (typeof this.task.item.project === "number") {
      if (this.task.item.project > 0) {
        str = this._projects[this.task.item.project].name;
      }
    } else {
      throw new Error(`unknown project type for task ${this.task.item.id}`);
    }
    if (str !== "") {
      return `on ${str}`;
    }
    return "no project";
  }

  public moveNext(): void {
    this._tasks_svc.moveNext(this.task);
  }

  public movePrevious(): void {
    this._tasks_svc.movePrevious(this.task);
  }

  public markDone(): void {
    this._tasks_svc.markDone(this.task);
  }

  public remove(): void {
    const dialogref: MatDialogRef<TaskDeleteComponent> =
      this._task_delete_dialog.open(TaskDeleteComponent);
    dialogref.afterClosed().subscribe({
      next: (result: boolean) => {
        if (result) {
          this._tasks_svc.remove(this.task);
        }
      }
    });
  }

  public archive(): void {
    this._tasks_svc.archive(this.task);
  }

  public hasNext(): boolean {
    return !!this.task.ledger.next;
  }

  public hasPrevious(): boolean {
    return !!this.task.ledger.previous;
  }

  public hasURL(): boolean {
    return !!this.task.item.url && (this.task.item.url !== "");
  }

  public canMarkDone(): boolean {
    return this._tasks_svc.canMarkDone(this.task);
  }

  public isMarkedDone(): boolean {
    return this._tasks_svc.isDone(this.task);
  }

  public openTaskInfo(): void {
    this._task_info_dialog.open(TaskInfoComponent, {
      data: {
        task: this.task
      }
    });
  }

  public openTaskNotes(): void {
    this._task_notes_dialog.open(TaskNotesComponent, {
      data: { task: this.task }
    });
  }

  public getCreatedSince(): string {
    if (!this.task.item.date) {
      return "";
    }
    return `created ${getTimeSince(this.task.item.date)}`;
  }

  public getDoneOn(): string {
    if (!this.task.item.done) {
      return "";
    }
    return `finished ${getTimeSince(this.task.item.done)}`;
  }

  public isRunning(): boolean {
    return this._tasks_svc.isTimerRunning(this.task);
  }

  public isPaused(): boolean {
    return this._tasks_svc.isTimerPaused(this.task);
  }

  public isStopped(): boolean {
    return this._tasks_svc.isTimerStopped(this.task);
  }

  public markStart(): void {
    this._tasks_svc.timerStart(this.task);
    this._startTimer();
  }

  private _updateFields(): void {
    this._updateTeamField();
    this._updateAssigneeField();
  }

  private _updateTeamField(): void {
    if (!this.has_team || Object.keys(this._teams_map).length === 0) {
      return;
    }
    const teamid: number = this._task.item.team;
    if (!(teamid in this._teams_map)) {
      throw new Error(`teamid ${teamid} for task ${this._task.id} DNE`);
    }
    this.team = this._teams_map[teamid].name;
  }

  private _updateAssigneeField(): void {
    if (!this.has_assignee || Object.keys(this._people_map).length === 0) {
      return;
    }
    const id: number = this._task.item.assignee;
    if (!(id in this._people_map)) {
      throw new Error(`assignee id ${id} for task ${this._task.id} DNE`);
    }
    this.assignee = this._people_map[id].name;
  }

  private _startTimer(): void {
    this._running_check_interval_subscription = interval(1000).subscribe({
      next: () => {
        this._updateTimer();
      }
    });
    this._updateTimer();
  }

  private _updateTimer(): void {
    const milisecs: number = this._tasks_svc.getTimerTotal(this.task);
    if (milisecs <= 0) {
      return;
    }
    const secs: number = Math.floor(milisecs / 1000);
    const str: string = getTimeDiffStr(secs, true);
    this._running_for_observer.next(str);
  }

  private _stopTimer(): void {
    this._running_check_interval_subscription.unsubscribe();
  }

  public markPause(): void {
    this._tasks_svc.timerPause(this.task);
    this._stopTimer();
  }

  public markStop(): void {
    this._tasks_svc.timerStop(this.task);
    this._stopTimer();
  }

  public getRunningFor(): BehaviorSubject<string> {
    return this._running_for_observer;
  }

  public hasNotes(): boolean {
    return this._tasks_svc.hasNotes(this.task);
  }

  public getNumNotes(): number {
    return this._tasks_svc.getNoteSize(this.task);
  }
}


function getTimeSince(date: Date): string {
  const now = new Date().getTime();
  const diff = Math.floor((now - date.getTime()) / 1000);
  return `${getTimeDiffStr(diff)} ago`;
}
