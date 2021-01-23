import { Component, OnInit, ViewChild } from '@angular/core';
import { ColumnMode, TableColumn } from '@swimlane/ngx-datatable';
import { ProjectItem, ProjectsMap, ProjectsService } from 'src/app/services/projects-service.service';
import { TaskByPeopleMap, TaskByPeopleService, TasksByPerson } from 'src/app/services/task-by-people-service.service';
import { TaskLedgerEntry } from 'src/app/services/task-service.service';

interface ByPeopleReportItem {
  person_name: string;
  per_project: {[id: string]: number};
  num_high: number;
  num_med: number;
  num_low: number;
}

@Component({
  selector: 'app-by-people-report',
  templateUrl: './by-people-report.component.html',
  styleUrls: ['./by-people-report.component.scss']
})
export class ByPeopleReportComponent implements OnInit {

  @ViewChild("peopleTable") public table: any;

  public rows: any[] = [];
  public cols: TableColumn[] = [];

  public ColumnMode = ColumnMode;
  public projects: string[] = [];

  private _tasks_by_people: TaskByPeopleMap = {};
  private _person_tasks: ByPeopleReportItem[] = [];
  private _projects_map: ProjectsMap = {};
  private _projects: string[] = [];

  public constructor(
    private _projects_svc: ProjectsService,
    private _task_by_people_svc: TaskByPeopleService
  ) { }


  public ngOnInit(): void {
    this._projects_svc.getProjects().subscribe({
      next: (prjs: ProjectsMap) => {
        const tmp: string[] = [];
        Object.values(prjs).forEach( (prj: ProjectItem) => {
          tmp.push(prj.name);
        });
        this._projects_map = prjs;
        this._projects = [...tmp];
        this._update();
      }
    });

    this._task_by_people_svc.getTasksByPeople().subscribe({
      next: (tasks_by_people: TaskByPeopleMap) => {
        this._tasks_by_people = tasks_by_people;
        this._update();
      }
    });
  }

  public toggleExpandRow(row: any): void {
    console.log("expand detail > row: ", row);
    this.table.rowDetail.toggleExpandRow(row);
  }

  private _updatePeople(): void {

    const people_items: ByPeopleReportItem[] = [];
    Object.values(this._tasks_by_people).forEach( (value: TasksByPerson) => {
      const item: ByPeopleReportItem = {
        person_name: value.person.name,
        per_project: {},
        num_high: 0, num_med: 0, num_low: 0
      };
      // init all projects
      this._projects.forEach( (prj: string) => {
        item.per_project[prj] = 0;
      });

      value.tasks.forEach( (entry: TaskLedgerEntry) => {
        if (typeof entry.item.project !== "number") {
          throw new TypeError("expected a number for project");
        }
        const prjid: number = entry.item.project;
        if (prjid === 0 || !(prjid in this._projects_map)) {
          return;
        }
        const prjname: string = this._projects_map[prjid].name;
        if (prjname === "") {
          throw new Error("unexpected empty project name");
        }
        item.per_project[prjname] ++;
        switch (entry.item.priority) {
          case "high": item.num_high ++; break;
          case "medium": item.num_med ++; break;
          case "low": item.num_low ++; break;
        }
      });
      people_items.push(item);
    });
    this._person_tasks = [...people_items];
  }

  private _update(): void {
    if (Object.keys(this._tasks_by_people).length === 0 ||
        this._projects.length === 0) {
      return;
    }

    this._updatePeople();

    const projects: string[] = [];
    const rows: any[] = [];
    const cols: TableColumn[] = [{name: "Name", sortable: true}];
    this._projects.forEach( (prj: string) => {
      cols.push({name: prj, sortable: true});
      projects.push(prj);
    });

    this._person_tasks.forEach( (item: ByPeopleReportItem) => {
      const row: {[id: string]: any} = {};
      row.name = item.person_name;
      this._projects.forEach( (prj: string) => {
        let n: number = 0;
        if (prj in item.per_project) {
          n = item.per_project[prj];
        }
        row[prj] = n;
      });
      row.prio_high = item.num_high;
      row.prio_medium = item.num_med;
      row.prio_low = item.num_low;
      rows.push(row);
    });

    this.rows = [...rows];
    this.cols = [...cols];
    this.projects = [...projects];
  }
}
