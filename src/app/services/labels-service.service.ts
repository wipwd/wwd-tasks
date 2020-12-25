import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';


export interface Label {
  id: number;
  name: string;
}

export declare type LabelsMap = {[id: string]: Label};

export interface LabelsStorageDataItem {
  labels: LabelsMap;
  latest_id: number;
}


@Injectable({
  providedIn: 'root'
})
export class LabelsService {

  private _latest_label_id: number = 0;
  private _labels: LabelsMap = {};
  private _labels_by_id: {[id: number]: Label} = {};
  private _labels_subject: BehaviorSubject<LabelsMap> =
    new BehaviorSubject<LabelsMap>({});

  private _storage_subject: BehaviorSubject<LabelsStorageDataItem|undefined> =
    new BehaviorSubject<LabelsStorageDataItem|undefined>(undefined);


  public constructor() { }

  private _getCurrentState(): LabelsStorageDataItem {
    return { labels: this._labels, latest_id: this._latest_label_id };
  }

  private _stateLoad(labels: LabelsMap, latest_id: number): void {
    this._labels = labels;
    this._latest_label_id = latest_id;

    this._labels_by_id = {};
    Object.values(this._labels).forEach( (label: Label) => {
      this._labels_by_id[label.id] = label;
    })

    this._updateSubjects();
  }

  private _stateSave(): void {
    const cur_state: LabelsStorageDataItem = this._getCurrentState();
    this._storage_subject.next(cur_state);

  }

  private _updateSubjects(): void {
    this._labels_subject.next(this._labels);
  }


  public getStorageObserver(
  ): BehaviorSubject<LabelsStorageDataItem|undefined> {
    return this._storage_subject;
  }

  public getInitState(): LabelsStorageDataItem {
    return this._getCurrentState();
  }

  public stateLoad(data: LabelsStorageDataItem): void {
    this._stateLoad(data.labels, data.latest_id);
  }

  public getLabels(): BehaviorSubject<LabelsMap> {
    return this._labels_subject;
  }

  public add(_name: string): void {
    if (!_name || _name === "" || _name in this._labels) {
      return;
    }
    const label_id: number = this._latest_label_id + 1;
    this._latest_label_id = label_id;
    this._labels[_name] = { id: label_id, name: _name};
    this._labels_by_id[label_id] = this._labels[_name];
    this._stateSave();
    this._updateSubjects();
  }

  public remove(_name: string): void {
    if (!_name || _name === "" || !(_name in this._labels)) {
      return;
    }
    const label: Label = this._labels[_name];
    delete this._labels[_name];
    delete this._labels_by_id[label.id];
    this._stateSave();
    this._updateSubjects();
  }

  public rename(_old: string, _new: string): void {
    if (!_old || _old === "" ||
        !_new || _new === "" ||
        _old === _new ||
        !(_old in this._labels) ||
        _new in this._labels
    ) {
      return;
    }

    const label: Label = this._labels[_old];
    label.name = _new;
    this._labels[_new] = label;
    delete this._labels[_old];
    this._stateSave();
    this._updateSubjects();
  }

}
