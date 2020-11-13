import { Component } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { TaskAddComponent } from '../tasks/task-add/task-add.component';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {

  private _is_menu_expanded: boolean = false;
  private _is_handset: boolean = false;
  private _is_new_task_overlay_open: boolean = false;
  private _is_new_task_bottom_sheet_open: boolean = false;
  private _use_new_task_overlay: boolean = true;
  private _use_new_task_bottom_sheet: boolean = false;

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
    private _bottom_sheet: MatBottomSheet
  ) {
    this.isHandset$.subscribe({
      next: (result: boolean) => {
        this._is_handset = result;
      }
    });
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
      this._bottom_sheet.open(TaskAddComponent);
      this._bottom_sheet._openedBottomSheetRef.backdropClick().subscribe({
        next: () => {
          this.toggleNewTaskBottomSheet();
          this._bottom_sheet.dismiss();
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
}
