import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-settings-labels',
  templateUrl: './settings-labels.component.html',
  styleUrls: ['./settings-labels.component.scss']
})
export class SettingsLabelsComponent implements OnInit {

  public label_add_form_ctrl: FormControl = new FormControl("");
  public labels: string[] = [];

  public constructor() { }

  public ngOnInit(): void { }

  public addLabel(): void {
    const value: string = this.label_add_form_ctrl.value?.trim();
    if (!value || value === "") {
      return;
    }
    this.labels = [...this.labels, value];

    this.label_add_form_ctrl.setValue("");
  }

}
