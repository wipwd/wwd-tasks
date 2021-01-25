import { Component, Inject, OnInit } from '@angular/core';
import {
  FormBuilder, FormControl, FormGroup, Validators
} from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { PeopleItem, PeopleMap, PeopleService } from 'src/app/services/people-service.service';
import { ProjectItem, ProjectsMap, ProjectsService } from 'src/app/services/projects-service.service';
import { TeamItem, TeamsMap, TeamsService } from 'src/app/services/teams-service.service';
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

  // edit mode
  public is_edit_mode: boolean = false;
  public edit_form_group: FormGroup;
  public edit_projects: {[id: number]: string};
  public edit_teams: {[id: number]: string} = {};
  public edit_assignees: {[id: number]: string} = {};

  public project: string = "none";
  public has_team: boolean = false;
  public has_assignee: boolean = false;
  public team: string = "";
  public assignee: string = "";

  // timesheet add entry
  public add_entry_form_group: FormGroup;
  // date picker form group
  public date_picker_form_group: FormGroup;
  public time_from_form_group: FormGroup;
  public time_until_form_group: FormGroup;

  public content: string = "timesheet";

  private _is_add_new_entry: boolean = false;


  public constructor(
    @Inject(MAT_DIALOG_DATA) private _data: TaskInfoDialogData,
    private _fb: FormBuilder,
    private _tasks_svc: TaskService,
    private _projects_svc: ProjectsService,
    private _teams_svc: TeamsService,
    private _people_svc: PeopleService
  ) {
    this.task = this._data.task;

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

    this._populateEditForm();
    this._updateEditForm();
  }

  private _populateEditForm(): void {
    this.edit_form_group = this._fb.group({
      title: new FormControl("", Validators.required),
      priority: new FormControl("", Validators.required),
      projects: new FormControl(),
      assignee: new FormControl(),
      team: new FormControl()
    });
  }

  private _updateEditForm(): void {
    const item: TaskItem = this.task.item;
    if (typeof item.project !== "number") {
      throw new Error("project type is not a number; old format!");
    }

    const projectid: number = (!!item.project ? item.project : 0);
    const assigneeid: number = (!!item.assignee ? item.assignee : 0);
    const teamid: number = (!!item.team ? item.team : 0);
    this.edit_form_group.setValue({
      title: this.task.item.title,
      priority: this.task.item.priority,
      projects: `${projectid}`,
      assignee: `${assigneeid}`,
      team: `${teamid}`
    });
  }

  private _updateFields(): void {
    const item: TaskItem = this.task.item;
    this.has_team = (!!item.team && item.team > 0);
    this.has_assignee = (!!item.assignee && item.assignee > 0);

    if (typeof item.project !== "number") {
      throw new Error("old project version not supported");
    }
    if (item.project > 0) {
      const project_item: ProjectItem =
        this._projects_svc.getProjectByID(item.project);
      if (!project_item) {
        throw new Error(`could not find project ${item.project}`);
      }
      this.project = project_item.name;
    }

    if (this.has_assignee && Object.keys(this.edit_assignees).length > 0) {
      this.assignee = this.edit_assignees[item.assignee];
    }
    if (this.has_team && Object.keys(this.edit_teams).length > 0) {
      this.team = this.edit_teams[item.team];
    }
  }

  public ngOnInit(): void {

    this._updateFields();

    this._projects_svc.getProjects().subscribe({
      next: (projects: ProjectsMap) => {
        this.edit_projects = {};
        Object.values(projects).forEach( (item: ProjectItem) => {
          this.edit_projects[item.id] = item.name;
        });
        this._updateFields();
        this._updateEditForm();
      }
    });

    this._teams_svc.getTeams().subscribe({
      next: (teams: TeamsMap) => {
        this.edit_teams = {};
        Object.values(teams).forEach( (item: TeamItem) => {
          this.edit_teams[item.id] = item.name;
        });
        if (this.has_team) {
          this.team = this.edit_teams[this.task.item.team];
        }
        this._updateFields();
        this._updateEditForm();
      }
    });

    this._people_svc.getPeople().subscribe({
      next: (people: PeopleMap) => {
        this.edit_assignees = {};
        Object.values(people).forEach( (item: PeopleItem) => {
          this.edit_assignees[item.id] = item.name;
        });
        if (this.has_assignee) {
          this.assignee = this.edit_assignees[this.task.item.assignee];
        }
        this._updateFields();
        this._updateEditForm();
      }
    });
  }

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
    this.task.item.timer?.intervals.forEach( (interval: TaskTimerItem) => {
      total_diff += this._timeSpent(interval);
    });
    return getTimeDiffStr(total_diff, true);
  }

  public isMarkedDone(): boolean {
    return !!this.task.item.done;
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
    this.is_edit_mode = true;
  }

  public saveEditValues(): void {
    this.is_edit_mode = false;

    const title: string = this.edit_form_group.get("title").value;
    const priority: string = this.edit_form_group.get("priority").value;
    const project: number = +this.edit_form_group.get("projects").value;
    const assignee_id: number = +this.edit_form_group.get("assignee").value;
    const team_id: number = +this.edit_form_group.get("team").value;

    if (!title || title === "" || !priority || priority === "" ||
        typeof project === "undefined") {
      console.log("info > edit > not valid!");
      return;
    }

    if (typeof assignee_id === "undefined" || typeof team_id === "undefined") {
      throw new Error("unexpected undefined on assignee or team edit");
    }

    if (typeof project !== "number") {
      throw new Error("project field expected to be a number");
    }

    this.task.item.title = title;
    this.task.item.priority = priority;
    this.task.item.project = project;
    this.task.item.assignee = assignee_id;
    this.task.item.team = team_id;
    this._tasks_svc.updateTask(this.task, this.task.item);
    this._updateFields();
  }

}
