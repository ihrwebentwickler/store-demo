import { DataSource } from '@angular/cdk/collections';
import { EntityState, getEntityType } from '@datorama/akita';
import { BehaviorSubject, Observable } from 'rxjs';

export class AkitaMatDataSource<S extends EntityState = any, E = getEntityType<S>>
  extends DataSource<E> {
  private readonly _renderData = new BehaviorSubject<E[]>([]);

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

  }

}

