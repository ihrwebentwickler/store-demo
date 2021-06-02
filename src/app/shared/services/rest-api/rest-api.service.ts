import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, delay, map } from 'rxjs/operators';
import {
  IRestApi,
  IRestCalculatedConfiguration
} from '../../interfaces/rest.interface';
import { Observable, of, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class RestApiService {
  baseApiUrl = '';

  constructor(
    private readonly httpClient: HttpClient
  ) {
  }

  static handleHttpResponseError(operation: string, err: Error, fullRestUrl: string): Observable<[]> {
    let dataError: {};
    if (err instanceof HttpErrorResponse) {
      const errorMessage = err.error ? err.error : err.message;
      dataError = {
        statusMessage: `error in ${operation}() retrieving ${fullRestUrl}`,
        status: err.status,
        statusText: err.statusText.replace(/%2f/g, '/'),
        errorUrl: err.url,
        name: err.name,
        message: errorMessage,
        headers: err.headers,
      };
    } else {
      dataError = {
        statusMessage: `error in ${operation}() retrieving ${fullRestUrl}, the exact reason is unknown`
      };
    }

    console.log('a rest-error has occurred (Response-Error):');
    console.log(dataError);

    // TODO: f.e. implement eror-logging here
    throwError(err);
    return of([]);
  }

  private getCalculatedConfiguration(restData: IRestApi): IRestCalculatedConfiguration {
    const configuration = {
      calculatedValues: {
        fullUrl: 'unknown',
        delayTime: restData && restData.delayTime ? Number(restData.delayTime) : 0,
        requestOptions: restData && restData.requestOptions ? restData.requestOptions : {}
      },
      errorMessage: '',
      isError: false
    };

    if (!restData || !restData.endpoint) {
      configuration.errorMessage = 'An error has occurred: The correct Rest API (API-Url) endpoint was not specified.';
      configuration.isError = true;
    } else {
      configuration.calculatedValues.fullUrl = restData.endpoint.toLowerCase().indexOf('http') !== -1 ?
        restData.endpoint : this.baseApiUrl + restData.endpoint;
    }

    return configuration;
  }

  get<T>(restData: IRestApi): Observable<T[]> {
    const configuration: IRestCalculatedConfiguration = this.getCalculatedConfiguration(restData);

    return !configuration.isError ?
      this.httpClient.get<T[] | T>(configuration.calculatedValues.fullUrl, configuration.calculatedValues.requestOptions).pipe(
        delay(configuration.calculatedValues.delayTime)
      ).pipe(
        catchError(err => {
          return RestApiService.handleHttpResponseError(
            'get-method', err, configuration.calculatedValues.fullUrl
          );
        }))
        .pipe(
          map(data => {
            return !Array.isArray(data) ? [data] : data;
          })) : of([]);
  }

  post<T>(restData: IRestApi): Observable<T | T[]> {
    const configuration: IRestCalculatedConfiguration = this.getCalculatedConfiguration(restData);

    if (!restData || !restData.data) {
      configuration.errorMessage = 'An error has occurred: there is no request data available for the post-method';
      configuration.isError = true;
    }

    return !configuration.isError ?
      this.httpClient.post<T | T[]>(
        configuration.calculatedValues.fullUrl, restData.data, configuration.calculatedValues.requestOptions
      ).pipe(
        delay(configuration.calculatedValues.delayTime)
      ).pipe(
        catchError(err => {
          return RestApiService.handleHttpResponseError(
            'post-method', err, configuration.calculatedValues.fullUrl
          );
        })) : of([]);
  }

  put<T>(restData: IRestApi): Observable<T | T[]> {
    const configuration: IRestCalculatedConfiguration = this.getCalculatedConfiguration(restData);

    if (!restData || !restData.data) {
      configuration.errorMessage = 'An error has occurred: there is no request data available for the put-method';
      configuration.isError = true;
    }

    return !configuration.isError ?
      this.httpClient.put<T | T[]>(
        configuration.calculatedValues.fullUrl, restData.data, configuration.calculatedValues.requestOptions
      ).pipe(
        delay(configuration.calculatedValues.delayTime)
      ).pipe(
        catchError(err => {
          return RestApiService.handleHttpResponseError(
            'put-method', err, configuration.calculatedValues.fullUrl
          );
        })) : of([]);
  }

  delete<T>(restData: IRestApi): Observable<T | T[]> {
    const configuration: IRestCalculatedConfiguration = this.getCalculatedConfiguration(restData);

    return !configuration.isError ?
      this.httpClient.delete<T | T[]>(configuration.calculatedValues.fullUrl, configuration.calculatedValues.requestOptions).pipe(
        delay(configuration.calculatedValues.delayTime)
      ).pipe(
        catchError(err => {
          return RestApiService.handleHttpResponseError(
            'delete-method', err, configuration.calculatedValues.fullUrl
          );
        })) : of([]);
  }
}
