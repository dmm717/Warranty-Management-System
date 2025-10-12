import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import vinLogo from "../../assets/Vin.jfif";
import "./Login.css";

function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "SC_Staff", // Default role
    department: "Service Center", // Default department
  });
  
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { register } = useAuth();
  
  const roles = [
    { value: "SC_Staff", label: "Nhân viên SC", department: "Service Center" },
    { value: "SC_Technician", label: "Kỹ thuật viên SC", department: "Service Center" },
    { value: "EVM_Staff", label: "Nhân viên EVM", department: "Manufacturing" },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === "role") {
      const selectedRole = roles.find(r => r.value === value);
      setFormData(prev => ({
        ...prev,
        [name]: value,
        department: selectedRole ? selectedRole.department : prev.department
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError("Tên người dùng là bắt buộc");
      return false;
    }
    
    if (!formData.email.trim()) {
      setError("Email là bắt buộc");
      return false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError("Email không hợp lệ");
      return false;
    }
    
    if (formData.password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự");
      return false;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError("Xác nhận mật khẩu không khớp");
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    if (validateForm()) {
      setLoading(true);
      
      try {
        const result = await register(formData);
        if (result.success) {
          navigate("/login", { state: { message: "Đăng ký thành công! Vui lòng đăng nhập." } });
        } else {
          setError(result.message || "Đăng ký không thành công");
        }
      } catch (error) {
        setError("Lỗi đăng ký: " + error.message);
      }
      
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-background">
        <img src={vinLogo} alt="VinFast Background" className="background-image" />
      </div>
      <div className="login-form-container">
        <div className="login-form register-form">
          <div className="login-header">
            <img
              src={vinLogo}
              alt="VinFast Logo"
              className="logo"
            />
            <h2>Hệ thống quản lý bảo hành</h2>
            <p>Đăng ký tài khoản mới</p>
          </div>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name" className="form-label">
                Họ tên
              </label>
              <input
                type="text"
                id="name"
                name="name"
                className="form-control"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Nhập họ tên của bạn"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                className="form-control"
                value={formData.email}
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
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Nhập mật khẩu"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">
                Xác nhận mật khẩu
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                className="form-control"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                placeholder="Nhập lại mật khẩu"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="role" className="form-label">
                Vai trò
              </label>
              <select
                id="role"
                name="role"
                className="form-control"
                value={formData.role}
                onChange={handleChange}
              >
                {roles.map(role => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="btn btn-primary login-btn"
              disabled={loading}
            >
              {loading ? "Đang đăng ký..." : "Đăng ký"}
            </button>
            
            <div className="form-footer">
              <p>
                Đã có tài khoản? <Link to="/login">Đăng nhập ngay</Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Register;
