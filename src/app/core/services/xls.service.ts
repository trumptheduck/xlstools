import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';



export class XlsTableConfig {
  fontSize: number = 16;
  borderColor: string = "black"
  borderWidth: number = 1; 
}

export interface XlsTableData {
  name: string,
  data: string[][],
  headers: string[]
}

export interface DocxTableData {
  ref: HTMLElement,
  headers: string[],
  dir: TableDirection;
}

export enum TableDirection {
  topToBottom = "tb",
  leftToRight = "lr",
  rightToLeft = "rl",
  bottomToTop = "bt",
}

@Injectable({
  providedIn: 'root'
})

export class XlsService {

  constructor() { }

  arrayEquals(a:any[], b:any[]) {
    return Array.isArray(a) &&
        Array.isArray(b) &&
        a.length == b.length &&
        a.every((val, index) => val == b[index]);
  }

  readExcelFile(file: any, callback: (any:any)=>any) {
    this.readFileAsArrayBuffer(file, (buffer) => {
      var results: XlsTableData[] = [];
      const workbook: XLSX.WorkBook = XLSX.read(buffer);
      workbook.SheetNames.forEach(sheetname=> {
        const data: string[][] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetname], {header: 1});
        results.push({
          name: file.name + " | Sheet: " + sheetname,
          data: data,
          headers: data[0]
        })
      })
      callback(results);
    });
  }
  getTableDirection(data: string[][]) {
    const tl = data[0][0].length > 0;
    const tr = data[0][data[0].length-1].length > 0;
    const bl = data[data.length-1][0].length > 0;
    const br = data[data.length-1][data[data.length-1].length -1].length > 0;
    if (tl&&tr) {
      return TableDirection.topToBottom;
    } else if (tr&&br) {
      return TableDirection.rightToLeft;
    } else if (tl&&bl) {
      return TableDirection.leftToRight;
    } else if (br&&bl) {
      return TableDirection.bottomToTop;
    }
    return TableDirection.topToBottom;
  }
  getTableHeaders(data: string[][], dir: TableDirection = TableDirection.topToBottom) {
    if (dir == TableDirection.topToBottom) return data[0];
    if (dir == TableDirection.bottomToTop) return data[data.length -1];
    let result = [];
    for (let row of data) {
      if (dir == TableDirection.leftToRight) {
        result.push(row[0]);
      } else if (dir == TableDirection.rightToLeft) {
        result.push(row[row.length - 1]);
      }
    }
    return result;
  }
  readFileAsArrayBuffer(file: any, callback: (ab: ArrayBuffer)=>any) {
    const reader: FileReader = new FileReader();
    reader.onload = (e: any) => {
      callback(e.target.result);
    }
    reader.readAsArrayBuffer(file);
  }

  createTable(data: string[][], config = new XlsTableConfig()) {
    let isHeader = true;
    let table = document.createElement("table");
    table.style.border = `solid ${config.borderWidth}px ${config.borderColor}`;
    table.style.borderCollapse = "collapse";
    table.style.fontSize = `${config.fontSize}px`;
    table.id = `table-${Math.random()}`
    data.forEach(row => {
      let tr = document.createElement("tr");
      row.forEach(cell => {
        let tcell = document.createElement("td");
        tcell.style.border = `solid ${config.borderWidth}px ${config.borderColor}`;
        tcell.style.borderCollapse = "collapse";
        tcell.style.cssText += "white-space: nowrap; overflow:hidden;"
        tcell.innerText = cell;
        if (isHeader) tcell.style.fontWeight = "bold";
        tr.append(tcell);
      })
      if (isHeader) {
        table.append(tr);
        isHeader = false;
      } else {
        table.append(tr);
      }
    })
    return table;
  }
  generateTable(data: string[][], dir: TableDirection) {
    const vertTableMaxRow = 28;
    if (dir == TableDirection.topToBottom) {
        const table = this.createTable(data);
        const pre = "<div>"
        const post = "</div>"
        return pre + table.outerHTML + post;
    } 
    if (dir == TableDirection.leftToRight) {
      const header = data[0];
      const bodyData = data.slice(1);
      let dataArray = [];
      for (let i = 0; i < bodyData.length/vertTableMaxRow; i++) {
        const _start = vertTableMaxRow*i;
        let _end = vertTableMaxRow*(i+1);
        if (_end >= bodyData.length) _end = bodyData.length-1;
        dataArray.push([header,...bodyData.slice(_start, _end)]);
      }
      var resultHTML = '';
      dataArray.forEach(data => {
        const pretable = this.createTable(data);
        const table = this.rotateTable(pretable, false);
        const pre = "<br clear=all style='mso-special-character:line-break;page-break-before:always'><div>"
        const post = "</div><p></p>"
        // this.xls$.resizableGrid(document.getElementById(table.id) as HTMLTableElement);
        resultHTML += pre + table.outerHTML + post;
      })
      resultHTML += "<br clear=all style='mso-special-character:line-break;page-break-before:always'>";
      return resultHTML;
    }

    if (dir == TableDirection.rightToLeft) {
      const header = data[0];
      const bodyData = data.slice(1);
      let dataArray = [];
      for (let i = 0; i < bodyData.length/vertTableMaxRow; i++) {
        const _start = vertTableMaxRow*i;
        let _end = vertTableMaxRow*(i+1);
        if (_end >= bodyData.length) _end = bodyData.length-1;
        dataArray.push([header,...bodyData.slice(_start, _end)]);
      }
      var resultHTML = '';
      dataArray.forEach(data => {
        const pretable = this.createTable(data);
        const table = this.rotateTable(pretable);
        const pre = "<br clear=all style='mso-special-character:line-break;page-break-before:always'><div class='o-landscape' style='display: flex; justify-content: flex-end; align-items: flex-end;'>"
        const post = "</div><p></p>"
        // this.xls$.resizableGrid(document.getElementById(table.id) as HTMLTableElement);
        resultHTML += pre + table.outerHTML + post;
      })
      resultHTML += "<br clear=all style='mso-special-character:line-break;page-break-before:always'>";
      return resultHTML;
    }
    return '';
  }
  resizableGrid(table:HTMLTableElement) {
    var row = table.getElementsByTagName('tr')[0],
    cols = row ? row.children : undefined;
    if (!cols) return;
    
    table.style.overflow = 'hidden';
    
    var tableHeight = table.offsetHeight;
    
    for (var i=0;i<cols.length;i++){
     var div = createDiv(tableHeight);
     (cols[i] as HTMLElement).appendChild(div);
     (cols[i] as HTMLElement).style.position = 'relative';
     setListeners(div);
    }
   
    function setListeners(div:any){
     var pageX:any,curCol:any,nxtCol:any,curColWidth:any,nxtColWidth:any;
   
     div.addEventListener('mousedown', function (e:any) {
      curCol = e.target.parentElement;
      nxtCol = curCol.nextElementSibling;
      pageX = e.pageX; 
    
      var padding = paddingDiff(curCol);
    
      curColWidth = curCol.offsetWidth - padding;
      if (nxtCol)
       nxtColWidth = nxtCol.offsetWidth - padding;
     });
   
     document.addEventListener('mousemove', function (e:any) {
      if (curCol) {
       var diffX = e.pageX - pageX;
    
       if (nxtCol)
        nxtCol.style.width = (nxtColWidth - (diffX))+'px';
   
       curCol.style.width = (curColWidth + diffX)+'px';
      }
     });
   
     document.addEventListener('mouseup', function (e) { 
      curCol = undefined;
      nxtCol = undefined;
      pageX = undefined;
      nxtColWidth = undefined;
      curColWidth = undefined
     });
    }
    
    function createDiv(height:any){
     var div = document.createElement('div');
     div.style.top = "0";
     div.style.right = "0";
     div.style.width = '5px';
     div.style.position = 'absolute';
     div.style.cursor = 'col-resize';
     div.style.userSelect = 'none';
     div.style.height = height + 'px';
     return div;
    }
    
    function paddingDiff(col:any){
    
     if (getStyleVal(col,'box-sizing') == 'border-box'){
      return 0;
     }
    
     var padLeft = getStyleVal(col,'padding-left');
     var padRight = getStyleVal(col,'padding-right');
     return (parseInt(padLeft) + parseInt(padRight));
   
    }
   
    function getStyleVal(elm:any,css:any){
     return (window.getComputedStyle(elm, null).getPropertyValue(css))
    }
   };
   calculateColWidth(table: HTMLTableElement) {
    const pageWidth = 800;
    const colLens = [];
    for (let y = 0; y < table.rows.length; y ++) {
      let _row = table.rows[y];
      for (let x =0; x < _row.children.length; x++) {
        if (!colLens[x]) colLens[x] = 0;
        if (colLens[x] < (_row.children[x] as HTMLElement).innerText.length)
          colLens[x] = (_row.children[x] as HTMLElement).innerText.length;
      }
     }
     let totalLen = 0;
     let result:number[] = [];
     colLens.forEach(len => totalLen+= len);
     colLens.forEach(colLen => {
       result.push(pageWidth/totalLen*colLen);
     })
     return result;
   }
   rotateTable(table: HTMLTableElement, isClockwise: boolean = true) {
     const colWidths = this.calculateColWidth(table);
     let result: HTMLTableElement = document.createElement("table");
     result.classList.add(isClockwise?"table-rotated-m90-t":"table-rotated-p90-t");
     result.style.cssText = table.style.cssText;
     for (let x =0; x < table.rows[0].children.length; x++) result.insertRow(x);

     for (let y = 0; y < table.rows.length; y ++) {
       let rIndex = isClockwise?table.rows.length - y - 1:y;
       let _row = table.rows[rIndex];
      for (let x =0; x < _row.children.length; x++) {
        // if (!result.rows[isClockwise?x:_row.children.length - x -1]) {
        //   result.insertRow(isClockwise?x:_row.children.length - x -1);
        // }
        let _cell = _row.children[x] as HTMLElement;
        let nCell = _cell.cloneNode(true) as HTMLElement;
        nCell.style.cssText = _cell.style.cssText;
        nCell.style.cssText += isClockwise?"writing-mode: vertical-rl":"writing-mode: vertical-rl; transform: rotate(180deg)";
        nCell.classList.add(isClockwise?"table-rotated-m90":"table-rotated-p90");
        nCell.style.width = `${16}px`;
        nCell.style.height = `${colWidths[x]}px`;
        result.rows[isClockwise?x:_row.children.length - x -1].appendChild(nCell);
      }
     }
    return result;
   }
   createTableFromCols() {

   }
   tableToData(table:HTMLTableElement) {
     const result: string[][] = [];
    for (let y = 0; y < table.rows.length; y ++) {
      let _row = table.rows[y];
     for (let x =0; x < _row.children.length; x++) {
       if (!result[y]) result[y] = [];
       let _cell = _row.children[x] as HTMLElement;
       result[y][x] = _cell.innerText;
     }
    }
    return result;
   }

}
