import { Injectable } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { PeopleItem, PeopleMap, PeopleService } from './people-service.service';
import { TaskLedgerEntry, TaskService } from './task-service.service';

export interface TasksByPerson {
  person: PeopleItem;
  tasks: TaskLedgerEntry[];
}

export declare type TaskByPeopleMap = {[id: number]: TasksByPerson};


@Injectable({
  providedIn: 'root'
})
export class TaskByPeopleService {

  private _people: PeopleMap = {};
  private _tasks: TaskLedgerEntry[] = [];

  private _tasks_by_people: TaskByPeopleMap = {};

  private _subject: BehaviorSubject<TaskByPeopleMap> =
    new BehaviorSubject<TaskByPeopleMap>({});

  public constructor(
    private _people_svc: PeopleService,
    private _tasks_svc: TaskService
  ) {
    this._people_svc.getPeople().subscribe({
      next: (people: PeopleMap) => {
        this._people = people;
        this._update();
      }
    });
    this._tasks_svc.getTasks().subscribe({
      next: (tasks: TaskLedgerEntry[]) => {
        this._tasks = tasks;
        this._update();
      }
    });
  }

  private _update(): void {

    const people: PeopleItem[] = Object.values(this._people);
    if (people.length === 0) {
      return;
    }

    const tasks_by_person: TaskByPeopleMap = {};

    people.forEach( (item: PeopleItem) => {
      const pid: number = item.id;

      const person_tasks: TasksByPerson = { person: item, tasks: [] };

      this._tasks.forEach( (entry: TaskLedgerEntry) => {
        if (!entry.item.assignee || entry.item.assignee !== pid) {
          return;
        }
        person_tasks.tasks.push(entry);
      });

      tasks_by_person[pid] = person_tasks;
    });

    this._tasks_by_people = tasks_by_person;
    this._subject.next(this._tasks_by_people);
  }

  public getTasksByPeople(): BehaviorSubject<TaskByPeopleMap> {
    return this._subject;
  }

  public removePerson(person_id: number): void {
    if (!(person_id in this._tasks_by_people)) {
      console.error(`tasks-by-people-svc > rm > unknown person ${person_id}`);
      return;
    }

    const item: TasksByPerson = this._tasks_by_people[person_id];
    item.tasks.forEach( (entry: TaskLedgerEntry) => {
      entry.item.assignee = 0;
    });

    this._people_svc.remove(item.person.name);
  }
}
