import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate, useLocation, Link } from "react-router-dom";
import vinLogo from "../../assets/Vin.jfif";
import "./Login.css";

function Login() {
  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    // Check if we were redirected from registration with a success message
    if (location.state?.message) {
      setSuccess(location.state.message);
      // Clear the message from location state to prevent showing again on refresh
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await login(credentials);
    if (result.success) {
      navigate("/");
    } else {
      setError(result.message);
    }
    setLoading(false);
  };

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="login-container">
      <div className="login-background">
        <img src={vinLogo} alt="VinFast Background" className="background-image" />
      </div>
      <div className="login-form-container">
        <div className="login-form">
          <div className="login-header">
            <img
              src={vinLogo}
              alt="VinFast Logo"
              className="logo"
            />
            <h2>Hệ thống quản lý bảo hành</h2>
            <p>Đăng nhập để tiếp tục</p>
          </div>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                className="form-control"
                value={credentials.email}
                onChange={handleChange}
                required
                placeholder="Nhập email của bạn"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Mật khẩu
              </label>
              <input
                type="password"
                id="password"
                name="password"
                className="form-control"
                value={credentials.password}
                onChange={handleChange}
                required
                placeholder="Nhập mật khẩu"
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary login-btn"
              disabled={loading}
            >
              {loading ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>
            
            <div className="form-footer">
              <p>
                Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
              </p>
            </div>
          </form>

          <div className="demo-accounts">
            <h4>Tài khoản demo:</h4>
            <div className="demo-account">
              <strong>SC Staff:</strong> sc_staff@vinfast.com / password123
            </div>
            <div className="demo-account">
              <strong>SC Technician:</strong> sc_tech@vinfast.com / password123
            </div>
            <div className="demo-account">
              <strong>EVM Staff:</strong> evm_staff@vinfast.com / password123
            </div>
            <div className="demo-account">
              <strong>Admin:</strong> admin@vinfast.com / password123
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
