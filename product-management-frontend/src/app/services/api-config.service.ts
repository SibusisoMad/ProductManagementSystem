import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiConfigService {
  private readonly baseUrl = environment.apiUrl;
  private readonly endpoints = environment.endpoints;

  getApiUrl(endpoint: keyof typeof environment.endpoints): string {
    return `${this.baseUrl}${this.endpoints[endpoint]}`;
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  getProductsUrl(): string {
    return this.getApiUrl('products');
  }

  getCategoriesUrl(): string {
    return this.getApiUrl('categories');
  }

  getUrlWithParams(endpoint: keyof typeof environment.endpoints, ...params: (string | number)[]): string {
    const baseUrl = this.getApiUrl(endpoint);
    return params.length > 0 ? `${baseUrl}/${params.join('/')}` : baseUrl;
  }

  isProduction(): boolean {
    return environment.production;
  }

  getAppConfig() {
    return environment.appConfig;
  }

  isLoggingEnabled(): boolean {
    return environment.appConfig.enableLogging;
  }
}