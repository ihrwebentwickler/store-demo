import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';

import {AppComponent} from './core/components/app.component';
import {AppRoutingModule} from './app-routing.module';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {DataComponent} from './features/data/data.component';
import {DataService} from './features/data/data.service';
import {FormsModule} from '@angular/forms';
import {HeaderComponent} from './core/header/header.component';
import {HelloComponent} from './features/hello/hello.component';
import {HttpClientModule} from '@angular/common/http';
import {MaterialModule} from './material.module';
import {RestApiService} from './shared/services/rest-api.service';

@NgModule({
  imports: [
    AppRoutingModule,
    BrowserAnimationsModule,
    BrowserModule,
    HttpClientModule,
    MaterialModule,
    FormsModule
  ],
  declarations: [
    AppComponent,
    DataComponent,
    HeaderComponent,
    HelloComponent
  ],
  providers: [
    DataService,
    RestApiService
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
