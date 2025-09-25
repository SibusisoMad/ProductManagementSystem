export interface Category {
  id: number;
  name: string;
  description: string;
  parentCategoryId?: number;
}

export interface CategoryDto {
  id?: number;
  name: string;
  description: string;
  parentCategoryId?: number;
}

export interface CategoryTreeNode {
  id: number;
  name: string;
  description: string;
  parentCategoryId?: number;
  children: CategoryTreeNode[];
}

export interface CreateCategoryRequest {
  name: string;
  description: string;
  parentCategoryId?: number;
}

export interface UpdateCategoryRequest {
  name: string;
  description: string;
  parentCategoryId?: number;
}