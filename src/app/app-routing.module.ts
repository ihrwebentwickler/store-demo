import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {DataComponent} from './features/data/data.component';
import {HelloComponent} from './features/hello/hello.component';

const routes: Routes = [
  {
    path: 'hello',
    component: HelloComponent
  },
  {
    path: 'data',
    component: DataComponent
  },
  {
    path: '**',
    redirectTo: 'data',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
