import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Label, LabelsMap, LabelsService } from '../../../services/labels-service.service';

@Component({
  selector: 'app-settings-labels',
  templateUrl: './settings-labels.component.html',
  styleUrls: ['./settings-labels.component.scss']
})
export class SettingsLabelsComponent implements OnInit {

  public label_add_form_ctrl: FormControl = new FormControl("");
  public labels: Label[] = [];

  public constructor(
    private _labels_svc: LabelsService
  ) { }

  public ngOnInit(): void {
    this._labels_svc.getLabels().subscribe({
      next: (labels: LabelsMap) => {
        this.labels = Object.values(labels);
      }
    });
  }

  public addLabel(): void {
    const value: string = this.label_add_form_ctrl.value?.trim();
    if (!value || value === "") {
      return;
    }
    if (value in this.labels) {
      console.error(`label '${value}' already exists`);
      return;
    }
    this._labels_svc.add(value);
    this.label_add_form_ctrl.setValue("");
  }

  public removeLabel(_label: Label): void {
    if (!_label) {
      throw new Error("undefined label");
    } else if (!this.labels.includes(_label)) {
      return;
    }
    this._labels_svc.remove(_label.name);
  }

  public renameLabel(_label: Label): void {
    if (!_label) {
      throw new Error("undefined label");
    } else if (!this.labels.includes(_label)) {
      throw new Error(`unknown label ${_label.name}`);
    }

    // edit form
  }

}
