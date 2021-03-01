import {Component, OnInit, ViewChild} from '@angular/core';

import {DataService} from './data.service';
import {IFilmList} from '../../shared/interfaces/app.interface';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';

@Component({
  selector: 'app-data',
  templateUrl: './data.component.html'
})
export class DataComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  dataSource!: MatTableDataSource<IFilmList>;
  displayedColumns: string[] = ['title', 'created', 'producer', 'director', 'isFavouritMovie'];
  isLoading = false;

  constructor(
    private readonly dataService: DataService
  ) {
  }

  ngOnInit(): void {
    this.dataService.getFilmList().subscribe((filmList: IFilmList[]) => {
        if (Array.isArray(filmList)) {
          this.dataSource = new MatTableDataSource(filmList);
          this.dataSource.paginator = this.paginator;
          this.dataSource.sort = this.sort;
          this.isLoading = false;
        }
      }
    );
  }

  onApplyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  onCheckedUpdateFavouritMovie(row: IFilmList): void {
    console.log(row);
  }

}
