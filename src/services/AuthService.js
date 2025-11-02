/* ==========================================================================
   AUTHENTICATION SERVICE - Xử lý các API liên quan đến xác thực
   ========================================================================== */

import { authAPI } from "./api";
import apiService from "./ApiService";

class AuthService {
  /**
   * Đăng ký user mới
   * @param {object} userData - { username, email, password, role, phoneNumber }
   * @returns {Promise<object>} Response với thông tin user mới
   */
  async register(userData) {
    try {
      const response = await authAPI.register(userData);

      if (response.success && response.data) {
        return {
          success: true,
          data: response.data,
          message: response.message || "Đăng ký thành công",
        };
      } else {
        return {
          success: false,
          message: response.message || "Đăng ký thất bại",
          errors: response.errors,
        };
      }
    } catch {
      return {
        success: false,
        message: "Không thể kết nối đến server. Vui lòng thử lại sau.",
        errors: null,
      };
    }
  }

  /**
   * Đăng nhập
   * @param {object} credentials - { email, password, rememberMe }
   * @returns {Promise<object>} Response với token và thông tin user
   */
  async login(credentials) {
    // Gọi API login - ApiService đã xử lý network errors
    const response = await authAPI.login(credentials);

    // Nếu đăng nhập thành công
    if (response.success && response.data) {
      // Tìm token trong response với nhiều tên khác nhau
      let token = null;
      if (response.data.token) {
        token = response.data.token;
      } else if (response.data.accessToken) {
        token = response.data.accessToken;
      } else if (response.data.jwt) {
        token = response.data.jwt;
      }

      // Lưu token nếu tìm thấy
      if (token) {
        apiService.setToken(token, credentials.rememberMe);
      }

      // Lưu thông tin user
      const userInfo = {
        id: response.data.userId || response.data.id,
        username: response.data.username,
        email: response.data.email,
        role: response.data.role,
        roles: response.data.roles || [response.data.role],
        phoneNumber: response.data.phoneNumber,
        branchOffice: response.data.branchOffice,
      };

      // Lưu vào localStorage hoặc sessionStorage dựa vào rememberMe
      const storage = credentials.rememberMe ? localStorage : sessionStorage;
      storage.setItem("user", JSON.stringify(userInfo));

      return {
        success: true,
        data: userInfo,
        message: response.message || "Đăng nhập thành công",
      };
    }

    // Nếu đăng nhập thất bại - trả về message từ backend
    return {
      success: false,
      message: response.message || "Đăng nhập thất bại. Vui lòng thử lại.",
      errors: response.errors,
    };
  }

  /**
   * Đăng xuất
   */
  async logout() {
    try {
      // Gọi API logout nếu backend có endpoint này
      // await apiService.post('/auth/logout');

      // Xóa token và thông tin user từ cả localStorage và sessionStorage
      apiService.removeToken();
      localStorage.removeItem("user");
      sessionStorage.removeItem("user");

      return { success: true };
    } catch {
      // Vẫn xóa token local dù API call fail
      apiService.removeToken();
      localStorage.removeItem("user");
      sessionStorage.removeItem("user");
      return { success: true };
    }
  }

  /**
   * Kiểm tra trạng thái đăng nhập
   */
  isAuthenticated() {
    return apiService.hasValidToken();
  }

  /**
   * Lấy thông tin user từ localStorage hoặc sessionStorage
   */
  getCurrentUser() {
    const userStr =
      localStorage.getItem("user") || sessionStorage.getItem("user");
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  }

  /**
   * Refresh token (nếu backend support)
   */
  async refreshToken() {
    try {
      const response = await apiService.post("/auth/refresh");

      if (response.success && response.data) {
        apiService.setToken(response.data.token);
        return { success: true };
      }

      return { success: false };
    } catch {
      return { success: false };
    }
  }

  /**
   * Format errors từ backend để hiển thị
   */
  formatErrors(errors) {
    if (!errors || !Array.isArray(errors)) {
      return null;
    }

    return errors.map((error) => ({
      field: error.field,
      message: error.message,
    }));
  }

  /**
   * Validate email format (client-side)
   */
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate login credentials (client-side)
   */
  validateCredentials(credentials) {
    const errors = [];

    if (!credentials.email || credentials.email.trim() === "") {
      errors.push({
        field: "email",
        message: "Email không được để trống",
      });
    } else if (!this.validateEmail(credentials.email)) {
      errors.push({
        field: "email",
        message: "Email không đúng định dạng",
      });
    }

    if (!credentials.password || credentials.password.trim() === "") {
      errors.push({
        field: "password",
        message: "Mật khẩu không được để trống",
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

// Tạo singleton instance
const authService = new AuthService();
export default authService;
