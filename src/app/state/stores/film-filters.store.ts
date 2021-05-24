import { Injectable } from '@angular/core';
import {EntityState, EntityStore, StoreConfig} from '@datorama/akita';
import {Film} from '../../shared/interfaces/film.interface';

export interface FilmState extends EntityState<Film> {}

@Injectable({
  providedIn: 'root'
})
@StoreConfig({
  name: 'filmFilters'
})
export class FilmFiltersStore extends EntityStore<FilmState> {
  constructor() {
    super();
  }
}
