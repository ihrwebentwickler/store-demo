import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {NgModule} from '@angular/core';

import {DataComponent} from './data.component';
import {DataService} from './data.service';
import {MaterialModule} from '../../material.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    MaterialModule
  ],
  declarations: [DataComponent],
  providers: [
    DataService
  ]
})
export class DataModule {
}
