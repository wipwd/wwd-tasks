import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { BehaviorSubject } from 'rxjs';
import { SettingsDeviceSyncDialogComponent } from './settings-device-sync-dialog/settings-device-sync-dialog.component';
import firebase from 'firebase/app';

@Component({
  selector: 'app-settings-device-sync',
  templateUrl: './settings-device-sync.component.html',
  styleUrls: ['./settings-device-sync.component.scss']
})
export class SettingsDeviceSyncComponent implements OnInit {

  private _enabled: boolean = false;
  private _uid: string = "";
  private _is_error: boolean = false;
  private _is_logging_in: boolean = false;
  private _is_logged_in: boolean = false;

  public is_toggled: BehaviorSubject<boolean> =
    new BehaviorSubject<boolean>(false);

  public constructor(
    private _confirm_dialog: MatDialog,
    private _firestore_auth: AngularFireAuth,
  ) { }

  public ngOnInit(): void { }

  private _showSyncDialog(): void {
    this._enabled = false;
    const dialogref: MatDialogRef<SettingsDeviceSyncDialogComponent> =
      this._confirm_dialog.open(SettingsDeviceSyncDialogComponent);
    dialogref.afterClosed().subscribe({
      next: (result: boolean) => {
        if (!!result && result === true) {
          console.log("enabled!");
          this._enableSync();
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

  private _enableSync(): void {
    this._enabled = true;
    this.is_toggled.next(true);

    this._loginGoogle();
  }

  private _loginGoogle(): void {
    this._is_logging_in = true;
    this._firestore_auth.signInWithPopup(
      new firebase.auth.GoogleAuthProvider()
    ).then(
      (credentials: firebase.auth.UserCredential) => {
        this._uid = credentials.user.uid;
        this._is_logged_in = true;
        this._is_logging_in = false;
      }
    ).catch( () => {
      this._is_logged_in = false;
      this._is_logging_in = false;
      this._is_error = true;
      this._disableSync();
    });
  }

  public changeSyncToggle(event: MatSlideToggleChange): void {
    console.log("change: ", event);
    if (event.checked) {
      this.is_toggled.next(true);
      this._showSyncDialog();
    } else {
      this._disableSync();
    }
    console.log("out we go");
  }

  public isEnabled(): boolean {
    return this._enabled;
  }

  public isLoggingIn(): boolean {
    return this._is_logging_in;
  }

  public isLoggedIn(): boolean {
    return this._is_logged_in;
  }

  public isError(): boolean {
    return this._is_error;
  }
}
