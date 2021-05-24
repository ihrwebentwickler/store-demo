import {AkitaFiltersStore, FiltersState} from './akita-filters-store';
import {AkitaFiltersQuery} from './akita-filters-query';
import {BehaviorSubject, combineLatest, isObservable, Observable, ObservedValueOf, of, Subject, Subscription} from 'rxjs';
import {distinctUntilChanged, map} from 'rxjs/operators';
import {
  compareValues,
  EntityCollectionPlugin,
  EntityState,
  EntityStore,
  getEntityType,
  getIDType,
  HashMap,
  ID,
  isFunction,
  isUndefined,
  OrArray,
  QueryEntity,
  SelectAllOptionsA,
  SelectAllOptionsB,
  SelectAllOptionsC,
  SelectAllOptionsD,
  SelectAllOptionsE,
  SortByOptions
} from '@datorama/akita';
import {AkitaFilter, AkitaFilterBase, AkitaFilterLocal, AkitaFilterServer, createFilter} from './akita-filters.model';

export interface FiltersParams<S extends EntityState> {
  filtersStoreName?: string;
  entityIds?: OrArray<getIDType<S>>;
  filtersStore?: AkitaFiltersStore<S>;
  filtersQuery?: AkitaFiltersQuery<S>;
  [key: string]: any;
}

export interface NormalizedFilterOptions {
  withSort?: boolean;
  asQueryParams?: boolean;
  sortByKey?: string;
  sortByOrderKey?: string;
}

export interface WithServerOptions extends NormalizedFilterOptions {
  [key: string]: any;
}

export class AkitaFiltersPlugin<S extends EntityState, E = getEntityType<S>, I = OrArray<getIDType<S>>, P = any>
  extends EntityCollectionPlugin<S, P> {
  get withServerOptionValues(): WithServerOptions {
    return this.withServerOptionValues;
  }

  set withServerOptionValues(value: WithServerOptions) {
    this.withServerOptionValues = value;
  }

  private readonly filterStore: AkitaFiltersStore<S>;
  private readonly filterQuery: AkitaFiltersQuery<S>;
  private readonly refresh$: BehaviorSubject<number> = new BehaviorSubject<number>(0);
  private isServer = false;
  private params: FiltersParams<EntityState<any, any>>;

  private selectFilters$: Observable<Array<AkitaFilterBase<S>>>;
  private readonly selectSortBy$: Observable<SortByOptions<E> | null>;
  private readonly selectFiltersAll$: Observable<Array<AkitaFilterBase<S>>>;
  private onChangeFilter!: ((filtersNormalized: (string | HashMap<any>)) => any | boolean | Observable<Array<getEntityType<S>>>);
  private lastServerSubscription: Subscription | undefined;
  constructor(protected query: QueryEntity<S>, private paramsInput: FiltersParams<S> = {}) {
    // @ts-ignore
    super(query, paramsInput.entityIds);
    this.params = {...{filtersStoreName: this.getStore().storeName + 'Filters'}, ...paramsInput};

    this.filterStore = (this.params.filtersStore) ? this.params.filtersStore : new AkitaFiltersStore<S>(this.params.filtersStoreName);
    this.filterQuery = (this.params.filtersQuery) ? this.params.filtersQuery : new AkitaFiltersQuery<S>(this.filterStore);

    this.selectFilters$ = this.filtersQuery.selectAll({sortBy: 'order'});
    this.selectFiltersAll$ = this.filtersQuery.selectAll({sortBy: 'order', filterBy: filter => !filter?.hide});
    this.selectSortBy$ = this.filtersQuery.select(state => state?.sort);
  }

  get filtersStore(): AkitaFiltersStore<S> {
    return this.filterStore;
  }

  get filtersQuery(): AkitaFiltersQuery<S> {
    return this.filterQuery;
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
  withServer(
    onChangeFilter: (filtersNormalized: string | HashMap<any>) => any | boolean,
    options: WithServerOptions = {}): AkitaFiltersPlugin<S, E, I, P> {
    options = {...options};

    this.server = true;
    this.withServerOptionValues = options;
    this.onChangeFilter = onChangeFilter;

    // Change default select filters to remove server filters, if you use selectAllByFilters();
    this.selectFilters$ = this.filterQuery.selectAll({sortBy: 'order', filterBy: filter => !(filter as AkitaFilterServer<S>)?.server});

    const listObservable: Array<Observable<any>> = [];
    listObservable.push(this.filterQuery.selectAll({sortBy: 'order', filterBy: filter =>
        (filter as AkitaFilterServer<S>)?.server === true})
      .pipe(distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b))));


    if (this.withServerOptionValues.withSort) {
      listObservable.push(this.selectSortBy() ?? of(null));
    }
    listObservable.push(this.refresh$);

    combineLatest<Observable<Array<getEntityType<S>>> | Observable<SortByOptions<E> | null>> (listObservable)
      .pipe(map((data) => {
      return this.getNormalizedFilters(this.withServerOptionValues);
    })).subscribe((normalizerFilters) => {
      let returnOnChange: boolean | Observable<Array<getEntityType<S>>> = false;

      if (normalizerFilters) {
        returnOnChange  = this.onChangeFilter(normalizerFilters);
      }

      if (returnOnChange && isObservable(returnOnChange)) {
        if (this.lastServerSubscription) { this.lastServerSubscription.unsubscribe(); }
        this.lastServerSubscription = returnOnChange.subscribe((newValue: Array<getEntityType<S>>) => {
          this.getStore().set(newValue);
        });
      }
    });

    return this;
  }

  get server(): boolean {
    return this.isServer;
  }

  set server(value: boolean) {
    this.isServer = value;
  }

  /*
  * Return true, if server is configured
  */
  hasServer(): boolean {
    return this.server;
  }

  /**
   *  Select all filters
   *
   *  Note: Only all filters not hide (with hide=true), will not be displayed. If you want it, call directly to:
   * `this.filtersQuery.selectAll()`
   *
   *
   */
  selectFilters(): Observable<Array<AkitaFilterBase<S>>> {
    return this.selectFiltersAll$;
  }

  /**
   * Get all the current snapshot filters
   *
   *  Note: filters with hide=true, will not be displayed. If you want it, call directly to:
   * `this.filtersQuery.getAll()`
   */
  getFilters(): Array<AkitaFilterBase<S>> {
    return this.filterQuery.getAll({filterBy: filter => !filter.hide});
  }

  /**
   * Get all the current snapshot server filters (only if server is available else return default not hidden filters)
   *
   *  Note: filters with server=false, will not be displayed. If you want it, call directly to:
   * `this.filtersQuery.getAll()`
   */
  getServerFilters(): Array<AkitaFilterServer<S>> {
    return this.server ?
      this.filterQuery.getAll({filterBy: filter => (filter as AkitaFilterServer<S>)?.server})  as Array<AkitaFilterServer<S>>
      : this.getFilters() as Array<AkitaFilterServer<S>>;
  }

  /**
   * Select All Entity with apply filter to it, and updated with any change (entity or filter)
   * Will not apply sort, if need return   asObject:true !
   */
  selectAllByFilters(options?: SelectAllOptionsA<E>
    | SelectAllOptionsB<E> | SelectAllOptionsC<E> |
    SelectAllOptionsD<E> | SelectAllOptionsE<E> | any): Observable<Array<getEntityType<S>> | HashMap<getEntityType<S>>> {
    const listObservable: Array<Observable<any>> = [];
    listObservable.push(this.selectFilters$, this.getQuery().selectAll(options), this.refresh$);

    if (options && options.asObject) {
      return combineLatest(listObservable).pipe(
        map((values) => {
          const [filters, entities, refresh] = values;
          const unkNowEntity: unknown = entities;
          return this._applyFiltersForHashMap((unkNowEntity as HashMap<getEntityType<S>>), filters);
        }),
      );
    } else {
      let sortBy = this.selectSortBy();
      if (this.server && this.withServerOptionValues?.withSort) {
        sortBy = sortBy.pipe(map(data => null));
      }
      listObservable.push(sortBy);

      return combineLatest(listObservable).pipe(
        map((values) => {
          const [filters, entities, refresh, sort ] = values;
          const unkNowEntity: unknown = entities;
          return this._applyFiltersForArray((unkNowEntity as Array<getEntityType<S>>), filters, sort);
        }),
      );
    }
  }

  /**
   * Get All Entity with apply filter to it, and updated with any change (entity or filter)
   * Will not apply sort, if need return   asObject:true !
   */
  getAllByFilters(options?: SelectAllOptionsA<E>
    | SelectAllOptionsB<E> | SelectAllOptionsC<E> |
    SelectAllOptionsD<E> | SelectAllOptionsE<E> | any): getEntityType<S>[] | HashMap<getEntityType<S>> | null {
    const filters = this.filtersQuery.getAll();
    const unkNowEntity: unknown = this.getQuery().getAll(options);

    if (options && options.asObject) {
      return this._applyFiltersForHashMap((unkNowEntity as HashMap<getEntityType<S>>), filters);
    } else {
      const sort = this.getSortBy();
      return this._applyFiltersForArray((unkNowEntity as getEntityType<S>[]), filters, sort);
    }
  }

  public getSortBy(): SortByOptions<E> | null {
    const state = this.filtersQuery.getValue();
    return state && state.sort ? state.sort : null;
  }

  /**
   * Create or update a filter
   */
  setFilter(filter: Partial<AkitaFilterBase<S> | AkitaFilterLocal<S> | AkitaFilterServer<S> | AkitaFilter<S>>): void {
    filter = this.updateServerIfNeeded(filter);
    const entity = createFilter(filter as AkitaFilterBase<S>);
    this.filtersStore.upsert(entity.id, entity);
  }

  private updateServerIfNeeded(filter: Partial<AkitaFilterBase<S>>): Partial<AkitaFilterBase<S>> {
    if (this.server && isUndefined((filter as AkitaFilterServer<S>)?.server)) {
      (filter as AkitaFilterServer<S>).server = true;
    }

    return filter;
  }

  /**
   * Create or update multiples filters
   */
  setFilters(filters: Array<Partial<AkitaFilterBase<S> | AkitaFilterLocal<S> | AkitaFilterServer<S> | AkitaFilter<S>>>): void {
    if (!filters) { return; }
    const entities = filters.map((filter => {
      filter = this.updateServerIfNeeded(filter);
      return createFilter(filter);
    }));

    this.filtersStore.upsertMany(entities);
  }

  /**
   * Remove a Filter
   */
  removeFilters(ids: ID[]): void {
    this.filtersStore.remove(ids);
  }

  /**
   * Clear all filters
   */
  clearFilters(): void {
    this.filtersStore.remove();
  }

  /**
   * Get filter value, return empty String, if value not available
   */
  getFilterValue<T = any>(id: string): string {
    if (this.filtersQuery.hasEntity(id)) {
      const entity: AkitaFilterBase<S> | undefined = this.filtersQuery.getEntity(id);
      return entity && entity.value ? entity.value : null;
    }

    return '';
  }

  /**
   * Get filter value, return null, if value not available
   */
  getSortValue(): SortByOptions<E> | null {
    const state: FiltersState<S> = this.filtersQuery.getValue();
    return state.sort ? state.sort : null;
  }

  /**
   * Select Sort by value
   */
  selectSortBy(): Observable<SortByOptions<E> | null> {
    return this.selectSortBy$;
  }

  /**
   * Set orderBy
   */
  setSortBy(order: SortByOptions<E>): void {
    this.filtersStore.update({sort: order});
  }

  /**
   * Get the filters normalized as key value or as query params.
   * This can be useful for server-side filtering
   */
  getNormalizedFilters(options: NormalizedFilterOptions = {}): string | HashMap<any> {
    const result = {};
    options = {sortByKey: 'sortBy', sortByOrderKey: 'sortByOrder', ...options};

    for (const filter of this.getServerFilters()) {
      // @ts-ignore
      result[filter.id] = filter.value;
    }
    const sort = this.getSortValue();
    if (options.withSort && sort?.sortBy) {
      // @ts-ignore
      result[options.sortByKey] = sort?.sortBy;
      // @ts-ignore
      result[options.sortByOrderKey] = sort?.sortByOrder;
    }

    if (options.asQueryParams) {
      return this._serialize(result);
    }

    return result;
  }

  destroy(): void {
    this.clearFilters();
  }

  /** This method is responsible for getting access to the query. */
  getQuery(): QueryEntity<S> {
    return this.query;
  }

  /** This method is responsible for getting access to the store. */
  getStore(): EntityStore<S> {
    return this.getQuery().__store__;
  }

  /**
   * Trigger a refresh of the data. This will force the library to replay all filters.
   * Very useful for the withServer feature, because it allows to call back the with server callback function with the same parameters, to
   * make a new call to the api.
   */
  refresh(): number {
      const value = this.refresh$.getValue() + 1;
      this.refresh$.next(value);
      return value;
  }

  private _serialize(obj: any): string {
    return Object.keys(obj)
      .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(obj[k])}`)
      .join('&');
  }

  private _applyFiltersForArray(
    entities: Array<getEntityType<S>>,
    filters: Array<AkitaFilterBase<S>>,
    sort: ObservedValueOf<Observable<SortByOptions<E> | null>>): Array<getEntityType<S>> {
    let entitiesFiltered = entities;
    if (filters.length !== 0) {
      entitiesFiltered = entities.filter((entity: getEntityType<S>, index: number, array: Array<getEntityType<S>>) => {
        return filters.every((filter: AkitaFilterBase<S>) => {
          if (typeof (filter as AkitaFilterLocal<S>)?.predicate !== 'undefined') {
            return (filter as AkitaFilterLocal<S>).predicate(entity, index, array, filter);
          }
          return true;
        });
      });
    }
    const sortOptions = (sort as SortByOptions<E>);
    if (sortOptions?.sortBy) {
      const sortBy: any = isFunction(sortOptions.sortBy) ? sortOptions.sortBy : compareValues(sortOptions.sortBy, sortOptions.sortByOrder);
      entitiesFiltered = [...entitiesFiltered.sort((a, b) => sortBy(a, b, entities))];
    }
    return entitiesFiltered;
  }

  private _applyFiltersForHashMap(
    entities: HashMap<getEntityType<S>>,
    filters: Array<AkitaFilterBase<S>>): HashMap<getEntityType<S>> {
    if (filters.length === 0) {
      return entities;
    }
    const hashMapFiltered: HashMap<getEntityType<S>> = {};
    Object.keys(entities).forEach((entityKey: string, index: number) => {
        const entity: getEntityType<S> = entities[entityKey] as getEntityType<S>;
        if (this._applyFiltersForOneEntity(filters, entity, index, entities)) {
          hashMapFiltered[entityKey] = entity;
        }
      });

    return hashMapFiltered;
  }

  // tslint:disable-next-line:typedef
  private _applyFiltersForOneEntity(filters: Array<AkitaFilterBase<S>>,
                                    entity: getEntityType<S>, index: number,
                                    array: Array<getEntityType<S>> | HashMap<getEntityType<S>>) {
    return filters.every((filter: AkitaFilterBase<S>) => {
      // @ts-ignore
      if ((filter as AkitaFilterLocal<S>)?.predicate) {
        return (filter as AkitaFilterLocal<S>).predicate(entity, index, array, filter);
      }
      return true;
    });
  }

  protected instantiatePlugin(id: getIDType<S>): P {
    // @ts-ignore
    return null;
  }
}
