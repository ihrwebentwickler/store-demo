import { Injectable } from '@angular/core';

import { EntityState, EntityStore, StoreConfig } from '@datorama/akita';
import { TableProperties } from '../store.interface';

export interface StateTable extends EntityState<TableProperties> {
}

@Injectable({providedIn: 'root'})
@StoreConfig({name: 'tableProperties'})
export class TableStore extends EntityStore<TableProperties> {
  constructor() {
    super();
  }
}
