import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PeopleDeleteComponent } from './people-delete.component';

describe('PeopleDeleteComponent', () => {
  let component: PeopleDeleteComponent;
  let fixture: ComponentFixture<PeopleDeleteComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PeopleDeleteComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PeopleDeleteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
