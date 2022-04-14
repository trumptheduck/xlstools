import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TablePreviewDialog } from './table-preview.component';

describe('TablePreviewComponent', () => {
  let component: TablePreviewDialog;
  let fixture: ComponentFixture<TablePreviewDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TablePreviewDialog ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TablePreviewDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
