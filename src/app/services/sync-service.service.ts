import { Injectable } from '@angular/core';
import {
  ImportExportDataItem,
  StorageService
} from './storage-service.service';
import * as triplesec from 'triplesec/browser/triplesec';
import { AngularFirestore } from '@angular/fire/firestore';
import { AngularFireAuth } from '@angular/fire/auth';
import firebase from 'firebase/app';
import { BehaviorSubject } from 'rxjs';
import {
  set as idbset,
  get as idbget
} from 'idb-keyval';

export interface SyncItem {
  version: number;
  timestamp: number;
  data: ImportExportDataItem;
}

export interface SyncEncryptedItem {
  version: number;
  timestamp: number;
  data: string;
  control: string;
}

export interface SyncUser {
  uid: string;
  name: string;
}

interface SyncWriteResultItem {
  conflict?: boolean;
  success?: boolean;
  error?: boolean;
}

export interface SyncStateResultItem {
  local_version: number;
  remote_version: number;
  remote_timestamp: number;
  has_remote_state: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SyncService {

  private _is_logged_in: boolean = false;
  private _user: firebase.User|undefined = undefined;
  private _is_ready: boolean = false;

  // synchronization
  private _is_synchronizing: boolean = false;
  private _cur_version: number = -1;
  private _cur_remote_state: SyncEncryptedItem|undefined = undefined;


  public constructor(
    private _firestore: AngularFirestore,
    private _firestore_auth: AngularFireAuth,
    private _storage_svc: StorageService,
  ) {
    this._firestore_auth.onAuthStateChanged(
      (user: firebase.User) => {
        // console.log("sync svc: state changed: ", user);
        if (!!user) {
          this._is_logged_in = true;
          this._user = user;
        } else {
          this._is_logged_in = false;
          this._user = undefined;
        }
      }
    );
    idbget("_wwdtasks_sync_version").then(
      (version: number | undefined) => {
        this._cur_version = (!!version ? version : 0);
      }
    );
  }

  public logout(): void {
    this._firestore_auth.signOut().then(
      () => {
        this._is_logged_in = false;
        this._user = undefined;
      }
    );
  }

  public isLoggedIn(): boolean {
    return this._is_logged_in;
  }

  public getUser(): SyncUser {
    return {
      uid: (!!this._user ? this._user.uid : ""),
      name: (!!this._user ? this._user.displayName : "")
    };
  }

  public encrypt(data: string, passphrase: string): Promise<string> {
    return new Promise<string>(
      (resolve, reject) => {
        triplesec.encrypt({
          data: triplesec.Buffer.from(data),
          key: triplesec.Buffer.from(passphrase)
        }, (err, buff: triplesec.Buffer) => {
          if (err) {
            reject(err);
          } else {
            resolve(buff.toString("hex"));
          }
        });
      }
    );
  }

  public decrypt(data: string, passphrase: string): Promise<string> {
    return new Promise<string>(
      (resolve, reject) => {
        triplesec.decrypt({
          data: triplesec.Buffer.from(data, "hex"),
          key: triplesec.Buffer.from(passphrase)
        }, (err, buff: triplesec.Buffer) => {
          if (err) {
            reject(err);
          } else {
            resolve(buff.toString());
          }
        });
      }
    );
  }

  /**
   * Synchronization infrastructure.
   *
   *
   * Current approach (as of Nov 22, 2020):
   *
   *  We are taking a very simple approach for our first implementation: we pass
   *  on to the user the onus of deciding whether we're downloading or uploading
   *  changes.
   *
   *  We will present the user with the server's current version and when data
   *  was last synchronized, and we will let the user then decide whether to
   *  upload or download the data.
   *
   *  At a later stage this ought to be smarter, but for now we need to ensure
   *  we have enough of the mechanism working. Additionally, something smarter
   *  requires some more awareness of other services, such as the task service,
   *  which would be overkill for a proof-of-concept.
   */

  public isSynchronizing(): boolean {
    return this._is_synchronizing;
  }

  public isReadyToSync(): boolean {
    return this.isLoggedIn() && (this._cur_version >= 0);
  }

  private async _isCorrectPassphrase(
    state: SyncEncryptedItem,
    passphrase: string
  ): Promise<boolean> {
    return new Promise<boolean>( (resolve, reject) => {
      this.decrypt(state.control, passphrase).then(
        (control: string) => {
          if (control !== this._user.uid) {
            resolve(false);
          } else {
            resolve(true);
          }
        }
      )
      .catch( (err) => {
        console.log("unable to decrypt remote state control: ", err);
        resolve(false);
      });
    });
  }

  public checkSyncStatus(passphrase: string): Promise<SyncStateResultItem> {
    return new Promise<SyncStateResultItem>( (resolve, reject) => {
      const state_loc: string = `wwdtasks/${this._user.uid}/sync/state`;
      this._firestore.doc(state_loc).get().subscribe({ next:
        async (doc: firebase.firestore.DocumentSnapshot<SyncEncryptedItem>) => {
          const remote_state: SyncEncryptedItem = doc.data();

          if (doc.exists) {
            if (!(await this._isCorrectPassphrase(remote_state, passphrase))) {
              reject("incorrect passphrase");
            }
          }

          this._cur_remote_state = remote_state;

          resolve({
            local_version: this._cur_version,
            remote_version: doc.exists ? remote_state.version : -1,
            remote_timestamp: doc.exists ? remote_state.timestamp : -1,
            has_remote_state: doc.exists
          });
        }
      });
    });
  }

  public canPullState(): boolean {
    if (!this.isReadyToSync) {
      return false;
    }
    return (
      !!this._cur_remote_state &&
      this._cur_remote_state.version > this._cur_version
    );
  }

  public canPushState(): boolean {
    if (!this.isReadyToSync()) {
      return false;
    } else if (!this._cur_remote_state) {
      return true;
    }
    return ((this._cur_version + 1) > this._cur_remote_state.version);
  }

  public pullState(passphrase: string): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      const encrypted_data: string = this._cur_remote_state.data;
      this.decrypt(encrypted_data, passphrase)
      .then( (data: string) => {
        console.log("decrypted data: ", data);
        resolve(true);
      })
      .catch( () => resolve(false) );
    });
  }

  public pushState(passphrase: string): Promise<boolean> {
    return new Promise<boolean>( async (resolve, reject) => {
      const pending_version: number = this._cur_version + 1;
      const exported_data: ImportExportDataItem =
        await this._storage_svc.exportData();

      const control_to_encrypt: string = this._user.uid;
      const encrypted_control: string =
        await this.encrypt(control_to_encrypt, passphrase);
      const data_to_encrypt: string = JSON.stringify(exported_data);
      const encrypted_data: string =
        await this.encrypt(data_to_encrypt, passphrase);

      const item: SyncEncryptedItem = {
        version: pending_version,
        timestamp: new Date().getTime(),
        data: encrypted_data,
        control: encrypted_control
      };

      const state_loc: string = `wwdtasks/${this._user.uid}/sync/state`;
      this._firestore.doc(state_loc).set(item)
      .then( () => {
        console.log("wrote to firestore");
        idbset("_wwdtasks_sync_version", pending_version)
        .then( () => {
          this._cur_version = pending_version;
          resolve(true);
        });
      })
      .catch( () => resolve(false));
    });
  }

}
