import { Component, OnInit } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { MatBottomSheet, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { TaskAddComponent } from '../tasks/task-add/task-add.component';
import { MatDialog } from '@angular/material/dialog';
import { FirstTimeDialogComponent } from '../first-time-dialog/first-time-dialog.component';
import { set as idbset, get as idbget } from 'idb-keyval';
import { HelpDialogComponent } from '../help-dialog/help-dialog.component';
import { TaskAddBottomSheetComponent } from '../tasks/task-add/task-add-bottom-sheet/task-add-bottom-sheet.component';
import { TaskLedgerEntry, TaskService } from '../services/task-service.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  private _is_menu_expanded: boolean = false;
  private _is_handset: boolean = false;
  private _is_new_task_overlay_open: boolean = false;
  private _is_new_task_bottom_sheet_open: boolean = false;

  public isHandset$: Observable<boolean> =
      this._breakpoint_observer.observe([
        Breakpoints.Handset,
        Breakpoints.Small,
        Breakpoints.Medium
  ])
  .pipe(
    map(result => result.matches),
    shareReplay()
  );

  constructor(
    private _breakpoint_observer: BreakpointObserver,
    private _bottom_sheet: MatBottomSheet,
    private _first_time_dialog: MatDialog,
    private _tasks_svc: TaskService
  ) {
    this.isHandset$.subscribe({
      next: (result: boolean) => {
        this._is_handset = result;
      }
    });
  }

  public ngOnInit(): void {
    this._checkVersion();
  }

  private _checkVersion(): void {
    idbget("_wwdtasks_version").then(
      (version: number|undefined) => {
        if (!version) {
          this._doFirstRun();
        }
    });
  }

  private _doFirstRun(): void {
    const dialogref = this._first_time_dialog.open(FirstTimeDialogComponent);
    idbset("_wwdtasks_version", 1);
  }

  public isExpanded(): boolean {
    return this._is_menu_expanded || this._is_handset;
  }

  public toggleMenu(): void {
    this._is_menu_expanded = !this._is_menu_expanded;
  }

  // new task overlay
  public isNewTaskOverlayOpen(): boolean {
    return this._is_new_task_overlay_open;
  }

  public toggleNewTaskOverlay(): void {
    this._is_new_task_overlay_open = !this._is_new_task_overlay_open;
  }

  // new task bottom sheet (mobile / smaller devices)
  public isNewTaskBottomSheetOpen(): boolean {
    return this._is_new_task_bottom_sheet_open;
  }

  public toggleNewTaskBottomSheet(): void {
    this._is_new_task_bottom_sheet_open = !this._is_new_task_bottom_sheet_open;

    if (this.isNewTaskBottomSheetOpen()) {
      const ref: MatBottomSheetRef<TaskAddBottomSheetComponent> =
        this._bottom_sheet.open(TaskAddBottomSheetComponent);
      ref.backdropClick().subscribe({
        next: () => {
          this._bottom_sheet.dismiss();
        }
      });
      ref.afterDismissed().subscribe({
        next: () => {
          this.toggleNewTaskBottomSheet();
        }
      });
    }
  }

  // generic 'new task' machinery
  public closeNewTask(): void {
    this._is_new_task_overlay_open = false;
    this._is_new_task_bottom_sheet_open = false;
  }

  public maybeCloseNewTask(event: KeyboardEvent): void {
    console.log("event > ", event);
    if (!!event && event.code.toLowerCase() === "escape") {
      this.toggleNewTask();
    }
  }

  public toggleNewTask(): void {
    if (this._is_handset) {
      this.toggleNewTaskBottomSheet();
    } else {
      this.toggleNewTaskOverlay();
    }
  }

  public isNewTaskOpen(): boolean {
    return this.isNewTaskBottomSheetOpen() || this.isNewTaskOverlayOpen();
  }

  public openHelpDialog(): void {
    const ref = this._first_time_dialog.open(
      HelpDialogComponent, {closeOnNavigation: false}
    );
  }

  public pauseCurrentTask(): void {
    const task: TaskLedgerEntry = this._tasks_svc.getRunningTimerTask();
    this._tasks_svc.timerPause(task);
  }

  public stopCurrentTask(): void {
    const task: TaskLedgerEntry = this._tasks_svc.getRunningTimerTask();
    this._tasks_svc.timerStop(task);
  }

  public hasRunningTask(): boolean {
    return this._tasks_svc.hasRunningTimerTask();
  }
}
