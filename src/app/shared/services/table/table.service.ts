import { Injectable } from '@angular/core';

import { Observable, of} from 'rxjs';
import { TableProperties } from '../../../state/store.interface';
import { TableQuery } from '../../../state/queries/table.query';
import { TableStore } from '../../../state/stores/table.store';
import { ID } from '@datorama/akita';

@Injectable({
  providedIn: 'root'
})
export class TableService {

  constructor(
    private readonly tableStore: TableStore,
    private readonly tableQuery: TableQuery
  ) {
  }

  setTableProperties(ValuesTableProperties: TableProperties): Observable<TableProperties> {
    let valueTable = of(ValuesTableProperties);
    if (!this.tableQuery.getHasCache()) {
      this.tableStore.set([ValuesTableProperties]);
    } else {
      if (this.tableQuery.hasEntity(ValuesTableProperties.id)) {
        valueTable = this.tableQuery.selectEntity(ValuesTableProperties.id) as Observable<TableProperties>;
      } else {
        this.tableStore.add(ValuesTableProperties);
      }
    }

    return valueTable;
  }

  getTableProperties(id: ID): Observable<TableProperties> {
    let valueTable: Observable<TableProperties> = of();

    if (this.tableQuery.hasEntity(id)) {
      valueTable = this.tableQuery.selectEntity(id) as Observable<TableProperties>;
    }

    return valueTable;
  }

  updateTableProperties(ValuesTableProperties: TableProperties): void {
    if (this.tableQuery.hasEntity(ValuesTableProperties.id)) {
      this.tableStore.update(ValuesTableProperties.id, ValuesTableProperties);
    }
  }
}
