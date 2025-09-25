import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ProductFormComponent } from './product-form.component';
import { ProductService } from '../../services/product.service';
import { CategoryService } from '../../services/category.service';
import { Product, CreateProductRequest } from '../../models/product.model';
import { Category } from '../../models/category.model';

describe('ProductFormComponent', () => {
  let component: ProductFormComponent;
  let fixture: ComponentFixture<ProductFormComponent>;
  let mockProductService: jasmine.SpyObj<ProductService>;
  let mockCategoryService: jasmine.SpyObj<CategoryService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockActivatedRoute: jasmine.SpyObj<ActivatedRoute>;

  const mockProduct: Product = {
    id: 1,
    name: 'Test Product',
    description: 'Test Description',
    sku: 'TEST-001',
    price: 99.99,
    quantity: 10,
    categoryId: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockCategories: Category[] = [
    { id: 1, name: 'Category 1', description: 'Description 1' },
    { id: 2, name: 'Category 2', description: 'Description 2' }
  ];

  beforeEach(async () => {
    const productServiceSpy = jasmine.createSpyObj('ProductService', [
      'getProduct', 'createProduct', 'updateProduct', 'clearError'
    ], {
      loading$: of(false),
      error$: of(null)
    });

    const categoryServiceSpy = jasmine.createSpyObj('CategoryService', [
      'getCategories'
    ], {
      categories$: of(mockCategories)
    });

    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    
    const activatedRouteSpy = jasmine.createSpyObj('ActivatedRoute', [], {
      snapshot: {
        paramMap: {
          get: jasmine.createSpy().and.returnValue(null)
        }
      }
    });

    await TestBed.configureTestingModule({
      imports: [ProductFormComponent, ReactiveFormsModule],
      providers: [
        { provide: ProductService, useValue: productServiceSpy },
        { provide: CategoryService, useValue: categoryServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: activatedRouteSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProductFormComponent);
    component = fixture.componentInstance;
    mockProductService = TestBed.inject(ProductService) as jasmine.SpyObj<ProductService>;
    mockCategoryService = TestBed.inject(CategoryService) as jasmine.SpyObj<CategoryService>;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    mockActivatedRoute = TestBed.inject(ActivatedRoute) as jasmine.SpyObj<ActivatedRoute>;

    // Setup default return values
    mockCategoryService.getCategories.and.returnValue(of(mockCategories));
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with empty values for new product', () => {
    fixture.detectChanges();
    
    expect(component.isEditMode).toBeFalse();
    expect(component.productForm.get('name')?.value).toBe('');
    expect(component.productForm.get('description')?.value).toBe('');
    expect(component.productForm.get('sku')?.value).toBe('');
    expect(component.productForm.get('price')?.value).toBe(0);
    expect(component.productForm.get('quantity')?.value).toBe(0);
    expect(component.productForm.get('categoryId')?.value).toBe('');
  });

  it('should load categories on init', () => {
    fixture.detectChanges();
    
    expect(mockCategoryService.getCategories).toHaveBeenCalled();
  });

  it('should validate required fields', () => {
    fixture.detectChanges();
    
    const form = component.productForm;
    
    // Test required validation
    expect(form.get('name')?.hasError('required')).toBeTruthy();
    expect(form.get('sku')?.hasError('required')).toBeTruthy();
    expect(form.get('price')?.hasError('required')).toBeTruthy();
    expect(form.get('quantity')?.hasError('required')).toBeTruthy();
    expect(form.get('categoryId')?.hasError('required')).toBeTruthy();
  });

  it('should validate field lengths and patterns', () => {
    fixture.detectChanges();
    
    const form = component.productForm;
    
    // Test name length validation
    form.get('name')?.setValue('a'); // Too short
    expect(form.get('name')?.hasError('minlength')).toBeTruthy();
    
    // Test SKU pattern validation
    form.get('sku')?.setValue('invalid sku with spaces');
    expect(form.get('sku')?.hasError('pattern')).toBeTruthy();
    
    // Test price minimum validation
    form.get('price')?.setValue(-1);
    expect(form.get('price')?.hasError('min')).toBeTruthy();
    
    // Test quantity minimum validation
    form.get('quantity')?.setValue(-1);
    expect(form.get('quantity')?.hasError('min')).toBeTruthy();
  });

  it('should check if field is invalid correctly', () => {
    fixture.detectChanges();
    
    const nameControl = component.productForm.get('name');
    nameControl?.markAsTouched();
    
    expect(component.isFieldInvalid('name')).toBeTruthy();
    
    nameControl?.setValue('Valid Name');
    expect(component.isFieldInvalid('name')).toBeFalsy();
  });

  it('should create product when form is valid', () => {
    fixture.detectChanges();
    
    // Fill form with valid data
    component.productForm.patchValue({
      name: 'Test Product',
      description: 'Test Description',
      sku: 'TEST-001',
      price: 99.99,
      quantity: 10,
      categoryId: 1
    });

    mockProductService.createProduct.and.returnValue(of(mockProduct));
    
    component.onSubmit();
    
    expect(mockProductService.createProduct).toHaveBeenCalledWith(jasmine.objectContaining({
      name: 'Test Product',
      description: 'Test Description',
      sku: 'TEST-001',
      price: 99.99,
      quantity: 10,
      categoryId: 1
    } as CreateProductRequest));
    
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/products']);
  });

  it('should not submit when form is invalid', () => {
    fixture.detectChanges();
    
    // Leave form empty (invalid)
    component.onSubmit();
    
    expect(mockProductService.createProduct).not.toHaveBeenCalled();
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });

  it('should navigate back when goBack is called', () => {
    component.goBack();
    
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/products']);
  });

  it('should clear error when clearError is called', () => {
    component.clearError();
    
    expect(mockProductService.clearError).toHaveBeenCalled();
  });

  it('should handle product creation error', () => {
    fixture.detectChanges();
    
    component.productForm.patchValue({
      name: 'Test Product',
      description: 'Test Description',
      sku: 'TEST-001',
      price: 99.99,
      quantity: 10,
      categoryId: 1
    });

    const error = new Error('Creation failed');
    mockProductService.createProduct.and.returnValue(throwError(error));
    
    spyOn(console, 'error');
    
    component.onSubmit();
    
    expect(console.error).toHaveBeenCalledWith('Error creating product:', error);
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });

  describe('Edit Mode', () => {
    beforeEach(() => {
      // Mock route to return product ID
      mockActivatedRoute.snapshot.paramMap.get = jasmine.createSpy().and.returnValue('1');
      mockProductService.getProduct.and.returnValue(of(mockProduct));
    });

    it('should enter edit mode when product ID is in route', () => {
      fixture.detectChanges();
      
      expect(component.isEditMode).toBeTruthy();
      expect(component.productId).toBe(1);
      expect(mockProductService.getProduct).toHaveBeenCalledWith(1);
    });

    it('should populate form with product data in edit mode', () => {
      fixture.detectChanges();
      
      expect(component.productForm.get('name')?.value).toBe(mockProduct.name);
      expect(component.productForm.get('description')?.value).toBe(mockProduct.description);
      expect(component.productForm.get('sku')?.value).toBe(mockProduct.sku);
      expect(component.productForm.get('price')?.value).toBe(mockProduct.price);
      expect(component.productForm.get('quantity')?.value).toBe(mockProduct.quantity);
      expect(component.productForm.get('categoryId')?.value).toBe(mockProduct.categoryId);
    });

    it('should update product in edit mode', () => {
      fixture.detectChanges();
      
      const updatedProduct = { ...mockProduct, name: 'Updated Product' };
      mockProductService.updateProduct.and.returnValue(of(updatedProduct));
      
      component.productForm.patchValue({ name: 'Updated Product' });
      component.onSubmit();
      
      expect(mockProductService.updateProduct).toHaveBeenCalledWith(1, jasmine.objectContaining({
        name: 'Updated Product'
      }));
      
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/products']);
    });
  });
});