import { Injectable } from '@angular/core';

import { EntityState, EntityStore, StoreConfig } from '@datorama/akita';
import { Film } from '../../shared/interfaces/film.interface';

export interface StateFilm extends EntityState<Film> {
}

@Injectable({providedIn: 'root'})
@StoreConfig({name: 'films'})
export class FilmsStore extends EntityStore<StateFilm> {
  constructor() {
    super();
  }
}
