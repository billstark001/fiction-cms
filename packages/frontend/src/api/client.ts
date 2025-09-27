/**
 * API client configuration and utilities for Fiction CMS Frontend
 */

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

export interface ErrorResponse {
  error: string;
  code: string;
  timestamp: string;
  requestId?: string;
  validationErrors?: Array<{
    field: string;
    message: string;
  }>;
}

export interface User {
  id: string;
  username: string;
  email: string;
  displayName?: string | null;
  isActive: boolean;
  createdAt: string;
  roles: Array<{
    id: string;
    name: string;
    displayName: string;
  }>;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface Site {
  id: string;
  name: string;
  description?: string | null;
  githubRepositoryUrl: string;
  localPath: string;
  createdAt: string;
  isActive: boolean;
}

export interface SitesResponse {
  sites: Site[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  displayName?: string;
  roleIds?: string[];
}

export interface UpdateUserRequest {
  email?: string;
  displayName?: string;
  isActive?: boolean;
  roleIds?: string[];
}

export interface Role {
  id: string;
  name: string;
  displayName: string;
  description?: string | null;
}

/**
 * API client class with token management
 */
class ApiClient {
  private baseURL: string;
  private accessToken: string | null = null;

  constructor(baseURL: string = '/api') {
    this.baseURL = baseURL;
    this.loadTokenFromStorage();
  }

  /**
   * Set access token for authenticated requests
   */
  setAccessToken(token: string) {
    this.accessToken = token;
    // Safely store token in localStorage if available
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('fiction_cms_access_token', token);
    }
  }

  /**
   * Clear access token
   */
  clearAccessToken() {
    this.accessToken = null;
    // Safely remove tokens from localStorage if available
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('fiction_cms_access_token');
      localStorage.removeItem('fiction_cms_refresh_token');
    }
  }

  /**
   * Load token from localStorage
   */
  private loadTokenFromStorage() {
    // Check if localStorage is available (browser environment)
    if (typeof window !== 'undefined' && window.localStorage) {
      const token = localStorage.getItem('fiction_cms_access_token');
      // Only set token if it's not null and not 'undefined' string
      if (token && token !== 'undefined') {
        this.accessToken = token;
      }
    }
  }

  /**
   * Make authenticated HTTP request
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>,
    };

    // Add Authorization header if token exists
    if (this.accessToken) {
      headers.Authorization = `Bearer ${this.accessToken}`;
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        // Handle token expiration
        if (response.status === 401 && this.accessToken) {
          // Try to refresh token
          const refreshed = await this.refreshAccessToken();
          if (refreshed) {
            // Retry the original request
            headers.Authorization = `Bearer ${this.accessToken}`;
            const retryResponse = await fetch(url, { ...config, headers });
            const retryData = await retryResponse.json();
            
            if (!retryResponse.ok) {
              throw new Error(retryData.error || `HTTP ${retryResponse.status}: ${retryResponse.statusText}`);
            }
            
            return retryData;
          } else {
            // Refresh failed, clear tokens
            this.clearAccessToken();
            throw new Error('Session expired. Please login again.');
          }
        }
        
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error occurred');
    }
  }

  /**
   * Refresh access token using refresh token
   */
  private async refreshAccessToken(): Promise<boolean> {
    try {
      const refreshToken = localStorage.getItem('fiction_cms_refresh_token');
      if (!refreshToken) {
        return false;
      }

      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        this.setAccessToken(data.accessToken);
        localStorage.setItem('fiction_cms_refresh_token', data.refreshToken);
        return true;
      }
      
      return false;
    } catch {
      return false;
    }
  }

  // Authentication endpoints
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await this.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    // Store tokens
    this.setAccessToken(response.accessToken);
    localStorage.setItem('fiction_cms_refresh_token', response.refreshToken);

    return response;
  }

  async logout(): Promise<void> {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } finally {
      this.clearAccessToken();
    }
  }

  async getCurrentUser(): Promise<User> {
    return this.request<User>('/auth/me');
  }

  // User management endpoints
  async getUsers(params?: { page?: number; limit?: number; search?: string }): Promise<{
    users: User[];
    total: number;
    page: number;
    limit: number;
  }> {
    const queryString = params ? new URLSearchParams(params as any).toString() : '';
    return this.request<any>(`/users${queryString ? `?${queryString}` : ''}`);
  }

  async getUserById(id: string): Promise<User> {
    return this.request<User>(`/users/${id}`);
  }

  async createUser(userData: CreateUserRequest): Promise<User> {
    return this.request<User>('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async updateUser(id: string, userData: UpdateUserRequest): Promise<User> {
    return this.request<User>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(id: string): Promise<void> {
    await this.request(`/users/${id}`, { method: 'DELETE' });
  }

  // Role management endpoints
  async getRoles(): Promise<Role[]> {
    return this.request<Role[]>('/roles');
  }

  async createRole(roleData: Omit<Role, 'id'>): Promise<Role> {
    return this.request<Role>('/roles', {
      method: 'POST',
      body: JSON.stringify(roleData),
    });
  }

  // Site management endpoints
  async getSites(params?: { page?: number; limit?: number; q?: string }): Promise<SitesResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.q) queryParams.set('q', params.q);
    
    const queryString = queryParams.toString();
    const url = queryString ? `/sites?${queryString}` : '/sites';
    
    return this.request<SitesResponse>(url);
  }

  async getSiteById(id: string): Promise<Site> {
    return this.request<Site>(`/sites/${id}`);
  }

  async createSite(siteData: Omit<Site, 'id' | 'createdAt'>): Promise<Site> {
    return this.request<Site>('/sites', {
      method: 'POST',
      body: JSON.stringify(siteData),
    });
  }

  async updateSite(id: string, siteData: Partial<Omit<Site, 'id' | 'createdAt'>>): Promise<Site> {
    return this.request<Site>(`/sites/${id}`, {
      method: 'PUT',
      body: JSON.stringify(siteData),
    });
  }

  async deleteSite(id: string): Promise<void> {
    await this.request(`/sites/${id}`, { method: 'DELETE' });
  }

  // Content management API functions
  async getEditableFiles(siteId: string): Promise<{
    files: Array<{
      path: string;
      type: 'markdown' | 'json' | 'sqlite' | 'asset';
      size: number;
      lastModified: string;
    }>;
    timestamp: string;
  }> {
    return this.request<any>(`/engine/sites/${siteId}/files`);
  }

  async getFileContent(siteId: string, filePath: string): Promise<{
    content: string;
    path: string;
    timestamp: string;
  }> {
    return this.request<any>(`/engine/sites/${siteId}/files/${encodeURIComponent(filePath)}`);
  }

  async updateFileContent(siteId: string, filePath: string, content: string, commitMessage?: string): Promise<{
    message: string;
    path: string;
    commitHash: string | null;
    timestamp: string;
  }> {
    return this.request<any>(`/engine/sites/${siteId}/files/${encodeURIComponent(filePath)}`, {
      method: 'PUT',
      body: JSON.stringify({ content, commitMessage }),
    });
  }

  async createFile(siteId: string, filePath: string, content: string, commitMessage?: string): Promise<{
    message: string;
    path: string;
    commitHash: string | null;
    timestamp: string;
  }> {
    return this.request<any>(`/engine/sites/${siteId}/files`, {
      method: 'POST',
      body: JSON.stringify({ path: filePath, content, commitMessage }),
    });
  }

  async deleteFile(siteId: string, filePath: string): Promise<{
    message: string;
    path: string;
    commitHash: string | null;
    timestamp: string;
  }> {
    return this.request<any>(`/engine/sites/${siteId}/files/${encodeURIComponent(filePath)}`, {
      method: 'DELETE',
    });
  }

  // Health check
  async getHealth(): Promise<{
    status: string;
    timestamp: string;
    service: string;
  }> {
    return this.request<any>('/health');
  }
}

// Create singleton instance
export const apiClient = new ApiClient();

// Export API client as default
export default apiClient;