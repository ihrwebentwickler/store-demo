import {IFilmList} from './app.interface';

export interface ReducerAppDataState {
  items: IFilmList[] | null;
  selectedItem: IFilmList | null;
}
