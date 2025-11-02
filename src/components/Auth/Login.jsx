import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import vinLogo from "../../assets/logovin.png";
import loginPage from "../../assets/loginPage.jpg";
import { toast } from "react-toastify";
import "../../styles/Login.css";

function Login() {
  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [hasError, setHasError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setHasError(false);
    setLoading(true);

    try {
      const result = await login(credentials);
      if (result.success) {
        toast.success("Đăng nhập thành công!", {
          position: "top-right",
          autoClose: 2000,
        });
        navigate("/");
      } else {
        // Chỉ dùng toast để hiển thị lỗi
        setHasError(true);
        toast.error(result.message || "Đăng nhập thất bại", {
          position: "top-right",
          autoClose: 4000,
        });

        // Auto remove highlight sau 3 giây
        setTimeout(() => setHasError(false), 3000);
      }
    } catch (err) {
      console.error("Login error:", err);
      setHasError(true);
      toast.error("Đã xảy ra lỗi không mong muốn. Vui lòng thử lại.", {
        position: "top-right",
        autoClose: 4000,
      });
      setTimeout(() => setHasError(false), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    // Clear error state khi user bắt đầu nhập lại
    if (hasError) {
      setHasError(false);
    }
    setCredentials({
      ...credentials,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  return (
    <div className="login-container">
      <div className="login-background">
        <img
          src={loginPage}
          alt="VinFast Background"
          className="background-image"
        />
      </div>
      <div className="login-form-container">
        <div className="login-form">
          <div className="login-header">
            <img src={vinLogo} alt="VinFast Logo" className="logo" />
            <h2>Hệ thống quản lý bảo hành</h2>
            <p>Đăng nhập để tiếp tục</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                className={`form-control ${hasError ? "input-error" : ""}`}
                value={credentials.email}
                onChange={handleChange}
                placeholder="Nhập email của bạn"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Mật khẩu
              </label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  className={`form-control ${hasError ? "input-error" : ""}`}
                  value={credentials.password}
                  onChange={handleChange}
                  placeholder="Nhập mật khẩu"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showPassword ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="form-group remember-me">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={credentials.rememberMe}
                  onChange={handleChange}
                />
                <span>Ghi nhớ đăng nhập</span>
              </label>
            </div>

            <button
              type="submit"
              className="btn btn-primary login-btn"
              disabled={loading}
            >
              {loading ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;
