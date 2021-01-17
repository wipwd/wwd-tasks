import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { BaseStorageService } from './base-storage-service';

export interface PeopleItem {
  id: number;
  name: string;
  teamid?: number;
}

export interface PeopleStorageDataItem {
  people: PeopleItem[];
  latest_id: number;
}

export declare type PeopleMap = {[id: number]: PeopleItem};
export declare type PeopleTeamMap = {[id: number]: PeopleMap};

@Injectable({
  providedIn: 'root'
})
export class PeopleService
  extends BaseStorageService<PeopleStorageDataItem> {

  private _latest_people_id: number = 0;
  private _people_by_id: PeopleMap = {};
  private _people_by_name: {[id: string]: PeopleItem} = {};
  private _people_by_team: PeopleTeamMap = {};
  private _people_subject: BehaviorSubject<PeopleMap> =
    new BehaviorSubject<PeopleMap>({});

  private _storage_subject: BehaviorSubject<PeopleStorageDataItem|undefined> =
    new BehaviorSubject<PeopleStorageDataItem|undefined>(undefined);

  public constructor() {
    super();
  }

  private _stateLoad(people: PeopleItem[], latest_id: number): void {
    this._latest_people_id = latest_id;
    this._people_by_id = {};
    this._people_by_name = {};
    this._people_by_team = {};

    people.forEach( (item: PeopleItem) => {
      this._people_by_id[item.id] = item;
      this._people_by_name[item.name] = item;

      if (!!item.teamid && item.teamid > 0) {
        if (!(item.teamid in this._people_by_team)) {
          this._people_by_team[item.teamid] = {};
        }
        this._people_by_team[item.teamid][item.id] = item;
      }
    });
    this._updateSubjects();
  }

  private _stateSave(): void {
    const cur_state: PeopleStorageDataItem = this._getCurrentState();
    this._storage_subject.next(cur_state);
  }

  private _getCurrentState(): PeopleStorageDataItem {
    return {
      people: Object.values(this._people_by_id),
      latest_id: this._latest_people_id
    };
  }

  private _updateSubjects(): void {
    this._people_subject.next(this._people_by_id);
  }

  private _sanitizeName(name: string): string {
    name = name.trim();
    const tokens: string[] = name.split(" ");
    const lst: string[] = [];
    tokens.forEach( (tok: string) => {
      const t: string = tok.trim();
      if (t === "") {
        return;
      }
      lst.push(t);
    });
    return lst.join(" ");
  }

  private _removeFromTeamSafe(teamid: number, item: PeopleItem): void {
    if (!(teamid in this._people_by_team)) {
      return;
    }
    const people_by_team: PeopleMap = this._people_by_team[teamid];
    if (!(item.id in people_by_team)) {
      return;
    }
    delete people_by_team[item.id];
  }

  public getInitState(): PeopleStorageDataItem {
    return { people: [], latest_id: 0 };
  }

  public getStorageObserver(
  ): BehaviorSubject<PeopleStorageDataItem|undefined> {
    return this._storage_subject;
  }

  public stateLoad(data: PeopleStorageDataItem): void {
    this._stateLoad(data.people, data.latest_id);
  }

  public getPeople(): BehaviorSubject<PeopleMap> {
    return this._people_subject;
  }

  public add(_name: string, _teamid?: number): void {
    console.debug(`people-svc > add > name: ${_name}, team: ${_teamid}`);
    if (!_name) {
      return;
    }
    const sanitized: string = this._sanitizeName(_name);
    if (sanitized === "" || (sanitized in this._people_by_name)) {
      return;
    }

    const new_id: number = (++ this._latest_people_id);
    const new_person: PeopleItem = {
      id: new_id, name: sanitized, teamid: _teamid
    };
    this._people_by_id[new_id] = new_person;
    this._people_by_name[sanitized] = new_person;
    if (!!_teamid) {
      if (!(_teamid in this._people_by_team)) {
        this._people_by_team[_teamid] = {};
      }
      this._people_by_team[_teamid][new_id] = new_person;
    }
    this._stateSave();
    this._updateSubjects();
  }

  public remove(_name: string): void {
    console.debug(`people-svc > remove > name: ${_name}`);
    if (!_name) {
      return;
    }
    const sanitized: string = this._sanitizeName(_name);
    if (sanitized === "" || !(sanitized in this._people_by_name)) {
      return;
    }
    const item: PeopleItem = this._people_by_name[sanitized];
    delete this._people_by_id[item.id];
    delete this._people_by_name[item.name];
    if (!!item.teamid && (item.teamid in this._people_by_team)) {
      this._removeFromTeamSafe(item.teamid, item);
    }
    this._stateSave();
    this._updateSubjects();
  }

}
