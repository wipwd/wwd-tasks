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
import { TaskOrganizerComponent } from './tasks/task-organizer/task-organizer.component';
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
import { ReportsComponent } from './reports/reports.component';
import { ArchivesListComponent } from './archives/archives-list/archives-list.component';
import { TaskInfoComponent } from './tasks/task-info/task-info.component';
import { TaskDeleteComponent } from './tasks/task-delete/task-delete.component';
import { TaskNotesComponent } from './tasks/task-notes/task-notes.component';
import { TaskAddBottomSheetComponent } from './tasks/task-add/task-add-bottom-sheet/task-add-bottom-sheet.component';
import { MatBadgeModule } from '@angular/material/badge';

import { AngularFireModule } from '@angular/fire';
import { environment } from '../environments/environment';
import { AngularFirestoreModule } from '@angular/fire/firestore';
import { AngularFireAuthModule } from '@angular/fire/auth';

import { SettingsDeviceSyncComponent } from './settings/settings-device-sync/settings-device-sync.component';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { SettingsDeviceSyncDialogComponent } from './settings/settings-device-sync/settings-device-sync-dialog/settings-device-sync-dialog.component';
import { ImportExportDataComponent } from './settings/import-export-data/import-export-data.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SettingsDeviceSyncValidatePullDialogComponent } from './settings/settings-device-sync/settings-device-sync-validate-pull-dialog/settings-device-sync-validate-pull-dialog.component';
import { SettingsDeviceSyncValidatePushDialogComponent } from './settings/settings-device-sync/settings-device-sync-validate-push-dialog/settings-device-sync-validate-push-dialog.component';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { WeeklyReportComponent } from './reports/weekly-report/weekly-report.component';
import { TaskAddManuallyComponent } from './tasks/task-add/task-add-manually/task-add-manually.component';
import { TaskAddFromGithubComponent } from './tasks/task-add/task-add-from-github/task-add-from-github.component';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatMomentDateModule, MAT_MOMENT_DATE_ADAPTER_OPTIONS, MAT_MOMENT_DATE_FORMATS, MomentDateAdapter } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { SettingsProjectsLabelsComponent } from './settings/settings-projects-labels/settings-projects-labels.component';
import { SettingsLabelsComponent } from './settings/settings-projects-labels/settings-labels/settings-labels.component';
import { SettingsProjectsComponent } from './settings/settings-projects-labels/settings-projects/settings-projects.component';
import { PeopleListComponent } from './people/people-list/people-list.component';
import { TeamsListComponent } from './teams/teams-list/teams-list.component';
import { ByPeopleReportComponent } from './reports/by-people-report/by-people-report.component';
import { ChoiceCardModule } from "./components/choice-card/choice-card.module";


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
    ReportsComponent,
    ArchivesListComponent,
    TaskInfoComponent,
    TaskDeleteComponent,
    TaskNotesComponent,
    TaskAddBottomSheetComponent,
    SettingsDeviceSyncComponent,
    SettingsDeviceSyncDialogComponent,
    ImportExportDataComponent,
    SettingsDeviceSyncValidatePullDialogComponent,
    SettingsDeviceSyncValidatePushDialogComponent,
    WeeklyReportComponent,
    TaskAddManuallyComponent,
    TaskAddFromGithubComponent,
    SettingsProjectsLabelsComponent,
    SettingsLabelsComponent,
    SettingsProjectsComponent,
    PeopleListComponent,
    TeamsListComponent,
    ByPeopleReportComponent,
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
    MatBadgeModule,
    AngularFireModule.initializeApp(environment.firebase),
    AngularFirestoreModule,
    AngularFireAuthModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatDatepickerModule,
    MatMomentDateModule,
    ChoiceCardModule,
  ],
  providers: [
    {
      provide: DateAdapter, useClass: MomentDateAdapter,
      deps: [MAT_DATE_LOCALE]
    },
    { provide: MAT_DATE_FORMATS, useValue: MAT_MOMENT_DATE_FORMATS },
    { provide: MAT_DATE_LOCALE, useValue: 'pt' },
    { provide: MAT_MOMENT_DATE_ADAPTER_OPTIONS, useValue: { useUTC: true } }
  ],
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
