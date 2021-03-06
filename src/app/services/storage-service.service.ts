import { Injectable } from '@angular/core';
import {
  ProjectsService, ProjectsStorageDataItem
} from './projects-service.service';
import {
  TaskService, TasksStorageDataItem,
  IDBTaskItem, IDBTaskArchiveType
} from './task-service.service';
import * as triplesec from 'triplesec/browser/triplesec';
import { Mutex } from 'async-mutex';
import { set as idbset, get as idbget, del as idbdel } from 'idb-keyval';
import { LabelsService, LabelsStorageDataItem } from './labels-service.service';
import { TeamsService, TeamsStorageDataItem } from './teams-service.service';
import { PeopleService, PeopleStorageDataItem } from './people-service.service';


export interface StorageDataItem {
  tasks?: TasksStorageDataItem;
  projects?: ProjectsStorageDataItem;
  labels?: LabelsStorageDataItem;
  teams?: TeamsStorageDataItem;
  people?: PeopleStorageDataItem;
}

export interface StorageItem {
  store_version?: number;
  timestamp: number;
  hash: string;
  data: StorageDataItem;
}

export interface ImportExportStorageItem {
  state: StorageItem;
  ledger: string[];
}

@Injectable({
  providedIn: 'root'
})
export class StorageService {

  private _current_state: StorageItem = {
    timestamp: 0, hash: "", data: { }
  };
  private _state_ledger: string[] = [];
  private _state_mutex: Mutex = new Mutex();
  private _is_init: boolean = false;
  private _is_error_state: boolean = false;

  public STORE_VERSION: number = 2;

  public constructor(
    private _tasks_svc: TaskService,
    private _projects_svc: ProjectsService,
    private _labels_svc: LabelsService,
    private _teams_svc: TeamsService,
    private _people_svc: PeopleService
  ) {
    this._initState();

    this._tasks_svc.getStorageObserver().subscribe({
      next: (item: TasksStorageDataItem) => {
        if (!item || Object.keys(item).length === 0) {
          return;
        }
        this._handleTaskData(item);
      }
    });

    this._projects_svc.getStorageObserver().subscribe({
      next: (item: ProjectsStorageDataItem) => {
        if (!item) {
          return;
        }
        this._handleProjectData(item);
      }
    });

    this._labels_svc.getStorageObserver().subscribe({
      next: (item: LabelsStorageDataItem) => {
        if (!item) {
          return;
        }
        this._handleLabelsData(item);
      }
    });

    this._teams_svc.getStorageObserver().subscribe({
      next: (item: TeamsStorageDataItem) => {
        if (!item) {
          return;
        }
        this._handleTeamsData(item);
      }
    });

    this._people_svc.getStorageObserver().subscribe({
      next: (item: PeopleStorageDataItem) => {
        if (!item) {
          return;
        }
        this._handlePeopleData(item);
      }
    });
  }

  private async _initStorage(): Promise<void> {
    return new Promise<void>( (resolve, reject) => {
      const new_state: StorageItem = {
        timestamp: new Date().getTime(),
        hash: "",
        data: {
          tasks: this._tasks_svc.getInitState(),
          projects: this._projects_svc.getInitState()
        }
      };

      this._commitStateSafe("", new_state, [])
      .then( () => {
        return idbset("_wwdtasks_version", this.STORE_VERSION);
      })
      .then( () => {
        console.log(`initiated storage state version ${this.STORE_VERSION}`);
        resolve();
      })
      .catch( (err) => {
        console.error("error initiating first storage state: ", err);
        reject(err);
      });
    });
  }

  private async _initStateSafe(): Promise<void> {
    return new Promise<void>( async (resolve, reject) => {
      if (!this._state_mutex.isLocked()) {
        throw new Error("state mutex must be locked");
      }
      const cur_version: number = await idbget("_wwdtasks_version");
      if (cur_version > this.STORE_VERSION) {
        console.error(`store version ${cur_version} higher than application's`);
        return;
      } else if (cur_version < this.STORE_VERSION) {
        await this._upgradeStore(cur_version);
      } else if (cur_version === undefined) {
        console.log("first run, initiate storage");
        await this._initStorage();
      }

      console.log("_initState > loading state");
      this._loadState()
      .then( () => {
        this._is_init = true;

        console.log("_initState > current state: ", this._current_state);

        this._tasks_svc.stateLoad(this._current_state.data.tasks);
        this._projects_svc.stateLoad(this._current_state.data.projects);
        if (!("labels" in this._current_state.data)) {
          this._current_state.data.labels = this._labels_svc.getInitState();
        }
        this._labels_svc.stateLoad(this._current_state.data.labels);
        if (!("teams" in this._current_state.data)) {
          this._current_state.data.teams = this._teams_svc.getInitState();
        }
        this._teams_svc.stateLoad(this._current_state.data.teams);
        if (!("people" in this._current_state.data)) {
          this._current_state.data.people = this._people_svc.getInitState();
        }
        this._people_svc.stateLoad(this._current_state.data.people);

        resolve();
      })
      .catch( (err: string) => {
        console.error(`_initStateSafe > error: ${err}`);
        console.error("_initStateSafe > marking store with error!");
        this._is_error_state = true;
        this._is_init = false;
        reject();
      });
    });
  }

  private _initState(): void {
    this._state_mutex.acquire()
    .then( async () => {
      console.log("mutex > acquire > _initState");
      await this._initStateSafe();
    })
    .finally( () => {
      console.log("mutex > release > _initState");
      this._state_mutex.release();
      this._initServices();
    });
  }

  private _initServices(): void {
    this._tasks_svc.convertProjectsToIDs(this._projects_svc);
  }

  private async _upgradeStore(version: number): Promise<void> {
    return new Promise<void>( (resolve) => {
      if (version === 1) {
        // initial store version, with state kept in individual keys.
        this._upgradeFromV1().then( (data: StorageDataItem) => {
          this._upgradeToV2(data).then( () => resolve() );
        });
      }
    });
  }

  private async _loadState(): Promise<void> {
    return new Promise<void>( async (resolve, reject) => {
      if (!this._state_mutex.isLocked()) {
        throw new Error("can't load state without protection from mutex");
      }

      const state_hash: string|undefined = await idbget("_wwdtasks_state");
      if (!state_hash) {
        console.log("_loadState > state hash not available");
        reject("state hash not available/found");
        return;
      }
      console.log(`_loadState > loading state ${state_hash}`);
      Promise.all([
        idbget(`_wwdtasks_${state_hash}`),
        idbget("_wwdtasks_ledger")
      ])
      .then( (result: [StorageItem|undefined, string[]|undefined]) => {
        const state: StorageItem|undefined = result[0];
        const ledger: string[]|undefined = result[1];
        if (!state || !ledger) {
          console.error("_loadState > state or ledger not found");
          reject("state or ledger not found");
          return;
        }
        this._current_state = state;
        this._state_ledger = ledger;
        console.log(`loaded state ${state_hash}`);
        resolve();
      });
    });
  }

  private async _commitStateSafe(
    old_hash: string,
    new_state: StorageItem,
    new_ledger?: string[]
  ): Promise<void> {

    return new Promise<void>( (resolve, reject) => {

      if (!this._state_mutex.isLocked()) {
        throw new Error("state mutex must be locked");
      }

      if (!new_state) {
        console.error("_commitStateSafe > attempting committing empty state");
        reject();
        return;
      }

      console.log(`commit state safely > old: ${old_hash}, new: `, new_state);
      const data_str: string = JSON.stringify(new_state.data);
      const data_hash: string = this.hash(data_str);

      if (data_hash === old_hash) {
        console.log(`commit state safely > no state changes (old: ${old_hash}, new: ${data_hash}) -- idempotent`);
        resolve();
        return;
      }

      new_state.hash = data_hash;
      new_state.timestamp = new Date().getTime();

      const new_state_ledger: string[] = (
        !!new_ledger ? [...new_ledger] : [...this._state_ledger]
      );
      new_state_ledger.push(data_hash);

      console.log("preparing to commit state");
      const promises = [
        idbset("_wwdtasks_state", data_hash),
        idbset(`_wwdtasks_${data_hash}`, new_state),
        idbset("_wwdtasks_ledger", new_state_ledger)
      ];
      if (!!old_hash && old_hash !== "") {
        promises.push(idbdel(`_wwdtasks_${old_hash}`));
      }
      Promise.all(promises)
      .then(() => {
        console.log(`wrote new state ${data_hash} to storage`);
        this._state_ledger = new_ledger;
        this._current_state = new_state;
        resolve();
      })
      .catch(() => reject());
    });
  }

  private async _commitState(): Promise<void> {
    return new Promise<void>( (resolve, reject) => {
      console.log(`committing state (locked ${this._state_mutex.isLocked()})`);
      this._state_mutex.acquire()
      .then( async () => {
        console.log("mutex > acquire > _commitState");
        if (!this._is_init) {
          console.log("storage not init");
          reject();
          return;
        }
        const old_hash: string = this._current_state.hash;
        this._commitStateSafe(old_hash, this._current_state, this._state_ledger)
        .then(() => resolve())
        .catch(() => reject());
      })
      .finally( () => {
        console.log("mutex > release > _commitState");
        this._state_mutex.release();
      });
    });
  }

  private async _handleTaskData(item: TasksStorageDataItem): Promise<void> {
    this._current_state.data.tasks = item;
    this._commitState();
  }

  private async _handleProjectData(
    item: ProjectsStorageDataItem
  ): Promise<void> {
    this._current_state.data.projects = item;
    this._commitState();
  }

  private async _handleLabelsData(
    item: LabelsStorageDataItem
  ): Promise<void> {
    this._current_state.data.labels = item;
    this._commitState();
  }

  private async _handleTeamsData(
    item: TeamsStorageDataItem
  ): Promise<void> {
    this._current_state.data.teams = item;
    this._commitState();
  }

  private async _handlePeopleData(
    item: PeopleStorageDataItem
  ): Promise<void> {
    this._current_state.data.people = item;
    this._commitState();
  }

  public hash(data: string): string {
    const sha256: triplesec.hash.SHA256 = new triplesec.hash.SHA256();
    const wordarray: triplesec.WordArray = triplesec.WordArray.from_utf8(data);
    const sha: triplesec.WordArray = sha256.finalize(wordarray);
    return sha.to_hex();
  }

  public async exportData(): Promise<ImportExportStorageItem> {
    return new Promise<ImportExportStorageItem>( (resolve) => {
      this._state_mutex.acquire()
      .then( () => {
        console.log("mutex > acquire > exportData");
        resolve({
          state: this._current_state,
          ledger: this._state_ledger
        });
      })
      .finally( () => {
        console.log("mutex > release > exportData");
        this._state_mutex.release();
      });
    });
  }

  public async importData(imported: ImportExportStorageItem): Promise<boolean> {
    return new Promise<boolean>( (resolve) => {
      console.log("importing data, begin");
      console.log(" mutex locked: ", this._state_mutex.isLocked());
      this._state_mutex.acquire()
      .then( () => {
        console.log("mutex > acquire > importData");
        console.log("importing data");

        const current_hash: string = (
          !!this._current_state ? this._current_state.hash : ""
        );
        return this._commitStateSafe(
          current_hash, imported.state, imported.ledger
        );
      })
      .then( () => {
        console.log("initing state");
        return this._initStateSafe();
      })
      .then(() => resolve(true))
      .catch(() => resolve(false))
      .finally( () => {
        this._state_mutex.release();
        console.log("mutex > release > importData");
      });
    });
  }

  public getState(): StorageItem {
    return this._current_state;
  }

  public getStateLedger(): string[] {
    return this._state_ledger;
  }

  // upgrade store formats
  //
  private _upgradeFromV1(): Promise<StorageDataItem> {
    return new Promise<StorageDataItem>( async (resolve) => {
      console.assert(this._state_mutex.isLocked());
      let instore_tasks: IDBTaskItem[]|undefined = await idbget("_wwd_tasks");
      if (!instore_tasks) {
        instore_tasks = [];
      }

      let instore_archives: IDBTaskArchiveType|undefined =
        await idbget("_wwdtasks_archive");
      if (!instore_archives) {
        instore_archives = {};
      }

      let instore_projects: string[]|undefined =
        await idbget("_wwdtasks_projects");
      if (!instore_projects) {
        instore_projects = [];
      }

      const data: StorageDataItem = {
        tasks: {
          tasks: instore_tasks,
          archives: instore_archives
        },
        projects: {
          projects: instore_projects
        }
      };
      idbset("_wwdtasks_version", this.STORE_VERSION).then(() => resolve(data));
    });
  }

  private _upgradeToV2(original_data: StorageDataItem): Promise<void> {
    return new Promise<void>( async (resolve) => {
      console.assert(this._state_mutex.isLocked());
      const data_str: string = JSON.stringify(original_data);
      const data_hash: string = this.hash(data_str);

      const new_state: StorageItem = {
        data: original_data,
        timestamp: new Date().getTime(),
        hash: data_hash,
        store_version: this.STORE_VERSION
      };
      const new_state_ledger: string[] = [data_hash];
      const promises = [
        idbset("_wwdtasks_state", data_hash),
        idbset(`_wwdtasks_${data_hash}`, new_state),
        idbset("_wwdtasks_ledger", new_state_ledger),
        idbset("_wwdtasks_version", this.STORE_VERSION)
      ];
      Promise.all(promises).then( () => {
        console.log("upgraded state from v1 to v2");
        resolve();
      });
    });
  }
}
