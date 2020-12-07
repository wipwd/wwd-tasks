import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-task-add-from-github',
  templateUrl: './task-add-from-github.component.html',
  styleUrls: ['./task-add-from-github.component.scss']
})
export class TaskAddFromGithubComponent implements OnInit {

  @Output() public finished: EventEmitter<boolean> =
    new EventEmitter<boolean>();

  public add_task_form_group: FormGroup;
  public form_ctrl_url: FormControl;
  public form_ctrl_priority: FormControl;

  private _url_pr_regex: RegExp =
    new RegExp("https://github.com/([\\w-_]+)/([\\w-_]+)/pull/(\\d+)[/.]*");

  public constructor(
    private _fb: FormBuilder
  ) {
    this.form_ctrl_url = new FormControl("", [
      Validators.required,
      Validators.pattern(this._url_pr_regex)
    ]);
    this.form_ctrl_priority = new FormControl("medium");
    this.add_task_form_group = this._fb.group({
      url: this.form_ctrl_url,
      priority: this.form_ctrl_priority
    });
  }

  public ngOnInit(): void { }


  public addNewTask(): void {

    if (this.form_ctrl_url.invalid || this.form_ctrl_priority.invalid) {
      return;
    }

    const url: string = this.form_ctrl_url.value;
    const prio: string = this.form_ctrl_priority.value;

    if (!url || url === "") {
      return;
    }

    const match: RegExpMatchArray = url.match(this._url_pr_regex);
    if (!match) {
      console.error("malformed github url: ", url);
      return;
    }

    const org: string = match[1];
    const repo: string = match[2];
    const pullnum: string = match[3];

    console.log(`pull request ${org}/${repo} #${pullnum}`);
    console.log(`add new task from github > url: ${url}, prio: ${prio}`);
  }

  public getURLErrorMessage(): string {
    if (this.form_ctrl_url.invalid) {
      if (this.form_ctrl_url.hasError("pattern")) {
        return "malformed pull request URL";
      } else if (this.form_ctrl_url.hasError("required")) {
        return "must provide a URL";
      }
    }
    return "";
  }
}
