/* ==========================================================================
   API SERVICE - Centralized API communication handler
   ========================================================================== */

class ApiService {
  constructor() {
    // Base URL của backend API
    this.baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
    this.apiPrefix = '/api';
  }

  /**
   * Gọi API với fetch
   * @param {string} endpoint - API endpoint (ví dụ: '/auth/login')
   * @param {object} options - Fetch options
   * @returns {Promise} Response data
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${this.apiPrefix}${endpoint}`;

    // Default headers
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Thêm token vào header nếu có
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers,
      mode: 'cors', // Enable CORS
      // Không dùng credentials: 'include' để tránh conflict với CORS backend
      // credentials: 'omit', // Default behavior
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      console.log(`API ${options.method || 'GET'} ${endpoint}:`, {
        status: response.status,
        ok: response.ok,
        data: data
      });

      // Xử lý response theo format backend
      if (response.ok) {
        return {
          success: true,
          data: data.data,
          message: data.message,
        };
      } else {
        // Response có lỗi
        return {
          success: false,
          status: response.status,
          message: data.message || 'An error occurred',
          errors: data.errors || null,
        };
      }
    } catch (error) {
      // Network error hoặc error khác
      console.error('API Request Error:', error);

      // Kiểm tra loại lỗi để trả về message phù hợp
      let errorMessage = 'Không thể kết nối đến server';

      if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
        errorMessage = 'Không thể kết nối đến server. Vui lòng kiểm tra:\n1. Backend đã chạy chưa?\n2. URL backend có đúng không? (' + this.baseURL + ')';
      } else if (error.name === 'AbortError') {
        errorMessage = 'Yêu cầu bị hủy do timeout';
      }

      return {
        success: false,
        message: errorMessage,
        errors: null,
      };
    }
  }

  /**
   * GET request
   */
  async get(endpoint, options = {}) {
    return this.request(endpoint, {
      method: 'GET',
      ...options,
    });
  }

  /**
   * POST request
   */
  async post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      ...options,
    });
  }

  /**
   * PUT request
   */
  async put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
      ...options,
    });
  }

  /**
   * DELETE request
   */
  async delete(endpoint, options = {}) {
    return this.request(endpoint, {
      method: 'DELETE',
      ...options,
    });
  }

  /**
   * Lưu token vào localStorage hoặc sessionStorage
   */
  setToken(token, rememberMe = false) {
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem('authToken', token);
  }

  /**
   * Lấy token từ localStorage hoặc sessionStorage
   */
  getToken() {
    return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
  }

  /**
   * Xóa token khỏi cả localStorage và sessionStorage
   */
  removeToken() {
    localStorage.removeItem('authToken');
    sessionStorage.removeItem('authToken');
  }

  /**
   * Kiểm tra token còn hợp lệ không
   */
  hasValidToken() {
    const token = this.getToken();
    if (!token) return false;

    try {
      // Decode JWT token để kiểm tra expiry
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiryTime = payload.exp * 1000; // Convert to milliseconds
      return Date.now() < expiryTime;
    } catch {
      // Token không hợp lệ hoặc không thể decode
      return false;
    }
  }
}

// Tạo singleton instance
const apiService = new ApiService();
export default apiService;
