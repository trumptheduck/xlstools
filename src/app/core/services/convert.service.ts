import { HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { GoogleApiService, GoogleAuthService } from 'ng-gapi';
import { HttpService } from './http.service';

export enum FileExportFormat {
  html = 'text/html',
  docx = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
}

@Injectable({
  providedIn: 'root'
})

export class GoogleConvertService {
  isSignedIn = false;
  accessToken: string = "";
  constructor(
    private gAuth$: GoogleAuthService,
    private http$: HttpService
    ) {}

  signIn(callback = (any:any)=> {}) {
    this.gAuth$.getAuth()
      .subscribe((auth) => {
          auth.signIn().then(res => {
            this.accessToken = this.getPropertyFromKey(res,"access_token");
            this.isSignedIn = true;
            callback(this.accessToken);
          });
      });
  }

  getPropertyFromKey(obj: any, key: string): any {
    for (let prop in obj) {
      const value = obj[prop]
      if (prop == key) return value;
      if (typeof value !== "object") continue;
      const recVal = this.getPropertyFromKey(value, key);
      if (recVal) return recVal;
    }
    return null;
  }
  createHtmlBlob(html: string) {
    return new Blob([html], {type: "text/html"});
  }
  createFile(filename: string,callback: (_:any)=> any) {
    this.http$.post("https://www.googleapis.com/drive/v3/files",{
      name: filename,
      mimeType: 'application/vnd.google-apps.document',
    }, this.accessToken).subscribe({
      next: (res) => {
        callback(res);
      }
    })
  }
  createHTMLFile(filename: string,callback: (_:any)=> any) {
    this.http$.post("https://www.googleapis.com/drive/v3/files",{
      name: filename,
      mimeType: 'text/html',
    }, this.accessToken).subscribe({
      next: (res) => {
        callback(res);
      }
    })
  }

  uploadFile(blob:any, type: any, id: string, callback: (_:any)=>any) {
    fetch(`https://www.googleapis.com/upload/drive/v3/files/${id}`, {
      method: 'PATCH',
      headers: new Headers({
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': type
      }),
      body: blob
    }).then(res => {
      callback(res);
    })
  }
  exportFile(id: string, format: string, callback: (_:any)=>any) {
    this.http$.get(`https://www.googleapis.com/drive/v3/files/${id}/export`, new HttpParams({fromObject: {
      'mimeType': format
    }}), this.accessToken, "text").subscribe({next:(res)=>{
      callback(res);
    }})
  }
  exportToDocx(id: string, callback: (_:any)=>any) {
    this.http$.get(`https://www.googleapis.com/drive/v3/files/${id}/export`, new HttpParams({fromObject: {
      'mimeType': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    }}), this.accessToken, 'blob').subscribe({next:(res)=>{
      let dataType = res.type;
      let binaryData = [];
      binaryData.push(res);
      callback(new Blob(binaryData, {type: dataType}));
    }})
  }
  deleteFile(id: string, callback: (_:any)=>any) {
    this.http$.delete(`https://www.googleapis.com/drive/v3/files/${id}`, new HttpParams(), this.accessToken)
      .subscribe({next:(res)=>{
        callback(res);
      }})
  }
  formatHTML(html:string) {
    var res = html.replace('<html><head><meta content="text/html; charset=UTF-8" http-equiv="content-type"></head>','')
                    .replace('</html>','')
                    .replace('<body','<div')
                    .replace('</body>','<div>')
    return res
}

  convertToHTML(file:any, callback: (_:any)=>any) {
    if (!this.isSignedIn) return alert("Hãy đăng nhập để sử dụng dịch vụ!");
    this.createFile("html-scaffold",(created)=>{
      this.uploadFile(new Blob([file]), file.type, created.id, (uploaded)=>{
        this.exportFile(created.id, FileExportFormat.html, (exported)=>{
          callback(this.formatHTML(exported));
        })
      })
    })
  }
}
