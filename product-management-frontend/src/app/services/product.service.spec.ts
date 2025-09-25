import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ProductService } from './product.service';
import { Product, CreateProductRequest, UpdateProductRequest, ProductSearchParams } from '../models/product.model';

describe('ProductService', () => {
  let service: ProductService;
  let httpMock: HttpTestingController;
  const baseUrl = 'https://localhost:7189/api/products';

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

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ProductService]
    });

    service = TestBed.inject(ProductService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getProducts', () => {
    it('should fetch products successfully', () => {
      const mockResponse = {
        products: [mockProduct],
        totalCount: 1,
        currentPage: 1,
        totalPages: 1
      };

      service.getProducts().subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(response.products.length).toBe(1);
        expect(response.products[0]).toEqual(mockProduct);
      });

      const req = httpMock.expectOne(baseUrl);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle search parameters', () => {
      const searchParams: ProductSearchParams = {
        search: 'test',
        categoryId: 1,
        page: 1,
        pageSize: 10
      };

      const mockResponse = {
        products: [mockProduct],
        totalCount: 1,
        currentPage: 1,
        totalPages: 1
      };

      service.getProducts(searchParams).subscribe();

      const req = httpMock.expectOne(req => 
        req.url === baseUrl && 
        req.params.get('search') === 'test' &&
        req.params.get('categoryId') === '1' &&
        req.params.get('page') === '1' &&
        req.params.get('pageSize') === '10'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle HTTP errors', () => {
      service.getProducts().subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.message).toContain('Server Error');
        }
      });

      const req = httpMock.expectOne(baseUrl);
      req.flush('Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('getProduct', () => {
    it('should fetch a single product', () => {
      service.getProduct(1).subscribe(product => {
        expect(product).toEqual(mockProduct);
      });

      const req = httpMock.expectOne(`${baseUrl}/1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockProduct);
    });
  });

  describe('createProduct', () => {
    it('should create a new product', () => {
      const createRequest: CreateProductRequest = {
        name: 'Test Product',
        description: 'Test Description',
        sku: 'TEST-001',
        price: 99.99,
        quantity: 10,
        categoryId: 1
      };

      service.createProduct(createRequest).subscribe(product => {
        expect(product).toEqual(mockProduct);
      });

      const req = httpMock.expectOne(baseUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(createRequest);
      req.flush(mockProduct);
    });
  });

  describe('updateProduct', () => {
    it('should update an existing product', () => {
      const updateRequest: UpdateProductRequest = {
        name: 'Updated Product',
        description: 'Updated Description',
        sku: 'TEST-001-UPDATED',
        price: 199.99,
        quantity: 20,
        categoryId: 1
      };

      const updatedProduct = { ...mockProduct, ...updateRequest };

      service.updateProduct(1, updateRequest).subscribe(product => {
        expect(product).toEqual(updatedProduct);
      });

      const req = httpMock.expectOne(`${baseUrl}/1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updateRequest);
      req.flush(updatedProduct);
    });
  });

  describe('deleteProduct', () => {
    it('should delete a product', () => {
      service.deleteProduct(1).subscribe(response => {
        expect(response).toBeUndefined();
      });

      const req = httpMock.expectOne(`${baseUrl}/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('searchProducts', () => {
    it('should search products by term', () => {
      const mockResponse = {
        products: [mockProduct],
        totalCount: 1,
        currentPage: 1,
        totalPages: 1
      };

      service.searchProducts('test').subscribe(products => {
        expect(products).toEqual([mockProduct]);
      });

      const req = httpMock.expectOne(req => 
        req.url === baseUrl && req.params.get('search') === 'test'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should search products by term and category', () => {
      const mockResponse = {
        products: [mockProduct],
        totalCount: 1,
        currentPage: 1,
        totalPages: 1
      };

      service.searchProducts('test', 1).subscribe(products => {
        expect(products).toEqual([mockProduct]);
      });

      const req = httpMock.expectOne(req => 
        req.url === baseUrl && 
        req.params.get('search') === 'test' &&
        req.params.get('categoryId') === '1'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('state management', () => {
    it('should update loading state', () => {
      let loadingStates: boolean[] = [];
      
      service.loading$.subscribe(loading => {
        loadingStates.push(loading);
      });

      service.getProducts().subscribe();

      const req = httpMock.expectOne(baseUrl);
      req.flush({ products: [], totalCount: 0, currentPage: 1, totalPages: 1 });

      expect(loadingStates).toContain(true);
      expect(loadingStates).toContain(false);
    });

    it('should clear errors', () => {
      service.clearError();
      
      service.error$.subscribe(error => {
        expect(error).toBeNull();
      });
    });
  });
});