/* ==========================================================================
   PASSWORD RECOVERY SERVICE - Xử lý các API liên quan đến khôi phục mật khẩu
   ========================================================================== */

import { passwordRecoveryAPI } from './api';

class PasswordRecoveryService {
  /**
   * Gửi OTP qua email
   * @param {string} email - Email của user cần reset password
   * @returns {Promise<object>} Response với thông báo
   */
  async sendOTP(email) {
    try {
      // Validate email
      if (!email || !this.validateEmail(email)) {
        return {
          success: false,
          message: 'Email không hợp lệ',
        };
      }

      const response = await passwordRecoveryAPI.sendOTP(email);

      if (response.success) {
        return {
          success: true,
          message: response.message || 'OTP đã được gửi đến email của bạn',
        };
      } else {
        return {
          success: false,
          message: response.message || 'Không thể gửi OTP. Vui lòng thử lại.',
        };
      }
    } catch (error) {
      console.error('Send OTP error:', error);
      return {
        success: false,
        message: 'Không thể kết nối đến server. Vui lòng thử lại sau.',
      };
    }
  }

  /**
   * Xác thực OTP
   * @param {string} email - Email của user
   * @param {string} otp - Mã OTP
   * @returns {Promise<object>} Response với kết quả xác thực
   */
  async verifyOTP(email, otp) {
    try {
      // Validate inputs
      if (!email || !this.validateEmail(email)) {
        return {
          success: false,
          message: 'Email không hợp lệ',
        };
      }

      if (!otp || otp.trim().length === 0) {
        return {
          success: false,
          message: 'Vui lòng nhập mã OTP',
        };
      }

      const response = await passwordRecoveryAPI.verifyOTP(email, otp.trim());

      if (response.success) {
        return {
          success: true,
          message: response.message || 'Xác thực OTP thành công',
        };
      } else {
        return {
          success: false,
          message: response.message || 'Mã OTP không chính xác hoặc đã hết hạn',
        };
      }
    } catch (error) {
      console.error('Verify OTP error:', error);
      return {
        success: false,
        message: 'Không thể xác thực OTP. Vui lòng thử lại.',
      };
    }
  }

  /**
   * Đặt lại mật khẩu mới
   * @param {string} email - Email của user
   * @param {string} newPassword - Mật khẩu mới
   * @returns {Promise<object>} Response với kết quả
   */
  async resetPassword(email, newPassword) {
    try {
      // Validate inputs
      if (!email || !this.validateEmail(email)) {
        return {
          success: false,
          message: 'Email không hợp lệ',
        };
      }

      // Validate password
      const passwordValidation = this.validatePassword(newPassword);
      if (!passwordValidation.isValid) {
        return {
          success: false,
          message: passwordValidation.message,
        };
      }

      const response = await passwordRecoveryAPI.resetPassword(email, newPassword);

      if (response.success) {
        return {
          success: true,
          message: response.message || 'Đặt lại mật khẩu thành công',
        };
      } else {
        return {
          success: false,
          message: response.message || 'Không thể đặt lại mật khẩu. Vui lòng thử lại.',
        };
      }
    } catch (error) {
      console.error('Reset password error:', error);
      return {
        success: false,
        message: 'Không thể đặt lại mật khẩu. Vui lòng thử lại sau.',
      };
    }
  }

  /**
   * Quy trình hoàn chỉnh: Gửi OTP -> Xác thực -> Reset Password
   * @param {string} email - Email của user
   * @returns {Promise<object>} Response với trạng thái và bước tiếp theo
   */
  async initiateForgotPassword(email) {
    const result = await this.sendOTP(email);
    
    if (result.success) {
      return {
        success: true,
        message: result.message,
        nextStep: 'verify-otp',
        email: email,
      };
    }

    return result;
  }

  /**
   * Validate email format
   */
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate password strength
   */
  validatePassword(password) {
    if (!password || password.trim().length === 0) {
      return {
        isValid: false,
        message: 'Mật khẩu không được để trống',
      };
    }

    if (password.length < 6) {
      return {
        isValid: false,
        message: 'Mật khẩu phải có ít nhất 6 ký tự',
      };
    }

    // Có thể thêm các rule khác nếu cần
    // - Chứa ít nhất 1 chữ hoa
    // - Chứa ít nhất 1 số
    // - Chứa ít nhất 1 ký tự đặc biệt

    return {
      isValid: true,
      message: 'Mật khẩu hợp lệ',
    };
  }

  /**
   * Format OTP input (remove spaces, etc.)
   */
  formatOTP(otp) {
    if (!otp) return '';
    return otp.replace(/\s/g, '').toUpperCase();
  }
}

// Tạo singleton instance
const passwordRecoveryService = new PasswordRecoveryService();
export default passwordRecoveryService;
