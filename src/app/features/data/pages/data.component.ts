import { AfterViewInit, ChangeDetectionStrategy, Component, OnDestroy, ViewChild } from '@angular/core';
import * as _ from 'lodash';
import { DataService } from '../services/data.service';
import { delay } from 'rxjs/operators';
import { Film } from '../../../shared/interfaces/film.interface';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort} from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { TableProperties } from '../../../state/store.interface';
import { TableService } from '../../../shared/services/table/table.service';

@Component({
  selector: 'app-data',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './data.component.html'
})
export class DataComponent implements AfterViewInit, OnDestroy {
  @ViewChild(MatSort, {static: true}) sort!: MatSort;
  @ViewChild(MatPaginator, {static: true}) paginator!: MatPaginator;

  displayedColumns: string[] = ['title', 'created', 'producer', 'director', 'isFavouritMovie'];
  dataSource: MatTableDataSource<Film> = new MatTableDataSource();

  constructor(
    private readonly dataService: DataService,
    private readonly tableService: TableService
  ) {
  }

  ngAfterViewInit(): void {
    this.tableService.setTableProperties({
      id: 'data',
      sortDirection: this.sort.direction,
      sortActive: this.sort.active,
      filterValue: this.dataSource.filter,
      itemsPerPage: this.paginator.pageSize,
      pageIndex: this.paginator.pageIndex
    })
      .pipe(delay(0)).subscribe((dataTableProps: TableProperties) => {
      const tableProperties = _.cloneDeep(dataTableProps);

      this.dataSource.sort = this.sort;
      this.sort.direction = tableProperties.sortDirection;
      this.sort.active = tableProperties.sortActive;
      this.dataSource.filter = tableProperties.filterValue.trim().toLowerCase();
      this.paginator.pageSize = tableProperties.itemsPerPage;
      this.paginator.pageIndex = tableProperties.pageIndex;
      this.dataSource.paginator = this.paginator;
    });

    this.dataService.getFilms().pipe(delay(0)).subscribe((dataRequest) => {
        this.dataSource.data = _.map(dataRequest, _.clone);
      }
    );
  }

  ngOnDestroy(): void {
    this.tableService.updateTableProperties({
      id: 'data',
      tableData: [
        {key: 'sortDirection', value: this.sort.direction},
        {key: 'sortActive', value: this.sort.active},
        {key: 'filterValue', value: this.dataSource.filter.trim().toLowerCase()},
        {key: 'itemsPerPage', value: this.paginator.pageSize},
        {key: 'pageIndex', value: this.paginator.pageIndex}
      ]
    });
  }

  changeFilmFavourit(film: Film): void {
    if (film) {
      film.isFavouritMovie = !film.isFavouritMovie;
      this.dataService.updateFilmFavourit(film.id, film.isFavouritMovie);
    }
  }
}
