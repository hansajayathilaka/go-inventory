import { apiClient } from './api';
import type {
  Category,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  MoveCategoryRequest,
  CategoryQueryParams,
  CategoryListResponse,
  CategoryPathResponse,
  CategoryHierarchy
} from '../types/category';

class CategoryService {
  private readonly baseUrl = '/categories';

  // List categories with optional filtering and pagination
  async listCategories(params?: CategoryQueryParams): Promise<CategoryListResponse> {
    const searchParams = new URLSearchParams();

    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.page_size) searchParams.append('page_size', params.page_size.toString());
    if (params?.level !== undefined) searchParams.append('level', params.level.toString());
    if (params?.parent_id !== undefined) {
      searchParams.append('parent_id', params.parent_id || 'null');
    }

    const endpoint = `${this.baseUrl}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    const response = await apiClient.get<CategoryListResponse['data']>(endpoint);

    return {
      data: response.data,
      pagination: (response as any).pagination || {
        page: params?.page || 1,
        limit: params?.page_size || 20,
        total: Array.isArray(response.data) ? response.data.length : 0,
        total_pages: 1
      },
      message: response.message
    };
  }

  // Create a new category
  async createCategory(data: CreateCategoryRequest): Promise<Category> {
    const response = await apiClient.post<Category>(this.baseUrl, data);
    return response.data;
  }

  // Get category by ID
  async getCategoryById(id: string): Promise<Category> {
    const response = await apiClient.get<Category>(`${this.baseUrl}/${id}`);
    return response.data;
  }

  // Update category
  async updateCategory(id: string, data: UpdateCategoryRequest): Promise<Category> {
    const response = await apiClient.put<Category>(`${this.baseUrl}/${id}`, data);
    return response.data;
  }

  // Delete category
  async deleteCategory(id: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${id}`);
  }

  // Get category children
  async getCategoryChildren(id: string): Promise<Category[]> {
    const response = await apiClient.get<Category[]>(`${this.baseUrl}/${id}/children`);
    return response.data;
  }

  // Get category hierarchy
  async getCategoryHierarchy(rootId?: string): Promise<CategoryHierarchy> {
    const endpoint = rootId
      ? `${this.baseUrl}/${rootId}/hierarchy`
      : `${this.baseUrl}/hierarchy`;
    const response = await apiClient.get<CategoryHierarchy>(endpoint);
    return response.data;
  }

  // Get category path
  async getCategoryPath(id: string): Promise<Category[]> {
    const response = await apiClient.get<CategoryPathResponse>(`${this.baseUrl}/${id}/path`);
    return response.data.path;
  }

  // Move category
  async moveCategory(id: string, data: MoveCategoryRequest): Promise<Category> {
    const response = await apiClient.put<Category>(`${this.baseUrl}/${id}/move`, data);
    return response.data;
  }

  // Search categories
  async searchCategories(query: string): Promise<Category[]> {
    const searchParams = new URLSearchParams({ q: query });
    const response = await apiClient.get<Category[]>(`${this.baseUrl}/search?${searchParams.toString()}`);
    return response.data;
  }

  // Get root categories
  async getRootCategories(): Promise<Category[]> {
    const response = await apiClient.get<Category[]>(`${this.baseUrl}/roots`);
    return response.data;
  }
}

export const categoryService = new CategoryService();