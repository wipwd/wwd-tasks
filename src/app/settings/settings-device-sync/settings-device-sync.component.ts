import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { BehaviorSubject, Observable } from 'rxjs';
import { SettingsDeviceSyncDialogComponent } from './settings-device-sync-dialog/settings-device-sync-dialog.component';
import firebase from 'firebase/app';
import { SyncService, SyncStateResultItem, SyncUser } from '../../services/sync-service.service';
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

  private _is_checking_sync_state: boolean = false;
  private _has_sync_state: boolean = false;
  private _sync_state: SyncStateResultItem|undefined = undefined;

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

    this._is_checking_sync_state = true;
    const result: Promise<SyncStateResultItem> =
      this._sync_svc.checkSyncStatus();
    result.then( (state: SyncStateResultItem) => {
      this._sync_state = state;
      this._is_checking_sync_state = false;
      this._has_sync_state = true;
    });
  }

  public isCheckingState(): boolean {
    return this._is_checking_sync_state;
  }

  public hasState(): boolean {
    return this._has_sync_state;
  }

  public getSyncState(): SyncStateResultItem {
    return this._sync_state;
  }

  public isSynchronizing(): boolean {
    return this.isCheckingState() || this.hasState();
  }

  public pushState(): void {

  }

  public pullState(): void {

  }
}
