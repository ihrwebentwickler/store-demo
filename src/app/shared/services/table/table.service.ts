import { Injectable } from '@angular/core';

import * as _ from 'lodash';
import { Observable, of } from 'rxjs';
import { TableProperties } from '../../../state/store.interface';
import { TableQuery } from '../../../state/queries/table.query';
import { TableStore } from '../../../state/stores/table.store';
import { ID, EntityState, getEntityType } from '@datorama/akita';
import { first, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class TableService<S extends EntityState = any, E = getEntityType<S>> {
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

  updateTableProperties(changeData: { id: ID, tableData: { key: string; value: string | number | boolean }[] }): void {
    const currentTableData$ = this.getTableProperties(changeData.id);
    currentTableData$.pipe(first(), map((dataTableProps: TableProperties) => {
        if (dataTableProps && Array.isArray(changeData.tableData)) {
          const dataTableUpdate = _.clone(dataTableProps) as unknown as { [p: string]: string | number | boolean };
          changeData.tableData.forEach((item: { [p: string]: string | number | boolean }) => {
            const keyString: string = String(item.key);

            if (typeof dataTableUpdate[keyString] !== "undefined") {
              dataTableUpdate[keyString] = item.value;
            }
          });

          this.tableStore.update(changeData.id, dataTableUpdate);
        }
      })
    ).subscribe();
  }
}
