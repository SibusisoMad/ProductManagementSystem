import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { 
  Product, 
  ProductDto, 
  CreateProductRequest, 
  UpdateProductRequest, 
  ProductSearchParams, 
  ProductListResponse 
} from '../models/product.model';
import { ApiError } from '../models/api.model';
import { ApiConfigService } from './api-config.service';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfigService);
  private readonly baseUrl = 'http://localhost:5263/api/products';
  
  private productsSubject = new BehaviorSubject<Product[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);

  
  public products$ = this.productsSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();
  public error$ = this.errorSubject.asObservable();

  
  getProducts(params?: ProductSearchParams): Observable<ProductListResponse> {
    this.setLoading(true);
    this.clearError();

    let httpParams = new HttpParams();
    
    if (params) {
      if (params.search) httpParams = httpParams.set('search', params.search);
      if (params.categoryId) httpParams = httpParams.set('categoryId', params.categoryId.toString());
      if (params.page) httpParams = httpParams.set('page', params.page.toString());
      if (params.pageSize) httpParams = httpParams.set('pageSize', params.pageSize.toString());
    }

    return this.http.get<ProductListResponse>(this.baseUrl, { params: httpParams }).pipe(
      tap((response: ProductListResponse) => {
        console.log('ProductService: API Response:', response);
        console.log('ProductService: First product:', response.items[0]);
        this.productsSubject.next(response.items);
        this.setLoading(false);
      }),
      catchError((error: any) => this.handleError(error))
    );
  }

  getProduct(id: number): Observable<Product> {
    this.setLoading(true);
    this.clearError();

    const url = `http://localhost:5263/api/products/${id}`;
    return this.http.get<Product>(url).pipe(
      tap(() => this.setLoading(false)),
      catchError((error: any) => this.handleError(error))
    );
  }

  createProduct(product: CreateProductRequest): Observable<Product> {
    this.setLoading(true);
    this.clearError();

    return this.http.post<Product>(this.baseUrl, product).pipe(
      tap((newProduct: Product) => {
        const currentProducts = this.productsSubject.value;
        this.productsSubject.next([...currentProducts, newProduct]);
        this.setLoading(false);
      }),
      catchError((error: any) => this.handleError(error))
    );
  }

  updateProduct(id: number, product: UpdateProductRequest): Observable<Product> {
    this.setLoading(true);
    this.clearError();

    const url = `http://localhost:5263/api/products/${id}`;
    return this.http.put<Product>(url, product).pipe(
      tap((updatedProduct: Product) => {
        const currentProducts = this.productsSubject.value;
        const index = currentProducts.findIndex((p: Product) => p.id === id);
        if (index !== -1) {
          const updated = [...currentProducts];
          updated[index] = updatedProduct;
          this.productsSubject.next(updated);
        }
        this.setLoading(false);
      }),
      catchError((error: any) => this.handleError(error))
    );
  }

  deleteProduct(id: number): Observable<void> {
    this.setLoading(true);
    this.clearError();

    const url = `http://localhost:5263/api/products/${id}`;
    return this.http.delete<void>(url).pipe(
      tap(() => {
        const currentProducts = this.productsSubject.value;
        this.productsSubject.next(currentProducts.filter((p: Product) => p.id !== id));
        this.setLoading(false);
      }),
      catchError((error: any) => this.handleError(error))
    );
  }

  searchProducts(searchTerm: string, categoryId?: number): Observable<Product[]> {
    const params: ProductSearchParams = { search: searchTerm };
    if (categoryId) params.categoryId = categoryId;

    return this.getProducts(params).pipe(
      map((response: ProductListResponse) => response.items)
    );
  }

  clearError(): void {
    this.errorSubject.next(null);
  }

  private setLoading(loading: boolean): void {
    this.loadingSubject.next(loading);
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    this.setLoading(false);
    
    let errorMessage = 'An error occurred while processing your request.';
    
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Client Error: ${error.error.message}`;
    } else {
      if (error.status === 0) {
        errorMessage = 'Unable to connect to the server. Please check your connection.';
      } else if (error.status === 404) {
        errorMessage = 'The requested resource was not found.';
      } else if (error.status === 400) {
        errorMessage = error.error?.message || 'Bad request. Please check your input.';
      } else if (error.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      } else {
        errorMessage = `Server Error: ${error.status} - ${error.error?.message || error.message}`;
      }
    }

    if (this.apiConfig.isLoggingEnabled()) {
      console.error('ProductService Error:', error);
    }

    this.errorSubject.next(errorMessage);
    return throwError(() => ({ message: errorMessage, statusCode: error.status } as ApiError));
  }
}