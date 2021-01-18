import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import { PeopleItem, PeopleMap, PeopleService } from 'src/app/services/people-service.service';
import { ProjectItem, ProjectsMap, ProjectsService } from 'src/app/services/projects-service.service';
import { TaskItem, TaskService } from 'src/app/services/task-service.service';
import { TeamItem, TeamsMap, TeamsService } from 'src/app/services/teams-service.service';

@Component({
  selector: 'app-task-add-manually',
  templateUrl: './task-add-manually.component.html',
  styleUrls: ['./task-add-manually.component.scss']
})
export class TaskAddManuallyComponent implements OnInit {

  @Output() finished: EventEmitter<boolean> =
    new EventEmitter<boolean>();


  public add_task_form_group: FormGroup;
  public form_ctrl_title: FormControl;
  public form_ctrl_priority: FormControl;
  public form_ctrl_project: FormControl;
  public form_ctrl_url: FormControl;
  public form_ctrl_notes: FormControl;
  public form_ctrl_assignee: FormControl;
  public form_ctrl_team: FormControl;

  public show_form_url: boolean = false;
  public show_form_notes: boolean = false;
  public show_form_assigned_to: boolean = false;

  public projects: string[] = [];
  public teams: TeamItem[] = [];
  public people: PeopleItem[] = [];


  public constructor(
    private _fb: FormBuilder,
    private _tasks_svc: TaskService,
    private _projects_svc: ProjectsService,
    private _people_svc: PeopleService,
    private _teams_svc: TeamsService
  ) {
    this.form_ctrl_title = new FormControl('');
    this.form_ctrl_priority = new FormControl("medium");
    this.form_ctrl_project = new FormControl('');
    this.form_ctrl_url = new FormControl('');
    this.form_ctrl_notes = new FormControl('');
    this.form_ctrl_assignee = new FormControl("");
    this.form_ctrl_team = new FormControl("");
    this.add_task_form_group = this._fb.group({
      title: this.form_ctrl_title,
      priority: this.form_ctrl_priority,
      project: this.form_ctrl_project,
      url: this.form_ctrl_url,
      notes: this.form_ctrl_notes,
      assignee: this.form_ctrl_assignee,
      team: this.form_ctrl_team
    });
  }

  public ngOnInit(): void {

    this._projects_svc.getProjects().subscribe({
      next: (projects: ProjectsMap) => {
        const project_names: string[] = [];
        Object.values(projects).forEach( (item: ProjectItem) => {
          project_names.push(item.name);
        });
        this.projects = [...project_names];
      }
    });

    this._people_svc.getPeople().subscribe({
      next: (people: PeopleMap) => {
        const peoplelst: PeopleItem[] = [];
        Object.values(people).forEach( (item: PeopleItem) => {
          peoplelst.push(item);
        });
        this.people = [...peoplelst];
      }
    });

    this._teams_svc.getTeams().subscribe({
      next: (teams: TeamsMap) => {
        const teamlst: TeamItem[] = [];
        Object.values(teams).forEach( (item: TeamItem) => {
          teamlst.push(item);
        });
        this.teams = [...teamlst];
      }
    });
  }

  public addNewTask(): void {
    if (!this.add_task_form_group.valid) {
      // ignore form submission: invalid.
      return;
    }
    let project: string = "";
    if (!!this.form_ctrl_project && !!this.form_ctrl_project.value) {
      const tmp: string = this.form_ctrl_project.value as string;
      if (!!tmp) {
        project = tmp;
      }
    }
    const now: Date = new Date();
    const task: TaskItem = {
      title: this.form_ctrl_title.value,
      priority: this.form_ctrl_priority.value,
      project: project,
      url: this.form_ctrl_url.value,
      date: now
    };
    if (!!this.form_ctrl_notes.value && this.form_ctrl_notes.value !== "") {
      task.notes = [{date: now, text: this.form_ctrl_notes.value}];
    }
    if (!!this.form_ctrl_assignee.value && this.form_ctrl_assignee.value > 0) {
      task.assignee = this.form_ctrl_assignee.value;
    }
    if (!!this.form_ctrl_team.value && this.form_ctrl_team.value > 0) {
      task.team = this.form_ctrl_team.value;
    }
    console.log(`add-task > assignee: ${task.assignee}, team: ${task.team}`);
    this._tasks_svc.add(task);
    console.log("add new task > ", task);
    this.finished.next(true);
  }

}
