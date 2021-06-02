import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { HelloComponent } from './pages/hello.component';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [HelloComponent]
})
export class HelloModule {
}
