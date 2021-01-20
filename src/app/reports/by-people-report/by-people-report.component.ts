import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTable } from '@angular/material/table';
import { ProjectItem, ProjectsMap, ProjectsService } from 'src/app/services/projects-service.service';
import { TaskByPeopleService } from 'src/app/services/task-by-people-service.service';
import { ByPeopleReportDataSource, ByPeopleReportItem } from './by-people-report-datasource';

@Component({
  selector: 'app-by-people-report',
  templateUrl: './by-people-report.component.html',
  styleUrls: ['./by-people-report.component.scss']
})
export class ByPeopleReportComponent implements AfterViewInit, OnInit {
  @ViewChild(MatPaginator) public paginator: MatPaginator;
  @ViewChild(MatSort) public sort: MatSort;
  @ViewChild(MatTable) public table: MatTable<ByPeopleReportItem>;
  public dataSource: ByPeopleReportDataSource;
  public displayedColumns = ['name'];

  public projects: string[] = [];

  public constructor(
    private _projects_svc: ProjectsService,
    private _task_by_people_svc: TaskByPeopleService
  ) { }


  public ngOnInit(): void {
    this.dataSource = new ByPeopleReportDataSource(
      this._projects_svc, this._task_by_people_svc
    );

    this._projects_svc.getProjects().subscribe({
      next: (prjs: ProjectsMap) => {
        Object.values(prjs).forEach( (prj: ProjectItem) => {
          this.displayedColumns.push(prj.name);
          this.projects.push(prj.name);
        });
      }
    });
  }

  public ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
    this.table.dataSource = this.dataSource;
  }
}
