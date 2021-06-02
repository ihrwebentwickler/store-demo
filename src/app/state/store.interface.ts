import { SortDirection } from '@angular/material/sort';
import { ID } from '@datorama/akita';

export interface TableProperties {
  id: ID;
  sort: {
    direction: SortDirection;
    active: string;
  };
  filter: {
    lastValue: string;
  };
  itemsPerPage: number
}
