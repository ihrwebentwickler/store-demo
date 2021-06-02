import { HttpHeaders, HttpParams } from '@angular/common/http';

export interface IRestApi {
  endpoint: string;
  requestOptions?: IRequestOptions;
  delayTime?: number;
  data?: any;
}

export interface IRequestOptions {
  headers?: HttpHeaders | {
    [header: string]: string | string[];
  };
  observe?: 'body';
  params?: HttpParams | {
    [param: string]: string | string[];
  };
  reportProgress?: boolean;
  responseType?: 'json';
  withCredentials?: boolean;
}

export interface IRestCalculatedConfiguration {
  calculatedValues: {
    fullUrl: string;
    delayTime: number;
    requestOptions: IRequestOptions | {};
  };
  errorMessage: string;
  isError: boolean;
}
