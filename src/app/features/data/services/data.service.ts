import { Injectable } from '@angular/core';

import { Film } from '../../../shared/interfaces/film.interface';
import { FilmsQuery } from '../../../state/queries/films.query';
import { FilmsStore } from '../../../state/stores/films.store';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { RestApiService } from '../../../shared/services/rest-api/rest-api.service';
import { ID } from '@datorama/akita';
import { TableStore } from '../../../state/stores/table.store';


@Injectable({
  providedIn: 'root',
})
export class DataService {

  constructor(
    private readonly filmsQuery: FilmsQuery,
    private readonly filmsStore: FilmsStore,
    private readonly restApiService: RestApiService,
    private readonly tableStore: TableStore
  ) {
  }

  getFilms(): Observable<Film[]> {
    if (!this.filmsQuery.getHasCache()) {
      return this.restApiService.get({
        endpoint: 'https://swapi.dev/api/films/'
      }).pipe(
        map((data) => {
          if (Array.isArray(data) && data[0] && data[0].results) {
            data[0].results.forEach((item: Film, key: number) => {
              item.id = key;
              item.isFavouritMovie = false;
            });

            this.filmsStore.set(data[0].results);

            return data[0].results;
          } else {
            return [];
          }
        })
      );
    } else {
      return this.filmsQuery.selectAll();
    }
  }

  updateFilmFavourit(id: ID, isFavouritMovie: boolean) {
    this.filmsStore.update(id, {isFavouritMovie});
  }
}
