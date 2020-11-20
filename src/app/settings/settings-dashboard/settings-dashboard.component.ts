import { Component, OnInit } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ProjectsService } from '../../services/projects-service.service';
import { ENTER, COMMA } from '@angular/cdk/keycodes';
import { FormControl } from '@angular/forms';
import { MatChipInputEvent } from '@angular/material/chips';
import {
  StorageService,
  ImportExportDataItem
} from '../../services/storage-service.service';
import { WWDTASKS_BUILD_COMMIT, WWDTASKS_BUILD_DATE } from '../../build-info';
import * as triplesec from 'triplesec/browser/triplesec';
import { AngularFirestore } from '@angular/fire/firestore';
import { AngularFireAuth } from '@angular/fire/auth';
import firebase from 'firebase/app';


@Component({
  selector: 'app-settings-dashboard',
  templateUrl: './settings-dashboard.component.html',
  styleUrls: ['./settings-dashboard.component.scss']
})
export class SettingsDashboardComponent implements OnInit {

  public chip_separator_codes: number[] = [ ENTER, COMMA ];
  public project_form_ctrl: FormControl = new FormControl();

  // private _is_exporting: boolean = false;
  // private _exported_data: ImportExportDataItem;
  // private _statistics: ImportExportStatistics[];
  // private _export_ready: boolean = false;
  private _encrypted: string;
  private _decrypted: string;
  private _auth_credentials: firebase.auth.UserCredential;

  public constructor(
    private _projects_svc: ProjectsService,
    private _storage_svc: StorageService,
    private _firestore: AngularFirestore,
    private _firestore_auth: AngularFireAuth,
  ) { }

  public ngOnInit(): void {
    // this.doStuff();
  }

  public getProjects(): BehaviorSubject<string[]> {
    return this._projects_svc.getProjects();
  }

  public removeProject(name: string): void {
    this._projects_svc.remove(name);
  }

  public addProject(event: MatChipInputEvent): void {
    const value: string = event.value.trim();
    const input: HTMLInputElement = event.input;
    if (!value || value === "") {
      return;
    }
    this._projects_svc.add(value);
    if (input) {
      input.value = "";
    }

    this.project_form_ctrl.setValue(null);
    console.log("add project: ", event.value);
  }

  public getBuildCommit(): string {
    return WWDTASKS_BUILD_COMMIT;
  }

  public getBuildDate(): string {
    return WWDTASKS_BUILD_DATE;
  }

  public getEncrypted(): string {
    return this._encrypted;
  }

  public getDecrypted(): string {
    return this._decrypted;
  }

  public importData(): void {
  }

  public doStuff(): void {
    if (!this._auth_credentials) {
      console.log("must login");
      return;
    }
    const uid: string = this._auth_credentials.user.uid;
    const coll: string = `wwdtasks/${uid}/foo`;
    this._firestore.collection(coll).valueChanges().subscribe({
      next: (value) => { console.log("value change: ", value); }
    });
    this._firestore.collection(coll).add({ data: "barbaz" });
  }

  public failStuff(): void {
    const uid: string = "asdasdasd";
    const coll: string = `wwdtasks/${uid}/foo`;
    this._firestore.collection(coll).valueChanges().subscribe({
      next: (value) => { console.log("value change: ", value); }
    });
    this._firestore.collection(coll).add({ data: "barbaz" });
  }

  public login(): void {
    this._firestore_auth.signInWithPopup(
      new firebase.auth.GoogleAuthProvider()
    ).then(
      (credential) => {
        console.log("credentials: ", credential);
        this._auth_credentials = credential;
      }
    ).catch(
      (error) => { console.log("error: ", error); }
    );
  }

  public logout(): void {
    this._firestore_auth.signOut();
  }
}
