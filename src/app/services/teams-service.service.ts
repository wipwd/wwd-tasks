import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { BaseStorageService } from './base-storage-service';


export interface TeamItem {
  id: number;
  name: string;
  desc: string;
}

export interface TeamsStorageDataItem {
  teams: TeamItem[];
  latest_id: number;
}

export declare type TeamsMap = {[id: number]: TeamItem};

@Injectable({
  providedIn: 'root'
})
export class TeamsService
  extends BaseStorageService<TeamsStorageDataItem> {

  private _latest_team_id: number = 0;
  private _teams_by_id: TeamsMap = {};
  private _teams_by_name: {[id: string]: TeamItem} = {};
  private _teams_subject: BehaviorSubject<TeamsMap> =
    new BehaviorSubject<TeamsMap>({});

  private _storage_subject: BehaviorSubject<TeamsStorageDataItem|undefined> =
    new BehaviorSubject<TeamsStorageDataItem|undefined>(undefined);

  public constructor() {
    super();
  }

  private _stateLoad(teams: TeamItem[], latest_id: number): void {
    this._latest_team_id = latest_id;
    this._teams_by_id = {};

    teams.forEach( (team: TeamItem) => {
      this._teams_by_id[team.id] = team;
      this._teams_by_name[team.name] = team;
    });
    this._updateSubjects();
  }

  private _stateSave(): void {
    const cur_state: TeamsStorageDataItem = this._getCurrentState();
    this._storage_subject.next(cur_state);
  }

  private _getCurrentState(): TeamsStorageDataItem {
    return {
      teams: Object.values(this._teams_by_id),
      latest_id: this._latest_team_id
    };
  }

  private _updateSubjects(): void {
    this._teams_subject.next(this._teams_by_id);
  }


  public getInitState(): TeamsStorageDataItem {
    return { teams: [], latest_id: 0 };
  }

  public getStorageObserver(): BehaviorSubject<TeamsStorageDataItem|undefined> {
    return this._storage_subject;
  }

  public stateLoad(data: TeamsStorageDataItem): void {
    this._stateLoad(data.teams, data.latest_id);
  }

  public getTeams(): BehaviorSubject<TeamsMap> {
    return this._teams_subject;
  }

  public add(_name: string, _desc: string): void {

    console.debug(`teams-svc > add > name: ${_name}, desc: ${_desc}`);

    if (!_name || _name === "" || _name in this._teams_by_name) {
      return;
    }

    if (!_desc) {
      _desc = "";
    }

    const team_id: number = (++this._latest_team_id);
    const new_team: TeamItem = { id: team_id, name: _name, desc: _desc };
    this._teams_by_name[_name] = new_team;
    this._teams_by_id[team_id] = new_team;
    this._stateSave();
    this._updateSubjects();
  }

  public remove(_name: string): void {
    if (!_name || _name === "" || !(_name in this._teams_by_name)) {
      return;
    }
    const item: TeamItem = this._teams_by_name[_name];
    delete this._teams_by_id[item.id];
    delete this._teams_by_name[item.name];
    this._stateSave();
    this._updateSubjects();
  }
}
