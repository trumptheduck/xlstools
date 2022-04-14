import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DomSanitizer } from '@angular/platform-browser';
import { EditorMenuComponent, MenuItem } from '../components/editor-menu/editor-menu.component';
import { GoogleConvertService } from '../core/services/convert.service';
import { DocxService } from '../core/services/docx.service';
import { DocxTableData, TableDirection, XlsService, XlsTableData } from '../core/services/xls.service';
import { TablePreviewDialog } from '../dialogs/table-preview/table-preview.component';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  @ViewChild('editorMenu') contextMenu: EditorMenuComponent;
  imageBase64Array: string[] = [];
  selectedTableIndex: number = -1;
  selTable: HTMLTableElement = document.createElement("table");
  tableData: XlsTableData[] = [];
  isLoading: boolean = false;
  originalDocxTableData: DocxTableData[] = [];
  editorMenuData: MenuItem[] = [
    {
      text: "Chèn bảng (Chiều dọc)",
      icon: "file_copy",
      callback: ()=>{
        if (this.selectedTableIndex == -1) return alert("Bạn chưa chọn bảng nào!")
        const data = this.tableData[this.selectedTableIndex].data;
        const html = this.xls$.generateTable(data, TableDirection.topToBottom)
        this.pasteHtmlAtCaret(html, false);
      },
    },
    {
      text: "Chèn bảng (Ngang, lề trái)",
      icon: "file_copy",
      callback: ()=>{
        if (this.selectedTableIndex == -1) return alert("Bạn chưa chọn bảng nào!")
        const data = this.tableData[this.selectedTableIndex].data;
        const html = this.xls$.generateTable(data, TableDirection.leftToRight)
        console.log(html);
        this.pasteHtmlAtCaret(html, false);
      },
    },
    {
      text: "Chèn bảng (Ngang, lề phải)",
      icon: "file_copy",
      callback: ()=>{
        if (this.selectedTableIndex == -1) return alert("Bạn chưa chọn bảng nào!")
        const data = this.tableData[this.selectedTableIndex].data;
        const html = this.xls$.generateTable(data, TableDirection.rightToLeft)
        this.pasteHtmlAtCaret(html, false);

      },
    },
    
    {
      text: "Thêm bảng",
      icon: "add",
      callback: ()=>{
        this.openXLSForm();
      }
    }
  ]
  constructor(
    public sanitizer: DomSanitizer,
    private docx$: DocxService,
    private xls$: XlsService,
    private gconvert$: GoogleConvertService,
    private dialog: MatDialog
    ) {
    
   }

  public get isSignedIn() {
    return this.gconvert$.isSignedIn;
  }
  
  setup(){
    this.getContainer().innerHTML = this.docx$.placeholderData;
    this.setupEditor(this.getContainer().querySelector("div"))

  }

  insertAllTablesToTemplates() {
    console.log(this.originalDocxTableData, this.tableData);
    this.originalDocxTableData.forEach((oData,index) => {
      for (let nData of this.tableData) {
        if (this.xls$.arrayEquals(oData.headers, nData.headers)) {
          oData.ref.outerHTML = this.xls$.generateTable(nData.data, oData.dir);
          this.originalDocxTableData.splice(index, 1);
          break;
        }
      }
    })
  }
  insertTableToTemplate(data: XlsTableData) {
    this.originalDocxTableData.forEach((oData,index) => {
      if (this.xls$.arrayEquals(oData.headers, data.headers)) {
        oData.ref.outerHTML = this.xls$.generateTable(data.data, oData.dir);
        this.originalDocxTableData.splice(index, 1);
        return;
      }
    })
  }
  getAllTableData(elem: HTMLElement) {
    let result: DocxTableData[] = [];
    elem.querySelectorAll("table").forEach(table => {
      let data = this.xls$.tableToData(table)
      let _dir = this.xls$.getTableDirection(data);
      let _headers = this.xls$.getTableHeaders(data, _dir);
      result.push({
        dir: _dir,
        headers: _headers,
        ref: table
      })
    })
    return result;
  }
  onDocxInput(e:any) {
    if (e.target.files.length == 0) return;
    this.isLoading = true;
    const container = this.getContainer()
    container.innerHTML = "";
    this.gconvert$.convertToHTML(e.target.files[0],(html)=>{
      container.innerHTML = html;
      container.querySelectorAll("p").forEach(p => {
        p.style.marginTop = "5px";
        p.style.marginBottom = "5px";
      });
      this.setupEditor(container.querySelector("div"));
      this.originalDocxTableData = this.getAllTableData(container);
      this.isLoading = false;
    })
  }

  onXlsInput(e:any) {
    const fileList: FileList = e.target.files;
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      this.xls$.readExcelFile(file,(data)=>{
        this.tableData = [...this.tableData, ...data];
      });
    }
  }

  setupEditor(elem: HTMLElement|null) {
    (elem as HTMLElement).contentEditable = "true";
    (elem as HTMLElement).style.border = "1px solid rgba(0, 0, 0, 0.1)";
    (elem as HTMLElement).spellcheck = false;
    (elem as HTMLElement).addEventListener("contextmenu", (e)=>{
      e.preventDefault();
      // this.pasteHtmlAtCaret(this.selTable.outerHTML, true);
      this.openEditorMenu(e);
    })
  }

  openTablePreview(data: string[][]) {
    this.dialog.open(TablePreviewDialog, {
      data: data,
    });
  }

  openXLSForm() {
    document.getElementById("xls")?.click();
  }

  openDOCXForm() {
    if (!this.gconvert$.isSignedIn) this.gconvert$.signIn();
      else document.getElementById("docx")?.click();
  }

  openEditorMenu(e: any) {
    e.preventDefault();
    this.contextMenu.display(e, this.editorMenuData);
  }

  pasteHtmlAtCaret(html:string, selectPastedContent:boolean) {
    var sel, range;
    if (window.getSelection) {
      sel = window.getSelection() as Selection;
      if (sel.getRangeAt && sel.rangeCount) {
        range = sel.getRangeAt(0);
        range.deleteContents();
        var el = document.createElement("div");
        el.innerHTML = html;
        var frag = document.createDocumentFragment(), node, lastNode;
        while ( (node = el.firstChild) ) {
          lastNode = frag.appendChild(node);
        }
        var firstNode = frag.firstChild;
        range.insertNode(frag);
        if (lastNode) {
          range = range.cloneRange();
          range.setStartAfter(lastNode);
          if (selectPastedContent) {
              range.setStartBefore(firstNode as ChildNode);
          } else {
              range.collapse(true);
          }
          sel.removeAllRanges();
          sel.addRange(range);
        }
      }
    } else if ( (sel = (document as any).selection) && sel.type != "Control") {
      var originalRange = sel.createRange();
      originalRange.collapse(true);
      sel.createRange().pasteHTML(html);
      if (selectPastedContent) {
          range = sel.createRange();
          range.setEndPoint("StartToStart", originalRange);
          range.select();
      }
    }
  }

  signIn() {
    this.gconvert$.signIn();
  }

  downloadDocument() {
    const container = this.getContainer()
    this.docx$.downloadFromHTML(container, this.imageBase64Array);
  }

  getContainer() {
    return (document.getElementById("hidden-output") as HTMLElement);
  }

  ngOnInit(): void {
  }

}
