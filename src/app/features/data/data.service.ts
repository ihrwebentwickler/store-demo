import {Injectable} from '@angular/core';

import {IFilmList} from '../../shared/interfaces/app.interface';
import {map} from 'rxjs/operators';
import {Observable} from 'rxjs';
import {RestApiService} from '../../shared/services/rest-api.service';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  constructor(
    private readonly restApiService: RestApiService
  ) {
  }

  getFilmList(): Observable<IFilmList[]> {
    return this.restApiService.get({
      endpoint: 'https://swapi.dev/api/films/'
    }).pipe(
      map((data) => {
        if (Array.isArray(data) && data[0].results) {
          data[0].results.map((film: IFilmList) => ({
            ...film,
            isFavouritMovie: false
          }));

          return data[0].results;
        }
      })
    );
  }
}
