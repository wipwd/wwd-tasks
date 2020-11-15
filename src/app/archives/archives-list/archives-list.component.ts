import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTable } from '@angular/material/table';
import { TaskArchiveEntry, TaskService } from '../../services/task-service.service';
import { ArchivesListDataSource } from './archives-list-datasource';

@Component({
  selector: 'app-archives-list',
  templateUrl: './archives-list.component.html',
  styleUrls: ['./archives-list.component.scss']
})
export class ArchivesListComponent implements AfterViewInit, OnInit {
  @ViewChild(MatPaginator) public paginator: MatPaginator;
  @ViewChild(MatSort) public sort: MatSort;
  @ViewChild(MatTable) public table: MatTable<TaskArchiveEntry>;
  public data_source: ArchivesListDataSource;
  public displayedColumns = ['title', 'priority', 'projects'];

  public constructor(
    private _tasks_svc: TaskService
  ) { }

  public ngOnInit(): void {
    this.data_source = new ArchivesListDataSource(this._tasks_svc);
  }

  public ngAfterViewInit(): void {
    this.data_source.sort = this.sort;
    this.data_source.paginator = this.paginator;
    this.table.dataSource = this.data_source;
  }
}
