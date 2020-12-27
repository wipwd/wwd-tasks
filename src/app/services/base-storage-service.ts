import { BehaviorSubject } from 'rxjs';

export abstract class BaseStorageService<T> {

  public abstract stateLoad(data: T): void;
  public abstract getInitState(): T;
  public abstract getStorageObserver(): BehaviorSubject<T>;

}