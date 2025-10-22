import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import vinLogo from "../../assets/Vin.jfif";
import { toast } from "react-toastify";
import "../../styles/Login.css";

function Login() {
  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    setLoading(true);

    try {
      const result = await login(credentials);
      if (result.success) {
        toast.success("Đăng nhập thành công!");
        navigate("/");
      } else {
        // Hiển thị lỗi chi tiết hơn
        setError(result.message);
        toast.error(result.message);

        // Xử lý field-specific errors từ backend
        if (result.errors && Array.isArray(result.errors)) {
          const errors = {};
          for (const err of result.errors) {
            if (err.field) {
              errors[err.field] = err.message;
            }
          }
          setFieldErrors(errors);
        }
      }
    } catch (err) {
      console.error("Login error:", err);
      const errorMsg = "Đã xảy ra lỗi không mong muốn. Vui lòng thử lại.";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCredentials({
      ...credentials,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  return (
    <div className="login-container">
      <div className="login-background">
        <img
          src={vinLogo}
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

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                className={`form-control ${fieldErrors.email ? "error" : ""}`}
                value={credentials.email}
                onChange={handleChange}
                placeholder="Nhập email của bạn"
              />
              {fieldErrors.email && (
                <div className="field-error">{fieldErrors.email}</div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Mật khẩu
              </label>
              <input
                type="password"
                id="password"
                name="password"
                className={`form-control ${
                  fieldErrors.password ? "error" : ""
                }`}
                value={credentials.password}
                onChange={handleChange}
                placeholder="Nhập mật khẩu"
              />
              {fieldErrors.password && (
                <div className="field-error">{fieldErrors.password}</div>
              )}
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
