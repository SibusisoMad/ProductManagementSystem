import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

import { CategoryService } from '../../services/category.service';
import { Category, CategoryTreeNode, CreateCategoryRequest, UpdateCategoryRequest } from '../../models/category.model';
import { LoadingSpinnerComponent } from '../loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-category-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LoadingSpinnerComponent],
  template: `
    <div class="category-management-container">
      <div class="header-section">
        <h2>Category Management</h2>
        <button 
          class="btn btn-primary" 
          (click)="showAddForm()">
          Add New Category
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

      <div class="content-grid">
        <!-- Category Form -->
        <div class="form-section">
          <h3>{{ editingCategory ? 'Edit Category' : 'Add New Category' }}</h3>
          
          <form 
            [formGroup]="categoryForm" 
            (ngSubmit)="onSubmit()" 
            class="category-form">

            <div class="form-group">
              <label for="name">Category Name *</label>
              <input 
                type="text" 
                id="name" 
                class="form-control"
                formControlName="name"
                [class.error]="isFieldInvalid('name')">
              <div 
                *ngIf="isFieldInvalid('name')" 
                class="field-error">
                <span *ngIf="categoryForm.get('name')?.errors?.['required']">
                  Category name is required
                </span>
                <span *ngIf="categoryForm.get('name')?.errors?.['minlength']">
                  Category name must be at least 2 characters long
                </span>
              </div>
            </div>

            <div class="form-group">
              <label for="description">Description</label>
              <textarea 
                id="description" 
                class="form-control"
                formControlName="description"
                rows="3"
                placeholder="Enter category description...">
              </textarea>
            </div>

            <div class="form-group">
              <label for="parentCategoryId">Parent Category</label>
              <select 
                id="parentCategoryId" 
                class="form-control"
                formControlName="parentCategoryId">
                <option value="">No Parent (Root Category)</option>
                <option 
                  *ngFor="let category of categories$ | async" 
                  [value]="category.id"
                  [disabled]="editingCategory?.id === category.id">
                  {{category.name}}
                </option>
              </select>
            </div>

            <div class="form-actions">
              <button 
                *ngIf="editingCategory" 
                type="button" 
                class="btn btn-secondary" 
                (click)="cancelEdit()">
                Cancel
              </button>
              <button 
                type="submit" 
                class="btn btn-primary"
                [disabled]="categoryForm.invalid">
                {{ editingCategory ? 'Update' : 'Create' }} Category
              </button>
            </div>
          </form>
        </div>

        <!-- Categories List -->
        <div class="list-section">
          <h3>Categories</h3>
          
          <!-- Tab Navigation -->
          <div class="tab-nav">
            <button 
              class="tab-button"
              [class.active]="activeTab === 'list'"
              (click)="activeTab = 'list'">
              Flat List
            </button>
            <button 
              class="tab-button"
              [class.active]="activeTab === 'tree'"
              (click)="setTreeTab()">
              Hierarchical Tree
            </button>
          </div>

          <!-- Flat List View -->
          <div *ngIf="activeTab === 'list'" class="categories-list">
            <div 
              *ngFor="let category of categories$ | async" 
              class="category-item">
              <div class="category-info">
                <h4>{{category.name}}</h4>
                <p *ngIf="category.description" class="category-description">
                  {{category.description}}
                </p>
                <span *ngIf="category.parentCategoryId" class="parent-info">
                  Parent: {{getParentCategoryName(category.parentCategoryId)}}
                </span>
              </div>
              <div class="category-actions">
                <button 
                  class="btn btn-outline btn-sm" 
                  (click)="editCategory(category)">
                  Edit
                </button>
                <button 
                  class="btn btn-danger btn-sm" 
                  (click)="confirmDelete(category)">
                  Delete
                </button>
              </div>
            </div>

            <div 
              *ngIf="(categories$ | async)?.length === 0" 
              class="empty-state">
              <p>No categories found.</p>
            </div>
          </div>

          <!-- Tree View -->
          <div *ngIf="activeTab === 'tree'" class="categories-tree">
            <div 
              *ngFor="let node of categoryTree$ | async" 
              class="tree-node">
              <ng-container *ngTemplateOutlet="treeNodeTemplate; context: { $implicit: node, level: 0 }">
              </ng-container>
            </div>

            <div 
              *ngIf="(categoryTree$ | async)?.length === 0" 
              class="empty-state">
              <p>No categories found.</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tree Node Template -->
    <ng-template #treeNodeTemplate let-node let-level="level">
      <div class="tree-item" [style.margin-left.px]="level * 20">
        <div class="tree-item-content">
          <span class="tree-icon" *ngIf="node.children.length > 0">📁</span>
          <span class="tree-icon" *ngIf="node.children.length === 0">📄</span>
          <div class="tree-item-info">
            <strong>{{node.name}}</strong>
            <small *ngIf="node.description">{{node.description}}</small>
          </div>
          <div class="tree-item-actions">
            <button 
              class="btn btn-outline btn-xs" 
              (click)="editCategoryFromTree(node)">
              Edit
            </button>
            <button 
              class="btn btn-danger btn-xs" 
              (click)="confirmDeleteFromTree(node)">
              Delete
            </button>
          </div>
        </div>
        
        <!-- Child nodes -->
        <div *ngFor="let child of node.children">
          <ng-container *ngTemplateOutlet="treeNodeTemplate; context: { $implicit: child, level: level + 1 }">
          </ng-container>
        </div>
      </div>
    </ng-template>

    <!-- Delete Confirmation Modal -->
    <div 
      *ngIf="categoryToDelete" 
      class="modal-overlay" 
      (click)="cancelDelete()">
      <div class="modal" (click)="$event.stopPropagation()">
        <h3>Confirm Delete</h3>
        <p>Are you sure you want to delete the category "{{categoryToDelete.name}}"?</p>
        <p class="warning-text">
          <strong>Warning:</strong> This action cannot be undone and may affect products in this category.
        </p>
        <div class="modal-actions">
          <button 
            class="btn btn-secondary" 
            (click)="cancelDelete()">
            Cancel
          </button>
          <button 
            class="btn btn-danger" 
            (click)="deleteCategory()">
            Delete
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .category-management-container {
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

    .content-grid {
      display: grid;
      grid-template-columns: 1fr 2fr;
      gap: 2rem;
    }

    .form-section,
    .list-section {
      background: white;
      padding: 1.5rem;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .form-section h3,
    .list-section h3 {
      margin: 0 0 1.5rem 0;
      color: #2c3e50;
    }

    .category-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
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

    textarea.form-control {
      resize: vertical;
      min-height: 80px;
    }

    .field-error {
      color: #e74c3c;
      font-size: 0.875rem;
    }

    .form-actions {
      display: flex;
      gap: 0.5rem;
      justify-content: flex-end;
      margin-top: 1rem;
    }

    /* Tab Navigation */
    .tab-nav {
      display: flex;
      margin-bottom: 1rem;
      border-bottom: 1px solid #eee;
    }

    .tab-button {
      padding: 0.75rem 1rem;
      border: none;
      background: none;
      cursor: pointer;
      border-bottom: 2px solid transparent;
      transition: all 0.2s;
    }

    .tab-button:hover {
      background: #f8f9fa;
    }

    .tab-button.active {
      border-bottom-color: #3498db;
      color: #3498db;
      font-weight: 500;
    }

    /* Categories List */
    .categories-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .category-item {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 1rem;
      border: 1px solid #eee;
      border-radius: 4px;
      transition: box-shadow 0.2s;
    }

    .category-item:hover {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .category-info h4 {
      margin: 0 0 0.5rem 0;
      color: #2c3e50;
    }

    .category-description {
      margin: 0 0 0.5rem 0;
      color: #666;
      font-size: 0.9rem;
    }

    .parent-info {
      font-size: 0.8rem;
      color: #888;
      background: #f8f9fa;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
    }

    .category-actions {
      display: flex;
      gap: 0.5rem;
    }

    /* Tree View */
    .categories-tree {
      font-family: monospace;
    }

    .tree-item {
      margin-bottom: 0.5rem;
    }

    .tree-item-content {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem;
      border-radius: 4px;
      transition: background-color 0.2s;
    }

    .tree-item-content:hover {
      background: #f8f9fa;
    }

    .tree-icon {
      font-size: 1rem;
    }

    .tree-item-info {
      flex: 1;
    }

    .tree-item-info small {
      display: block;
      color: #666;
      margin-top: 0.25rem;
    }

    .tree-item-actions {
      display: flex;
      gap: 0.25rem;
    }

    /* Empty State */
    .empty-state {
      text-align: center;
      padding: 2rem;
      color: #666;
    }

    /* Modal */
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
      margin-bottom: 1rem;
      color: #666;
    }

    .warning-text {
      color: #e74c3c;
      font-size: 0.9rem;
    }

    .modal-actions {
      display: flex;
      gap: 0.5rem;
      justify-content: flex-end;
    }

    /* Buttons */
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

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-sm {
      padding: 0.375rem 0.75rem;
      font-size: 0.875rem;
    }

    .btn-xs {
      padding: 0.25rem 0.5rem;
      font-size: 0.75rem;
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

    /* Alert */
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
      .content-grid {
        grid-template-columns: 1fr;
      }

      .header-section {
        flex-direction: column;
        gap: 1rem;
        align-items: stretch;
      }

      .tree-item-content {
        flex-wrap: wrap;
      }

      .tree-item-actions {
        flex-basis: 100%;
        margin-top: 0.5rem;
      }
    }
  `]
})
export class CategoryManagementComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly categoryService = inject(CategoryService);
  private readonly destroy$ = new Subject<void>();

  categoryForm: FormGroup;
  editingCategory: Category | null = null;
  categoryToDelete: Category | null = null;
  activeTab: 'list' | 'tree' = 'list';

  // Observables
  categories$ = this.categoryService.categories$;
  categoryTree$ = this.categoryService.categoryTree$;
  loading$ = this.categoryService.loading$;
  error$ = this.categoryService.error$;

  constructor() {
    this.categoryForm = this.createForm();
  }

  ngOnInit(): void {
    this.loadCategories();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: [''],
      parentCategoryId: ['']
    });
  }

  private loadCategories(): void {
    this.categoryService.getCategories().subscribe();
  }

  showAddForm(): void {
    this.editingCategory = null;
    this.categoryForm.reset();
  }

  editCategory(category: Category): void {
    this.editingCategory = category;
    this.categoryForm.patchValue({
      name: category.name,
      description: category.description,
      parentCategoryId: category.parentCategoryId || ''
    });
  }

  editCategoryFromTree(node: CategoryTreeNode): void {
    // Convert tree node to category for editing
    const category: Category = {
      id: node.id,
      name: node.name,
      description: node.description,
      parentCategoryId: node.parentCategoryId
    };
    this.editCategory(category);
  }

  cancelEdit(): void {
    this.editingCategory = null;
    this.categoryForm.reset();
  }

  onSubmit(): void {
    if (this.categoryForm.valid) {
      const formValue = this.categoryForm.value;
      
      const categoryData = {
        name: formValue.name,
        description: formValue.description,
        parentCategoryId: formValue.parentCategoryId || undefined
      };

      if (this.editingCategory) {
        // Update existing category
        const updateRequest: UpdateCategoryRequest = categoryData;
        
        this.categoryService.updateCategory(this.editingCategory.id, updateRequest).pipe(
          takeUntil(this.destroy$)
        ).subscribe({
          next: () => {
            this.cancelEdit();
          },
          error: (error: any) => {
            console.error('Error updating category:', error);
          }
        });
      } else {
        // Create new category
        const createRequest: CreateCategoryRequest = categoryData;
        
        this.categoryService.createCategory(createRequest).pipe(
          takeUntil(this.destroy$)
        ).subscribe({
          next: () => {
            this.categoryForm.reset();
          },
          error: (error: any) => {
            console.error('Error creating category:', error);
          }
        });
      }
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.categoryForm.controls).forEach(key => {
      const control = this.categoryForm.get(key);
      control?.markAsTouched();
    });
  }

  confirmDelete(category: Category): void {
    this.categoryToDelete = category;
  }

  confirmDeleteFromTree(node: CategoryTreeNode): void {
    // Convert tree node to category for deletion
    const category: Category = {
      id: node.id,
      name: node.name,
      description: node.description,
      parentCategoryId: node.parentCategoryId
    };
    this.confirmDelete(category);
  }

  cancelDelete(): void {
    this.categoryToDelete = null;
  }

  deleteCategory(): void {
    if (this.categoryToDelete) {
      const categoryId = this.categoryToDelete.id;
      this.categoryService.deleteCategory(this.categoryToDelete.id).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: () => {
          this.categoryToDelete = null;
          // If we were editing this category, cancel the edit
          if (this.editingCategory?.id === categoryId) {
            this.cancelEdit();
          }
        },
        error: (error: any) => {
          console.error('Error deleting category:', error);
        }
      });
    }
  }

  setTreeTab(): void {
    this.activeTab = 'tree';
    // Load tree structure if not already loaded
    this.categoryService.getCategoryTree().subscribe();
  }

  getParentCategoryName(parentId: number): string {
    // This would need to be implemented by getting the categories and finding the parent
    // For now, return the ID as a string
    return `ID: ${parentId}`;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.categoryForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  clearError(): void {
    this.categoryService.clearError();
  }
}