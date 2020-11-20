import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ImportExportDataComponent } from './import-export-data.component';

describe('ImportExportDataComponent', () => {
  let component: ImportExportDataComponent;
  let fixture: ComponentFixture<ImportExportDataComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ImportExportDataComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ImportExportDataComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
