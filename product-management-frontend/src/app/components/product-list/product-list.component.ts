import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged, combineLatest } from 'rxjs';

import { ProductService } from '../../services/product.service';
import { CategoryService } from '../../services/category.service';
import { Product } from '../../models/product.model';
import { Category } from '../../models/category.model';
import { SearchBarComponent } from '../search-bar/search-bar.component';
import { LoadingSpinnerComponent } from '../loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
    CommonModule, 
    RouterLink, 
    ReactiveFormsModule,
    SearchBarComponent,
    LoadingSpinnerComponent
  ],
  template: `
    <div class="product-list-container">
      <div class="header-section">
        <h2>Product Catalog</h2>
        <button 
          routerLink="/products/new" 
          class="btn btn-primary">
          Add New Product
        </button>
      </div>

      <div class="filters-section">
        <app-search-bar 
          (searchChange)="onSearchChange($event)"
          placeholder="Search products by name...">
        </app-search-bar>

        <div class="filter-group">
          <label for="categoryFilter">Filter by Category:</label>
          <select 
            id="categoryFilter"
            class="form-select"
            [formControl]="categoryFilter">
            <option value="">All Categories</option>
            <option 
              *ngFor="let category of categories$ | async" 
              [value]="category.id">
              {{category.name}}
            </option>
          </select>
        </div>
      </div>

      <app-loading-spinner *ngIf="loading$ | async"></app-loading-spinner>

      <div 
        *ngIf="error$ | async as error" 
        class="alert alert-error">
        {{error}}
        <button 
          class="btn btn-secondary" 
          (click)="clearError()">
          Dismiss
        </button>
      </div>

      <div 
        *ngIf="!(loading$ | async) && !(error$ | async)" 
        class="products-grid">
        
        <div 
          *ngIf="(products$ | async)?.length === 0" 
          class="empty-state">
          <p>No products found.</p>
          <button 
            routerLink="/products/new" 
            class="btn btn-primary">
            Create your first product
          </button>
        </div>

        <div 
          *ngFor="let product of products$ | async; trackBy: trackByProductId" 
          class="product-card">
          
          <div class="product-header">
            <h3>{{product.name}}</h3>
            <span class="product-sku">SKU: {{product.sku}}</span>
          </div>

          <div class="product-body">
            <p class="product-description">{{product.description}}</p>
            <div class="product-details">
              <span class="product-price">R {{product.price | number:'1.2-2'}}</span>
              <span 
                class="product-quantity"
                [class.low-stock]="product.quantity < 10">
                Stock: {{product.quantity}}
              </span>
            </div>
          </div>

          <div class="product-actions">
            <button 
              [routerLink]="['/products/edit', product.id]" 
              class="btn btn-outline">
              Edit
            </button>
            <button 
              (click)="confirmDelete(product)" 
              class="btn btn-danger">
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>

    <div 
      *ngIf="productToDelete" 
      class="modal-overlay" 
      (click)="cancelDelete()">
      <div class="modal" (click)="$event.stopPropagation()">
        <h3>Confirm Delete</h3>
        <p>Are you sure you want to delete "{{productToDelete.name}}"?</p>
        <div class="modal-actions">
          <button 
            class="btn btn-secondary" 
            (click)="cancelDelete()">
            Cancel
          </button>
          <button 
            class="btn btn-danger" 
            (click)="deleteProduct()">
            Delete
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .product-list-container {
      max-width: 1200px;
      margin: 0 auto;
    }

    .header-section {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }

    .header-section h2 {
      margin: 0;
      color: #2c3e50;
    }

    .filters-section {
      display: flex;
      gap: 1rem;
      margin-bottom: 2rem;
      flex-wrap: wrap;
      align-items: end;
    }

    .filter-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .filter-group label {
      font-weight: 500;
      color: #555;
    }

    .products-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
    }

    .product-card {
      background: white;
      border-radius: 8px;
      padding: 1.5rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .product-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    }

    .product-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1rem;
    }

    .product-header h3 {
      margin: 0;
      color: #2c3e50;
      flex: 1;
    }

    .product-sku {
      background: #ecf0f1;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.875rem;
      color: #7f8c8d;
    }

    .product-body {
      margin-bottom: 1rem;
    }

    .product-description {
      color: #666;
      margin-bottom: 1rem;
      line-height: 1.4;
    }

    .product-details {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .product-price {
      font-size: 1.25rem;
      font-weight: 600;
      color: #27ae60;
    }

    .product-quantity {
      padding: 0.25rem 0.75rem;
      background: #27ae60;
      color: white;
      border-radius: 20px;
      font-size: 0.875rem;
    }

    .product-quantity.low-stock {
      background: #e74c3c;
    }

    .product-actions {
      display: flex;
      gap: 0.5rem;
      justify-content: flex-end;
    }

    .empty-state {
      text-align: center;
      padding: 3rem;
      grid-column: 1 / -1;
    }

    .empty-state p {
      color: #666;
      margin-bottom: 1rem;
    }

    /* Modal Styles */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }

    .modal {
      background: white;
      padding: 2rem;
      border-radius: 8px;
      max-width: 400px;
      width: 90%;
    }

    .modal h3 {
      margin: 0 0 1rem 0;
      color: #2c3e50;
    }

    .modal p {
      margin-bottom: 1.5rem;
      color: #666;
    }

    .modal-actions {
      display: flex;
      gap: 0.5rem;
      justify-content: flex-end;
    }

    /* Button Styles */
    .btn {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 500;
      transition: all 0.2s;
    }

    .btn-primary {
      background: #3498db;
      color: white;
    }

    .btn-primary:hover {
      background: #2980b9;
    }

    .btn-secondary {
      background: #95a5a6;
      color: white;
    }

    .btn-secondary:hover {
      background: #7f8c8d;
    }

    .btn-outline {
      background: transparent;
      color: #3498db;
      border: 1px solid #3498db;
    }

    .btn-outline:hover {
      background: #3498db;
      color: white;
    }

    .btn-danger {
      background: #e74c3c;
      color: white;
    }

    .btn-danger:hover {
      background: #c0392b;
    }

    /* Form Styles */
    .form-select {
      padding: 0.5rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      background: white;
      min-width: 200px;
    }

    .form-select:focus {
      outline: none;
      border-color: #3498db;
      box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
    }

    /* Alert Styles */
    .alert {
      padding: 1rem;
      border-radius: 4px;
      margin-bottom: 1rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .alert-error {
      background: #fdf2f2;
      border: 1px solid #fbb;
      color: #c53030;
    }

    @media (max-width: 768px) {
      .header-section {
        flex-direction: column;
        gap: 1rem;
        align-items: stretch;
      }

      .filters-section {
        flex-direction: column;
      }

      .products-grid {
        grid-template-columns: 1fr;
      }

      .product-details {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
      }
    }
  `]
})
export class ProductListComponent implements OnInit, OnDestroy {
  private readonly productService: ProductService = inject(ProductService);
  private readonly categoryService: CategoryService = inject(CategoryService);
  private readonly destroy$ = new Subject<void>();

  constructor() {
  }

  categoryFilter = new FormControl<string>('');
  searchControl = new FormControl<string>('');

  products$ = this.productService.products$;
  categories$ = this.categoryService.categories$;
  loading$ = this.productService.loading$;
  error$ = this.productService.error$;

  productToDelete: Product | null = null;

  ngOnInit(): void {
    this.loadInitialData();
    this.setupFilters();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadInitialData(): void {

    this.categoryService.getCategories().subscribe();
    this.productService.getProducts().subscribe();
  }

  private setupFilters(): void {
    // Combine search and category filter changes
    combineLatest([
      this.searchControl.valueChanges.pipe(
        debounceTime(300),
        distinctUntilChanged()
      ),
      this.categoryFilter.valueChanges
    ]).pipe(
      takeUntil(this.destroy$)
    ).subscribe(([searchTerm, categoryId]) => {
      this.filterProducts(searchTerm || '', categoryId || '');
    });
  }

  private filterProducts(searchTerm: string, categoryId: string): void {
    const params = {
      search: searchTerm || undefined,
      categoryId: categoryId ? Number(categoryId) : undefined
    };

    this.productService.getProducts(params).subscribe();
  }

  onSearchChange(searchTerm: string): void {
    this.searchControl.setValue(searchTerm);
  }

  confirmDelete(product: Product): void {
    this.productToDelete = product;
  }

  cancelDelete(): void {
    this.productToDelete = null;
  }

  deleteProduct(): void {
    if (this.productToDelete) {
      this.productService.deleteProduct(this.productToDelete.id).subscribe({
        next: () => {
          this.productToDelete = null;
        },
        error: (error: any) => {
          console.error('Error deleting product:', error);
        }
      });
    }
  }

  clearError(): void {
    this.productService.clearError();
  }

  trackByProductId(index: number, product: Product): number {
    return product.id;
  }
} 
