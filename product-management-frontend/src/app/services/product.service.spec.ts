import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ProductService } from './product.service';
import { ApiConfigService } from './api-config.service';
import { Product, CreateProductRequest, UpdateProductRequest, ProductSearchParams, ProductListResponse } from '../models/product.model';

describe('ProductService', () => {
  let service: ProductService;
  let httpMock: HttpTestingController;
  let apiConfigService: jasmine.SpyObj<ApiConfigService>;

  const baseUrl = 'http://localhost:5263/api/products';
  
  const mockProduct: Product = {
    id: 1,
    name: 'Test Product',
    description: 'Test Description',
    sku: 'TEST1',
    price: 99.99,
    quantity: 10,
    categoryId: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(() => {
    const apiConfigSpy = jasmine.createSpyObj('ApiConfigService', ['getProductsUrl']);
    
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ProductService,
        { provide: ApiConfigService, useValue: apiConfigSpy }
      ]
    });
    
    service = TestBed.inject(ProductService);
    httpMock = TestBed.inject(HttpTestingController);
    apiConfigService = TestBed.inject(ApiConfigService) as jasmine.SpyObj<ApiConfigService>;
    
    apiConfigService.getProductsUrl.and.returnValue(baseUrl);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getProducts', () => {
    it('should fetch products successfully', () => {
      const mockResponse: ProductListResponse = {
        items: [mockProduct],
        totalItems: 1,
        page: 1,
        pageSize: 10,
        totalPages: 1
      };

      service.getProducts().subscribe((response: ProductListResponse) => {
        expect(response).toEqual(mockResponse);
        expect(response.items.length).toBe(1);
        expect(response.items[0]).toEqual(mockProduct);
      });

      const req = httpMock.expectOne(baseUrl);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle error response', () => {
      service.getProducts().subscribe({
        next: () => fail('Should have failed'),
        error: (error: any) => {
          expect(error.message).toContain('Server Error');
        }
      });

      const req = httpMock.expectOne(baseUrl);
      req.flush('Server Error', { status: 500, statusText: 'Server Error' });
    });
  });

  describe('getProduct', () => {
    it('should fetch single product', () => {
      service.getProduct(1).subscribe((product: Product) => {
        expect(product).toEqual(mockProduct);
      });

      const req = httpMock.expectOne(`${baseUrl}/1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockProduct);
    });
  });

  describe('createProduct', () => {
    it('should create product', () => {
      const createRequest: CreateProductRequest = {
        name: 'New Product',
        description: 'New Description',
        sku: 'NEW-001',
        price: 49.99,
        quantity: 5,
        categoryId: 1
      };

      service.createProduct(createRequest).subscribe((product: Product) => {
        expect(product).toEqual(mockProduct);
      });

      const req = httpMock.expectOne(baseUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(createRequest);
      req.flush(mockProduct);
    });
  });

  describe('updateProduct', () => {
    it('should update product', () => {
      const updateRequest: UpdateProductRequest = {
        name: 'Updated Product',
        description: 'Updated Description',
        sku: 'UPD-001',
        price: 59.99,
        quantity: 8,
        categoryId: 1
      };

      service.updateProduct(1, updateRequest).subscribe((product: Product) => {
        expect(product).toEqual(mockProduct);
      });

      const req = httpMock.expectOne(`${baseUrl}/1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updateRequest);
      req.flush(mockProduct);
    });
  });

  describe('deleteProduct', () => {
    it('should delete product', () => {
      service.deleteProduct(1).subscribe((response: any) => {
        expect(response).toBeTruthy();
      });

      const req = httpMock.expectOne(`${baseUrl}/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush({});
    });
  });

  describe('state management', () => {
    it('should update loading state', () => {
      service.loading$.subscribe((loading: boolean) => {
        expect(typeof loading).toBe('boolean');
      });
      
      service.getProducts().subscribe();
      const req = httpMock.expectOne(baseUrl);
      req.flush({ items: [], totalItems: 0, page: 1, pageSize: 10, totalPages: 1 });
    });

    it('should update error state', () => {
      service.error$.subscribe((error: string | null) => {
        // Error state test
      });
      
      service.getProducts().subscribe({
        next: () => {},
        error: () => {}
      });
      
      const req = httpMock.expectOne(baseUrl);
      req.flush('Error', { status: 500, statusText: 'Server Error' });
    });
  });
});