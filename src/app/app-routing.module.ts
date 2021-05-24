import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {DataComponent} from './features/data/data.component';
import {HelloComponent} from './features/hello/hello.component';

const routes: Routes = [
  {
    path: 'hello',
    component: HelloComponent,
    loadChildren: () =>
      import('./features/hello/hello.module').then(m => m.HelloModule)
  },
  {
    path: 'data',
    component: DataComponent,
    loadChildren: () =>
      import('./features/data/data.module').then(m => m.DataModule)
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
