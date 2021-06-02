import { Injectable } from '@angular/core';

import { FilmsStore, StateFilm } from '../stores/films.store';
import { QueryConfig, QueryEntity } from '@datorama/akita';

@Injectable({
  providedIn: 'root'
})
@QueryConfig({
  sortBy: 'title'
})
export class FilmsQuery extends QueryEntity<StateFilm> {
  constructor(protected store: FilmsStore) {
    super(store);
  }
}
