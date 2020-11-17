import { BrowserModule, DomSanitizer } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DashboardComponent } from './dashboard/dashboard.component';
import { LayoutModule } from '@angular/cdk/layout';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule, MatIconRegistry } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { TaskOrganizerComponent } from './tasks/task-organizer/task-organizer/task-organizer.component';
import { TaskLedgerComponent } from './tasks/task-ledger/task-ledger.component';
import { TaskItemComponent } from './tasks/task-item/task-item.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { HttpClientModule } from '@angular/common/http';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatTabsModule } from '@angular/material/tabs';
import { MatExpansionModule } from '@angular/material/expansion';
import { TaskLedgerListComponent } from './tasks/task-ledger-list/task-ledger-list/task-ledger-list.component';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { OverlayModule } from '@angular/cdk/overlay';
import { MatCardModule } from '@angular/material/card';
import { MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { TaskAddComponent } from './tasks/task-add/task-add.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { FirstTimeDialogComponent } from './first-time-dialog/first-time-dialog.component';
import { MatDialogModule } from '@angular/material/dialog';
import { SettingsDashboardComponent } from './settings/settings-dashboard/settings-dashboard.component';
import { MatChipsModule } from '@angular/material/chips';
import { HelpDialogComponent } from './help-dialog/help-dialog.component';
import { TaskEditComponent } from './tasks/task-edit/task-edit.component';
import { ReportsComponent } from './reports/reports/reports.component';
import { ArchivesListComponent } from './archives/archives-list/archives-list.component';
import { TaskInfoComponent } from './tasks/task-info/task-info.component';
import { TaskDeleteComponent } from './tasks/task-delete/task-delete.component';
import { TaskNotesComponent } from './tasks/task-notes/task-notes.component';
import { TaskAddBottomSheetComponent } from './tasks/task-add/task-add-bottom-sheet/task-add-bottom-sheet.component';

@NgModule({
  declarations: [
    AppComponent,
    DashboardComponent,
    TaskOrganizerComponent,
    TaskLedgerComponent,
    TaskItemComponent,
    TaskLedgerListComponent,
    TaskAddComponent,
    FirstTimeDialogComponent,
    SettingsDashboardComponent,
    HelpDialogComponent,
    TaskEditComponent,
    ReportsComponent,
    ArchivesListComponent,
    TaskInfoComponent,
    TaskDeleteComponent,
    TaskNotesComponent,
    TaskAddBottomSheetComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    LayoutModule,
    MatToolbarModule,
    MatButtonModule,
    MatSidenavModule,
    MatIconModule,
    MatListModule,
    MatTooltipModule,
    HttpClientModule,
    FlexLayoutModule,
    MatTabsModule,
    MatExpansionModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    OverlayModule,
    MatCardModule,
    MatBottomSheetModule,
    FormsModule,
    ReactiveFormsModule,
    MatInputModule,
    MatSelectModule,
    MatDialogModule,
    MatChipsModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {

  public constructor(
    private _mat_icon_registry: MatIconRegistry,
    private _dom_sanitizer: DomSanitizer
  ) {
    this._mat_icon_registry.addSvgIcon("github",
      this._dom_sanitizer.bypassSecurityTrustResourceUrl(
        "assets/github-icon.svg"
      )
    );
  }

}
