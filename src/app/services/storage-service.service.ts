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


export interface StorageDataItem {
  tasks?: TasksStorageDataItem;
  projects?: ProjectsStorageDataItem;
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

  public STORE_VERSION: number = 2;

  public constructor(
    private _tasks_svc: TaskService,
    private _projects_svc: ProjectsService
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
  }

  private async _initStateSafe(): Promise<void> {
    return new Promise<void>( async (resolve) => {
      if (!this._state_mutex.isLocked()) {
        throw new Error("state mutex must be locked");
      }
      console.log("mutex > acquire > _initState");
      const cur_version: number = await idbget("_wwdtasks_version");
      if (cur_version > this.STORE_VERSION) {
        console.error(`store version ${cur_version} higher than application's`);
        return;
      } else if (cur_version < this.STORE_VERSION) {
        await this._upgradeStore(cur_version);
      }

      console.log("_initState > loading state");
      await this._loadState();
      this._is_init = true;

      this._tasks_svc.stateLoad(this._current_state.data.tasks);
      this._projects_svc.stateLoad(this._current_state.data.projects);
      resolve();
    });
  }

  private _initState(): void {
    this._state_mutex.acquire()
    .then( async () => {
      await this._initStateSafe();
    })
    .finally( () => {
      console.log("mutex > release > _initState");
      this._state_mutex.release();
    });
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
    return new Promise<void>( async (resolve) => {
      if (!this._state_mutex.isLocked()) {
        throw new Error("can't load state without protection from mutex");
      }

      const state_hash: string|undefined = await idbget("_wwdtasks_state");
      if (!state_hash) {
        resolve();
        return;
      }
      Promise.all([
        idbget(`_wwdtasks_${state_hash}`),
        idbget("_wwdtasks_ledger")
      ])
      .then( (result: [StorageItem|undefined, string[]|undefined]) => {
        const state: StorageItem|undefined = result[0];
        const ledger: string[]|undefined = result[1];
        if (!state || !ledger) {
          resolve();
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
      console.log(`commit state safely > old: ${old_hash}, new: `, new_state);
      const data_str: string = JSON.stringify(new_state.data);
      const data_hash: string = this.hash(data_str);
      new_state.hash = data_hash;

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
      console.log("committing state...");
      this._state_mutex.acquire()
      .then( async () => {
        console.log("mutex > acquire > _commitState");
        if (!this._is_init) {
          console.log("storage not init");
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
