import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTable } from '@angular/material/table';
import { PeopleService } from 'src/app/services/people-service.service';
import { PeopleListDataSource, PeopleListItem } from './people-list-datasource';

@Component({
  selector: 'app-people-list',
  templateUrl: './people-list.component.html',
  styleUrls: ['./people-list.component.scss']
})
export class PeopleListComponent implements AfterViewInit, OnInit {
  @ViewChild(MatPaginator) public paginator: MatPaginator;
  @ViewChild(MatSort) public sort: MatSort;
  @ViewChild(MatTable) public table: MatTable<PeopleListItem>;
  public dataSource: PeopleListDataSource;
  public displayedColumns = ['id', 'name', 'team', 'num_tasks'];

  public show_people_add_form: boolean = false;
  public form_add_people: FormGroup;

  public constructor(
    private _people_svc: PeopleService,
    private _fb: FormBuilder
  ) {
    this.form_add_people = this._fb.group({
      name: new FormControl("", Validators.required),
      team: new FormControl("")
    });
  }

  public ngOnInit(): void {
    this.dataSource = new PeopleListDataSource(this._people_svc);
  }

  public ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
    this.table.dataSource = this.dataSource;
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
}
