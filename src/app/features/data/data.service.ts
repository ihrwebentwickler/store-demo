import {Injectable} from '@angular/core';

import {AkitaFilter, AkitaFiltersPlugin} from '../../../../lib/akita-filters-plugin';
import {FilmFiltersStore, FilmState} from '../../state/stores/film-filters.store';
import {Film} from '../../shared/interfaces/film.interface';
import {FilmsFiltersQuery} from '../../state/queries/film-filters.query';
import {map} from 'rxjs/operators';
import {empty, Observable} from 'rxjs';
import {HashMap, Order} from '@datorama/akita';
import {RestApiService} from '../../shared/services/rest-api.service';
import {StateFilm} from '../../state/stores/films.store';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  filtersFilm: AkitaFiltersPlugin<StateFilm>;

  constructor(
    private readonly filmFiltersStore: FilmFiltersStore,
    private readonly filmFiltersQuery: FilmsFiltersQuery,
    private readonly restApiService: RestApiService
  ) {
    this.filtersFilm = new AkitaFiltersPlugin<FilmState>(this.filmFiltersQuery);
  }

  getFilms(): Observable<Film[]> {
    return this.restApiService.get({
      endpoint: 'https://swapi.dev/api/films/'
    }).pipe(
      map((data) => {
        if (Array.isArray(data) && data[0].results) {
          data[0].results.forEach((item: Film) => {
            item.isFavouritMovie = false;
          });

          this.filmFiltersStore.set(data[0].results);
          return !this.filmFiltersQuery.getHasCache() ? data[0].results : empty();
        }
      })
    );
  }

  setFilter(filter: AkitaFilter<StateFilm>): void {
    this.filtersFilm.setFilter(filter);
  }

  setOrderBy(by: any, order: string | '+' | '-'): void {
    this.filtersFilm.setSortBy({ sortBy: by, sortByOrder: order === '+' ? Order.ASC : Order.DESC });
  }

  removeFilter(id: string): void {
    this.filtersFilm.removeFilters([id]);
  }

  removeAllFilter(): void {
    this.filtersFilm.clearFilters();
  }

  getFilterValue(id: string): any | null {
    return this.filtersFilm.getFilterValue(id);
  }

  getSortValue(): string | null {
    const sortValue = this.filtersFilm.getSortValue();
    if ( !sortValue ) { return '+title'; }
    const order = sortValue.sortByOrder === Order.ASC ? '+' : '-';
    return sortValue.sortBy ? order + sortValue.sortBy : '+title';
  }

  selectFilters(): Observable<AkitaFilter<StateFilm>[]> {
    return this.filtersFilm.selectFilters();
  }

  selectAll(): Observable<HashMap<Film> | Film[]> {
    return this.filtersFilm.selectAllByFilters();
  }
}
