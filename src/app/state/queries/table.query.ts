import { Injectable } from '@angular/core';
import { QueryEntity } from '@datorama/akita';
import { TableProperties } from '../store.interface';
import { TableStore } from '../stores/table.store';

@Injectable({
  providedIn: 'root'
})
export class TableQuery extends QueryEntity<TableProperties> {
  constructor(protected store: TableStore) {
    super(store);
  }
}
