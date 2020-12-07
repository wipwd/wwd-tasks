import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ProjectsService } from './projects-service.service';
import { TaskItem, TaskService } from './task-service.service';

interface GithubPRItem {
  title: string;
  html_url: string;
  number: number;
}

@Injectable({
  providedIn: 'root'
})
export class GithubService {

  public constructor(
    private _tasks_svc: TaskService,
    private _projects_svc: ProjectsService,
    private _http: HttpClient
  ) { }


  public addPullRequest(
    org: string,
    repo: string,
    prnum: number,
    priority: string
  ): void {

    if (!org || org === "" || !repo || repo === "" || !prnum || prnum <= 0) {
      console.error("github-svc > malformed add PR request");
      return;
    }

    const endpoint: string = `repos/${org}/${repo}/pulls/${prnum}`;
    const url: string = `https://api.github.com/${endpoint}`;

    this._http.get<GithubPRItem>(url).subscribe({
      next: (result: GithubPRItem) => {
        console.log("github-svc > PR: ", result);
        console.log(`github-svc > title: ${result.title}, url: ${result.html_url}, num: ${result.number}`);

        this._addPullRequest(org, repo, result, priority);
      }
    });
  }

  private _addPullRequest(
    org: string,
    repo: string,
    pr: GithubPRItem,
    task_priority: string
  ): void {

    const task_project: string = `${org}/${repo}`;
    this._projects_svc.add(task_project);

    const task_title: string = `${pr.title} (#${pr.number})`;

    const task: TaskItem = {
      title: task_title,
      url: pr.html_url,
      project: [task_project],
      date: new Date(),
      priority: task_priority
    };
    this._tasks_svc.add(task);
  }
}
