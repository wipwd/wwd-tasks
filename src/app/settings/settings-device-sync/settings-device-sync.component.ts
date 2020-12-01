import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { BehaviorSubject, Observable } from 'rxjs';
import { SettingsDeviceSyncDialogComponent } from './settings-device-sync-dialog/settings-device-sync-dialog.component';
import firebase from 'firebase/app';
import {
  SyncResultItem, SyncService, SyncStateResultItem, SyncUser, SyncStatus
} from '../../services/sync-service.service';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';


@Component({
  selector: 'app-settings-device-sync',
  templateUrl: './settings-device-sync.component.html',
  styleUrls: ['./settings-device-sync.component.scss']
})
export class SettingsDeviceSyncComponent implements OnInit {

  private _enabled: boolean = false;
  private _is_error: boolean = false;
  private _is_logging_in: boolean = false;
  private _logging_in_state: string = "";

  private _is_checking_sync_status: boolean = false;
  private _has_sync_status: boolean = false;
  private _has_sync_error: boolean = false;
  private _sync_error_msg: string = "";
  private _sync_status: SyncStatus|undefined = undefined;
  private _is_pulling_state: boolean = false;
  private _is_pushing_state: boolean = false;
  private _push_pull_op_state: string = "";

  public passphrase_form_group: FormGroup;
  public passphrase_form_ctrl: FormControl;

  public is_toggled: BehaviorSubject<boolean> =
    new BehaviorSubject<boolean>(false);

  public constructor(
    private _confirm_dialog: MatDialog,
    private _firestore_auth: AngularFireAuth,
    private _sync_svc: SyncService,
    private _fb: FormBuilder
  ) {
    this.passphrase_form_ctrl = new FormControl("");
    this.passphrase_form_group = this._fb.group({
      passphrase: this.passphrase_form_ctrl
    });
  }

  public ngOnInit(): void { }

  private _showSyncDialog(): void {
    this._enabled = false;
    const dialogref: MatDialogRef<SettingsDeviceSyncDialogComponent> =
      this._confirm_dialog.open(SettingsDeviceSyncDialogComponent);
    dialogref.afterClosed().subscribe({
      next: (result: boolean) => {
        if (!!result && result === true) {
          console.log("enabled!");
          this._enableSync(true);
        } else {
          this._disableSync();
        }
      }
    });
    dialogref.backdropClick().subscribe({
      next: () => { this._disableSync(); }
    });
  }

  private _disableSync(): void {
    this._enabled = false;
    this.is_toggled.next(false);
    console.log("disable sync");
  }

  private _enableSync(login: boolean): void {
    this._enabled = true;
    this.is_toggled.next(true);

    if (login) {
      this._loginGoogle();
    }
  }

  private _loginGoogle(): void {
    this._is_logging_in = true;
    this._logging_in_state = "inprogress";
    this._firestore_auth.signInWithPopup(
      new firebase.auth.GoogleAuthProvider()
    ).then(
      (credentials: firebase.auth.UserCredential) => {
        console.log("credentials: ", credentials);
        this._is_logging_in = false;
        this._logging_in_state = "success";
      }
    ).catch( () => {
      this._is_logging_in = false;
      this._is_error = true;
      this._logging_in_state = "error";
      this._disableSync();
    });
  }


  public changeSyncToggle(event: MatSlideToggleChange): void {
    console.log("change: ", event);
    if (event.checked) {
      this.is_toggled.next(true);
      if (!this.isLoggedIn()) {
        this._showSyncDialog();
      } else {
        this._enableSync(false);
        this._logging_in_state = "success";
      }
    } else {
      this._disableSync();
    }
  }

  public logout(): void {
    this._sync_svc.logout();
    this.is_toggled.next(false);
    this._logging_in_state = "";
  }

  public getInfo(): Observable<string> {
    return new Observable<string>(
      subscribe => {
        this._firestore_auth.user.subscribe({
          next: (user: firebase.User) => {
            if (!user) {
              return;
            }
            const uid = user.uid;
            const username = user.displayName;
            subscribe.next(`uid: ${uid}, username: ${username}`);
          }
        });
      }
    );
  }

  public getState(): string {
    return this._logging_in_state;
  }

  public isEnabled(): boolean {
    return this._enabled && this.isLoggedIn();
  }

  public isLoggingIn(): boolean {
    return this._is_logging_in;
  }

  public isLoggedIn(): boolean {
    return this._sync_svc.isLoggedIn();
  }

  public isError(): boolean {
    return this._is_error;
  }

  public getLoggedUser(): SyncUser {
    return this._sync_svc.getUser();
  }

  public startSync(): void {
    if (!this.passphrase_form_group.valid) {
      return;
    }
    const passphrase: string = this.passphrase_form_ctrl.value;

    this._sync_svc.initSync(passphrase).subscribe({
      next: (result: SyncResultItem) => {
        if (!result) {
          return;
        }

        if (!!result.error) {
          this._has_sync_error = true;
          if (result.error.incorrect_passphrase) {
            this._sync_error_msg = "Incorrect Passphrase";
          } else if (result.error.needs_login) {
            this._sync_error_msg = "Requires log in";
          } else {
            this._sync_error_msg = "Unknown error occurred";
          }
          return;
        }
        this._sync_status = result.status;
        this._is_checking_sync_status = false;
        this._has_sync_error = false;
        this._has_sync_status = true;
      }
    });
  }

  public isCheckingStatus(): boolean {
    return this._is_checking_sync_status;
  }

  public hasStatus(): boolean {
    return this._has_sync_status && !!this._sync_status;
  }

  public getSyncStatus(): SyncStatus {
    return this._sync_status;
  }

  public hasSyncError(): boolean {
    return this._has_sync_error;
  }

  public getSyncError(): string {
    return this._sync_error_msg;
  }

  public isSynchronizing(): boolean {
    return this.isCheckingStatus() || this.hasStatus();
  }

  public hasRemoteState(): boolean {
    return this.hasStatus() && !!this._sync_status.remote;
  }

  public isConflict(): boolean {
    return (
      this.hasStatus() &&
      !!this._sync_status.conflict && this._sync_status.conflict
    );
  }

  public isLocalAhead(): boolean {
    return (
      this.hasStatus() &&
      !!this._sync_status.ahead && this._sync_status.ahead
    );
  }

  public isFastForward(): boolean {
    return (
      this.hasStatus() &&
      !!this._sync_status.fastforward && this._sync_status.fastforward
    );
  }

  public getOffBy(): number {
    if (!this.hasStatus() || !this._sync_status.offby) {
      return -1;
    }
    return (
      this.isFastForward() || this.isLocalAhead() ?
        this._sync_status.offby : -1
    );
  }

  public pushState(): void {
    this._is_pushing_state = true;
    this._push_pull_op_state = "pushing";
    this._sync_svc.pushState(this.passphrase_form_ctrl.value)
    .then(() => this._push_pull_op_state = "success")
    .catch(() =>  this._push_pull_op_state = "error")
    .finally(() => this._is_pushing_state = false);
  }

  public pullState(): void {
    this._is_pulling_state = true;
    this._push_pull_op_state = "pulling";
    this._sync_svc.pullState()
    .then(() => this._push_pull_op_state = "success")
    .catch(() => this._push_pull_op_state = "error")
    .finally(() => this._is_pulling_state = false);
  }

  public canPushState(): boolean {
    return this._sync_svc.canPushState() && !this.isPullingOrPushing();
  }

  public canPullState(): boolean {
    return this._sync_svc.canPullState() && !this.isPullingOrPushing();
  }

  public isPulling(): boolean {
    return this._is_pulling_state;
  }

  public isPushing(): boolean {
    return this._is_pushing_state;
  }

  public isPullingOrPushing(): boolean {
    return this.isPulling() || this.isPushing();
  }

  public getPushPullState(): string {
    return this._push_pull_op_state;
  }
}
