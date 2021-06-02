import { AfterViewInit, ChangeDetectionStrategy, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';

import * as _ from 'lodash';
import { DataService } from '../services/data.service';
import { delay } from 'rxjs/operators';
import { Film } from '../../../shared/interfaces/film.interface';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { TableProperties } from '../../../state/store.interface';
import { TableService } from '../../../shared/services/table/table.service';

@Component({
  selector: 'app-data',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './data.component.html'
})
export class DataComponent implements AfterViewInit, OnDestroy, OnInit {
  displayedColumns: string[] = ['title', 'created', 'producer', 'director', 'isFavouritMovie'];
  dataSource!: MatTableDataSource<Film>;
  tableProperties!: TableProperties;

  @ViewChild(MatSort, {static: true}) sort!: MatSort;
  @ViewChild(MatPaginator, {static: true}) paginator!: MatPaginator;

  constructor(
    private readonly dataService: DataService,
    private readonly tableService: TableService
  ) {
  }

  ngOnInit(): void {
    this.tableProperties = {
      id: 'data',
      sort: {
        direction: this.sort.direction,
        active: this.sort.active
      },
      filter: {
        lastValue: ''
      },
      itemsPerPage: 5
    };
  }

  ngAfterViewInit(): void {
    this.dataService.getFilms().subscribe((dataRequest) => {
        this.dataSource = new MatTableDataSource();
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.dataSource.data = _.map(dataRequest, _.clone);

        this.tableService.setTableProperties(this.tableProperties)
          .pipe(delay(0)).subscribe((dataTableProps: TableProperties) => {
          this.tableProperties = _.cloneDeep(dataTableProps);
          this.sort.direction = this.tableProperties.sort.direction;
          this.sort.active = this.tableProperties.sort.active;
          this.dataSource.filter = this.tableProperties.filter.lastValue.trim().toLowerCase();
          this.paginator.pageSize = this.tableProperties.itemsPerPage;
        });
      }
    );
  }

  ngOnDestroy(): void {
    if (this.tableProperties) {
      this.tableProperties.filter.lastValue = this.dataSource.filter;
      this.tableService.updateTableProperties(_.cloneDeep(this.tableProperties));
    }
  }

  changeFilmFavourit(film: Film): void {
    if (film) {
      film.isFavouritMovie = !film.isFavouritMovie;
      this.dataService.updateFilmFavourit(film.id, film.isFavouritMovie);
    }
  }

  applyFilter($event: Event): void {
    const filterValue = _.cloneDeep(($event.target as HTMLInputElement).value.trim().toLowerCase());
    this.dataSource.filter = filterValue;

    if (this.tableProperties) {
      this.tableProperties.filter.lastValue = filterValue;
    }
  }

  onPaginateChange($event: PageEvent): void {
    if (this.tableProperties) {
      this.tableProperties.itemsPerPage = Number($event.pageSize);
      this.tableService.updateTableProperties(_.cloneDeep(this.tableProperties));
    }
  }

  onSortChange(sort: Sort): void {
    if (this.tableProperties) {
      this.tableProperties.sort.active = sort.active;
      this.tableProperties.sort.direction = sort.direction;
      this.tableService.updateTableProperties(_.cloneDeep(this.tableProperties));
    }
  }
}
