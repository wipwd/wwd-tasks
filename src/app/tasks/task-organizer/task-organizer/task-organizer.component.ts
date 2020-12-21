import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { MatSelectChange } from '@angular/material/select';
import { BehaviorSubject } from 'rxjs';
import { ProjectsService } from 'src/app/services/projects-service.service';
import { TaskService } from '../../../services/task-service.service';
import { TaskFilterItem } from '../task-filter';

declare type LedgerEntry = {
  name: string;
  label: string;
};

@Component({
  selector: 'app-task-organizer',
  templateUrl: './task-organizer.component.html',
  styleUrls: ['./task-organizer.component.scss']
})
export class TaskOrganizerComponent implements OnInit {

  private _ledgers: LedgerEntry[] = [];
  private _ledger_sizes: {[id: string]: BehaviorSubject<string>} = {};

  private _has_project_filter: boolean = false;
  private _has_expression_filter: boolean = false;

  private _filters: TaskFilterItem = {
    projects: [],
    title: ""
  };
  public filters$: BehaviorSubject<TaskFilterItem> =
    new BehaviorSubject<TaskFilterItem>({ projects: [], title: ""});

  public filter_form_group: FormGroup;


  public constructor(
    private _tasks_svc: TaskService,
    private _fb: FormBuilder,
    private _projects_svc: ProjectsService
  ) {
    this.filter_form_group = this._fb.group({
      project: new FormControl([]),
      expression: new FormControl("")
    });
  }

  public ngOnInit(): void {
    this._tasks_svc.getLedgersNames().forEach( (ledgername: string) => {
      const ledgerlabel: string = this._tasks_svc.getLedgerLabel(ledgername);
      this._ledgers.push({name: ledgername, label: ledgerlabel});
      this._ledger_sizes[ledgername] = new BehaviorSubject<string>("");
      this._subscribeSize(ledgername);
    });
  }

  private _subscribeSize(ledgername: string): void {
    this._tasks_svc.getLedgerSize(ledgername).subscribe({
      next: (size: number) => {
        let str: string = "";
        if (size > 0) {
          str = `(${size})`;
        }
        this._ledger_sizes[ledgername].next(str);
      }
    });
  }

  public getLedgerSize(ledgername: string): BehaviorSubject<string> {
    console.assert(ledgername in this._ledger_sizes);
    return this._ledger_sizes[ledgername];
  }

  public getLedgers(): LedgerEntry[] {
    return this._ledgers;
  }

  public getProjects(): BehaviorSubject<string[]> {
    return this._projects_svc.getProjects();
  }

  public hasProjectFilter(): boolean {
    return this._has_project_filter;
  }

  public hasExpressionFilter(): boolean {
    return this._has_expression_filter;
  }

  public hasFilter(): boolean {
    return this.hasProjectFilter() || this.hasExpressionFilter();
  }

  public getFilters(): {[id: string]: string} {
    const filterstrs: {[id: string]: string} = {};

    if (this.hasProjectFilter()) {
      filterstrs.project = this._filters.projects.join(", ");
    }

    return filterstrs;
  }

  public projectFilterChanged(event: MatSelectChange): void {
    console.log("project filter changed: ", event);
    this._filters.projects = (event.value as string[]);
    this._has_project_filter =
      (!!event.value && this._filters.projects.length !== 0);
    this.filters$.next(this._filters);
  }

}
