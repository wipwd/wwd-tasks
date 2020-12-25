import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { MatSelectChange } from '@angular/material/select';
import { BehaviorSubject } from 'rxjs';
import { ProjectsService } from 'src/app/services/projects-service.service';
import { TaskService } from '../../services/task-service.service';
import { TaskFilterItem, TaskSortItem } from './task-list-options';
import { InOutAnimation } from '../../animations';


declare type LedgerEntry = {
  name: string;
  label: string;
  icon: string;
};

@Component({
  selector: 'app-task-organizer',
  templateUrl: './task-organizer.component.html',
  styleUrls: ['./task-organizer.component.scss'],
  animations: [
    InOutAnimation
  ]
})
export class TaskOrganizerComponent implements OnInit {

  public ledgers: LedgerEntry[] = [];
  public selected_ledger: string;

  public show_options_menu: boolean = false;

  private _ledger_sizes: {[id: string]: BehaviorSubject<string>} = {};

  private _has_project_filter: boolean = false;
  private _has_title_filter: boolean = false;

  private _filters: TaskFilterItem = {
    projects: [],
    title: ""
  };
  private _sorting: TaskSortItem = {
    sortby: "creation",
    ascending: false
  };

  public filters$: BehaviorSubject<TaskFilterItem> =
    new BehaviorSubject<TaskFilterItem>({ projects: [], title: ""});
  public sorting$: BehaviorSubject<TaskSortItem> =
    new BehaviorSubject<TaskSortItem>(this._sorting);

  public filter_form_group: FormGroup;
  public sorting_form_group: FormGroup;


  public constructor(
    private _tasks_svc: TaskService,
    private _fb: FormBuilder,
    private _projects_svc: ProjectsService
  ) {
    this.filter_form_group = this._fb.group({
      project: new FormControl([]),
      title: new FormControl("")
    });
    this.sorting_form_group = this._fb.group({
      field: new FormControl("creation"),
      direction: new FormControl("desc")
    });
  }

  public ngOnInit(): void {
    this._tasks_svc.getLedgersNames().forEach( (ledgername: string) => {
      const ledgerlabel: string = this._tasks_svc.getLedgerLabel(ledgername);
      const ledgericon: string = this._tasks_svc.getLedgerIcon(ledgername);
      this.ledgers.push({
        name: ledgername, label: ledgerlabel, icon: ledgericon
      });
      this.selected_ledger =
        (this.ledgers.length > 0 ? this.ledgers[0].name : "");
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

  public toggleOptionsMenu(): void {
    this.show_options_menu = !this.show_options_menu;
  }

  public selectLedger(ledger: LedgerEntry): void {
    this.selected_ledger = ledger.name;
  }

  public getLedgerSize(ledgername: string): BehaviorSubject<string> {
    console.assert(ledgername in this._ledger_sizes);
    return this._ledger_sizes[ledgername];
  }

  public getLedgers(): LedgerEntry[] {
    return this.ledgers;
  }

  public getProjects(): BehaviorSubject<string[]> {
    return this._projects_svc.getProjects();
  }

  public hasProjectFilter(): boolean {
    return this._has_project_filter;
  }

  public hasTitleFilter(): boolean {
    return this._has_title_filter;
  }

  public hasFilter(): boolean {
    return this.hasProjectFilter() || this.hasTitleFilter();
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

  public titleFilterChanged(event): void {
    const titlestr: string = this.filter_form_group.get("title").value;
    console.log("title filter changed: ", event, ", value: ", titlestr);
    this._filters.title = titlestr;
    this._has_title_filter = (titlestr !== "");
    this.filters$.next(this._filters);
  }

  private _sortingChanged(): void {
    console.log("sort changed: ", this._sorting);
    this.sorting$.next(this._sorting);
  }

  public sortingFieldChanged(event: MatSelectChange): void {
    this._sorting.sortby = event.value;
    this._sortingChanged();
  }

  public sortingDirectionChanged(event: MatSelectChange): void {
    this._sorting.ascending = (event.value === "asc");
    this._sortingChanged();
  }

  public getSorting(): TaskSortItem {
    return this._sorting;
  }
}