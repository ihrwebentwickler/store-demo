import {ChangeDetectionStrategy, Component, OnInit, ViewChild} from '@angular/core';

import {AkitaMatDataSource} from '../../../../lib/akita-mat-datasource';
import {DataService} from './data.service';
import {FilmsFiltersQuery} from '../../state/queries/film-filters.query';
import {FilmState} from '../../state/stores/film-filters.store';
import {Film} from '../../shared/interfaces/film.interface';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {Observable} from 'rxjs';

@Component({
  selector: 'app-data',
  templateUrl: './data.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DataComponent implements OnInit {
  @ViewChild(MatPaginator, { static: true }) paginator!: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort!: MatSort;

  public dataSource!: AkitaMatDataSource<FilmState>;
  public displayedColumns: string[] = ['title', 'created', 'producer', 'director', 'isFavouritMovie'];
  count$!: Observable<number>;

  constructor(
    private readonly dataService: DataService,
    private readonly filmsFilterQuery: FilmsFiltersQuery,
  ) {
  }

  ngOnInit(): void {
    this.dataSource = new AkitaMatDataSource<FilmState>(this.filmsFilterQuery, this.dataService.filtersFilm);
    this.count$ = this.dataSource.selectCount();
    this.dataService.getFilms().subscribe();

    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    console.log(this.dataSource);
  }

  isDataSourceEmpty(): boolean {
    return !this.dataSource || this.dataSource.data.length === 0;
  }

  onCheckedUpdateFavouritMovie(row: Film): void {
  }

  applyFilter(filterValue: Event): void {
    if (filterValue.target) {

    }
  }
}
