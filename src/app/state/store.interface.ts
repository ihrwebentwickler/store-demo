import {Film} from '../shared/interfaces/film.interface';
import {ITableProperties} from '../shared/interfaces/app.interface';

export interface IFilmState {
  list?: Array<Film>;
  tableProperties?: ITableProperties;
  error: Error | boolean;
}
