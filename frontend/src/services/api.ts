const API_BASE_URL = 'http://localhost:9090/api/v1';

export class ApiError extends Error {
  public status: number;
  
  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const token = localStorage.getItem('auth_token');
    const requestId = Math.random().toString(36).substr(2, 8);

    console.log(`🌐 [ApiClient:${requestId}] Starting request:`, {
      method: options.method || 'GET',
      endpoint,
      hasToken: !!token,
      tokenPreview: token ? `${token.substring(0, 10)}...` : 'none',
      hasBody: !!options.body
    });

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    const url = `${this.baseUrl}${endpoint}`;

    try {
      console.log(`📤 [ApiClient:${requestId}] Making fetch request to:`, url);
      const startTime = Date.now();
      const response = await fetch(url, config);
      const endTime = Date.now();

      console.log(`📡 [ApiClient:${requestId}] Response received:`, {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        duration: `${endTime - startTime}ms`,
        contentType: response.headers.get('content-type')
      });

      const data = await response.json();

      console.log(`📦 [ApiClient:${requestId}] Response data parsed:`, {
        hasData: !!data,
        dataKeys: typeof data === 'object' ? Object.keys(data) : 'not object',
        success: data?.success,
        message: data?.message,
        dataLength: Array.isArray(data?.data) ? data.data.length : 'not array'
      });

      if (!response.ok) {
        console.error(`❌ [ApiClient:${requestId}] Request failed:`, {
          status: response.status,
          statusText: response.statusText,
          errorMessage: data.message || 'Request failed',
          errorData: data
        });
        throw new ApiError(response.status, data.message || 'Request failed');
      }

      console.log(`✅ [ApiClient:${requestId}] Request successful`);
      return data;
    } catch (error: any) {
      console.error(`💥 [ApiClient:${requestId}] Request error:`, {
        error: error.message,
        isApiError: error instanceof ApiError,
        status: error.status,
        stack: error.stack
      });

      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(0, 'Network error occurred');
    }
  }

  async get<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET', ...options });
  }

  async post<T>(endpoint: string, data?: any, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
  }

  async put<T>(endpoint: string, data?: any, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
  }

  async delete<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE', ...options });
  }
}

export const apiClient = new ApiClient();