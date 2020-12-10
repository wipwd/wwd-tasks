import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTable } from '@angular/material/table';
import { getTimeDiffStr, TaskNoteItem, TaskService } from 'src/app/services/task-service.service';
import { getCurrentWeek, WeeklyReportDataSource, WeeklyTaskItem } from './weekly-report-datasource';

@Component({
  selector: 'app-weekly-report',
  templateUrl: './weekly-report.component.html',
  styleUrls: ['./weekly-report.component.scss']
})
export class WeeklyReportComponent implements AfterViewInit, OnInit {
  @ViewChild(MatPaginator) public paginator: MatPaginator;
  @ViewChild(MatSort) public sort: MatSort;
  @ViewChild(MatTable) public table: MatTable<WeeklyTaskItem>;

  public data_source: WeeklyReportDataSource;
  public displayedColumns = ["status", "prio", "title", "spent"];

  public constructor(
    private _tasks_svc: TaskService
  ) {

  }

  public ngOnInit(): void {
    this.data_source = new WeeklyReportDataSource(this._tasks_svc);
  }

  public ngAfterViewInit(): void {
    this.data_source.sort = this.sort;
    this.data_source.paginator = this.paginator;
    this.table.dataSource = this.data_source;
  }

  public isDone(item: WeeklyTaskItem): boolean {
    return item.finished;
  }

  public isInProgress(item: WeeklyTaskItem): boolean {
    return item.workedon && !this.isDone(item);
  }

  public wasOnlyCreated(item: WeeklyTaskItem): boolean {
    return item.created && !this.isDone(item) && !this.isInProgress(item);
  }

  public isPrioRed(item: WeeklyTaskItem): boolean {
    return (
      item.task.priority === "high" &&
      !this.isDone(item) && !this.isInProgress(item)
    );
  }

  public isPrioAmber(item: WeeklyTaskItem): boolean {
    return (
      item.task.priority === "high" &&
      this.isInProgress(item)
    ) || (
      item.task.priority === "medium" &&
      !this.isInProgress(item) && !this.isDone(item)
    );
  }

  public getTimeSpent(item: WeeklyTaskItem): string {
    return getTimeDiffStr(item.spent_seconds);
  }

  public getTotalTimeSpent(): string {
    return getTimeDiffStr(this.data_source.getTotalSpentTime());
  }

  private _getYMDStr(date: Date): string {
    const year: number = date.getUTCFullYear();
    const month: number = date.getUTCMonth();
    const day: number = date.getUTCDate();
    return `${year}-${month}-${day}`;
  }

  public getWeekString(): string {
    const week: {monday: Date, sunday: Date} = getCurrentWeek();
    const monday: string = this._getYMDStr(week.monday);
    const sunday: string = this._getYMDStr(week.sunday);
    return `(${monday} to ${sunday})`;
  }

  private _getTaskRAGInfo(item: WeeklyTaskItem): string {
    let str: string = `  * ${item.task.title} [${item.task.priority}]\n`;
    if (!!item.task.url && item.task.url !== "") {
      str += `      - ${item.task.url}\n`;
    }
    if (!!item.task.notes && item.task.notes.length > 0) {
      item.task.notes.forEach( (note: TaskNoteItem) => {
        str += `      - ${note.text}\n`;
      });
    }
    return str;
  }

  public downloadAsRAG(): void {
    const rag = { red: [], amber: [], green: [] };

    const tasks: WeeklyTaskItem[] = [...this.data_source.getTasks()];
    tasks.forEach( (task: WeeklyTaskItem) => {
      if (this.isPrioRed(task)) {
        rag.red.push(task);
      } else if (this.isPrioAmber(task)) {
        rag.amber.push(task);
      } else {
        rag.green.push(task);
      }
    });

    let red_str: string = "";
    rag.red.forEach( (e: WeeklyTaskItem) => {
      red_str += this._getTaskRAGInfo(e);
    });

    let amber_str: string = "";
    rag.amber.forEach( (e: WeeklyTaskItem) => {
      amber_str += this._getTaskRAGInfo(e);
    });

    let green_str: string = "";
    rag.green.forEach( (e: WeeklyTaskItem) => {
      green_str += this._getTaskRAGInfo(e);
    });

    const report: string =
`\n\
[red]\n\
${red_str}\n\
\n\
[amber]\n\
${amber_str}\n\
\n\
[green]\n\
${green_str}\n\
\n`;

    const blob = new Blob([report], {type: "data:text/plain"});
    const url: string = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.download = "weekly-report.txt";
    anchor.href = url;
    anchor.click();
  }
}
