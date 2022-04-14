import { Component, Inject, OnInit } from '@angular/core';
import {MAT_DIALOG_DATA} from '@angular/material/dialog';

@Component({
  selector: 'dialog-table-preview',
  templateUrl: './table-preview.component.html',
  styleUrls: ['./table-preview.component.scss']
})
export class TablePreviewDialog implements OnInit {

  constructor(@Inject(MAT_DIALOG_DATA) public data: string[][]) { }

  ngOnInit(): void {
  }

  get tBody() {
    return [...this.data].shift();
  }

}
