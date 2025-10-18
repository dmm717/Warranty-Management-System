/* ==========================================================================
   AUTHENTICATION SERVICE - Xử lý các API liên quan đến xác thực
   ========================================================================== */

import apiService from './ApiService';

class AuthService {
  /**
   * Đăng nhập
   * @param {object} credentials - { email, password }
   * @returns {Promise<object>} Response với token và thông tin user
   */
  async login(credentials) {
    try {
      const response = await apiService.post('/auth/login', credentials);

      if (response.success && response.data) {
        // Lưu token vào localStorage
        apiService.setToken(response.data.token);

        // Lưu thông tin user
        const userInfo = {
          username: response.data.username,
          roles: response.data.roles,
        };

        return {
          success: true,
          data: userInfo,
          message: response.message,
        };
      } else {
        return {
          success: false,
          message: response.message || 'Đăng nhập thất bại',
          errors: response.errors,
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: 'Không thể kết nối đến server. Vui lòng thử lại sau.',
        errors: null,
      };
    }
  }

  /**
   * Đăng xuất
   */
  async logout() {
    try {
      // Gọi API logout nếu backend có endpoint này
      // await apiService.post('/auth/logout');

      // Xóa token và thông tin user
      apiService.removeToken();
      localStorage.removeItem('user');

      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      // Vẫn xóa token local dù API call fail
      apiService.removeToken();
      localStorage.removeItem('user');
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
   * Lấy thông tin user từ localStorage
   */
  getCurrentUser() {
    const userStr = localStorage.getItem('user');
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
      const response = await apiService.post('/auth/refresh');

      if (response.success && response.data) {
        apiService.setToken(response.data.token);
        return { success: true };
      }

      return { success: false };
    } catch (error) {
      console.error('Refresh token error:', error);
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

    return errors.map(error => ({
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

    if (!credentials.email || credentials.email.trim() === '') {
      errors.push({
        field: 'email',
        message: 'Email không được để trống',
      });
    } else if (!this.validateEmail(credentials.email)) {
      errors.push({
        field: 'email',
        message: 'Email không đúng định dạng',
      });
    }

    if (!credentials.password || credentials.password.trim() === '') {
      errors.push({
        field: 'password',
        message: 'Mật khẩu không được để trống',
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
