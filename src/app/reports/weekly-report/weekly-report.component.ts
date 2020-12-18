import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTable } from '@angular/material/table';
import { getTimeDiffStr, TaskNoteItem, TaskService } from 'src/app/services/task-service.service';
import { getCurrentWeek, WeeklyReportDataSource, WeeklyTaskItem } from './weekly-report-datasource';
import * as moment from 'moment';

class ReportEntry {

  private _children: ReportEntry[] = [];

  public constructor(private _value: string) {

  }

  public length(): number {
    return this._value.length;
  }

  public getChildrenLength(): number {
    let max_len: number = 0;
    this._children.forEach( (entry: ReportEntry) => {
      max_len = Math.max(max_len, entry.length());
    });
    return max_len;
  }

  public add(value: string): ReportEntry {
    const entry: ReportEntry = new ReportEntry(value);
    this._children.push(entry);
    return entry;
  }

  private _getPrefix(char: string, len: number): string {
    let prefix: string = "";
    for (let i = 0; i < len; i ++) {
      prefix += char;
    }
    return prefix;
  }

  private _wrapLine(line: string, len: number): string[] {
    const lines: string[] = [];
    const tokens: string[] = line.split(" ");
    let cur_len: number = 0;
    let cur_line: string = "";
    tokens.forEach( (word: string) => {
      if (cur_len + word.length + 1 > len && !word.startsWith("http")) {
        if (cur_line === "") {
          throw new Error(`'len' too small > len: ${len}, word: ${word}`);
        }
        lines.push(cur_line);
        cur_len = 0;
        cur_line = "";
      }
      if (cur_line !== "") {
        cur_line += " ";
        cur_len += 1;
      }
      cur_line += word;
      cur_len += word.length;
    });
    if (cur_line !== "") {
      lines.push(cur_line);
    }
    return lines;
  }

  public toString(linelen: number, indent: number = 0): string {
    let strs: string[] = [];
    const wrapped_lines: string[] = this._wrapLine(this._value, linelen);
    const prefix: string = this._getPrefix(" ", indent);
    let str: string = "";
    wrapped_lines.forEach( (l: string) => {
      l = l.trimEnd();
      if (str === "" && indent > 0) {
        str += prefix;
        str += "* ";
      } else if (str !== "") {
        str += prefix;
        str += "  ";
      }
      str += `${l}\n`;
    });
    strs.push(str);
    this._children.forEach( (entry: ReportEntry) => {
      const s: string = entry.toString(linelen - prefix.length - 2, indent + 2);
      strs.push(s);
    });
    return strs.join("");
  }
}

class Report {
  private _header: ReportEntry;
  private _sections: ReportEntry[] = [];
  private _footer: ReportEntry;

  public constructor() { }

  public setHeader(value: string): void {
    this._header = new ReportEntry(value);
  }

  public setFooter(value: string): void {
    this._footer = new ReportEntry(value);
  }

  public section(value: string): ReportEntry {
    const entry: ReportEntry = new ReportEntry(value);
    this._sections.push(entry);
    return entry;
  }

  public toString(linelen: number = 80): string {
    const strs: string[] = [];
    
    strs.push(this._header.toString(linelen));
    this._sections.forEach( (section: ReportEntry) => {
      strs.push(section.toString(linelen));
    });
    strs.push(this._footer.toString(linelen));
    return strs.join("\n");
  }
}


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

    const now: moment.Moment = moment();
    const nowstr: string = now.utc().toString();
    const week: number = now.week();
    const mondaydate: number = now.day(1).date();
    const sundaydate: number = now.day(7).date();
    const start: string = `${now.year()}-${now.month()}-${mondaydate}`;
    const end: string = `${now.year()}-${now.month()}-${sundaydate}`;

    const reportA: Report = new Report();
    reportA.setHeader(
      `// Work Report - week ${week} (from ${start} to ${end})`
    );
    reportA.setFooter(
      `// autogenerated by Tasks (https://wipwd.github.io/tasks/) on ${nowstr}`
    );

    Object.keys(rag).forEach( (key: string) => {
      const entry: ReportEntry = reportA.section(`[${key}]`);
      rag[key].forEach( (e: WeeklyTaskItem) => {
        const state: string = (e.finished ? "done" : 
          (e.workedon ? "ongoing" : "scheduled")
        );
        const title: string = `${e.task.title} [${state}]`;
        const task_entry: ReportEntry = entry.add(title);
        if (!!e.task.url && e.task.url !== "") {
          task_entry.add(`url: ${e.task.url}`);
        }
        if (!!e.task.notes && e.task.notes.length > 0) {
          e.task.notes.forEach( (note: TaskNoteItem) => {
            const lines: string[] = note.text.split("\n");
            lines.forEach( (line: string) => {
              line = line.trim()
              if (line !== "") {
                task_entry.add(line);
              }
            });
          })
        }
      })
    });
    // console.log(reportA.toString());

    const report: string = reportA.toString();
    const blob = new Blob([report], {type: "data:text/plain"});
    const url: string = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.download = `weekly-report-W${week}.txt`;
    anchor.href = url;
    anchor.click();
  }
}
