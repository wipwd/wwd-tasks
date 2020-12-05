import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ArchivesListComponent } from './archives/archives-list/archives-list.component';
import { ReportsComponent } from './reports/reports.component';
import { SettingsDashboardComponent } from './settings/settings-dashboard/settings-dashboard.component';
import { TaskLedgerComponent } from './tasks/task-ledger/task-ledger.component';
import { TaskOrganizerComponent } from './tasks/task-organizer/task-organizer/task-organizer.component';

const routes: Routes = [
  { path: 'task-organizer', component: TaskOrganizerComponent },
  { path: 'settings', component: SettingsDashboardComponent },
  { path: 'reports', component: ReportsComponent },
  { path: 'archives', component: ArchivesListComponent },
  { path: '**', component: TaskOrganizerComponent },
  { path: '', component: TaskOrganizerComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
