import { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import PropTypes from "prop-types";
import authService from "../services/AuthService";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in from localStorage
    const storedUser = localStorage.getItem("user");
    if (storedUser && authService.isAuthenticated()) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Error parsing stored user:", error);
        localStorage.removeItem("user");
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (credentials) => {
    try {
      // Validate credentials trước khi gọi API
      const validation = authService.validateCredentials(credentials);
      if (!validation.isValid) {
        const errorMessage = validation.errors.map(e => e.message).join(', ');
        return {
          success: false,
          message: errorMessage,
          errors: validation.errors
        };
      }

      // Gọi API login
      const response = await authService.login(credentials);

      if (response.success && response.data) {
        // Lấy role đầu tiên từ danh sách roles
        const primaryRole = response.data.roles && response.data.roles.length > 0
          ? response.data.roles[0]
          : null;

        // Tạo user object theo format cũ để tương thích với code hiện tại
        const userInfo = {
          name: response.data.username,
          email: credentials.email,
          role: primaryRole,
          roles: response.data.roles,
        };

        setUser(userInfo);
        localStorage.setItem("user", JSON.stringify(userInfo));

        return {
          success: true,
          message: response.message
        };
      } else {
        return {
          success: false,
          message: response.message || "Email hoặc mật khẩu không đúng",
          errors: response.errors
        };
      }
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        message: "Không thể kết nối đến server. Vui lòng thử lại sau."
      };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
      setUser(null);
    } catch (error) {
      console.error("Logout error:", error);
      // Vẫn clear state dù có lỗi
      setUser(null);
    }
  }, []);

  const updateProfile = useCallback((updatedInfo) => {
    setUser((currentUser) => {
      const updatedUser = { ...currentUser, ...updatedInfo };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      return updatedUser;
    });
    return { success: true };
  }, []);

  const value = useMemo(
    () => ({
      user,
      login,
      logout,
      loading,
      updateProfile,
    }),
    [user, loading, login, logout, updateProfile]
  );

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
