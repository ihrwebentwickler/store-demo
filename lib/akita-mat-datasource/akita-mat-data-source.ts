import {DataSource} from '@angular/cdk/table';
import {BehaviorSubject, combineLatest, merge, Observable, Subject, Subscription} from 'rxjs';
import {EntityState, getEntityType, getIDType, HashMap, ID, isArray, Order, QueryEntity} from '@datorama/akita';
import {debounceTime, filter, map, takeUntil, tap} from 'rxjs/operators';
import {MatSort, Sort} from '@angular/material/sort';
import {MatPaginator, PageEvent} from '@angular/material/paginator';

import {AkitaFilter, AkitaFiltersPlugin, compareFiltersArray, defaultFilter, WithServerOptions} from '../akita-filters-plugin';
import {DataSourceWithServerOptions} from './data-source-with-server-options.model';
import {MatTableDataSourceInterface} from './mat-table-data-source.interface';
import {_isNumberValue} from '@angular/cdk/coercion';
import {AkitaFilterBase, AkitaFilterLocal, AkitaFilterServer} from '../akita-filters-plugin';

/**
 * Corresponds to `Number.MAX_SAFE_INTEGER`. Moved out into a variable here due to
 * flaky browser support and the value not being defined in Closure's typings.
 */
const MAX_SAFE_INTEGER = 9007199254740991;

export class AkitaMatDataSource<S extends EntityState = any, E = getEntityType<S>>
  extends DataSource<E>
  implements MatTableDataSourceInterface<E> {
  get data(): getEntityType<S>[] {
    return this.dataQuery.getAll() as getEntityType<S>[];
  }

  set data(value: getEntityType<S>[]) {
    this.dataQuery.__store__.set(value);
  }

  get filteredData(): getEntityType<S>[] {
    return this.akitaFiltersPlugIn.getAllByFilters() as getEntityType<S>[];
  }

  set filteredData(value: getEntityType<S>[]) {
    this.data = value;
  }

  sortData: any;

  /**
   * Data source to use an Akita EntityStore with a Material table
   * @see : https://material.angular.io/components/table/overview
   *
   * @param query string : [Mandatory] the akita Query Entity, you wan to use to this data source.
   * @param akitaFilters string [Optional] If you want to provide an AkitaFilters that you use externally. Else it will create a new one.
   * @param dataSourceOptions [Optional] If you want to specify some options for user
   */
  constructor(query: QueryEntity<S, getEntityType<S>, getIDType<S>>,
              akitaFilters: AkitaFiltersPlugin<S>,
              dataSourceOptions: DataSourceWithServerOptions = {}) {
    super();
    this.dataSourceOptions = {
      searchFilterId: 'search',
      serverPagination: false,
      pageIndexId: 'page',
      pageIndexName: 'Page',
      pageIndexDisplay: false,
      pageSizeId: 'size',
      pageSizeName: 'Size',
      pageSizeDisplay: false,
      debounceTimeBetweenTwoChanges: 60,
      resetPageIndexOnFiltersChange: true,
      ...dataSourceOptions
    };
    this.dataQuery = query;

    this._filters = akitaFilters ? akitaFilters : new AkitaFiltersPlugin<S>(query);
    this.hasCustomAkitaFiltersPlugins = !!akitaFilters;
    this.count$ = new BehaviorSubject(0);

    this.previousFilters = [];

    this.onFiltersChanges$ = this._filters.filtersQuery.selectAll({
      sortBy: 'order',
      filterBy: filterConfig => filterConfig.id !== this.options.pageIndexId && filterConfig.id !== this.options.pageSizeId
    }).pipe(
      filter((current) => !compareFiltersArray<S>(this.previousFilters, current)),
      tap((data: Array<AkitaFilterBase<S> | AkitaFilterLocal<S> | AkitaFilterServer<S>>) => this.previousFilters = data),
    );
    this._updateChangeSubscription();
  }

  get filter(): string {
    return this.search;
  }

  /**
   * @param searchQuery the string use to search
   */
  set filter(searchQuery: string) {
    this.search = searchQuery;
  }

  get search(): string {
    let filterValue = '';

    if (this.dataSourceOptions.searchFilterId) {
      filterValue = this._filters.getFilterValue<string>(this.dataSourceOptions.searchFilterId);
    }

    return filterValue;
  }

  /**
   * filter all the list by a search term.
   *
   * use like a property :
   * akitaMatDataSourceInstance.search = 'term';
   * @param searchQuery the string use to search
   */
  set search(searchQuery: string) {
    if ((searchQuery === '' || !searchQuery) && this.dataSourceOptions.searchFilterId) {
      this._filters.removeFilters([this.dataSourceOptions.searchFilterId]);
    } else {
      this._filters.setFilter({
        predicate(entity: E, index: number, array: E[] | HashMap<E>, filterValue: AkitaFilterBase<S> | AkitaFilterLocal<S>): boolean {
          return false;
        }, server: true, id: this.dataSourceOptions.searchFilterId, value: searchQuery, name: searchQuery
      });
    }
  }

  /**
   * @deprecated use get akitaFiltersPlugin
   */
  get AkitaFilters(): AkitaFiltersPlugin<S> {
    return this._filters;
  }

  /**
   * Access to AkitaFiltersPlugins, usefull to interact with all filters
   */
  get akitaFiltersPlugIn(): AkitaFiltersPlugin<S> {
    return this._filters;
  }

  /**
   * Instance of the MatPaginator component used by the table to control what page of the data is
   * displayed. Page changes emitted by the MatPaginator will trigger an update to the
   * table's rendered data.
   *
   * Note that the data source uses the paginator's properties to calculate which page of data
   * should be displayed. If the paginator receives its properties as template inputs,
   * e.g. `[pageLength]=100` or `[pageIndex]=1`, then be sure that the paginator's view has been
   * initialized before assigning it to this data source.
   *
   * Important : Must be a MatPaginator, the type any added was to evit a bug with typescript
   * where MatSort was different in external project.
   */
  get paginator(): MatPaginator | any {
    return this._paginator;
  }

  set paginator(paginator: MatPaginator | any) {
    this._paginator = paginator;
    this.updateSubscriptions();
  }

  /**
   * Instance of the MatSort component used by the table to sort data
   */
  get sort(): MatSort {
    return this.sortValue ? this.sortValue : null;
  }

  /**
   * Instance of the MatSort directive used by the table to control its sorting. Sort changes
   * emitted by the MatSort will trigger an update to the table's rendered data.
   *
   * Important : Must be a MatSort, the type any added was to avoid a bug with typescript where MatSort was different in external project.
   */
  set sort(sort: MatSort) {
    if (sort) {
      this.sortValue = sort;
      sort.sortChange.pipe(takeUntil(this.disconnectSubject)).subscribe((sortValue: Sort) => {
        this._setSortBy(sortValue);
      });

      sort.initialized.subscribe(() => {
        this.setDefaultSort(sort.active as keyof E, sort.direction === 'desc' ? Order.DESC : Order.ASC);
      });
    }
  }

  get server(): boolean {
    return this.akitaFiltersPlugIn.server;
  }

  set server(value: boolean) {
    this.akitaFiltersPlugIn.server = value;
  }

  /**
   * set and get total for paginator, when use in server pagination
   */
  get total(): number {
    return this.paginator?.length;
  }

  set total(value: number) {
    if (this.paginator) {
      this.paginator.length = value;
    }
  }

  get options(): DataSourceWithServerOptions {
    return this.dataSourceOptions;
  }

  set options(dataSourceOptions: DataSourceWithServerOptions) {
    this.dataSourceOptions = {
      ...this.dataSourceOptions,
      ...dataSourceOptions
    };
    this.updateSubscriptions();
  }

  /**
   * subscribe to be noticed when a filters has changed (and with server pagination, will exclude pagination filters).
   */
  public onFiltersChanges$: Observable<Array<AkitaFilterBase<S> | AkitaFilterLocal<S> | AkitaFilterServer<S>>>;
  private dataQuery: QueryEntity<S, getEntityType<S>, getIDType<S>>;
  private _filters: AkitaFiltersPlugin<S>;
  /*
   * if set a custom filter plugins, do not delete all in disconnect()
   */
  private hasCustomAkitaFiltersPlugins: boolean;
  private selectAllByFilter$: Observable<E[]> | undefined;
  private count$: BehaviorSubject<number>;
  /** Used to react to internal changes of the paginator that are made by the data source itself. */
  private readonly _internalPageChanges = new Subject<void>();
  /** Stream emitting render data to the table (depends on ordered data changes). */
  private readonly _renderData = new BehaviorSubject<E[]>([]);
  /** Used to react to internal changes of the paginator that are made by the data source itself. */
  private readonly disconnectSubject = new Subject<void>();
  private dataSourceOptions: DataSourceWithServerOptions;
  /**
   * Subscription to the changes that should trigger an update to the table's rendered rows, such
   * as filtering, sorting, pagination, or base data changes.
   */
  private _renderChangesSubscription = Subscription.EMPTY;
  private serverPaginationSubscription: Subscription = Subscription.EMPTY;
  private previousFilters: Array<AkitaFilterBase<S> | AkitaFilterLocal<S> | AkitaFilterServer<S>>;
  private _paginator: MatPaginator | any = null;
  private sortValue: MatSort | any = null;

  private _setSortBy(sortValue: Sort): void {
    const sortByOrder = sortValue.direction === 'desc' ? Order.DESC : Order.ASC;
    if (this.server && this.akitaFiltersPlugIn?.withServerOptionValues?.withSort) {
      this._filters.setSortBy({
        sortBy: this.sort.active,
        sortByOrder
      });
    } else {
      this._filters.setSortBy({
        sortBy: (a, b, list) => this.sortFunction(a, b, this.sort),
        sortByOrder
      });
    }
  }

  /**
   * Checks if a data object matches the data source's filter string. By default, each data object
   * is converted to a string of its properties and returns true if the filter has
   * at least one occurrence in that string. By default, the filter string has its whitespace
   * trimmed and the match is case-insensitive. May be overridden for a custom implementation of
   * filter matching.
   * @param data Data object used to check against the filter.
   * @param filter Filter string that has been set on the data source.
   * @returns Whether the filter matches against the data
   */

  withOptions(dataSourceOptions: DataSourceWithServerOptions): this {
    this.options = dataSourceOptions;
    return this;
  }

  /**
   *  Add support of filters from server. Provide a function that will be call each time a filter changes
   *
   *  new AkitaFilterPlugins(query).withServer((filters) => {
   *      return this.api.getData(filters);
   *  });
   *
   *  Return false to not add in store. if you want to manage the store in your own.
   */
  public withServer(
    onChangeFilter: (filtersNormalized: string | HashMap<any>) => any | boolean,
    options: WithServerOptions = {}): AkitaMatDataSource<S, E> {
    options = {...options};

    this.server = true;
    this._filters = this._filters.withServer(onChangeFilter, options);

    return this;
  }

  public hasServer(): boolean {
    return this._filters.hasServer();
  }

  /**
   *  add a filter to filters plugins
   */
  addFilter(akitaFilter: Partial<AkitaFilterBase<S> | AkitaFilterLocal<S> | AkitaFilterServer<S>>): void {
    this._filters.setFilter(akitaFilter);
  }

  /**
   *  add or update a filter to filters plugins
   */
  setFilter(akitaFilter: Partial<AkitaFilterBase<S> | AkitaFilterLocal<S> | AkitaFilterServer<S>>): void {
    this._filters.setFilter(akitaFilter);
  }

  /**
   *  add or update multiple filter to filters plugins
   */
  setFilters(filters: Array<Partial<AkitaFilterBase<S> | AkitaFilterLocal<S> | AkitaFilterServer<S>>>): void {
    this._filters.setFilters(filters);
  }

  /**
   * Remove a Filter
   */
  removeFilters(ids: number[] | string[]): void {
    this._filters.removeFilters(ids);
  }

  removeFilterDirectly(id: number | string): void {
    this._filters.removeFilters([id]);
  }

  /**
   * Clear all filters
   */
  clearFilters(): void {
    this._filters.clearFilters();
  }

  /**
   * Get filter value, return null, if value not available
   */
  getFilterValue<V = E>(id: string): string {
    return this._filters.getFilterValue(id);
  }

  /**
   * Set the default sort
   * @param sortColumn the colum name present in your object
   * @param direction string the direction for sorting (asc or desc). Default asc.
   */
  public setDefaultSort(sortColumn: keyof E, direction: 'asc' | 'desc' = 'asc'): void {
    this._filters.setSortBy({
      sortBy: sortColumn,
      sortByOrder: direction === 'desc' ? Order.DESC : Order.ASC
    });
  }

  /**
   * Select Count filtered results.
   */
  selectCount(): Observable<number> {
    return this.count$;
  }

  /**
   * Select Count filtered results.
   */
  getCount(): number {
    return this.count$.getValue();
  }

  /**
   * Function used by matTable to subscribe to the data
   */
  connect(): Observable<E[]> {
    return this._renderData.asObservable();
  }

  /**
   * Used by the MatTable. Called when it is destroyed. No-op.
   * @docs-private
   */
  disconnect(): void {
    if (!this.hasCustomAkitaFiltersPlugins) {
      this._filters.clearFilters();
      this._filters.destroy();
    }
    this._renderChangesSubscription?.unsubscribe();
    this.serverPaginationSubscription?.unsubscribe();
    this.disconnectSubject.next();
    this.disconnectSubject.complete();
  }

  private updateSubscriptions(): void {
    if (this.server && this.dataSourceOptions.serverPagination) {
      this._subscribeServerPagination(this._paginator);
    }
    this._updateChangeSubscription();
  }

  /**
   * Subscribe to changes that should trigger an update to the table's rendered rows. When the
   * changes occur, process the current state of the filter, sort, and pagination along with
   * the provided base data and send it to the table for rendering.
   */
  private _updateChangeSubscription(): void {
    // @ts-ignore ignore, as without options, we will always have an Array.
    this.selectAllByFilter$ = this._filters.selectAllByFilters();
    let subscription;

    if (this.paginator && !this.dataSourceOptions.serverPagination) {
      // Sorting and/or pagination should be watched if MatSort and/or MatPaginator are provided.
      // The events should emit whenever the component emits a change or initializes, or if no
      // component is provided, a stream with just a null event should be provided.
      // The `sortChange` and `pageChange` acts as a signal to the combineLatests below so that the
      // pipeline can progress to the next step. Note that the value from these streams are not used,
      // they purely act as a signal to progress in the pipeline.
      const pageChange: Observable<PageEvent | null | void> = merge(
        this.paginator.page,
        this._internalPageChanges,
        this.paginator.initialized
      ) as Observable<PageEvent | void>;

      subscription = combineLatest([this.selectAllByFilter$, pageChange])
        .pipe(map((data) => {
          if (data) {
            this._pageData(data);
          }
        }));
    }

    if (this.dataSourceOptions.debounceTimeBetweenTwoChanges && subscription) {
      subscription.pipe(
        takeUntil(this.disconnectSubject),
        debounceTime(this.dataSourceOptions.debounceTimeBetweenTwoChanges)
      );
    }
  }

  /**
   * Updates the paginator to reflect the length of the filtered data, and makes sure that the page
   * index does not exceed the paginator's last page. Values are changed in a resolved promise to
   * guard against making property changes within a round of change detection.
   */
  private _updatePaginator(filteredDataLength: number): void {
    Promise.resolve().then(() => {
      const paginator = this.paginator;

      if (!paginator) {
        return;
      }

      paginator.length = filteredDataLength;

      // If the page index is set beyond the page, reduce it to the last page.
      if (paginator.pageIndex > 0) {
        const lastPageIndex = Math.ceil(paginator.length / paginator.pageSize) - 1 || 0;
        const newPageIndex = Math.min(paginator.pageIndex, lastPageIndex);

        if (newPageIndex !== paginator.pageIndex) {
          paginator.pageIndex = newPageIndex;

          // Since the paginator only emits after user-generated changes,
          // we need our own stream so we know to should re-render the data.
          this._internalPageChanges.next();
        }
      }
    });
  }

  private _subscribeServerPagination(paginator: any): void {
    const {
      pageSizeName,
      pageSizeDisplay,
      pageIndexId,
      serverPagination,
      pageIndexDisplay,
      pageSizeId,
      pageIndexName,
      debounceTimeBetweenTwoChanges,
      resetPageIndexOnFiltersChange
    } = this.dataSourceOptions;

    if (paginator && serverPagination) {
      const paginatedData = merge(
        this.paginator.page,
        this._internalPageChanges,
        this.paginator.initialized);
      // Watched for paged data changes and create filters informations.
      this.serverPaginationSubscription.unsubscribe();
      this.serverPaginationSubscription = paginatedData.pipe(takeUntil(this.disconnectSubject))
        .subscribe(() => {
          // noinspection TypeScriptValidateTypes
          this.setFilters([{
            id: pageIndexId,
            value: this.paginator.pageIndex,
            hide: !pageIndexDisplay,
            name: `${pageIndexName}: ${this.paginator.pageIndex}`,
            server: true
          }, {
            id: pageSizeId,
            value: this.paginator.pageSize,
            hide: !pageSizeDisplay,
            name: `${pageSizeName}: ${this.paginator.pageSize}`,
            server: true
          }]);
        });
      this._internalPageChanges.next();
    } else {
      if (pageIndexId && pageSizeId) {
        this.removeFilters([pageIndexId, pageSizeId]);
        this.serverPaginationSubscription.unsubscribe();
      }
    }

    if (resetPageIndexOnFiltersChange) {
      this.onFiltersChanges$.subscribe((data) => {
        if (this.paginator.pageIndex > 0 && data?.length > 0) {
          this.paginator.firstPage();
        }
      });
    }
  }

  private _updateCount(value: [(Observable<E[]> | Observable<void | PageEvent | null> | undefined)]): void {
    const count = value.length ? value.length : 0;
    if (count !== this.count$.getValue()) {
      this.count$.next(count);

      if (this.paginator && !this.dataSourceOptions.serverPagination) {
        this._updatePaginator(count);
      }
    }
  }

  /**
   * Paginate the data (client-side). If you're using server-side pagination,
   * this would be replaced by requesting the appropriate data from the server.
   */
  private _pageData(data: [(Observable<E[]> | Observable<void | PageEvent | null> | undefined)]):
    [(Observable<E[]> | Observable<void | PageEvent | null> | undefined)] | string {
    this._updateCount(data);
    return data;
  }

  sortFunction: ((a: E, b: E, sort: MatSort) => 0 | 1 | -1) = (a, b, sort): 0 | 1 | -1 => {
    let varA = this.sortingDataAccessor(a, sort.active);
    let varB = this.sortingDataAccessor(b, sort.active);

    if (!varA || !varB) {
      return 0;
    }

    varA = typeof varA === 'string' ? varA.toUpperCase() : varA;
    varB = typeof varB === 'string' ? varB.toUpperCase() : varB;

    let comparison: 0 | 1 | -1 = 0;
    if (varA > varB) {
      comparison = 1;
    } else if (varA < varB) {
      comparison = -1;
    }
    return sort.direction === 'desc' ? comparison * -1 as 0 | 1 | -1 : comparison;
  };

  /**
   * Data accessor function that is used for accessing data properties for sorting through
   * the default sortFunction.
   * This default function assumes that the sort header IDs (which defaults to the column name)
   * matches the data's properties (e.g. column Xyz represents data['Xyz']).
   * May be set to a custom function for different behavior.
   * @param data Data object that is being accessed.
   * @param sortHeaderId The name of the column that represents the data.
   */
  sortingDataAccessor: ((data: E, sortHeaderId: string) => string | number) =
    (data: E, sortHeaderId: string): string | number => {
      const value = (data as { [key: string]: any })[sortHeaderId];

      if (_isNumberValue(value)) {
        const numberValue = Number(value);

        // Numbers beyond `MAX_SAFE_INTEGER` can't be compared reliably so we
        // leave them as strings. For more info: https://goo.gl/y5vbSg
        return numberValue < MAX_SAFE_INTEGER ? numberValue : value;
      }

      return value;
    };

  refresh(): number {
    return this.akitaFiltersPlugIn.refresh();
  }

  filterPredicate(data: E, filterValue: string): boolean {
    return false;
  }
}
