import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';

import {
  GoogleApiModule, 
  NgGapiClientConfig, 
  NG_GAPI_CONFIG,
} from "ng-gapi";
import { HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AuthComponent } from './auth/auth.component';
import { MatButtonModule } from "@angular/material/button"
import { MatIconModule } from "@angular/material/icon"
import { MatCardModule } from "@angular/material/card"
import { AuthGuard } from './core/guards/auth.guard';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import { TablePreviewDialog } from './dialogs/table-preview/table-preview.component';
import { MatDialogModule } from '@angular/material/dialog';
import { EditorMenuComponent } from './components/editor-menu/editor-menu.component';
import { TableInsertComponent } from './dialogs/table-insert/table-insert.component'


let gapiClientConfig: NgGapiClientConfig = {
  client_id: "945685249020-rb1tk80gq6lmbrftf0om7c7d12svh1fg.apps.googleusercontent.com",
  discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"],
  scope: [
    'https://www.googleapis.com/auth/drive.file'
  ].join(" ")
};

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    AuthComponent,
    TablePreviewDialog,
    EditorMenuComponent,
    TableInsertComponent,
  ],
  imports: [
    HttpClientModule,
    MatButtonModule,
    BrowserModule,
    AppRoutingModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
    GoogleApiModule.forRoot({
      provide: NG_GAPI_CONFIG,
      useValue: gapiClientConfig
    }),
    BrowserAnimationsModule,
    MatDialogModule
  ],
  providers: [AuthGuard],
  bootstrap: [AppComponent]
})
export class AppModule { }
