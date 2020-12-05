import { Injectable } from '@angular/core';
import {
  ImportExportStorageItem,
  StorageItem,
  StorageService
} from './storage-service.service';
import * as triplesec from 'triplesec/browser/triplesec';
import { AngularFirestore } from '@angular/fire/firestore';
import { AngularFireAuth } from '@angular/fire/auth';
import firebase from 'firebase/app';
import {
  set as idbset,
  get as idbget
} from 'idb-keyval';
import { BehaviorSubject } from 'rxjs';

export interface SyncItem {
  version: number;
  timestamp: number;
  data: ImportExportStorageItem;
}

export interface SyncEncryptedItem {
  version: string;
  timestamp: number;
  data: string;
}

export interface SyncDecryptedItem {
  version: string;
  timestamp: number;
  data: ImportExportStorageItem;
}

export interface SyncUser {
  uid: string;
  name: string;
  email?: string;
}

export interface SyncStateResultItem {
  local_version: string;
  remote_version: string;
  remote_timestamp: number;
  has_remote_state: boolean;
}

interface RemoteState {
  decrypted: SyncDecryptedItem;
  version: string;
  timestamp: number;
  state: StorageItem;
  ledger: string[];
}

export interface SyncStatus {
  remote?: RemoteState;
  local: {
    state: StorageItem;
    ledger: string[];
  };
  conflict?: boolean;
  ahead?: boolean;
  fastforward?: boolean;
  match?: boolean;
  offby?: number;
}

interface SyncError {
  incorrect_passphrase?: boolean;
  needs_login?: boolean;
}

export interface SyncResultItem {
  status?: SyncStatus;
  error?: SyncError;
}

@Injectable({
  providedIn: 'root'
})
export class SyncService {

  private _is_logged_in: boolean = false;
  private _user: firebase.User|undefined = undefined;

  // synchronization
  private _is_synchronizing: boolean = false;
  private _is_obtaining_state: boolean = false;
  private _has_sync_error: boolean = false;
  private _has_sync_status: boolean = false;
  private _sync_status?: SyncStatus = undefined;
  private _sync_error?: SyncError = undefined;

  private _sync_subject: BehaviorSubject<SyncResultItem|undefined> =
    new BehaviorSubject<SyncResultItem|undefined>(undefined);


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
      name: (!!this._user ? this._user.displayName : ""),
      email: (!!this._user ? this._user.email : "")
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
   *
   * Improved approach (as of Nov 28, 2020):
   *
   *  Our state now includes a version ledger, an array of past version's
   *  hashes, on which we can rely to ascertain whether the remote state is
   *  further along, behind, or conflicting with the current state.
   *
   *  In a nutshell, we are going to grab the remote state and check the
   *  version. If the unencrypted version matches any version we know, then we
   *  can assume we are ahead of the remote state; otherwise we may either be
   *  behind or conflicting. To ascertain which case, we will need to decrypt
   *  the remote state, and check the remote version ledger. Should our hash
   *  exist in the remote ledger, we know we are behind, and will fast-forward
   *  to the remote state; otherwise, we are in conflict and can't do anything
   *  at this point.
   */

  public isSynchronizing(): boolean {
    return this._is_synchronizing;
  }

  private _obtainRemoteEncryptedState(): Promise<SyncEncryptedItem> {
    return new Promise<SyncEncryptedItem>( (resolve, reject) => {
      const state_loc: string = `wwdtasks/${this._user.uid}/sync/state`;
      this._firestore.doc(state_loc).get().subscribe({
        next: (doc: firebase.firestore.DocumentSnapshot<SyncEncryptedItem>) => {
          if (!doc.exists) {
            reject();
          } else {
            resolve(doc.data());
          }
        }
      });
    });
  }

  private _decryptState(
    encrypted: SyncEncryptedItem, passphrase: string
  ): Promise<SyncDecryptedItem> {
    return new Promise<SyncDecryptedItem>( (resolve, reject) => {
      const encrypted_data: string = encrypted.data;
      this.decrypt(encrypted_data, passphrase)
      .then( (decrypted_data: string) => {
        const item: ImportExportStorageItem = JSON.parse(decrypted_data);
        resolve({
          data: item,
          version: item.state.hash,
          timestamp: item.state.timestamp
        });
      })
      .catch( (err) => reject(err));
    });
  }

  private _encryptState(
    plain: ImportExportStorageItem,
    passphrase: string
  ): Promise<SyncEncryptedItem> {
    return new Promise<SyncEncryptedItem>( (resolve, reject) => {
      const plain_data: string = JSON.stringify(plain);
      this.encrypt(plain_data, passphrase).then( (encrypted_data: string) => {
        const encrypted_item: SyncEncryptedItem = {
          data: encrypted_data,
          timestamp: plain.state.timestamp,
          version: plain.state.hash
        };
        resolve(encrypted_item);
      })
      .catch( (err) => reject(err));
    });
  }

  private _preprocessRemoteState(
    item: SyncDecryptedItem, status: SyncStatus
  ): void {

    const remote_state: RemoteState = {
      decrypted: item,
      version: item.version,
      timestamp: item.timestamp,
      state: item.data.state,
      ledger: item.data.ledger
    };

    status.remote = remote_state;

    const our_version: string = status.local.state.hash;

    if (remote_state.version === our_version) {
      // same version, nothing to do.
      status.match = true;
    } else if (
      remote_state.ledger.includes(our_version) ||
      our_version === ""
    ) {
      // fast-forward
      const idx: number = remote_state.ledger.indexOf(our_version);
      status.fastforward = true;
      status.offby = remote_state.ledger.length - idx - 1;
    } else if (status.local.ledger.includes(remote_state.version)) {
      // remote is behind.
      const idx: number = status.local.ledger.indexOf(remote_state.version);
      status.ahead = true;
      status.offby = status.local.ledger.length - idx - 1;
    } else {
      // conflict.
      // todo: check for last shared state.
      status.conflict = true;
    }
  }

  private async _obtainSyncStatus(passphrase: string): Promise<SyncStatus> {

    return new Promise<SyncStatus>( (resolve, reject) => {

      const status: SyncStatus = {
        local: {
          state: this._storage_svc.getState(),
          ledger: this._storage_svc.getStateLedger()
        }
      };

      // FIXME: rate limit obtaining remote state.
      this._obtainRemoteEncryptedState()
      .then( (encrypted_item: SyncEncryptedItem) => {

        this._decryptState(encrypted_item, passphrase)
        .then( (decrypted_item: SyncDecryptedItem) => {
          // decrypted
          this._preprocessRemoteState(decrypted_item, status);
          resolve(status);
        })
        .catch( () => {
          // incorrect passphrase
          const error: SyncError = {incorrect_passphrase: true};
          reject(error);
        });
      })
      .catch( () => {
        // no such item
        resolve(status);
      });
    });
  }

  public initSync(
    passphrase: string
  ): BehaviorSubject<SyncResultItem|undefined> {
    if (!this.isLoggedIn()) {
      this._has_sync_error = true;
      this._sync_error = {needs_login: true};
      this._sync_subject.next({error: this._sync_error});
      return this._sync_subject;
    }

    if (this._is_obtaining_state) {
      return this._sync_subject;
    }
    this._is_obtaining_state = true;
    this._sync_status = undefined;
    this._sync_error = undefined;
    this._has_sync_error = false;
    this._has_sync_status = false;

    this._obtainSyncStatus(passphrase)
    .then( (status: SyncStatus) => {
      this._sync_status = status;
      this._sync_error = undefined;
      this._has_sync_error = false;
      this._has_sync_status = true;
    })
    .catch( (error: SyncError) => {
      this._sync_status = undefined;
      this._sync_error = error;
      this._has_sync_status = false;
      this._has_sync_error = true;
    })
    .finally( () => {
      this._is_obtaining_state = false;
      this._sync_subject.next({
        status: this._sync_status,
        error: this._sync_error
      });
    });
    return this._sync_subject;
  }

  public isObtainingState(): boolean {
    return this._is_obtaining_state;
  }

  public hasSyncState(): boolean {
    return (
      !this.isObtainingState() &&
      this._has_sync_status && this._sync_status !== undefined &&
      !this._has_sync_error
    );
  }

  public hasRemoteState(): boolean {
    return (
      this.hasSyncState() &&
      !!this._sync_status.remote
    );
  }

  public canFastForward(): boolean {
    return (
      this.hasSyncState() &&
      this.hasRemoteState() &&
      !!this._sync_status.fastforward &&
      this._sync_status.fastforward
    );
  }

  public isAhead(): boolean {
    return (
      this.hasSyncState() &&
      this.hasRemoteState() &&
      !!this._sync_status.ahead &&
      this._sync_status.ahead
    );
  }

  public hasConflict(): boolean {
    return (
      this.hasSyncState() &&
      this.hasRemoteState() &&
      !!this._sync_status.conflict &&
      this._sync_status.conflict
    );
  }

  public hasError(): boolean {
    return (!this.isObtainingState() && this._has_sync_error);
  }

  public isReadyToSync(): boolean {
    return (
      this.isLoggedIn() && this.hasSyncState() && (
        this.canFastForward() || this.isAhead() || this.hasConflict() ||
        !this.hasRemoteState()
      )
    );
  }

  public canPullState(): boolean {
    return (
      this.isReadyToSync() && this.hasRemoteState() && !this.isAhead()
    );
  }

  public canPushState(): boolean {
    return (
      this.isReadyToSync() && (!this.canFastForward() || !this.hasRemoteState())
    );
  }

  private _pushState(encrypted: SyncEncryptedItem): Promise<void> {
    return new Promise<void>( (resolve, reject) => {
      const state_loc: string = `wwdtasks/${this._user.uid}/sync/state`;
      this._firestore.doc(state_loc).set(encrypted)
      .then( () => {
        console.log(`pushed state ${encrypted.version}`);
        resolve();
      })
      .catch( (err) => reject(err));
    });
  }

  public pushState(passphrase: string): Promise<void> {
    return new Promise<void>( (resolve, reject) => {
      this._storage_svc.exportData()
      .then( (exported: ImportExportStorageItem) => {
        return this._encryptState(exported, passphrase);
      })
      .then( (encrypted_item: SyncEncryptedItem) => {
        return this._pushState(encrypted_item);
      })
      .then( () => resolve())
      .catch( (err) => reject(err));
    });
  }

  public pullState(): Promise<void> {
    return new Promise<void>( (resolve, reject) => {
      if (!this.hasSyncState() || !this.hasRemoteState()) {
        reject();
        return;
      }
      const remote_item: SyncDecryptedItem = this._sync_status.remote.decrypted;
      this._storage_svc.importData(remote_item.data)
      .then(() => resolve())
      .catch(() => reject());
    });
  }

}
