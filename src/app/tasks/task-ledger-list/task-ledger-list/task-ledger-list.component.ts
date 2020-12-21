import { AfterViewInit, Component, Input, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTable } from '@angular/material/table';
import { BehaviorSubject } from 'rxjs';
import {
  TaskLedgerEntry, TaskService
} from 'src/app/services/task-service.service';
import { TaskFilterItem } from '../../task-organizer/task-list-options';
import { TaskLedgerListDataSource } from './task-ledger-list-datasource';

@Component({
  selector: 'app-task-ledger-list',
  templateUrl: './task-ledger-list.component.html',
  styleUrls: ['./task-ledger-list.component.scss']
})
export class TaskLedgerListComponent implements AfterViewInit, OnInit {

  @Input() public ledger: string = "backlog";
  @Input() public prio: string = "medium";
  @Input() public filters: BehaviorSubject<TaskFilterItem>;

  @ViewChild(MatPaginator) public paginator: MatPaginator;
  @ViewChild(MatSort) public sort: MatSort;
  @ViewChild(MatTable) public table: MatTable<TaskLedgerEntry>;
  public data_source: TaskLedgerListDataSource;

  public displayedColumns = ['id', 'name'];

  public constructor(
    private _tasks_svc: TaskService
  ) { }

  public ngOnInit(): void {
    this.data_source =
      new TaskLedgerListDataSource(
        this._tasks_svc, this.ledger, this.prio, this.filters
      );
  }

  public ngAfterViewInit(): void {
    this.data_source.sort = this.sort;
    this.data_source.paginator = this.paginator;
    this.table.dataSource = this.data_source;
  }
}
