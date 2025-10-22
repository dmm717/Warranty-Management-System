import React, { useState, useEffect } from "react";
import {
  USER_ROLES,
  ROLE_DESCRIPTIONS,
  PASSWORD_REQUIREMENTS,
} from "../../constants";
import "../../styles/UserForm.css";

function UserForm({ user, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "",
    department: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState("");

  const roles = USER_ROLES;

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        phone: user.phone,
        password: "",
        confirmPassword: "",
      });
    }
  }, [user]);

  const checkPasswordStrength = (password) => {
    if (password.length < 6) return "weak";
    if (password.length < 8 || !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password))
      return "medium";
    return "strong";
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "role") {
      const selectedRole = roles.find((r) => r.value === value);
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        department: selectedRole ? selectedRole.department : prev.department,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    if (name === "password") {
      setPasswordStrength(checkPasswordStrength(value));
    }

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Tên người dùng là bắt buộc";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email là bắt buộc";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email không hợp lệ";
    }

    if (!formData.role) {
      newErrors.role = "Vai trò là bắt buộc";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Số điện thoại là bắt buộc";
    } else if (!/^[0-9]{10,11}$/.test(formData.phone)) {
      newErrors.phone = "Số điện thoại không hợp lệ";
    }

    if (!user) {
      // Chỉ validate password khi tạo mới
      if (!formData.password) {
        newErrors.password = "Mật khẩu là bắt buộc";
      } else if (formData.password.length < 6) {
        newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự";
      }

      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Xác nhận mật khẩu không khớp";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      const submitData = { ...formData };
      if (user && !submitData.password) {
        delete submitData.password;
        delete submitData.confirmPassword;
      }
      onSave(submitData);
    }
  };

  const getPasswordRequirements = () => {
    return PASSWORD_REQUIREMENTS.map((req) => ({
      text: req.text,
      met: req.regex.test(formData.password),
    }));
  };

  const getRoleInfo = (roleValue) => {
    return ROLE_DESCRIPTIONS[roleValue] || "";
  };

  return (
    <div className="user-form card">
      <div className="card-header">
        <h3 className="card-title">
          {user ? "Chỉnh sửa người dùng" : "Thêm người dùng mới"}
        </h3>
      </div>

      <form onSubmit={handleSubmit} className="form">
        <div className="form-section">
          <h4 className="section-title">Thông tin cá nhân</h4>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Tên người dùng *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`form-control ${errors.name ? "error" : ""}`}
                placeholder="Nguyễn Văn An"
              />
              {errors.name && (
                <div className="error-message">{errors.name}</div>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`form-control ${errors.email ? "error" : ""}`}
                placeholder="example@vinfast.com"
              />
              {errors.email && (
                <div className="error-message">{errors.email}</div>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Số điện thoại *</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className={`form-control ${errors.phone ? "error" : ""}`}
                placeholder="0912345678"
              />
              {errors.phone && (
                <div className="error-message">{errors.phone}</div>
              )}
            </div>
          </div>
        </div>

        <div className="form-section">
          <h4 className="section-title">Thông tin công việc</h4>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Vai trò *</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className={`form-control ${errors.role ? "error" : ""}`}
              >
                <option value="">Chọn vai trò</option>
                {roles.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
              {errors.role && (
                <div className="error-message">{errors.role}</div>
              )}
              {formData.role && (
                <div className="role-info">
                  <div className="role-info-title">Quyền hạn:</div>
                  <div className="role-info-desc">
                    {getRoleInfo(formData.role)}
                  </div>
                </div>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">Phòng ban</label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="form-control"
                placeholder="Phòng ban"
                readOnly
              />
              <small className="form-help">Tự động cập nhật theo vai trò</small>
            </div>
          </div>
        </div>

        {!user && (
          <div className="form-section">
            <h4 className="section-title">Thông tin bảo mật</h4>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Mật khẩu *</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`form-control ${errors.password ? "error" : ""}`}
                  placeholder="Nhập mật khẩu"
                />
                {errors.password && (
                  <div className="error-message">{errors.password}</div>
                )}
                {formData.password && (
                  <div className="password-strength">
                    <div className="strength-meter">
                      <div
                        className={`strength-fill strength-${passwordStrength}`}
                      ></div>
                    </div>
                    <div className={`strength-text ${passwordStrength}`}>
                      Độ mạnh:{" "}
                      {passwordStrength === "weak"
                        ? "Yếu"
                        : passwordStrength === "medium"
                        ? "Trung bình"
                        : "Mạnh"}
                    </div>
                  </div>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Xác nhận mật khẩu *</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`form-control ${
                    errors.confirmPassword ? "error" : ""
                  }`}
                  placeholder="Nhập lại mật khẩu"
                />
                {errors.confirmPassword && (
                  <div className="error-message">{errors.confirmPassword}</div>
                )}
              </div>
            </div>

            {formData.password && (
              <div className="password-requirements">
                <h5>Yêu cầu mật khẩu:</h5>
                <ul className="requirement-list">
                  {getPasswordRequirements().map((req, index) => (
                    <li
                      key={index}
                      className={`requirement-item ${
                        req.met ? "met" : "unmet"
                      }`}
                    >
                      {req.text}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="user-preview">
          <h4 className="section-title">Xem trước người dùng</h4>
          <div className="preview-content">
            <div className="preview-header">
              <div className="preview-avatar">
                {formData.name.charAt(0).toUpperCase() || "U"}
              </div>
              <div className="preview-info">
                <h5>{formData.name || "Tên người dùng"}</h5>
                <div className="preview-email">
                  {formData.email || "email@example.com"}
                </div>
              </div>
            </div>
            <div className="preview-details">
              <div className="preview-detail">
                <div className="preview-label">Vai trò</div>
                <div className="preview-value">
                  {roles.find((r) => r.value === formData.role)?.label ||
                    "Chưa chọn"}
                </div>
              </div>
              <div className="preview-detail">
                <div className="preview-label">Phòng ban</div>
                <div className="preview-value">
                  {formData.department || "Chưa xác định"}
                </div>
              </div>
              <div className="preview-detail">
                <div className="preview-label">Điện thoại</div>
                <div className="preview-value">
                  {formData.phone || "Chưa nhập"}
                </div>
              </div>
              <div className="preview-detail">
                <div className="preview-label">Trạng thái</div>
                <div className="preview-value">Hoạt động</div>
              </div>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" onClick={onCancel} className="btn btn-outline">
            Hủy
          </button>
          <button type="submit" className="btn btn-primary">
            {user ? "Cập nhật người dùng" : "Tạo người dùng"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default UserForm;
