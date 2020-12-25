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
  public label_rename_form_ctrl: FormControl = new FormControl("");

  public labels: Label[] = [];
  public edit_label_id: number = -1;

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

    if (this.edit_label_id === _label.id) {
      this.edit_label_id = -1;
      this.label_rename_form_ctrl.setValue("");
    }
  }

  public toggleRenameLabel(_label: Label): void {
    if (!_label) {
      throw new Error("undefined label");
    } else if (!this.labels.includes(_label)) {
      throw new Error(`unknown label ${_label.name}`);
    } else if (this.edit_label_id !== -1 && this.edit_label_id !== _label.id) {
      return;
    }

    this.edit_label_id = (this.edit_label_id >= 0 ? -1 : _label.id);
    if (this.edit_label_id >= 0) {
      this.label_rename_form_ctrl.setValue(_label.name);
    }
  }

  public submitLabelRename(_label: Label): void {
    if (!_label || !this.labels.includes(_label)) {
      return;
    }
    const value: string = this.label_rename_form_ctrl.value?.trim();
    if (!value || value === "") {
      return;
    }
    const old_name: string = _label.name;
    const new_name: string = value;
    this.edit_label_id = -1;
    this.label_rename_form_ctrl.setValue("");
    this._labels_svc.rename(old_name, new_name);
  }

}
