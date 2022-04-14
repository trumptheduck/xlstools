import { Component, HostListener, OnInit } from '@angular/core';

export interface MenuItem {
  icon?: string,
  text: string,
  callback: ()=>any;
}

@Component({
  selector: 'app-editor-menu',
  templateUrl: './editor-menu.component.html',
  styleUrls: ['./editor-menu.component.scss']
})
export class EditorMenuComponent implements OnInit {
  isDisplayed = false;
  data:MenuItem[] = []
  posX = 0;
  posY = 0;
  @HostListener('document:click')
  private close() {
    this.isDisplayed = false;
  }
  constructor() { }

  ngOnInit(): void {
  }
  invoke(fn: ()=>any, e: any) {
    // e.stopPropagation();
    fn();
  }
  display(event: any, data: MenuItem[]) {
    this.data = data;
    this.posX = event.clientX;
    this.posY = event.clientY;
    this.isDisplayed = true;
  }

}
