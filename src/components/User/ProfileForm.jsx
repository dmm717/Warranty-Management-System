import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import "./ProfileForm.css";

function ProfileForm() {
  const { user, updateProfile } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    currentPassword: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState("");
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        currentPassword: "",
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
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

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

    if (!formData.phone.trim()) {
      newErrors.phone = "Số điện thoại là bắt buộc";
    } else if (!/^[0-9]{10,11}$/.test(formData.phone)) {
      newErrors.phone = "Số điện thoại không hợp lệ";
    }

    // Only validate password fields if the user is trying to change password
    if (formData.password) {
      if (formData.password.length < 6) {
        newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự";
      }

      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Xác nhận mật khẩu không khớp";
      }

      if (!formData.currentPassword) {
        newErrors.currentPassword = "Vui lòng nhập mật khẩu hiện tại";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    if (validateForm()) {
      const updatedInfo = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
      };

      // In a real application, we would verify the current password
      // before allowing a password change
      if (formData.password) {
        updatedInfo.password = formData.password;
      }

      try {
        const result = updateProfile(updatedInfo);
        if (result.success) {
          setMessage({
            type: "success",
            text: "Thông tin cá nhân đã được cập nhật thành công",
          });
          // Clear password fields after successful update
          setFormData((prev) => ({
            ...prev,
            currentPassword: "",
            password: "",
            confirmPassword: "",
          }));
        } else {
          setMessage({
            type: "error",
            text: result.message || "Có lỗi xảy ra",
          });
        }
      } catch (error) {
        setMessage({
          type: "error",
          text: "Có lỗi xảy ra khi cập nhật thông tin",
        });
      }
    }
  };

  const getPasswordRequirements = () => {
    const requirements = [
      { text: "Ít nhất 6 ký tự", met: formData.password.length >= 6 },
      { text: "Chứa chữ hoa", met: /[A-Z]/.test(formData.password) },
      { text: "Chứa chữ thường", met: /[a-z]/.test(formData.password) },
      { text: "Chứa số", met: /\d/.test(formData.password) },
    ];
    return requirements;
  };

  return (
    <div className="card profile-form-container">
      <h2 className="card-title">Thông tin cá nhân</h2>
      {message.text && (
        <div
          className={`alert ${
            message.type === "success" ? "alert-success" : "alert-error"
          }`}
        >
          {message.text}
        </div>
      )}
      <form onSubmit={handleSubmit} className="user-form">
        <div className="form-section">
          <h3>Thông tin cơ bản</h3>

          <div className="form-group">
            <label htmlFor="name">Họ tên</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={errors.name ? "error" : ""}
            />
            {errors.name && <div className="error-message">{errors.name}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={errors.email ? "error" : ""}
            />
            {errors.email && (
              <div className="error-message">{errors.email}</div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="phone">Số điện thoại</label>
            <input
              type="text"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className={errors.phone ? "error" : ""}
            />
            {errors.phone && (
              <div className="error-message">{errors.phone}</div>
            )}
          </div>

          <div className="form-group">
            <label>Phòng ban</label>
            <input
              type="text"
              value={user?.department || ""}
              disabled
              className="disabled"
            />
          </div>

          <div className="form-group">
            <label>Vai trò</label>
            <input
              type="text"
              value={user?.role || ""}
              disabled
              className="disabled"
            />
          </div>
        </div>

        <div className="form-section">
          <h3>Thay đổi mật khẩu</h3>
          <div className="form-group">
            <label htmlFor="currentPassword">Mật khẩu hiện tại</label>
            <input
              type="password"
              id="currentPassword"
              name="currentPassword"
              value={formData.currentPassword}
              onChange={handleChange}
              className={errors.currentPassword ? "error" : ""}
            />
            {errors.currentPassword && (
              <div className="error-message">{errors.currentPassword}</div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password">Mật khẩu mới</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={errors.password ? "error" : ""}
            />
            {formData.password && (
              <div className={`password-strength ${passwordStrength}`}>
                Độ mạnh:{" "}
                {passwordStrength === "weak"
                  ? "Yếu"
                  : passwordStrength === "medium"
                  ? "Trung bình"
                  : "Mạnh"}
              </div>
            )}
            {errors.password && (
              <div className="error-message">{errors.password}</div>
            )}
          </div>

          {formData.password && (
            <div className="password-requirements">
              {getPasswordRequirements().map((req, index) => (
                <div
                  key={index}
                  className={`requirement ${req.met ? "met" : "not-met"}`}
                >
                  {req.met ? "✓" : "○"} {req.text}
                </div>
              ))}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="confirmPassword">Xác nhận mật khẩu mới</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={errors.confirmPassword ? "error" : ""}
            />
            {errors.confirmPassword && (
              <div className="error-message">{errors.confirmPassword}</div>
            )}
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary">
            Lưu thay đổi
          </button>
        </div>
      </form>
    </div>
  );
}

export default ProfileForm;
