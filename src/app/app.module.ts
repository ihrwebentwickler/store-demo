import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';

import { AppComponent } from './core/components/app.component';
import { AppRoutingModule } from './app-routing.module';
import { HeaderComponent } from './core/header/header.component';
import { HttpClientModule } from '@angular/common/http';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { OverlayModule } from '@angular/cdk/overlay'; // Importing OverlayModule in lazy-loaded modules not work!
import { RestApiService } from './shared/services/rest-api/rest-api.service';

@NgModule({
  imports: [
    AppRoutingModule,
    BrowserAnimationsModule,
    BrowserModule,
    CommonModule,
    FormsModule,
    HttpClientModule,
    MatSelectModule,
    MatTooltipModule,
    OverlayModule,
    ReactiveFormsModule
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
