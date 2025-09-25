export interface Product {
  id: number;
  name: string;
  description: string;
  sku: string;
  price: number;
  quantity: number;
  categoryId: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductDto {
  id?: number;
  name: string;
  description: string;
  sku: string;
  price: number;
  quantity: number;
  categoryId: number;
}

export interface CreateProductRequest {
  name: string;
  description: string;
  sku: string;
  price: number;
  quantity: number;
  categoryId: number;
}

export interface UpdateProductRequest {
  name: string;
  description: string;
  sku: string;
  price: number;
  quantity: number;
  categoryId: number;
}

export interface ProductSearchParams {
  search?: string;
  categoryId?: number;
  page?: number;
  pageSize?: number;
}

export interface ProductListResponse {
  products: Product[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}