/* ==========================================================================
   API SERVICE - Centralized API communication handler
   ========================================================================== */

class ApiService {
  constructor() {
    // Base URL của backend API
    this.baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
    this.apiPrefix = "/api";
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
      "Content-Type": "application/json",
      ...options.headers,
    };

    // CRITICAL: Skip Authorization header cho public endpoints
    const publicEndpoints = ["/auth/login", "/permissions/roles"];
    const isPublicEndpoint = publicEndpoints.some((path) =>
      endpoint.startsWith(path)
    );

    // Chỉ thêm token nếu KHÔNG phải public endpoint
    if (!isPublicEndpoint) {
      const token = this.getToken();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }

    const config = {
      ...options,
      headers,
      mode: "cors", // Enable CORS
      credentials: "omit", // Không gửi cookies
    };

    try {
      const response = await fetch(url, config);

      // Check if response has content
      const contentType = response.headers.get("content-type");
      const hasJsonContent =
        contentType && contentType.includes("application/json");

      let data = null;
      if (hasJsonContent && response.status !== 204) {
        // Only parse JSON if content-type is JSON and not 204 No Content
        const text = await response.text();
        if (text && text.trim().length > 0) {
          data = JSON.parse(text);
        }
      }

      // Xử lý response theo format backend
      if (response.ok) {
        // Backend có thể trả về 2 format:
        // Format 1: { success: true, data: {...}, message: "..." }
        // Format 2: { content: [...], totalElements: 10, ... } (Page response)
        // Format 3: Empty response (204 No Content)

        if (!data) {
          // Empty response - success without data
          return {
            success: true,
            data: null,
            message: "Success",
          };
        }

        // Kiểm tra nếu có data.data (format 1)
        if (data.data !== undefined) {
          return {
            success: true,
            data: data.data,
            message: data.message,
          };
        }

        // Nếu không có data.data, trả về data trực tiếp (format 2)
        return {
          success: true,
          data: data,
          message: data.message || "Success",
        };
      } else {
        // Response có lỗi

        // Xử lý 401 Unauthorized - KHÔNG tự động logout
        if (response.status === 401) {
          return {
            success: false,
            status: 401,
            message:
              data?.message ||
              "Không có quyền truy cập. Vui lòng kiểm tra lại.",
            errors: data?.errors || null,
          };
        }

        return {
          success: false,
          status: response.status,
          message: data?.message || "An error occurred",
          errors: data?.errors || null,
        };
      }
    } catch (error) {
      // Network error hoặc error khác
      // Kiểm tra loại lỗi để trả về message phù hợp
      let errorMessage = "Không thể kết nối đến server";

      if (error.name === "TypeError" && error.message === "Failed to fetch") {
        errorMessage =
          "Không thể kết nối đến server. Vui lòng kiểm tra:\n1. Backend đã chạy chưa?\n2. URL backend có đúng không? (" +
          this.baseURL +
          ")";
      } else if (error.name === "AbortError") {
        errorMessage = "Yêu cầu bị hủy do timeout";
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
      method: "GET",
      ...options,
    });
  }

  /**
   * POST request
   */
  async post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
      ...options,
    });
  }

  /**
   * PUT request
   */
  async put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
      ...options,
    });
  }

  /**
   * PATCH request
   */
  async patch(endpoint, data = null, options = {}) {
    const config = {
      method: "PATCH",
      ...options,
    };

    if (data) {
      config.body = JSON.stringify(data);
    }

    return this.request(endpoint, config);
  }

  /**
   * DELETE request
   */
  async delete(endpoint, options = {}) {
    return this.request(endpoint, {
      method: "DELETE",
      ...options,
    });
  }

  /**
   * Lưu token vào localStorage hoặc sessionStorage
   */
  setToken(token, rememberMe = false) {
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem("authToken", token);
  }

  /**
   * Lấy token từ localStorage hoặc sessionStorage
   */
  getToken() {
    return (
      localStorage.getItem("authToken") || sessionStorage.getItem("authToken")
    );
  }

  /**
   * Xóa token khỏi cả localStorage và sessionStorage
   */
  removeToken() {
    localStorage.removeItem("authToken");
    sessionStorage.removeItem("authToken");
  }

  /**
   * Kiểm tra token còn hợp lệ không
   */
  hasValidToken() {
    const token = this.getToken();
    if (!token) return false;

    try {
      // Decode JWT token để kiểm tra expiry
      const payload = JSON.parse(atob(token.split(".")[1]));
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
