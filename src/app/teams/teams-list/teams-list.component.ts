import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import {
  FormBuilder, FormControl, FormGroup, Validators
} from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTable } from '@angular/material/table';
import { TeamsService } from 'src/app/services/teams-service.service';
import { TeamsListDataSource, TeamsListItem } from './teams-list-datasource';

@Component({
  selector: 'app-teams-list',
  templateUrl: './teams-list.component.html',
  styleUrls: ['./teams-list.component.scss']
})
export class TeamsListComponent implements AfterViewInit, OnInit {
  @ViewChild(MatPaginator) public paginator: MatPaginator;
  @ViewChild(MatSort) public sort: MatSort;
  @ViewChild(MatTable) public table: MatTable<TeamsListItem>;
  public dataSource: TeamsListDataSource;
  public displayedColumns = ['id', 'name', 'desc'];

  public show_team_add_form: boolean = false;

  public form_add_team: FormGroup;

  public constructor(
    private _teams_svc: TeamsService,
    private _fb: FormBuilder
  ) {

    this.form_add_team = this._fb.group({
      name: new FormControl("", Validators.required),
      desc: new FormControl("")
    });
  }

  public ngOnInit(): void {
    this.dataSource = new TeamsListDataSource(this._teams_svc);
  }

  public ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
    this.table.dataSource = this.dataSource;
  }

  public toggleTeamAdd(): void {
    this.show_team_add_form = !this.show_team_add_form;
  }

  public addTeam(): void {
    if (!this.form_add_team.valid) {
      return;
    }

    const _name: string = this.form_add_team.get("name").value;
    if (!_name || _name === "") {
      throw new Error("expected a non-null/not empty team name");
    }
    const _desc: string = this.form_add_team.get("desc").value;
    this._teams_svc.add(_name, _desc);
    this.form_add_team.setValue({name: "", desc: ""});
    this.show_team_add_form = false;
  }
}
