import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})

export class HttpService {
  constructor(private http: HttpClient) {}
  get(path: string, params: HttpParams = new HttpParams(), token: string='', responseType = "json"): Observable<any> {
    var header = new HttpHeaders();
    header = header.set("Authorization","Bearer " + token)
    return this.http
      .get(path, { headers: header, params: params, responseType: responseType as "json"})
      .pipe(catchError(this.handleError));
  }

  put(path: string, body: Object = {}, token: string=''): Observable<any> {
    var header = new HttpHeaders();
    header = header.set("Authorization","Bearer " + token)
    return this.http
      .put(path, body,{headers: header})
      .pipe(catchError(this.handleError));
  }

  patch(path: string, body: Object = {}, token: string=''): Observable<any> {
    var header = new HttpHeaders();
    header = header.set("Authorization","Bearer " + token)
    return this.http
      .patch(path, body,{headers: header})
      .pipe(catchError(this.handleError));
  }

  post(path: string, body: Object = {}, token: string=''): Observable<any> {
    var header = new HttpHeaders();
    header = header.set("Authorization","Bearer " + token)
    return this.http
      .post(path, body,{headers: header})
      .pipe(catchError(this.handleError));
  }

  delete(path: string, params: HttpParams = new HttpParams(), token: string=''): Observable<any> {
    var header = new HttpHeaders();
    header = header.set("Authorization","Bearer " + token)
    return this.http
      .delete(path,{headers: header,params: params})
      .pipe(catchError(this.handleError));
  }
  uploadMultipart(path: string, formdata: FormData, token: string='') {
    var header = new HttpHeaders();
    header = header.set("Authorization","Bearer " + token)
    return this.http
    .post<any>(path, formdata, {headers: header})
    .pipe(catchError(this.handleError));
  }

  private handleError(error: any) {
    return throwError(error.error);
  }
}