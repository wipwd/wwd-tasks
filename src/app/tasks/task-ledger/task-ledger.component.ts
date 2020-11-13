import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-task-ledger',
  templateUrl: './task-ledger.component.html',
  styleUrls: ['./task-ledger.component.scss']
})
export class TaskLedgerComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }


  public foo(): void {
    console.log("foo");
  }
}
