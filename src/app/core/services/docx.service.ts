import { Injectable } from '@angular/core';
import * as JSZip from 'jszip';
import * as fs from "file-saver"
import * as docxToHtml from 'docx2html'
import { FileExportFormat } from './convert.service';
import { XlsService } from './xls.service';


@Injectable({
  providedIn: 'root'
})
export class DocxService {

  constructor(
    private xls$: XlsService
  ) { }

  readToHTML(file: any, outputElem: HTMLElement|null , callback: (any:any)=>any) {
    docxToHtml(file,
      {
        container: outputElem
      }).then((html:any) => {
      callback(html.toString());
    })
  }

  readImageB64ToArray(html:HTMLElement, outputArray: string[]) {
    html.querySelectorAll("img").forEach((imgElem:HTMLImageElement) => {
      this.getBase64FromImage(imgElem, outputArray);
    })
  }
  async getBase64FromImage(img: HTMLImageElement, outputArray: string[]) {
    let blob = await fetch(img.src).then(r => r.blob());
    var reader = new FileReader();
    reader.readAsDataURL(blob); 
    reader.onloadend = () => {
      var base64data = reader.result;
      outputArray.push((base64data as string).replace("data:image/*;base64,", ""));
    }
  }

  downloadFromHTML(elem:HTMLElement, images: string[], filename = '') {
    let index = 0;

    let clonedElem = elem.cloneNode(true) as HTMLElement;
    ((clonedElem as HTMLElement).querySelector("div") as HTMLElement).style.border = "none";
    (clonedElem as HTMLElement).querySelectorAll("img").forEach(img => {
      img.src = `./images/${index}.jpg`
      index++;
    });
    for(let elem of (clonedElem.querySelector("div") as HTMLElement).children) {
      if ((elem as HTMLElement).innerText.length == 0) {
        elem.remove();
      } else {
        console.log((elem as HTMLElement).innerText);
        console.log(elem);
        console.log(clonedElem.cloneNode(true));
        break;
      }
    }
    let isContentful = false;
    clonedElem.querySelectorAll('span').forEach(span => {
      if (span.innerText.length == 0) {
        if (isContentful) {
          span.innerHTML = "<br>"
        } else {
          let parent = span.parentNode as HTMLElement;
          if (parent.tagName == "p") {
            parent.remove();
          }
        }
      } else {
        isContentful = true;
      }
    })
    clonedElem.querySelectorAll("td").forEach(elem => {
      if (elem.style.borderLeftWidth == "0pt") {
        elem.style.cssText += "border-left: none;"
      }
      if (elem.style.borderRightWidth == "0pt") {
        elem.style.cssText += "border-right: none;"
      }
      if (elem.style.borderTopWidth == "0pt") {
        elem.style.cssText += "border-top: none;"
      }
      if (elem.style.borderBottomWidth == "0pt") {
        elem.style.cssText += "border-bottom: none;"
      }
    })
    clonedElem.querySelectorAll("hr").forEach(hr=>{
      if (hr.style.display == "none") {
        hr.outerHTML = `<br clear=all style='mso-special-character:line-break;page-break-before:always'>`;
      }
    })
    clonedElem.querySelectorAll("table").forEach(ptable => {
      if (ptable.dir == "rtl") {
        let data = this.xls$.tableToData(ptable);
        //Reverse matrix rotation
        data = data[0].map((val, index) => data.map(row => row[index]));
        const pretable = this.xls$.createTable(data);
        const table = this.xls$.rotateTable(pretable);
        const pre = "<br clear=all style='mso-special-character:line-break;page-break-before:always'><div class='o-landscape' style='display: flex; justify-content: flex-end; align-items: flex-end;'>"
        const post = "</div><p></p>"
        let casing = document.createElement("div");
        casing.classList.add("o-landscape");
        casing.innerHTML = table.outerHTML;
        ptable.replaceWith(casing);

        // const colWidths = this.xls$.calculateColWidth(table);
        // let br = document.createElement("span");
        // br.innerHTML = `<br clear=all style='mso-special-character:line-break;page-break-before:always'>`
        // table.parentNode?.insertBefore(table, br);
        // for (let y = 0; y < table.rows.length; y ++) {
        //   let _row = table.rows[y];
        //  for (let x =0; x < _row.children.length; x++) {
        //    let _cell = _row.children[x] as HTMLElement;
        //    let nCell = document.createElement("td");
        //     nCell.classList.add("table-rotated-m90");
        //     console.log(colWidths);
        //     nCell.style.cssText += `width: ${16}px; height:${colWidths[y]}px`;
        //     nCell.innerText = _cell.innerText;
        //    _cell.replaceWith(nCell)
        //  }
        // }
      }
    })

    // (clonedElem as HTMLElement).querySelectorAll("p").forEach(p => {
    //   p.style.marginTop = "5px";
    //   p.style.marginBottom = "5px";
    // });

    
    index = 0;
    let html = (clonedElem as HTMLElement).innerHTML
    filename = filename?filename+'.doc':'document.doc';
    var preHtml = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head><meta charset='utf-8'><title>Export HTML To Doc</title></head>
    <body>
      <style>
      table, th, td {
        border: 1px solid black;
        border-collapse: collapse;
      }
      .table-rotated-m90 {
        mso-rotate: -90;
      }
      .o-landscape {
        text-align: right;
      }
      .table-rotated-m90-t {
        mso-table-dir: rtl;
      }
      .table-rotated-p90 {
        mso-rotate: 90;
      }
      .table-rotated-p90-t {
        mso-table-dir: ltr;
      }
      </style>
    `;
    var postHtml = `
    </body></html>`;
    console.log(clonedElem);
    var result = preHtml+html+postHtml;
    var blob = new Blob(['\ufeff', result], {
        type: 'application/msword'
    });
    if (images.length > 0) {
      var zip = new JSZip();
      zip.file(filename, blob);
      var img = zip.folder("images");
      images.forEach(b64 => {
        img?.file(`${index}.jpg`, b64, {base64: true});
        index++;
      })
      zip.generateAsync({type:"blob"})
      .then(function(content) {
          fs.saveAs(content, filename+".zip");
      });
    } else {
      fs.saveAs(blob, filename);
    }

  }
  htmlToBlob(html:string, filename = '') {
    filename = filename?filename+'.doc':'document.doc';
    var preHtml = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head><meta charset='utf-8'><title>Export HTML To Doc</title></head>
    <body>`;
    var postHtml = `
    </body></html>`;
    var result = preHtml+html+postHtml;
    var blob = new Blob(['\ufeff', result], {
        type: 'text/html'
    });
    return blob;

  }
  saveDocx(data: string, filename = "") {
    filename = filename?filename+'.doc':'document.doc';
    var blob = new Blob(['\ufeff', data], {
      type: FileExportFormat.docx
    });
    fs.saveAs(blob, filename);
  }
  saveBlob(blob:any, filename = "") {
    filename = filename?filename+'.docx':'document.docx';
    fs.saveAs(blob, filename);
  }

  placeholderData: string = `
                <div style="background-color: rgb(255, 255, 255); padding: 72pt 72pt 72pt 90pt; max-width: 450pt; border: 1px solid rgba(0, 0, 0, 0.1);" contenteditable="true"><div><p style="padding: 0px; margin: 5px 0px; color: rgb(0, 0, 255); font-size: 12pt; font-family: &quot;Times New Roman&quot;; line-height: 1; orphans: 2; widows: 2; height: 12pt; text-align: center;"><span style="color:#000000;font-weight:400;text-decoration:none;vertical-align:baseline;font-size:12pt;font-family:&quot;Times New Roman&quot;;font-style:normal"></span></p><p style="padding: 0px; margin: 5px 0px; color: rgb(0, 0, 255); font-size: 12pt; font-family: &quot;Times New Roman&quot;; line-height: 1; orphans: 2; widows: 2; height: 12pt; text-align: left;"><span style="color:#000000;font-weight:400;text-decoration:none;vertical-align:baseline;font-size:14pt;font-family:&quot;Times New Roman&quot;;font-style:normal"></span></p></div><p style="padding: 0px; margin: 5px 0px; color: rgb(0, 0, 255); font-size: 12pt; font-family: &quot;Times New Roman&quot;; line-height: 1.15; height: 12pt; text-align: left;"><span style="color:#000000;font-weight:400;text-decoration:none;vertical-align:baseline;font-size:11pt;font-family:&quot;Arial&quot;;font-style:normal"></span></p><a id="t.dc62c75642fe16c5970f70f72dc4dbc1a89b93ad"></a><a id="t.0"></a><table style="margin-left:-5.4pt;border-spacing:0;border-collapse:collapse;margin-right:auto"><tbody><tr style="height:0pt"><td colspan="1" rowspan="1" style="border-right-style:solid;padding:0pt 5.4pt 0pt 5.4pt;border-bottom-color:#000000;border-top-width:0pt;border-right-width:0pt;border-left-color:#000000;vertical-align:top;border-right-color:#000000;border-left-width:0pt;border-top-style:solid;border-left-style:solid;border-bottom-width:0pt;width:185.4pt;border-top-color:#000000;border-bottom-style:solid"><p style="padding: 0px; margin: 5px 0px; color: rgb(0, 0, 255); font-size: 12pt; font-family: &quot;Times New Roman&quot;; line-height: 1; orphans: 2; widows: 2; text-align: center;"><span style="vertical-align:baseline;font-size:12pt;font-family:&quot;Times New Roman&quot;;color:#000000;font-weight:700">QU???C H???I</span></p><p style="padding: 0px; margin: 5px 0px; color: rgb(0, 0, 255); font-size: 12pt; font-family: &quot;Times New Roman&quot;; line-height: 1; orphans: 2; widows: 2; text-align: center;"><span style="color:#000000;font-weight:400;text-decoration:none;vertical-align:baseline;font-size:12pt;font-family:&quot;Times New Roman&quot;;font-style:normal">-------------</span></p><p style="padding: 0px; margin: 5px 0px; color: rgb(0, 0, 255); font-size: 12pt; font-family: &quot;Times New Roman&quot;; line-height: 1; orphans: 2; widows: 2; text-align: center;"><span style="color:#000000;font-weight:400;text-decoration:none;vertical-align:baseline;font-size:12pt;font-family:&quot;Times New Roman&quot;;font-style:normal">Lu???t s???: 67/2011/QH12</span></p></td><td colspan="1" rowspan="1" style="border-right-style:solid;padding:0pt 5.4pt 0pt 5.4pt;border-bottom-color:#000000;border-top-width:0pt;border-right-width:0pt;border-left-color:#000000;vertical-align:top;border-right-color:#000000;border-left-width:0pt;border-top-style:solid;border-left-style:solid;border-bottom-width:0pt;width:264.6pt;border-top-color:#000000;border-bottom-style:solid"><p style="padding: 0px; margin: 5px 0px; color: rgb(0, 0, 255); font-size: 12pt; font-family: &quot;Times New Roman&quot;; line-height: 1; orphans: 2; widows: 2; text-align: center;"><span style="vertical-align:baseline;font-size:12pt;font-family:&quot;Times New Roman&quot;;color:#000000;font-weight:700">C???NG HO?? X?? H???I CH??? NGH??A VI???T NAM</span></p><p style="padding: 0px; margin: 5px 0px; color: rgb(0, 0, 255); font-size: 12pt; font-family: &quot;Times New Roman&quot;; line-height: 1; orphans: 2; widows: 2; text-align: center;"><span style="vertical-align:baseline;font-size:12pt;font-family:&quot;Times New Roman&quot;;color:#000000;font-weight:700">?????c l???p - T??? do - H???nh ph??c</span></p><p style="padding: 0px; margin: 5px 0px; color: rgb(0, 0, 255); font-size: 12pt; font-family: &quot;Times New Roman&quot;; line-height: 1; orphans: 2; widows: 2; text-align: center;"><span style="color:#000000;font-weight:400;text-decoration:none;vertical-align:baseline;font-size:12pt;font-family:&quot;Times New Roman&quot;;font-style:normal">-------------------------</span></p><p style="padding: 0px; margin: 5px 0px; color: rgb(0, 0, 255); font-size: 12pt; font-family: &quot;Times New Roman&quot;; line-height: 1; orphans: 2; widows: 2; text-align: center;"><span style="color:#000000;font-weight:400;vertical-align:baseline;font-size:12pt;font-family:&quot;Times New Roman&quot;;font-style:italic">H?? N???i, ng??y 29 th??ng 03 n??m 2011</span></p></td></tr></tbody></table><p style="padding: 0px; margin: 5px 0px; color: rgb(0, 0, 255); font-size: 12pt; font-family: &quot;Times New Roman&quot;; line-height: 1; orphans: 2; widows: 2; height: 12pt; text-align: left;"><span style="color:#000000;font-weight:400;text-decoration:none;vertical-align:baseline;font-size:12pt;font-family:&quot;Times New Roman&quot;;font-style:normal"></span></p><p style="padding: 0px; margin: 5px 0px; color: rgb(0, 0, 255); font-size: 12pt; font-family: &quot;Times New Roman&quot;; line-height: 1; orphans: 2; widows: 2; height: 12pt; text-align: center;"><span style="color:#000000;font-weight:400;text-decoration:none;vertical-align:baseline;font-size:12pt;font-family:&quot;Times New Roman&quot;;font-style:normal"></span></p><p style="padding: 0px; margin: 5px 0px; color: rgb(0, 0, 255); font-size: 12pt; font-family: &quot;Times New Roman&quot;; line-height: 1; orphans: 2; widows: 2; text-align: center;"><span style="vertical-align:baseline;font-size:12pt;font-family:&quot;Times New Roman&quot;;color:#000000;font-weight:700">LU???T</span></p><p style="padding: 0px; margin: 5px 0px; color: rgb(0, 0, 255); font-size: 12pt; font-family: &quot;Times New Roman&quot;; line-height: 1; orphans: 2; widows: 2; text-align: center;"><span style="vertical-align:baseline;font-size:12pt;font-family:&quot;Times New Roman&quot;;color:#000000;font-weight:700">KI???M TO??N ?????C L???P</span></p><p style="padding: 0px; margin: 5px 0px; color: rgb(0, 0, 255); font-size: 12pt; font-family: &quot;Times New Roman&quot;; line-height: 1; orphans: 2; widows: 2; height: 12pt; text-align: center;"><span style="color:#000000;font-weight:400;text-decoration:none;vertical-align:baseline;font-size:12pt;font-family:&quot;Times New Roman&quot;;font-style:normal"></span></p><p style="padding: 0px; margin: 5px 0px; color: rgb(0, 0, 255); text-indent: 36pt; font-size: 12pt; font-family: &quot;Times New Roman&quot;; line-height: 1; orphans: 2; widows: 2; text-align: justify;"><span style="color:#000000;font-weight:400;vertical-align:baseline;font-size:12pt;font-family:&quot;Times New Roman&quot;;font-style:italic">C??n c??? Hi???n ph??p n?????c C???ng ho?? x?? h???i ch??? ngh??a Vi???t Nam n??m 1992 ???? ???????c s???a ?????i, b??? sung m???t s??? ??i???u theo Ngh??? quy???t s??? 51/2001/QH10;</span></p><p style="padding: 0px; margin: 5px 0px; color: rgb(0, 0, 255); text-indent: 36pt; font-size: 12pt; font-family: &quot;Times New Roman&quot;; line-height: 1; orphans: 2; widows: 2; text-align: justify;"><span style="color:#000000;font-weight:400;vertical-align:baseline;font-size:12pt;font-family:&quot;Times New Roman&quot;;font-style:italic">Qu???c h???i ban h??nh Lu???t ki???m to??n ?????c l???p.</span></p><p style="padding: 0px; margin: 5px 0px; color: rgb(0, 0, 255); font-size: 12pt; font-family: &quot;Times New Roman&quot;; line-height: 1; orphans: 2; widows: 2; height: 12pt; text-align: left;"><span style="color:#000000;font-weight:400;text-decoration:none;vertical-align:baseline;font-size:12pt;font-family:&quot;Times New Roman&quot;;font-style:normal"></span></p><p id="h.gjdgxs" style="padding: 0px; margin: 5px 0px; color: rgb(0, 0, 255); font-size: 12pt; font-family: &quot;Times New Roman&quot;; line-height: 1; orphans: 2; widows: 2; text-align: center;"><span style="vertical-align:baseline;font-size:12pt;font-family:&quot;Times New Roman&quot;;color:#000000;font-weight:700">CH????NG I</span></p><p style="padding: 0px; margin: 5px 0px; color: rgb(0, 0, 255); font-size: 12pt; font-family: &quot;Times New Roman&quot;; line-height: 1; orphans: 2; widows: 2; text-align: center;"><span style="vertical-align:baseline;font-size:12pt;font-family:&quot;Times New Roman&quot;;color:#000000;font-weight:700">NH???NG QUY ?????NH CHUNG</span></p><p style="padding: 0px; margin: 5px 0px; color: rgb(0, 0, 255); font-size: 12pt; font-family: &quot;Times New Roman&quot;; line-height: 1; orphans: 2; widows: 2; height: 12pt; text-align: left;"><span style="color:#000000;font-weight:400;text-decoration:none;vertical-align:baseline;font-size:12pt;font-family:&quot;Times New Roman&quot;;font-style:normal"></span></p><p style="padding: 0px; margin: 5px 0px; color: rgb(0, 0, 255); text-indent: 36pt; font-size: 12pt; font-family: &quot;Times New Roman&quot;; line-height: 1; orphans: 2; widows: 2; text-align: justify;"><span style="vertical-align:baseline;font-size:12pt;font-family:&quot;Times New Roman&quot;;color:#000000;font-weight:700">??i???u 1.</span><span style="color:#000000;font-weight:400;text-decoration:none;vertical-align:baseline;font-size:12pt;font-family:&quot;Times New Roman&quot;;font-style:normal">&nbsp;Ph???m vi ??i???u ch???nh</span></p><p style="padding: 0px; margin: 5px 0px; color: rgb(0, 0, 255); text-indent: 36pt; font-size: 12pt; font-family: &quot;Times New Roman&quot;; line-height: 1; orphans: 2; widows: 2; text-align: justify;"><span style="color:#000000;font-weight:400;text-decoration:none;vertical-align:baseline;font-size:12pt;font-family:&quot;Times New Roman&quot;;font-style:normal">Lu???t n??y quy ?????nh nguy??n t???c, ??i???u ki???n, ph???m vi, h??nh th???c ho???t ?????ng ki???m to??n ?????c l???p; quy???n, ngh??a v??? c???a ki???m to??n vi??n h??nh ngh???, doanh nghi???p ki???m to??n, chi nh??nh doanh nghi???p ki???m to??n n?????c ngo??i t???i Vi???t Nam v?? ????n v??? ???????c ki???m to??n.</span></p><p style="padding: 0px; margin: 5px 0px; color: rgb(0, 0, 255); text-indent: 36pt; font-size: 12pt; font-family: &quot;Times New Roman&quot;; line-height: 1; orphans: 2; widows: 2; text-align: justify;"><span style="vertical-align:baseline;font-size:12pt;font-family:&quot;Times New Roman&quot;;color:#000000;font-weight:700">??i???u 2.</span><span style="color:#000000;font-weight:400;text-decoration:none;vertical-align:baseline;font-size:12pt;font-family:&quot;Times New Roman&quot;;font-style:normal">&nbsp;?????i t?????ng ??p d???ng</span></p><p style="padding: 0px; margin: 5px 0px; color: rgb(0, 0, 255); text-indent: 36pt; font-size: 12pt; font-family: &quot;Times New Roman&quot;; line-height: 1; orphans: 2; widows: 2; text-align: justify;"><span style="color:#000000;font-weight:400;text-decoration:none;vertical-align:baseline;font-size:12pt;font-family:&quot;Times New Roman&quot;;font-style:normal">Lu???t n??y ??p d???ng ?????i v???i ki???m to??n vi??n, ki???m to??n vi??n h??nh ngh???, doanh nghi???p ki???m to??n, chi nh??nh doanh nghi???p ki???m to??n n?????c ngo??i t???i Vi???t Nam, ????n v??? ???????c ki???m to??n, t??? ch???c ngh??? nghi???p v??? ki???m to??n v?? t??? ch???c, c?? nh??n kh??c c?? li??n quan ?????n ho???t ?????ng ki???m to??n ?????c l???p.</span></p><p style="padding: 0px; margin: 5px 0px; color: rgb(0, 0, 255); text-indent: 36pt; font-size: 12pt; font-family: &quot;Times New Roman&quot;; line-height: 1; orphans: 2; widows: 2; text-align: justify;"><span style="vertical-align:baseline;font-size:12pt;font-family:&quot;Times New Roman&quot;;color:#000000;font-weight:700">??i???u 3.</span><span style="color:#000000;font-weight:400;text-decoration:none;vertical-align:baseline;font-size:12pt;font-family:&quot;Times New Roman&quot;;font-style:normal">&nbsp;??p d???ng Lu???t ki???m to??n ?????c l???p, ??i???u ?????c qu???c t??? v?? c??c lu???t c?? li??n quan</span></p><p style="padding: 0px; margin: 5px 0px; color: rgb(0, 0, 255); text-indent: 36pt; font-size: 12pt; font-family: &quot;Times New Roman&quot;; line-height: 1; orphans: 2; widows: 2; text-align: justify;"><span style="color:#000000;font-weight:400;text-decoration:none;vertical-align:baseline;font-size:12pt;font-family:&quot;Times New Roman&quot;;font-style:normal">1. T??? ch???c, c?? nh??n trong n?????c v?? t??? ch???c, c?? nh??n n?????c ngo??i tham gia ho???t ?????ng ki???m to??n ?????c l???p tr??n l??nh th??? Vi???t Nam ph???i tu??n theo Lu???t n??y v?? c??c quy ?????nh kh??c c???a ph??p lu???t c?? li??n quan. </span></p><p style="padding: 0px; margin: 5px 0px; color: rgb(0, 0, 255); text-indent: 36pt; font-size: 12pt; font-family: &quot;Times New Roman&quot;; line-height: 1; orphans: 2; widows: 2; text-align: justify;"><span style="color:#000000;font-weight:400;text-decoration:none;vertical-align:baseline;font-size:12pt;font-family:&quot;Times New Roman&quot;;font-style:normal">2. Tr?????ng h???p ??i???u ?????c qu???c t??? m?? C???ng ho?? x?? h???i ch??? ngh??a Vi???t Nam l?? th??nh vi??n c?? quy ?????nh kh??c v???i quy ?????nh c???a Lu???t n??y th?? ??p d???ng quy ?????nh c???a ??i???u ?????c qu???c t??? ????.</span></p><p style="padding: 0px; margin: 5px 0px; color: rgb(0, 0, 255); text-indent: 36pt; font-size: 12pt; font-family: &quot;Times New Roman&quot;; line-height: 1; orphans: 2; widows: 2; text-align: justify;"><span style="vertical-align:baseline;font-size:12pt;font-family:&quot;Times New Roman&quot;;color:#000000;font-weight:700">??i???u 4.</span><span style="color:#000000;font-weight:400;text-decoration:none;vertical-align:baseline;font-size:12pt;font-family:&quot;Times New Roman&quot;;font-style:normal">&nbsp;M???c ????ch c???a ki???m to??n ?????c l???p</span></p><p style="padding: 0px; margin: 5px 0px; color: rgb(0, 0, 255); text-indent: 36pt; font-size: 12pt; font-family: &quot;Times New Roman&quot;; line-height: 1; orphans: 2; widows: 2; text-align: justify;"><span style="color:#000000;font-weight:400;text-decoration:none;vertical-align:baseline;font-size:12pt;font-family:&quot;Times New Roman&quot;;font-style:normal">Ho???t ?????ng ki???m to??n ?????c l???p nh???m g??p ph???n c??ng khai, minh b???ch th??ng tin kinh t???, t??i ch??nh c???a ????n v??? ???????c ki???m to??n v?? doanh nghi???p, t??? ch???c kh??c; l??m l??nh m???nh m??i tr?????ng ?????u t??; th???c h??nh ti???t ki???m, ch???ng l??ng ph??, ph??ng, ch???ng tham nh??ng; ph??t hi???n v?? ng??n ch???n vi ph???m ph??p lu???t; n??ng cao hi???u l???c, hi???u qu??? qu???n l??, ??i???u h??nh kinh t???, t??i ch??nh c???a Nh?? n?????c v?? ho???t ?????ng kinh doanh c???a doanh nghi???p.</span></p><p style="padding: 0px; margin: 5px 0px; color: rgb(0, 0, 255); text-indent: 36pt; font-size: 12pt; font-family: &quot;Times New Roman&quot;; line-height: 1; orphans: 2; widows: 2; text-align: justify;"><span style="vertical-align:baseline;font-size:12pt;font-family:&quot;Times New Roman&quot;;color:#000000;font-weight:700">??i???u 5.</span><span style="color:#000000;font-weight:400;text-decoration:none;vertical-align:baseline;font-size:12pt;font-family:&quot;Times New Roman&quot;;font-style:normal">&nbsp;Gi???i th??ch t??? ng???</span></p><p style="padding: 0px; margin: 5px 0px; color: rgb(0, 0, 255); text-indent: 36pt; font-size: 12pt; font-family: &quot;Times New Roman&quot;; line-height: 1; orphans: 2; widows: 2; text-align: justify;"><span style="color:#000000;font-weight:400;text-decoration:none;vertical-align:baseline;font-size:12pt;font-family:&quot;Times New Roman&quot;;font-style:normal">Trong Lu???t n??y, c??c t??? ng??? d?????i ????y ???????c hi???u nh?? sau:</span></p><p style="padding: 0px; margin: 5px 0px; color: rgb(0, 0, 255); text-indent: 36pt; font-size: 12pt; font-family: &quot;Times New Roman&quot;; line-height: 1; orphans: 2; widows: 2; text-align: justify;"><span style="color:#000000;font-weight:400;text-decoration:none;vertical-align:baseline;font-size:12pt;font-family:&quot;Times New Roman&quot;;font-style:normal">1. Ki???m to??n ?????c l???p l?? vi???c ki???m to??n vi??n h??nh ngh???, doanh nghi???p ki???m to??n, chi nh??nh doanh nghi???p ki???m to??n n?????c ngo??i t???i Vi???t Nam ki???m tra, ????a ra ?? ki???n ?????c l???p c???a m??nh v??? b??o c??o t??i ch??nh v?? c??ng vi???c ki???m to??n kh??c theo h???p ?????ng ki???m to??n.</span></p><p style="padding: 0px; margin: 5px 0px; color: rgb(0, 0, 255); text-indent: 36pt; font-size: 12pt; font-family: &quot;Times New Roman&quot;; line-height: 1; orphans: 2; widows: 2; text-align: justify;"><span style="color:#000000;font-weight:400;text-decoration:none;vertical-align:baseline;font-size:12pt;font-family:&quot;Times New Roman&quot;;font-style:normal">2. Ki???m to??n vi??n l?? ng?????i ???????c c???p ch???ng ch??? ki???m to??n vi??n theo quy ?????nh c???a ph??p lu???t ho???c ng?????i c?? ch???ng ch??? c???a n?????c ngo??i ???????c B??? T??i ch??nh c??ng nh???n v?? ?????t k??? thi s??t h???ch v??? ph??p lu???t Vi???t Nam.</span></p><p style="padding: 0px; margin: 5px 0px; color: rgb(0, 0, 255); text-indent: 36pt; font-size: 12pt; font-family: &quot;Times New Roman&quot;; line-height: 1; orphans: 2; widows: 2; text-align: justify;"><span style="color:#000000;font-weight:400;text-decoration:none;vertical-align:baseline;font-size:12pt;font-family:&quot;Times New Roman&quot;;font-style:normal">3. Ki???m to??n vi??n h??nh ngh??? l?? ki???m to??n vi??n ???? ???????c c???p Gi???y ch???ng nh???n ????ng k?? h??nh ngh??? ki???m to??n.</span></p><p style="padding: 0px; margin: 5px 0px; color: rgb(0, 0, 255); text-indent: 36pt; font-size: 12pt; font-family: &quot;Times New Roman&quot;; line-height: 1; orphans: 2; widows: 2; text-align: justify;"><span style="color:#000000;font-weight:400;text-decoration:none;vertical-align:baseline;font-size:12pt;font-family:&quot;Times New Roman&quot;;font-style:normal">4. Th??nh vi??n tham gia cu???c ki???m to??n bao g???m ki???m to??n vi??n h??nh ngh???, ki???m to??n vi??n v?? c??c th??nh vi??n kh??c. </span></p><p style="padding: 0px; margin: 5px 0px; color: rgb(0, 0, 255); text-indent: 36pt; font-size: 12pt; font-family: &quot;Times New Roman&quot;; line-height: 1; orphans: 2; widows: 2; text-align: justify;"><span style="color:#000000;font-weight:400;text-decoration:none;vertical-align:baseline;font-size:12pt;font-family:&quot;Times New Roman&quot;;font-style:normal">5. Doanh nghi???p ki???m to??n l?? doanh nghi???p c?? ????? ??i???u ki???n ????? kinh doanh d???ch v??? ki???m to??n theo quy ?????nh c???a Lu???t n??y v?? c??c quy ?????nh kh??c c???a ph??p lu???t c?? li??n quan. </span></p><p style="padding: 0px; margin: 5px 0px; color: rgb(0, 0, 255); text-indent: 36pt; font-size: 12pt; font-family: &quot;Times New Roman&quot;; line-height: 1; orphans: 2; widows: 2; text-align: justify;"><span style="color:#000000;font-weight:400;text-decoration:none;vertical-align:baseline;font-size:12pt;font-family:&quot;Times New Roman&quot;;font-style:normal">6. ????n v??? ???????c ki???m to??n l?? doanh nghi???p, t??? ch???c ???????c doanh nghi???p ki???m to??n, chi nh??nh doanh nghi???p ki???m to??n n?????c ngo??i t???i Vi???t Nam th???c hi???n ki???m to??n theo h???p ?????ng ki???m to??n.</span></p><br><div></div></div>`
}
