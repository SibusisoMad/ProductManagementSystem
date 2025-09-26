import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { 
  Category, 
  CategoryDto, 
  CategoryTreeNode, 
  CreateCategoryRequest, 
  UpdateCategoryRequest 
} from '../models/category.model';
import { ApiError } from '../models/api.model';
import { ApiConfigService } from './api-config.service';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfigService);
  private readonly baseUrl = 'http://localhost:5263/api/categories';
  
  private categoriesSubject = new BehaviorSubject<Category[]>([]);
  private categoryTreeSubject = new BehaviorSubject<CategoryTreeNode[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);

  public categories$ = this.categoriesSubject.asObservable();
  public categoryTree$ = this.categoryTreeSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();
  public error$ = this.errorSubject.asObservable();

  /**
   * Get all categories as flat list
   */
  getCategories(): Observable<Category[]> {
    this.setLoading(true);
    this.clearError();

    return this.http.get<Category[]>(this.baseUrl).pipe(
      tap((categories: Category[]) => {
        this.categoriesSubject.next(categories);
        this.setLoading(false);
      }),
      catchError((error: any) => this.handleError(error))
    );
  }

  /**
   * Get categories as hierarchical tree structure
   */
  getCategoryTree(): Observable<CategoryTreeNode[]> {
    this.setLoading(true);
    this.clearError();

    return this.http.get<CategoryTreeNode[]>(`${this.baseUrl}/tree`).pipe(
      tap((tree: CategoryTreeNode[]) => {
        this.categoryTreeSubject.next(tree);
        this.setLoading(false);
      }),
      catchError((error: any) => this.handleError(error))
    );
  }

  /**
   * Get category by ID
   */
  getCategory(id: number): Observable<Category> {
    this.setLoading(true);
    this.clearError();

    return this.http.get<Category>(`${this.baseUrl}/${id}`).pipe(
      tap(() => this.setLoading(false)),
      catchError((error: any) => this.handleError(error))
    );
  }

  /**
   * Create new category
   */
  createCategory(category: CreateCategoryRequest): Observable<Category> {
    this.setLoading(true);
    this.clearError();

    return this.http.post<Category>(this.baseUrl, category).pipe(
      tap((newCategory: Category) => {
        const currentCategories = this.categoriesSubject.value;
        this.categoriesSubject.next([...currentCategories, newCategory]);
        this.setLoading(false);
        // Refresh tree structure
        this.getCategoryTree().subscribe();
      }),
      catchError((error: any) => this.handleError(error))
    );
  }

  /**
   * Update existing category
   */
  updateCategory(id: number, category: UpdateCategoryRequest): Observable<Category> {
    this.setLoading(true);
    this.clearError();

    return this.http.put<Category>(`${this.baseUrl}/${id}`, category).pipe(
      tap((updatedCategory: Category) => {
        const currentCategories = this.categoriesSubject.value;
        const index = currentCategories.findIndex((c: Category) => c.id === id);
        if (index !== -1) {
          const updated = [...currentCategories];
          updated[index] = updatedCategory;
          this.categoriesSubject.next(updated);
        }
        this.setLoading(false);
        // Refresh tree structure
        this.getCategoryTree().subscribe();
      }),
      catchError((error: any) => this.handleError(error))
    );
  }

  /**
   * Delete category
   */
  deleteCategory(id: number): Observable<void> {
    this.setLoading(true);
    this.clearError();

    return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(
      tap(() => {
        const currentCategories = this.categoriesSubject.value;
        this.categoriesSubject.next(currentCategories.filter((c: Category) => c.id !== id));
        this.setLoading(false);
        // Refresh tree structure
        this.getCategoryTree().subscribe();
      }),
      catchError((error: any) => this.handleError(error))
    );
  }

  /**
   * Get root categories (categories without parent)
   */
  getRootCategories(): Observable<Category[]> {
    return this.getCategories().pipe(
      tap(() => {}),
      catchError((error: any) => this.handleError(error))
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