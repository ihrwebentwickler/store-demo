import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';

import {AppComponent} from './core/components/app.component';
import {AppRoutingModule} from './app-routing.module';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {HeaderComponent} from './core/header/header.component';
import {HttpClientModule} from '@angular/common/http';
import {RestApiService} from './shared/services/rest-api.service';

@NgModule({
  imports: [
    AppRoutingModule,
    BrowserAnimationsModule,
    BrowserModule,
    CommonModule,
    HttpClientModule,
    FormsModule
  ],
  declarations: [
    AppComponent,
    HeaderComponent
  ],
  providers: [
    RestApiService
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
