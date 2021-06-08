import { SortDirection } from '@angular/material/sort';
import { ID } from '@datorama/akita';

export type TableProperties = {
  id: ID;
  sortDirection: SortDirection;
  sortActive: string;
  filterValue: string;
  itemsPerPage: number;
  pageIndex: number;
};
