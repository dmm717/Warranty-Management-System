import React, { useState, useEffect } from "react";
import {
  USER_ROLES,
  ROLE_DESCRIPTIONS,
  PASSWORD_REQUIREMENTS,
  REGIONS,
} from "../../constants";
import "../../styles/UserForm.css";

function UserForm({ user, currentUser, currentUserBranch, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "",
    department: "",
    phone: "",
    dateOfBirth: "",
    specialty: "", // Thêm field specialty cho SC_TECHNICAL
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState("");

  // Lọc roles theo currentUser
  const getAvailableRoles = () => {
    if (currentUser?.role === "SC_ADMIN") {
      // SC_ADMIN chỉ thấy SC_STAFF và SC_TECHNICAL
      return USER_ROLES.filter(
        (r) => r.value === "SC_STAFF" || r.value === "SC_TECHNICAL"
      );
    }
    // EVM_ADMIN thấy tất cả roles
    return USER_ROLES;
  };

  const roles = getAvailableRoles();

  useEffect(() => {
    if (user) {
      // Backend trả về: username, email, roles (Set), branchOffice, phoneNumber, dateOfBirth
      const userRole = user.roles && user.roles.length > 0 ? user.roles[0] : "";

      // Convert dateOfBirth from dd-MM-yyyy to yyyy-MM-dd for HTML date input
      let formattedDate = "";
      if (user.dateOfBirth) {
        // Backend format: "27-10-2025" hoặc "2025-10-27"
        if (user.dateOfBirth.includes("-")) {
          const parts = user.dateOfBirth.split("-");
          if (parts[0].length === 4) {
            // Already yyyy-MM-dd
            formattedDate = user.dateOfBirth;
          } else {
            // dd-MM-yyyy → yyyy-MM-dd
            formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
          }
        }
      }

      setFormData({
        name: user.username || "",
        email: user.email || "",
        role: userRole,
        department: user.branchOffice || "",
        phone: user.phoneNumber || "",
        dateOfBirth: formattedDate,
        specialty: user.specialty || "", // Load specialty khi edit
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
      let departmentValue = selectedRole
        ? selectedRole.department
        : formData.department;

      // Nếu SC_ADMIN tạo SC_STAFF/SC_TECHNICAL, tự động set chi nhánh của SC_ADMIN
      if (currentUser?.role === "SC_ADMIN" && !user && currentUserBranch) {
        if (value === "SC_STAFF" || value === "SC_TECHNICAL") {
          departmentValue = currentUserBranch;
        }
      }

      setFormData((prev) => ({
        ...prev,
        [name]: value,
        department: departmentValue,
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
    } else if (!/^[0-9]{10}$/.test(formData.phone)) {
      newErrors.phone = "Số điện thoại phải có đúng 10 chữ số";
    }

    // Chỉ SC roles mới bắt buộc branchOffice
    if (
      formData.role === "SC_ADMIN" ||
      formData.role === "SC_STAFF" ||
      formData.role === "SC_TECHNICAL"
    ) {
      if (!formData.department || !formData.department.trim()) {
        newErrors.department = "Khu vực là bắt buộc cho vai trò SC";
      }
    }

    // Specialty validation for SC_TECHNICAL
    if (formData.role === "SC_TECHNICAL") {
      if (!formData.specialty || !formData.specialty.trim()) {
        newErrors.specialty = "Chuyên môn là bắt buộc cho Kỹ thuật viên SC";
      }
    }

    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = "Ngày sinh là bắt buộc";
    } else {
      const birthDate = new Date(formData.dateOfBirth);
      const today = new Date();
      if (birthDate >= today) {
        newErrors.dateOfBirth = "Ngày sinh phải là ngày trong quá khứ";
      }
    }

    if (!user) {
      // Chỉ validate password khi tạo mới
      if (!formData.password) {
        newErrors.password = "Mật khẩu là bắt buộc";
      } else if (formData.password.length < 8) {
        newErrors.password = "Mật khẩu phải có ít nhất 8 ký tự";
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
              <small className="form-help">Phải có đúng 10 chữ số</small>
            </div>

            <div className="form-group">
              <label className="form-label">Ngày sinh *</label>
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                className={`form-control ${errors.dateOfBirth ? "error" : ""}`}
                max={new Date().toISOString().split("T")[0]}
              />
              {errors.dateOfBirth && (
                <div className="error-message">{errors.dateOfBirth}</div>
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

            {/* Chỉ SC roles mới có field Khu vực */}
            {(formData.role === "SC_ADMIN" ||
              formData.role === "SC_STAFF" ||
              formData.role === "SC_TECHNICAL") && (
              <div className="form-group">
                <label className="form-label">Khu vực *</label>
                {/* SC_ADMIN tạo SC_STAFF/SC_TECHNICAL: Hiển thị readonly branch */}
                {currentUser?.role === "SC_ADMIN" &&
                !user &&
                (formData.role === "SC_STAFF" ||
                  formData.role === "SC_TECHNICAL") ? (
                  <>
                    <input
                      type="text"
                      name="department"
                      value={formData.department}
                      className="form-control"
                      readOnly
                      disabled
                      style={{
                        backgroundColor: "#f1f5f9",
                        cursor: "not-allowed",
                      }}
                    />
                    <small className="form-help" style={{ color: "#3b82f6" }}>
                      🔒 Tự động gán chi nhánh của bạn: {currentUserBranch}
                    </small>
                  </>
                ) : (
                  <>
                    <select
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                      className={`form-control ${
                        errors.department ? "error" : ""
                      }`}
                      disabled={
                        currentUser?.role === "SC_ADMIN" &&
                        !user &&
                        (formData.role === "SC_STAFF" ||
                          formData.role === "SC_TECHNICAL")
                      }
                    >
                      <option value="">Chọn khu vực</option>
                      {REGIONS.filter((r) => r.value !== "ALL").map(
                        (region) => (
                          <option key={region.value} value={region.label}>
                            {region.label}
                          </option>
                        )
                      )}
                    </select>
                    {errors.department && (
                      <div className="error-message">{errors.department}</div>
                    )}
                    <small className="form-help">
                      Chọn quận/huyện khu vực hoạt động
                    </small>
                  </>
                )}
              </div>
            )}

            {/* Specialty field - Chỉ cho SC_TECHNICAL */}
            {formData.role === "SC_TECHNICAL" && (
              <div className="form-group">
                <label className="form-label">Chuyên môn *</label>
                <input
                  type="text"
                  name="specialty"
                  value={formData.specialty}
                  onChange={handleChange}
                  className={`form-control ${errors.specialty ? "error" : ""}`}
                  placeholder="Ví dụ: Sửa chữa động cơ điện, Bảo dưỡng pin"
                />
                {errors.specialty && (
                  <div className="error-message">{errors.specialty}</div>
                )}
                <small className="form-help">
                  Nhập chuyên môn của kỹ thuật viên
                </small>
              </div>
            )}
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
                {(formData.name || "U").charAt(0).toUpperCase()}
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
