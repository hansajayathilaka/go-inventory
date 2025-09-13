// Category type definitions based on backend API
export interface Category {
  id: string;
  name: string;
  description: string;
  parent_id: string | null;
  level: number;
  path: string;
  children_count: number;
  product_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreateCategoryRequest {
  name: string;
  description: string;
  parent_id?: string | null;
}

export interface UpdateCategoryRequest {
  name: string;
  description: string;
}

export interface MoveCategoryRequest {
  new_parent_id?: string | null;
}

export interface CategoryHierarchy {
  category: Category | null;
  children: CategoryHierarchy[];
}

export interface CategoryPathResponse {
  path: Category[];
}

export interface CategoryQueryParams {
  page?: number;
  page_size?: number;
  level?: number;
  parent_id?: string | null;
  q?: string; // for search
}

// API Response types
export interface CategoryListResponse {
  data: Category[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
  message: string;
}

export interface CategoryResponse {
  success: boolean;
  data: Category;
  message: string;
}

export interface CategoryHierarchyResponse {
  success: boolean;
  data: CategoryHierarchy;
  message: string;
}

export interface CategorySearchResponse {
  success: boolean;
  data: Category[];
  message: string;
}