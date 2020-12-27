import { AfterViewInit, Component, Input, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTable } from '@angular/material/table';
import { BehaviorSubject } from 'rxjs';
import { FilteredTasksService } from 'src/app/services/filtered-tasks-service.service';
import { ProjectsService } from 'src/app/services/projects-service.service';
import {
  TaskLedgerEntry, TaskService
} from 'src/app/services/task-service.service';
import { TaskSortItem } from '../../task-organizer/task-list-options';
import { TaskLedgerListDataSource } from './task-ledger-list-datasource';

@Component({
  selector: 'app-task-ledger-list',
  templateUrl: './task-ledger-list.component.html',
  styleUrls: ['./task-ledger-list.component.scss']
})
export class TaskLedgerListComponent implements AfterViewInit, OnInit {

  @Input() public ledger: string = "backlog";
  @Input() public prio: string = "medium";
  @Input() public sorting: BehaviorSubject<TaskSortItem>;

  @ViewChild(MatPaginator) public paginator: MatPaginator;
  @ViewChild(MatTable) public table: MatTable<TaskLedgerEntry>;
  public data_source: TaskLedgerListDataSource;

  public displayedColumns = ['id', 'name'];

  public constructor(
    private _tasks_svc: TaskService,
    private _projects_svc: ProjectsService,
    private _filtered_tasks_svc: FilteredTasksService
  ) { }

  public ngOnInit(): void {
    this.data_source =
      new TaskLedgerListDataSource(
        this._filtered_tasks_svc,
        this._tasks_svc,
        this._projects_svc,
        this.ledger, this.prio,
        this.sorting
      );
  }

  public ngAfterViewInit(): void {
    this.data_source.paginator = this.paginator;
    this.table.dataSource = this.data_source;
  }
}
