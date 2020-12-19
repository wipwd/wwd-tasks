import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTable } from '@angular/material/table';
import { getTimeDiffStr, TaskNoteItem, TaskService } from 'src/app/services/task-service.service';
import { DateRange, getCurrentWeek, WeeklyReportDataSource, WeeklyTaskItem } from './weekly-report-datasource';
import * as moment from 'moment';
import { ProjectsService } from 'src/app/services/projects-service.service';
import { BehaviorSubject } from 'rxjs';
import { MatSelectChange } from '@angular/material/select';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';

class ReportEntry {

  private _children: ReportEntry[] = [];

  public constructor(private _value: string) { }

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

  private _date_range: DateRange = { };

  public constructor(
    private _tasks_svc: TaskService,
    private _projects_svc: ProjectsService,
  ) {

  }

  public ngOnInit(): void {
    this.data_source = new WeeklyReportDataSource(this._tasks_svc);
    this._date_range = this._getCurrentWeek();
    this.data_source.setDateRange(this._date_range);
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
    ) || (
      item.task.priority === "low" && !this.isDone(item)
    );
  }

  public getTimeSpent(item: WeeklyTaskItem): string {
    return getTimeDiffStr(item.spent_seconds);
  }

  public getTotalTimeSpent(): string {
    return getTimeDiffStr(this.data_source.getTotalSpentTime());
  }

  private _getCurrentWeek(): DateRange {
    const now: moment.Moment = moment.utc();
    let monday: moment.Moment = undefined;
    if (now.day() === 0) {
      monday = moment.utc().day(-6); // previous monday
    } else {
      monday = moment.utc().day(1);
      console.log("last monday: ", monday);
    }
    const sunday: moment.Moment = moment.utc().day(7); // next sunday

    const dr: DateRange = {
      start: moment.utc([monday.year(), monday.month(), monday.date()]),
      end: moment.utc([sunday.year(), sunday.month(), sunday.date()])
    };

    console.log("current week: ", dr);
    return dr;
  }

  private _getDateString(date: moment.Moment): string {
    if (!date) {
      return "";
    }
    return `${date.year()}-${date.month()}-${date.date()}`;
  }

  public getDateRangeString(): string {
    const start: string = this._getDateString(this._date_range.start);
    const end: string = this._getDateString(this._date_range.end);
    return `(${start} to ${end})`;
  }

  public getDateRangeStart(): moment.Moment {
    return this._date_range.start;
  }

  public getDateRangeEnd(): moment.Moment {
    return this._date_range.end;
  }

  public getProjects(): BehaviorSubject<string[]> {
    return this._projects_svc.getProjects();
  }

  public selectProject(selection: MatSelectChange): void {
    console.log("selected project: ", selection.value);
    this.data_source.filterData(selection.value);
  }

  public dateRangePickerFilter(d: Date | null): boolean {
    if (!d) {
      return false;
    }
    return (d <= (new Date()));
  }

  private _updateDateRange(): void {
    console.log("report from ", this._date_range.start, " to ", this._date_range.end);
    this.data_source.setDateRange(this._date_range);
  }

  public dateRangeChanged(
    event: MatDatepickerInputEvent<moment.Moment>,
    is_start: boolean
  ): void {
    if (is_start) {
      console.log("start: ", event.value);
      if (!!event.value) {
        this._date_range.start = event.value;
        this._date_range.end = undefined;
      }
    } else {
      if (!!event.value) {
        this._date_range.end = event.value;
      }
      console.log("end: ", event);
    }

    if (!!this._date_range.start && !!this._date_range.end) {
      this._updateDateRange();
    }
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
