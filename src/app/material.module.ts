import {NgModule} from '@angular/core';
import {MatBottomSheetModule} from '@angular/material/bottom-sheet';
import {MatButtonModule} from '@angular/material/button';
import {MatButtonToggleModule} from '@angular/material/button-toggle';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatChipsModule} from '@angular/material/chips';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {MatPaginatorModule} from '@angular/material/paginator';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatSortModule} from '@angular/material/sort';
import {MatTableModule} from '@angular/material/table';

@NgModule({
  exports: [
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatChipsModule,
    MatBottomSheetModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatCheckboxModule,
    MatProgressSpinnerModule
  ]
})
export class MaterialModule {
}
