import { Component } from '@angular/core';
import { StorageService } from './services/storage-service.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'wwd-tasks';

  public constructor(
    private _storage_svc: StorageService
  ) {
    console.log(`starting storage version ${this._storage_svc.STORE_VERSION}`);
  }
}
