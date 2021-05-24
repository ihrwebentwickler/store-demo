import {Injectable} from '@angular/core';
import {Film} from '../../shared/interfaces/film.interface';
import {getEntityType, QueryConfig, QueryEntity} from '@datorama/akita';
import {FilmsStore, StateFilm} from '../stores/films.store';
import {Observable} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
@QueryConfig({
  sortBy: 'created'
})
export class FilmsFiltersQuery extends QueryEntity<StateFilm> {
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
