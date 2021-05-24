import { Injectable } from '@angular/core';

import {FilmsStore, StateFilm} from '../stores/films.store';
import {getEntityType, QueryConfig, QueryEntity} from '@datorama/akita';
import {Film} from '../../shared/interfaces/film.interface';
import {Observable} from 'rxjs';

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

  getFilms(term: string, sortBy: keyof Film): Observable<getEntityType<StateFilm>[]> {
    return this.selectAll({
      sortBy,
      filterBy: entity => entity.title.toLowerCase().includes(term)
    });
  }
}
