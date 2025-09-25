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

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'https://localhost:7189/api/products'; // Adjust to match your API port
  
  // State management using BehaviorSubject
  private productsSubject = new BehaviorSubject<Product[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);

  // Public observables
  public products$ = this.productsSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();
  public error$ = this.errorSubject.asObservable();

  /**
   * Get all products with optional search and filtering
   */
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
      tap(response => {
        this.productsSubject.next(response.products);
        this.setLoading(false);
      }),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Get product by ID
   */
  getProduct(id: number): Observable<Product> {
    this.setLoading(true);
    this.clearError();

    return this.http.get<Product>(`${this.baseUrl}/${id}`).pipe(
      tap(() => this.setLoading(false)),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Create new product
   */
  createProduct(product: CreateProductRequest): Observable<Product> {
    this.setLoading(true);
    this.clearError();

    return this.http.post<Product>(this.baseUrl, product).pipe(
      tap(newProduct => {
        const currentProducts = this.productsSubject.value;
        this.productsSubject.next([...currentProducts, newProduct]);
        this.setLoading(false);
      }),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Update existing product
   */
  updateProduct(id: number, product: UpdateProductRequest): Observable<Product> {
    this.setLoading(true);
    this.clearError();

    return this.http.put<Product>(`${this.baseUrl}/${id}`, product).pipe(
      tap(updatedProduct => {
        const currentProducts = this.productsSubject.value;
        const index = currentProducts.findIndex(p => p.id === id);
        if (index !== -1) {
          const updated = [...currentProducts];
          updated[index] = updatedProduct;
          this.productsSubject.next(updated);
        }
        this.setLoading(false);
      }),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Delete product
   */
  deleteProduct(id: number): Observable<void> {
    this.setLoading(true);
    this.clearError();

    return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(
      tap(() => {
        const currentProducts = this.productsSubject.value;
        this.productsSubject.next(currentProducts.filter(p => p.id !== id));
        this.setLoading(false);
      }),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Search products by name
   */
  searchProducts(searchTerm: string, categoryId?: number): Observable<Product[]> {
    const params: ProductSearchParams = { search: searchTerm };
    if (categoryId) params.categoryId = categoryId;

    return this.getProducts(params).pipe(
      map(response => response.products)
    );
  }

  /**
   * Clear current error state
   */
  clearError(): void {
    this.errorSubject.next(null);
  }

  /**
   * Set loading state
   */
  private setLoading(loading: boolean): void {
    this.loadingSubject.next(loading);
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    this.setLoading(false);
    
    let errorMessage = 'An error occurred while processing your request.';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Client Error: ${error.error.message}`;
    } else {
      // Server-side error
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

    this.errorSubject.next(errorMessage);
    return throwError(() => ({ message: errorMessage, statusCode: error.status } as ApiError));
  }
}