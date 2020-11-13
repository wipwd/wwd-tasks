import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTable } from '@angular/material/table';
import { TaskLedgerListDataSource, TaskLedgerListItem } from './task-ledger-list-datasource';

@Component({
  selector: 'app-task-ledger-list',
  templateUrl: './task-ledger-list.component.html',
  styleUrls: ['./task-ledger-list.component.scss']
})
export class TaskLedgerListComponent implements AfterViewInit, OnInit {
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatTable) table: MatTable<TaskLedgerListItem>;
  dataSource: TaskLedgerListDataSource;

  displayedColumns = ['id', 'name'];

  public ngOnInit(): void {
    this.dataSource = new TaskLedgerListDataSource();
  }

  public ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
    this.table.dataSource = this.dataSource;
  }
}
