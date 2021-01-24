import { Component, OnInit } from '@angular/core';
import {
  FormBuilder, FormControl, FormGroup, Validators
} from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ColumnMode } from '@swimlane/ngx-datatable';
import { PeopleService } from 'src/app/services/people-service.service';
import { TaskByPeopleMap, TaskByPeopleService, TasksByPerson } from 'src/app/services/task-by-people-service.service';
import { TeamItem, TeamsMap, TeamsService } from 'src/app/services/teams-service.service';
import { PeopleDeleteComponent } from '../people-delete/people-delete.component';


interface PeopleListItem {
  id: number;
  name: string;
  team: string;
  tasks: number;
}


@Component({
  selector: 'app-people-list',
  templateUrl: './people-list.component.html',
  styleUrls: ['./people-list.component.scss']
})
export class PeopleListComponent implements OnInit {

  public ColumnMode = ColumnMode;

  public show_people_add_form: boolean = false;
  public form_add_people: FormGroup;

  public rows: PeopleListItem[] = [];
  public teams: {[id: number]: string} = {};

  private _people_map: TaskByPeopleMap = {};
  private _teams_map: TeamsMap = {};

  public constructor(
    private _task_by_people_svc: TaskByPeopleService,
    private _teams_svc: TeamsService,
    private _people_svc: PeopleService,
    private _dialog: MatDialog,
    private _fb: FormBuilder
  ) {
    this.form_add_people = this._fb.group({
      name: new FormControl("", Validators.required),
      team: new FormControl("")
    });
  }

  public ngOnInit(): void {
    this._task_by_people_svc.getTasksByPeople().subscribe({
      next: (people_map: TaskByPeopleMap) => {
        this._people_map = people_map;
        this._update();
      }
    });

    this._teams_svc.getTeams().subscribe({
      next: (teams_map: TeamsMap) => {
        this._teams_map = teams_map;

        const teams: {[id: number]: string} = {};
        Object.values(teams_map).forEach( (team: TeamItem) => {
          teams[team.id] = team.name;
        });
        this.teams = teams;
        this._update();
      }
    });
  }

  private _update(): void {
    const rows: PeopleListItem[] = [];

    Object.values(this._people_map).forEach( (value: TasksByPerson) => {
      const team_id: number = (!!value.person.teamid ? value.person.teamid : 0);
      const team_name: string =
        (team_id in this._teams_map ? this._teams_map[team_id].name : "");

      const item: PeopleListItem = {
        id: value.person.id,
        name: value.person.name,
        team: team_name,
        tasks: value.tasks.length
      };
      rows.push(item);
    });

    this.rows = [...rows];
  }

  private _removePerson(item: PeopleListItem): void {
    this._people_svc.remove(item.name);
  }

  public togglePeopleAdd(): void {
    this.show_people_add_form = !this.show_people_add_form;
    this.form_add_people.setValue({name: "", team: ""});
  }

  public addPeople(): void {
    if (!this.form_add_people.valid) {
      return;
    }

    let name: string = this.form_add_people.get("name").value;
    if (!name) {
      return;
    }
    name = name.trim();
    if (name === "") {
      return;
    }

    let teamid: number = +(this.form_add_people.get("team").value);
    if (!teamid || teamid < 0) {
      teamid = 0;
    }

    this._people_svc.add(name, teamid);
    this.form_add_people.setValue({name: "", team: ""});
    this.show_people_add_form = false;
  }

  public removePerson(item: PeopleListItem): void {
    const dialogref: MatDialogRef<PeopleDeleteComponent> =
      this._dialog.open(PeopleDeleteComponent);
    dialogref.afterClosed().subscribe({
      next: (result: boolean) => {
        if (result) {
          this._removePerson(item);
        }
      }
    });
  }
}
