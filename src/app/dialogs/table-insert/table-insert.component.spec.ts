import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TableInsertComponent } from './table-insert.component';

describe('TableInsertComponent', () => {
  let component: TableInsertComponent;
  let fixture: ComponentFixture<TableInsertComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TableInsertComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TableInsertComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
