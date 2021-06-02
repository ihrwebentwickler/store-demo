import { Component, OnInit } from '@angular/core';
import { Film } from '../../../shared/interfaces/film.interface';
import { Observable } from 'rxjs';
import { DataService } from '../../data/services/data.service';
import { TableService } from '../../../shared/services/table/table.service';
import { TableProperties } from '../../../state/store.interface';

@Component({
  selector: 'app-hello',
  templateUrl: './hello.component.html'
})
export class HelloComponent implements OnInit {
  films$!: Observable<Film[]>;
  tableProperties$!: Observable<TableProperties>;

  constructor(
    private readonly dataService: DataService,
    private readonly tableService: TableService
  ) {
  }

  ngOnInit(): void {
    this.films$ = this.dataService.getFilms();
    this.tableProperties$ = this.tableService.getTableProperties('data');
  }
}
