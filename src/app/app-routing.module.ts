import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ArchivesListComponent } from './archives/archives-list/archives-list.component';
import { PeopleListComponent } from './people/people-list/people-list.component';
import { ReportsComponent } from './reports/reports.component';
import { WeeklyReportComponent } from './reports/weekly-report/weekly-report.component';
import { SettingsDashboardComponent } from './settings/settings-dashboard/settings-dashboard.component';
import { TaskOrganizerComponent } from './tasks/task-organizer/task-organizer.component';
import { TeamsListComponent } from './teams/teams-list/teams-list.component';

const routes: Routes = [
  { path: 'task-organizer', component: TaskOrganizerComponent },
  { path: 'settings', component: SettingsDashboardComponent },
  { path: 'reports', component: ReportsComponent },
  { path: 'archives', component: ArchivesListComponent },
  { path: 'people', component: PeopleListComponent },
  { path: 'teams', component: TeamsListComponent },
  { path: 'report-tasks', component: WeeklyReportComponent },
  { path: '**', component: TaskOrganizerComponent },
  { path: '', component: TaskOrganizerComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
