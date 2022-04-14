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
                <div style="background-color: rgb(255, 255, 255); padding: 72pt 72pt 72pt 90pt; max-width: 450pt; border: 1px solid rgba(0, 0, 0, 0.1);" contenteditable="true"><div><p style="padding: 0px; margin: 5px 0px; color: rgb(0, 0, 255); font-size: 12pt; font-family: &quot;Times New Roman&quot;; line-height: 1; orphans: 2; widows: 2; height: 12pt; text-align: center;"><span style="color:#000000;font-weight:400;text-decoration:none;vertical-align:baseline;font-size:12pt;font-family:&quot;Times New Roman&quot;;font-style:normal"></span></p><p style="padding: 0px; margin: 5px 0px; color: rgb(0, 0, 255); font-size: 12pt; font-family: &quot;Times New Roman&quot;; line-height: 1; orphans: 2; widows: 2; height: 12pt; text-align: left;"><span style="color:#000000;font-weight:400;text-decoration:none;vertical-align:baseline;font-size:14pt;font-family:&quot;Times New Roman&quot;;font-style:normal"></span></p></div><p style="padding: 0px; margin: 5px 0px; color: rgb(0, 0, 255); font-size: 12pt; font-family: &quot;Times New Roman&quot;; line-height: 1.15; height: 12pt; text-align: left;"><span style="color:#000000;font-weight:400;text-decoration:none;vertical-align:baseline;font-size:11pt;font-family:&quot;Arial&quot;;font-style:normal"></span></p><a id="t.dc62c75642fe16c5970f70f72dc4dbc1a89b93ad"></a><a id="t.0"></a><table style="margin-left:-5.4pt;border-spacing:0;border-collapse:collapse;margin-right:auto"><tbody><tr style="height:0pt"><td colspan="1" rowspan="1" style="border-right-style:solid;padding:0pt 5.4pt 0pt 5.4pt;border-bottom-color:#000000;border-top-width:0pt;border-right-width:0pt;border-left-color:#000000;vertical-align:top;border-right-color:#000000;border-left-width:0pt;border-top-style:solid;border-left-style:solid;border-bottom-width:0pt;width:185.4pt;border-top-color:#000000;border-bottom-style:solid"><p style="padding: 0px; margin: 5px 0px; color: rgb(0, 0, 255); font-size: 12pt; font-family: &quot;Times New Roman&quot;; line-height: 1; orphans: 2; widows: 2; text-align: center;"><span style="vertical-align:baseline;font-size:12pt;font-family:&quot;Times New Roman&quot;;color:#000000;font-weight:700">QUỐC HỘI</span></p><p style="padding: 0px; margin: 5px 0px; color: rgb(0, 0, 255); font-size: 12pt; font-family: &quot;Times New Roman&quot;; line-height: 1; orphans: 2; widows: 2; text-align: center;"><span style="color:#000000;font-weight:400;text-decoration:none;vertical-align:baseline;font-size:12pt;font-family:&quot;Times New Roman&quot;;font-style:normal">-------------</span></p><p style="padding: 0px; margin: 5px 0px; color: rgb(0, 0, 255); font-size: 12pt; font-family: &quot;Times New Roman&quot;; line-height: 1; orphans: 2; widows: 2; text-align: center;"><span style="color:#000000;font-weight:400;text-decoration:none;vertical-align:baseline;font-size:12pt;font-family:&quot;Times New Roman&quot;;font-style:normal">Luật số: 67/2011/QH12</span></p></td><td colspan="1" rowspan="1" style="border-right-style:solid;padding:0pt 5.4pt 0pt 5.4pt;border-bottom-color:#000000;border-top-width:0pt;border-right-width:0pt;border-left-color:#000000;vertical-align:top;border-right-color:#000000;border-left-width:0pt;border-top-style:solid;border-left-style:solid;border-bottom-width:0pt;width:264.6pt;border-top-color:#000000;border-bottom-style:solid"><p style="padding: 0px; margin: 5px 0px; color: rgb(0, 0, 255); font-size: 12pt; font-family: &quot;Times New Roman&quot;; line-height: 1; orphans: 2; widows: 2; text-align: center;"><span style="vertical-align:baseline;font-size:12pt;font-family:&quot;Times New Roman&quot;;color:#000000;font-weight:700">CỘNG HOÀ XÃ HỘI CHỦ NGHĨA VIỆT NAM</span></p><p style="padding: 0px; margin: 5px 0px; color: rgb(0, 0, 255); font-size: 12pt; font-family: &quot;Times New Roman&quot;; line-height: 1; orphans: 2; widows: 2; text-align: center;"><span style="vertical-align:baseline;font-size:12pt;font-family:&quot;Times New Roman&quot;;color:#000000;font-weight:700">Độc lập - Tự do - Hạnh phúc</span></p><p style="padding: 0px; margin: 5px 0px; color: rgb(0, 0, 255); font-size: 12pt; font-family: &quot;Times New Roman&quot;; line-height: 1; orphans: 2; widows: 2; text-align: center;"><span style="color:#000000;font-weight:400;text-decoration:none;vertical-align:baseline;font-size:12pt;font-family:&quot;Times New Roman&quot;;font-style:normal">-------------------------</span></p><p style="padding: 0px; margin: 5px 0px; color: rgb(0, 0, 255); font-size: 12pt; font-family: &quot;Times New Roman&quot;; line-height: 1; orphans: 2; widows: 2; text-align: center;"><span style="color:#000000;font-weight:400;vertical-align:baseline;font-size:12pt;font-family:&quot;Times New Roman&quot;;font-style:italic">Hà Nội, ngày 29 tháng 03 năm 2011</span></p></td></tr></tbody></table><p style="padding: 0px; margin: 5px 0px; color: rgb(0, 0, 255); font-size: 12pt; font-family: &quot;Times New Roman&quot;; line-height: 1; orphans: 2; widows: 2; height: 12pt; text-align: left;"><span style="color:#000000;font-weight:400;text-decoration:none;vertical-align:baseline;font-size:12pt;font-family:&quot;Times New Roman&quot;;font-style:normal"></span></p><p style="padding: 0px; margin: 5px 0px; color: rgb(0, 0, 255); font-size: 12pt; font-family: &quot;Times New Roman&quot;; line-height: 1; orphans: 2; widows: 2; height: 12pt; text-align: center;"><span style="color:#000000;font-weight:400;text-decoration:none;vertical-align:baseline;font-size:12pt;font-family:&quot;Times New Roman&quot;;font-style:normal"></span></p><p style="padding: 0px; margin: 5px 0px; color: rgb(0, 0, 255); font-size: 12pt; font-family: &quot;Times New Roman&quot;; line-height: 1; orphans: 2; widows: 2; text-align: center;"><span style="vertical-align:baseline;font-size:12pt;font-family:&quot;Times New Roman&quot;;color:#000000;font-weight:700">LUẬT</span></p><p style="padding: 0px; margin: 5px 0px; color: rgb(0, 0, 255); font-size: 12pt; font-family: &quot;Times New Roman&quot;; line-height: 1; orphans: 2; widows: 2; text-align: center;"><span style="vertical-align:baseline;font-size:12pt;font-family:&quot;Times New Roman&quot;;color:#000000;font-weight:700">KIỂM TOÁN ĐỘC LẬP</span></p><p style="padding: 0px; margin: 5px 0px; color: rgb(0, 0, 255); font-size: 12pt; font-family: &quot;Times New Roman&quot;; line-height: 1; orphans: 2; widows: 2; height: 12pt; text-align: center;"><span style="color:#000000;font-weight:400;text-decoration:none;vertical-align:baseline;font-size:12pt;font-family:&quot;Times New Roman&quot;;font-style:normal"></span></p><p style="padding: 0px; margin: 5px 0px; color: rgb(0, 0, 255); text-indent: 36pt; font-size: 12pt; font-family: &quot;Times New Roman&quot;; line-height: 1; orphans: 2; widows: 2; text-align: justify;"><span style="color:#000000;font-weight:400;vertical-align:baseline;font-size:12pt;font-family:&quot;Times New Roman&quot;;font-style:italic">Căn cứ Hiến pháp nước Cộng hoà xã hội chủ nghĩa Việt Nam năm 1992 đã được sửa đổi, bổ sung một số điều theo Nghị quyết số 51/2001/QH10;</span></p><p style="padding: 0px; margin: 5px 0px; color: rgb(0, 0, 255); text-indent: 36pt; font-size: 12pt; font-family: &quot;Times New Roman&quot;; line-height: 1; orphans: 2; widows: 2; text-align: justify;"><span style="color:#000000;font-weight:400;vertical-align:baseline;font-size:12pt;font-family:&quot;Times New Roman&quot;;font-style:italic">Quốc hội ban hành Luật kiểm toán độc lập.</span></p><p style="padding: 0px; margin: 5px 0px; color: rgb(0, 0, 255); font-size: 12pt; font-family: &quot;Times New Roman&quot;; line-height: 1; orphans: 2; widows: 2; height: 12pt; text-align: left;"><span style="color:#000000;font-weight:400;text-decoration:none;vertical-align:baseline;font-size:12pt;font-family:&quot;Times New Roman&quot;;font-style:normal"></span></p><p id="h.gjdgxs" style="padding: 0px; margin: 5px 0px; color: rgb(0, 0, 255); font-size: 12pt; font-family: &quot;Times New Roman&quot;; line-height: 1; orphans: 2; widows: 2; text-align: center;"><span style="vertical-align:baseline;font-size:12pt;font-family:&quot;Times New Roman&quot;;color:#000000;font-weight:700">CHƯƠNG I</span></p><p style="padding: 0px; margin: 5px 0px; color: rgb(0, 0, 255); font-size: 12pt; font-family: &quot;Times New Roman&quot;; line-height: 1; orphans: 2; widows: 2; text-align: center;"><span style="vertical-align:baseline;font-size:12pt;font-family:&quot;Times New Roman&quot;;color:#000000;font-weight:700">NHỮNG QUY ĐỊNH CHUNG</span></p><p style="padding: 0px; margin: 5px 0px; color: rgb(0, 0, 255); font-size: 12pt; font-family: &quot;Times New Roman&quot;; line-height: 1; orphans: 2; widows: 2; height: 12pt; text-align: left;"><span style="color:#000000;font-weight:400;text-decoration:none;vertical-align:baseline;font-size:12pt;font-family:&quot;Times New Roman&quot;;font-style:normal"></span></p><p style="padding: 0px; margin: 5px 0px; color: rgb(0, 0, 255); text-indent: 36pt; font-size: 12pt; font-family: &quot;Times New Roman&quot;; line-height: 1; orphans: 2; widows: 2; text-align: justify;"><span style="vertical-align:baseline;font-size:12pt;font-family:&quot;Times New Roman&quot;;color:#000000;font-weight:700">Điều 1.</span><span style="color:#000000;font-weight:400;text-decoration:none;vertical-align:baseline;font-size:12pt;font-family:&quot;Times New Roman&quot;;font-style:normal">&nbsp;Phạm vi điều chỉnh</span></p><p style="padding: 0px; margin: 5px 0px; color: rgb(0, 0, 255); text-indent: 36pt; font-size: 12pt; font-family: &quot;Times New Roman&quot;; line-height: 1; orphans: 2; widows: 2; text-align: justify;"><span style="color:#000000;font-weight:400;text-decoration:none;vertical-align:baseline;font-size:12pt;font-family:&quot;Times New Roman&quot;;font-style:normal">Luật này quy định nguyên tắc, điều kiện, phạm vi, hình thức hoạt động kiểm toán độc lập; quyền, nghĩa vụ của kiểm toán viên hành nghề, doanh nghiệp kiểm toán, chi nhánh doanh nghiệp kiểm toán nước ngoài tại Việt Nam và đơn vị được kiểm toán.</span></p><p style="padding: 0px; margin: 5px 0px; color: rgb(0, 0, 255); text-indent: 36pt; font-size: 12pt; font-family: &quot;Times New Roman&quot;; line-height: 1; orphans: 2; widows: 2; text-align: justify;"><span style="vertical-align:baseline;font-size:12pt;font-family:&quot;Times New Roman&quot;;color:#000000;font-weight:700">Điều 2.</span><span style="color:#000000;font-weight:400;text-decoration:none;vertical-align:baseline;font-size:12pt;font-family:&quot;Times New Roman&quot;;font-style:normal">&nbsp;Đối tượng áp dụng</span></p><p style="padding: 0px; margin: 5px 0px; color: rgb(0, 0, 255); text-indent: 36pt; font-size: 12pt; font-family: &quot;Times New Roman&quot;; line-height: 1; orphans: 2; widows: 2; text-align: justify;"><span style="color:#000000;font-weight:400;text-decoration:none;vertical-align:baseline;font-size:12pt;font-family:&quot;Times New Roman&quot;;font-style:normal">Luật này áp dụng đối với kiểm toán viên, kiểm toán viên hành nghề, doanh nghiệp kiểm toán, chi nhánh doanh nghiệp kiểm toán nước ngoài tại Việt Nam, đơn vị được kiểm toán, tổ chức nghề nghiệp về kiểm toán và tổ chức, cá nhân khác có liên quan đến hoạt động kiểm toán độc lập.</span></p><p style="padding: 0px; margin: 5px 0px; color: rgb(0, 0, 255); text-indent: 36pt; font-size: 12pt; font-family: &quot;Times New Roman&quot;; line-height: 1; orphans: 2; widows: 2; text-align: justify;"><span style="vertical-align:baseline;font-size:12pt;font-family:&quot;Times New Roman&quot;;color:#000000;font-weight:700">Điều 3.</span><span style="color:#000000;font-weight:400;text-decoration:none;vertical-align:baseline;font-size:12pt;font-family:&quot;Times New Roman&quot;;font-style:normal">&nbsp;Áp dụng Luật kiểm toán độc lập, điều ước quốc tế và các luật có liên quan</span></p><p style="padding: 0px; margin: 5px 0px; color: rgb(0, 0, 255); text-indent: 36pt; font-size: 12pt; font-family: &quot;Times New Roman&quot;; line-height: 1; orphans: 2; widows: 2; text-align: justify;"><span style="color:#000000;font-weight:400;text-decoration:none;vertical-align:baseline;font-size:12pt;font-family:&quot;Times New Roman&quot;;font-style:normal">1. Tổ chức, cá nhân trong nước và tổ chức, cá nhân nước ngoài tham gia hoạt động kiểm toán độc lập trên lãnh thổ Việt Nam phải tuân theo Luật này và các quy định khác của pháp luật có liên quan. </span></p><p style="padding: 0px; margin: 5px 0px; color: rgb(0, 0, 255); text-indent: 36pt; font-size: 12pt; font-family: &quot;Times New Roman&quot;; line-height: 1; orphans: 2; widows: 2; text-align: justify;"><span style="color:#000000;font-weight:400;text-decoration:none;vertical-align:baseline;font-size:12pt;font-family:&quot;Times New Roman&quot;;font-style:normal">2. Trường hợp điều ước quốc tế mà Cộng hoà xã hội chủ nghĩa Việt Nam là thành viên có quy định khác với quy định của Luật này thì áp dụng quy định của điều ước quốc tế đó.</span></p><p style="padding: 0px; margin: 5px 0px; color: rgb(0, 0, 255); text-indent: 36pt; font-size: 12pt; font-family: &quot;Times New Roman&quot;; line-height: 1; orphans: 2; widows: 2; text-align: justify;"><span style="vertical-align:baseline;font-size:12pt;font-family:&quot;Times New Roman&quot;;color:#000000;font-weight:700">Điều 4.</span><span style="color:#000000;font-weight:400;text-decoration:none;vertical-align:baseline;font-size:12pt;font-family:&quot;Times New Roman&quot;;font-style:normal">&nbsp;Mục đích của kiểm toán độc lập</span></p><p style="padding: 0px; margin: 5px 0px; color: rgb(0, 0, 255); text-indent: 36pt; font-size: 12pt; font-family: &quot;Times New Roman&quot;; line-height: 1; orphans: 2; widows: 2; text-align: justify;"><span style="color:#000000;font-weight:400;text-decoration:none;vertical-align:baseline;font-size:12pt;font-family:&quot;Times New Roman&quot;;font-style:normal">Hoạt động kiểm toán độc lập nhằm góp phần công khai, minh bạch thông tin kinh tế, tài chính của đơn vị được kiểm toán và doanh nghiệp, tổ chức khác; làm lành mạnh môi trường đầu tư; thực hành tiết kiệm, chống lãng phí, phòng, chống tham nhũng; phát hiện và ngăn chặn vi phạm pháp luật; nâng cao hiệu lực, hiệu quả quản lý, điều hành kinh tế, tài chính của Nhà nước và hoạt động kinh doanh của doanh nghiệp.</span></p><p style="padding: 0px; margin: 5px 0px; color: rgb(0, 0, 255); text-indent: 36pt; font-size: 12pt; font-family: &quot;Times New Roman&quot;; line-height: 1; orphans: 2; widows: 2; text-align: justify;"><span style="vertical-align:baseline;font-size:12pt;font-family:&quot;Times New Roman&quot;;color:#000000;font-weight:700">Điều 5.</span><span style="color:#000000;font-weight:400;text-decoration:none;vertical-align:baseline;font-size:12pt;font-family:&quot;Times New Roman&quot;;font-style:normal">&nbsp;Giải thích từ ngữ</span></p><p style="padding: 0px; margin: 5px 0px; color: rgb(0, 0, 255); text-indent: 36pt; font-size: 12pt; font-family: &quot;Times New Roman&quot;; line-height: 1; orphans: 2; widows: 2; text-align: justify;"><span style="color:#000000;font-weight:400;text-decoration:none;vertical-align:baseline;font-size:12pt;font-family:&quot;Times New Roman&quot;;font-style:normal">Trong Luật này, các từ ngữ dưới đây được hiểu như sau:</span></p><p style="padding: 0px; margin: 5px 0px; color: rgb(0, 0, 255); text-indent: 36pt; font-size: 12pt; font-family: &quot;Times New Roman&quot;; line-height: 1; orphans: 2; widows: 2; text-align: justify;"><span style="color:#000000;font-weight:400;text-decoration:none;vertical-align:baseline;font-size:12pt;font-family:&quot;Times New Roman&quot;;font-style:normal">1. Kiểm toán độc lập là việc kiểm toán viên hành nghề, doanh nghiệp kiểm toán, chi nhánh doanh nghiệp kiểm toán nước ngoài tại Việt Nam kiểm tra, đưa ra ý kiến độc lập của mình về báo cáo tài chính và công việc kiểm toán khác theo hợp đồng kiểm toán.</span></p><p style="padding: 0px; margin: 5px 0px; color: rgb(0, 0, 255); text-indent: 36pt; font-size: 12pt; font-family: &quot;Times New Roman&quot;; line-height: 1; orphans: 2; widows: 2; text-align: justify;"><span style="color:#000000;font-weight:400;text-decoration:none;vertical-align:baseline;font-size:12pt;font-family:&quot;Times New Roman&quot;;font-style:normal">2. Kiểm toán viên là người được cấp chứng chỉ kiểm toán viên theo quy định của pháp luật hoặc người có chứng chỉ của nước ngoài được Bộ Tài chính công nhận và đạt kỳ thi sát hạch về pháp luật Việt Nam.</span></p><p style="padding: 0px; margin: 5px 0px; color: rgb(0, 0, 255); text-indent: 36pt; font-size: 12pt; font-family: &quot;Times New Roman&quot;; line-height: 1; orphans: 2; widows: 2; text-align: justify;"><span style="color:#000000;font-weight:400;text-decoration:none;vertical-align:baseline;font-size:12pt;font-family:&quot;Times New Roman&quot;;font-style:normal">3. Kiểm toán viên hành nghề là kiểm toán viên đã được cấp Giấy chứng nhận đăng ký hành nghề kiểm toán.</span></p><p style="padding: 0px; margin: 5px 0px; color: rgb(0, 0, 255); text-indent: 36pt; font-size: 12pt; font-family: &quot;Times New Roman&quot;; line-height: 1; orphans: 2; widows: 2; text-align: justify;"><span style="color:#000000;font-weight:400;text-decoration:none;vertical-align:baseline;font-size:12pt;font-family:&quot;Times New Roman&quot;;font-style:normal">4. Thành viên tham gia cuộc kiểm toán bao gồm kiểm toán viên hành nghề, kiểm toán viên và các thành viên khác. </span></p><p style="padding: 0px; margin: 5px 0px; color: rgb(0, 0, 255); text-indent: 36pt; font-size: 12pt; font-family: &quot;Times New Roman&quot;; line-height: 1; orphans: 2; widows: 2; text-align: justify;"><span style="color:#000000;font-weight:400;text-decoration:none;vertical-align:baseline;font-size:12pt;font-family:&quot;Times New Roman&quot;;font-style:normal">5. Doanh nghiệp kiểm toán là doanh nghiệp có đủ điều kiện để kinh doanh dịch vụ kiểm toán theo quy định của Luật này và các quy định khác của pháp luật có liên quan. </span></p><p style="padding: 0px; margin: 5px 0px; color: rgb(0, 0, 255); text-indent: 36pt; font-size: 12pt; font-family: &quot;Times New Roman&quot;; line-height: 1; orphans: 2; widows: 2; text-align: justify;"><span style="color:#000000;font-weight:400;text-decoration:none;vertical-align:baseline;font-size:12pt;font-family:&quot;Times New Roman&quot;;font-style:normal">6. Đơn vị được kiểm toán là doanh nghiệp, tổ chức được doanh nghiệp kiểm toán, chi nhánh doanh nghiệp kiểm toán nước ngoài tại Việt Nam thực hiện kiểm toán theo hợp đồng kiểm toán.</span></p><br><div></div></div>`
}
