import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { ProductService } from '../../services/product.service';
import { CategoryService } from '../../services/category.service';
import { Product, CreateProductRequest, UpdateProductRequest } from '../../models/product.model';
import { Category } from '../../models/category.model';
import { LoadingSpinnerComponent } from '../loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LoadingSpinnerComponent],
  template: `
    <div class="product-form-container">
      <div class="form-header">
        <h2>{{ isEditMode ? 'Edit Product' : 'Add New Product' }}</h2>
        <button 
          class="btn btn-secondary" 
          (click)="goBack()">
          Back to Products
        </button>
      </div>

      <!-- Loading State -->
      <app-loading-spinner *ngIf="loading$ | async"></app-loading-spinner>

      <!-- Error State -->
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

      <!-- Product Form -->
      <form 
        *ngIf="!(loading$ | async)" 
        [formGroup]="productForm" 
        (ngSubmit)="onSubmit()" 
        class="product-form">

        <div class="form-grid">
          <!-- Product Name -->
          <div class="form-group">
            <label for="name">Product Name *</label>
            <input 
              type="text" 
              id="name" 
              class="form-control"
              formControlName="name"
              [class.error]="isFieldInvalid('name')">
            <div 
              *ngIf="isFieldInvalid('name')" 
              class="field-error">
              <span *ngIf="productForm.get('name')?.errors?.['required']">
                Product name is required
              </span>
              <span *ngIf="productForm.get('name')?.errors?.['minlength']">
                Product name must be at least 2 characters long
              </span>
              <span *ngIf="productForm.get('name')?.errors?.['maxlength']">
                Product name cannot exceed 100 characters
              </span>
            </div>
          </div>

          <!-- SKU -->
          <div class="form-group">
            <label for="sku">SKU *</label>
            <input 
              type="text" 
              id="sku" 
              class="form-control"
              formControlName="sku"
              [class.error]="isFieldInvalid('sku')">
            <div 
              *ngIf="isFieldInvalid('sku')" 
              class="field-error">
              <span *ngIf="productForm.get('sku')?.errors?.['required']">
                SKU is required
              </span>
              <span *ngIf="productForm.get('sku')?.errors?.['pattern']">
                SKU can only contain letters, numbers, and hyphens
              </span>
            </div>
          </div>

          <!-- Price -->
          <div class="form-group">
            <label for="price">Price *</label>
            <div class="input-group">
              <span class="input-prefix">$</span>
              <input 
                type="number" 
                id="price" 
                class="form-control"
                formControlName="price"
                min="0"
                step="0.01"
                [class.error]="isFieldInvalid('price')">
            </div>
            <div 
              *ngIf="isFieldInvalid('price')" 
              class="field-error">
              <span *ngIf="productForm.get('price')?.errors?.['required']">
                Price is required
              </span>
              <span *ngIf="productForm.get('price')?.errors?.['min']">
                Price must be greater than 0
              </span>
            </div>
          </div>

          <!-- Quantity -->
          <div class="form-group">
            <label for="quantity">Stock Quantity *</label>
            <input 
              type="number" 
              id="quantity" 
              class="form-control"
              formControlName="quantity"
              min="0"
              [class.error]="isFieldInvalid('quantity')">
            <div 
              *ngIf="isFieldInvalid('quantity')" 
              class="field-error">
              <span *ngIf="productForm.get('quantity')?.errors?.['required']">
                Quantity is required
              </span>
              <span *ngIf="productForm.get('quantity')?.errors?.['min']">
                Quantity cannot be negative
              </span>
            </div>
          </div>

          <!-- Category -->
          <div class="form-group">
            <label for="categoryId">Category *</label>
            <select 
              id="categoryId" 
              class="form-control"
              formControlName="categoryId"
              [class.error]="isFieldInvalid('categoryId')">
              <option value="">Select a category</option>
              <option 
                *ngFor="let category of categories$ | async" 
                [value]="category.id">
                {{category.name}}
              </option>
            </select>
            <div 
              *ngIf="isFieldInvalid('categoryId')" 
              class="field-error">
              <span *ngIf="productForm.get('categoryId')?.errors?.['required']">
                Please select a category
              </span>
            </div>
          </div>
        </div>

        <!-- Description -->
        <div class="form-group full-width">
          <label for="description">Description</label>
          <textarea 
            id="description" 
            class="form-control"
            formControlName="description"
            rows="4"
            placeholder="Enter product description..."
            [class.error]="isFieldInvalid('description')">
          </textarea>
          <div 
            *ngIf="isFieldInvalid('description')" 
            class="field-error">
            <span *ngIf="productForm.get('description')?.errors?.['maxlength']">
              Description cannot exceed 1000 characters
            </span>
          </div>
        </div>

        <!-- Form Actions -->
        <div class="form-actions">
          <button 
            type="button" 
            class="btn btn-secondary" 
            (click)="goBack()">
            Cancel
          </button>
          <button 
            type="submit" 
            class="btn btn-primary"
            [disabled]="productForm.invalid || (loading$ | async)">
            {{ isEditMode ? 'Update Product' : 'Create Product' }}
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .product-form-container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      padding: 2rem;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .form-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid #eee;
    }

    .form-header h2 {
      margin: 0;
      color: #2c3e50;
    }

    .product-form {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .form-group.full-width {
      grid-column: 1 / -1;
    }

    .form-group label {
      font-weight: 500;
      color: #555;
    }

    .form-control {
      padding: 0.75rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 1rem;
      transition: border-color 0.2s, box-shadow 0.2s;
    }

    .form-control:focus {
      outline: none;
      border-color: #3498db;
      box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
    }

    .form-control.error {
      border-color: #e74c3c;
    }

    .form-control.error:focus {
      box-shadow: 0 0 0 2px rgba(231, 76, 60, 0.2);
    }

    .input-group {
      position: relative;
      display: flex;
      align-items: center;
    }

    .input-prefix {
      position: absolute;
      left: 0.75rem;
      color: #666;
      font-weight: 500;
      z-index: 1;
      pointer-events: none;
    }

    .input-group .form-control {
      padding-left: 2rem;
    }

    textarea.form-control {
      resize: vertical;
      min-height: 100px;
    }

    .field-error {
      color: #e74c3c;
      font-size: 0.875rem;
      margin-top: 0.25rem;
    }

    .form-actions {
      display: flex;
      gap: 1rem;
      justify-content: flex-end;
      padding-top: 1rem;
      border-top: 1px solid #eee;
    }

    /* Button Styles */
    .btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 500;
      transition: all 0.2s;
      font-size: 1rem;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-primary {
      background: #3498db;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: #2980b9;
    }

    .btn-secondary {
      background: #95a5a6;
      color: white;
    }

    .btn-secondary:hover {
      background: #7f8c8d;
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
      .product-form-container {
        padding: 1rem;
        margin: 0 1rem;
      }

      .form-header {
        flex-direction: column;
        gap: 1rem;
        align-items: stretch;
      }

      .form-grid {
        grid-template-columns: 1fr;
      }

      .form-actions {
        flex-direction: column-reverse;
      }
    }
  `]
})
export class ProductFormComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly productService = inject(ProductService);
  private readonly categoryService = inject(CategoryService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroy$ = new Subject<void>();

  productForm: FormGroup;
  isEditMode = false;
  productId: number | null = null;

  // Observables
  categories$ = this.categoryService.categories$;
  loading$ = this.productService.loading$;
  error$ = this.productService.error$;

  constructor() {
    this.productForm = this.createForm();
  }

  ngOnInit(): void {
    this.loadCategories();
    this.checkEditMode();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      description: ['', [Validators.maxLength(1000)]],
      sku: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9-]+$/)]],
      price: [0, [Validators.required, Validators.min(0.01)]],
      quantity: [0, [Validators.required, Validators.min(0)]],
      categoryId: ['', [Validators.required]]
    });
  }

  private loadCategories(): void {
    this.categoryService.getCategories().subscribe();
  }

  private checkEditMode(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.productId = Number(id);
      this.loadProduct(this.productId);
    }
  }

  private loadProduct(id: number): void {
    this.productService.getProduct(id).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (product: Product) => {
        this.populateForm(product);
      },
      error: (error: any) => {
        console.error('Error loading product:', error);
      }
    });
  }

  private populateForm(product: Product): void {
    this.productForm.patchValue({
      name: product.name,
      description: product.description,
      sku: product.sku,
      price: product.price,
      quantity: product.quantity,
      categoryId: product.categoryId
    });
  }

  onSubmit(): void {
    if (this.productForm.valid) {
      const formValue = this.productForm.value;
      
      if (this.isEditMode && this.productId) {
        const updateRequest: UpdateProductRequest = {
          name: formValue.name,
          description: formValue.description,
          sku: formValue.sku,
          price: Number(formValue.price),
          quantity: Number(formValue.quantity),
          categoryId: Number(formValue.categoryId)
        };

        this.productService.updateProduct(this.productId, updateRequest).pipe(
          takeUntil(this.destroy$)
        ).subscribe({
          next: () => {
            this.router.navigate(['/products']);
          },
          error: (error: any) => {
            console.error('Error updating product:', error);
          }
        });
      } else {
        const createRequest: CreateProductRequest = {
          name: formValue.name,
          description: formValue.description,
          sku: formValue.sku,
          price: Number(formValue.price),
          quantity: Number(formValue.quantity),
          categoryId: Number(formValue.categoryId)
        };

        this.productService.createProduct(createRequest).pipe(
          takeUntil(this.destroy$)
        ).subscribe({
          next: () => {
            this.router.navigate(['/products']);
          },
          error: (error: any) => {
            console.error('Error creating product:', error);
          }
        });
      }
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.productForm.controls).forEach(key => {
      const control = this.productForm.get(key);
      control?.markAsTouched();
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.productForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  clearError(): void {
    this.productService.clearError();
  }

  goBack(): void {
    this.router.navigate(['/products']);
  }
}