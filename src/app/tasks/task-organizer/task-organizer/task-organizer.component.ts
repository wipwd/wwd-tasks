import { Component, OnInit } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { TaskService } from '../../../services/task-service.service';

declare type LedgerEntry = {
  name: string;
  label: string;
};

@Component({
  selector: 'app-task-organizer',
  templateUrl: './task-organizer.component.html',
  styleUrls: ['./task-organizer.component.scss']
})
export class TaskOrganizerComponent implements OnInit {

  private _ledgers: LedgerEntry[] = [];
  private _ledger_sizes: {[id: string]: BehaviorSubject<string>} = {};

  public constructor(
    private _tasks_svc: TaskService
  ) { }

  public ngOnInit(): void {
    this._tasks_svc.getLedgersNames().forEach( (ledgername: string) => {
      const ledgerlabel: string = this._tasks_svc.getLedgerLabel(ledgername);
      this._ledgers.push({name: ledgername, label: ledgerlabel});
      this._ledger_sizes[ledgername] = new BehaviorSubject<string>("");
      this._subscribeSize(ledgername);
    });
  }

  private _subscribeSize(ledgername: string): void {
    this._tasks_svc.getLedgerSize(ledgername).subscribe({
      next: (size: number) => {
        let str: string = "";
        if (size > 0) {
          str = `(${size})`;
        }
        this._ledger_sizes[ledgername].next(str);
      }
    });
  }

  public getLedgerSize(ledgername: string): BehaviorSubject<string> {
    console.assert(ledgername in this._ledger_sizes);
    return this._ledger_sizes[ledgername];
  }

  public getLedgers(): LedgerEntry[] {
    return this._ledgers;
  }

}
