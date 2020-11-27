import { Injectable } from '@angular/core';
import {
  ImportExportProjectsDataItem, ProjectsService, ProjectsStorageDataItem
} from './projects-service.service';
import {
  ImportExportTaskDataItem, TaskService, TasksStorageDataItem
} from './task-service.service';
import * as triplesec from 'triplesec/browser/triplesec';
import { Mutex } from 'async-mutex';
import { set as idbset, get as idbget, del as idbdel } from 'idb-keyval';

export interface ImportExportDataItem {
  timestamp: number;
  data: {
    tasks: ImportExportTaskDataItem;
    projects: ImportExportProjectsDataItem;
  };
}

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

  public STORE_VERSION: number = 1;

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

  private _initState(): void {
    this._state_mutex.acquire()
    .then( async () => {
      await this._loadState();
      this._is_init = true;
    })
    .finally( () => this._state_mutex.release());
  }

  private async _loadState(): Promise<void> {
    return new Promise<void>( async (resolve) => {
      if (!this._state_mutex.isLocked()) {
        throw new Error("can't load state without protection from mutex");
      }

      const state_hash: string|undefined = await idbget("_wwdtasks_state");
      if (!state_hash) {
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

  private async _commitState(): Promise<void> {
    this._state_mutex.acquire()
    .then( async () => {
      if (!this._is_init) {
        return;
      }
      const old_hash: string = this._current_state.hash;
      this._current_state.timestamp = new Date().getTime();
      const data_str: string = JSON.stringify(this._current_state.data);
      const data_hash: string = this.hash(data_str);
      this._current_state.hash = data_hash;
      this._state_ledger.push(data_hash);

      const promises = [
        idbset("_wwdtasks_state", data_hash),
        idbset(`_wwdtasks_${data_hash}`, this._current_state),
        idbset("_wwdtasks_ledger", this._state_ledger)
      ];
      if (!!old_hash && old_hash !== "") {
        promises.push(idbdel(`_wwdtasks_${old_hash}`));
      }
      Promise.all(promises).then(
        () => {
          console.log(`committed state ${data_hash}`);
        }
      );
    })
    .finally( () => this._state_mutex.release() );
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

  async exportData(): Promise<ImportExportDataItem> {
    return new Promise<ImportExportDataItem>( async (resolve) => {
      const export_data: ImportExportDataItem = {
        timestamp: new Date().getTime(),
        data: {
          tasks: await this._tasks_svc.exportData(),
          projects: await this._projects_svc.exportData()
        }
      };
      resolve(export_data);
    });
  }

  async importData(import_data: ImportExportDataItem): Promise<boolean> {
    return new Promise<boolean>( async (resolve) => {

      // FIXME: we should be loading first, and then committing all services IFF
      // all services succeed.
      const promises: Promise<boolean>[] = [];
      promises.push(this._tasks_svc.importData(import_data.data.tasks));
      promises.push(this._projects_svc.importData(import_data.data.projects));

      Promise.all(promises).then( (result: boolean[]) => {
        let success: boolean = true;
        result.forEach( (v: boolean) => success = success && v);
        resolve(success);
      });
    });
  }
}
