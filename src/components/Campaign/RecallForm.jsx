import React, { useState, useEffect } from "react";
import "../../styles/RecallForm.css";
import { VEHICLE_TYPES, REGIONS, PRODUCTION_YEARS } from "../../constants";
import { useAuth } from "../../contexts/AuthContext";

function RecallForm({ recall, onSave, onCancel }) {
  const { user } = useAuth();
  const isEVMAdmin = user?.role === "EVM_ADMIN";
  const isEVMStaff = user?.role === "EVM_STAFF";

  const [formData, setFormData] = useState({
    RecallName: "",
    VehicleModels: [],
    ProductionYears: [],
    Regions: [],
    IssueDescription: "",
    RequiredAction: "",
    PartsRequired: "",
    StartDate: "",
    Status: "Pending",
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (recall) {
      setFormData({
        RecallName: recall.RecallName || "",
        VehicleModels: Array.isArray(recall.VehicleModels)
          ? recall.VehicleModels
          : [],
        ProductionYears: Array.isArray(recall.ProductionYears)
          ? recall.ProductionYears
          : [],
        Regions: Array.isArray(recall.Regions) ? recall.Regions : [],
        IssueDescription: recall.IssueDescription || "",
        RequiredAction: recall.RequiredAction || "",
        PartsRequired: recall.PartsRequired || "",
        StartDate: recall.StartDate || "",
        Status: recall.Status || "Pending",
      });
    }
  }, [recall]);

  const handleArrayToggle = (fieldName, value) => {
    setFormData((prev) => {
      const currentArray = prev[fieldName];
      const isSelected = currentArray.includes(value);

      return {
        ...prev,
        [fieldName]: isSelected
          ? currentArray.filter((item) => item !== value)
          : [...currentArray, value],
      };
    });

    if (errors[fieldName]) {
      setErrors((prev) => ({ ...prev, [fieldName]: "" }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateAdminForm = () => {
    const newErrors = {};
    if (!formData.RecallName.trim()) {
      newErrors.RecallName = "Tên recall là bắt buộc";
    }
    if (formData.VehicleModels.length === 0) {
      newErrors.VehicleModels = "Phải chọn ít nhất một model xe";
    }
    if (formData.ProductionYears.length === 0) {
      newErrors.ProductionYears = "Phải chọn ít nhất một năm sản xuất";
    }
    if (formData.Regions.length === 0) {
      newErrors.Regions = "Phải chọn ít nhất một quận";
    }
    return newErrors;
  };

  const validateStaffForm = () => {
    const newErrors = {};
    if (!formData.IssueDescription.trim()) {
      newErrors.IssueDescription = "Mô tả vấn đề là bắt buộc";
    } else if (formData.IssueDescription.length < 20) {
      newErrors.IssueDescription = "Mô tả vấn đề phải có ít nhất 20 ký tự";
    }
    if (!formData.RequiredAction.trim()) {
      newErrors.RequiredAction = "Hành động yêu cầu là bắt buộc";
    }
    if (!formData.PartsRequired.trim()) {
      newErrors.PartsRequired = "Phụ tùng yêu cầu là bắt buộc";
    }
    if (!formData.StartDate) {
      newErrors.StartDate = "Ngày bắt đầu là bắt buộc";
    }
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    let newErrors = {};

    if (isEVMAdmin) {
      newErrors = validateAdminForm();
    } else if (isEVMStaff) {
      newErrors = validateStaffForm();
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    onSave(formData);
  };

  if (isEVMAdmin) {
    return (
      <div className="recall-form card">
        <div className="card-header">
          <h3 className="card-title">
            {recall ? "Chỉnh sửa Recall" : "Tạo Recall mới"}
          </h3>
          <p className="card-subtitle">EVM_ADMIN - Thông tin cơ bản</p>
        </div>
        <form onSubmit={handleSubmit} className="form">
          <div className="form-section">
            <div className="form-group">
              <label className="form-label">Tên Recall *</label>
              <input
                type="text"
                name="RecallName"
                value={formData.RecallName}
                onChange={handleChange}
                className={`form-control ${errors.RecallName ? "error" : ""}`}
                placeholder="VD: Thu hồi pin VF8 2023"
              />
              {errors.RecallName && (
                <div className="error-message">{errors.RecallName}</div>
              )}
            </div>
          </div>
          <div className="form-section">
            <h4 className="section-title">Model xe bị ảnh hưởng *</h4>
            <div className="checkbox-grid">
              {VEHICLE_TYPES.map((vehicle) => (
                <label key={vehicle.id} className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={formData.VehicleModels.includes(vehicle.id)}
                    onChange={() =>
                      handleArrayToggle("VehicleModels", vehicle.id)
                    }
                  />
                  <span>{vehicle.name}</span>
                </label>
              ))}
            </div>
            {errors.VehicleModels && (
              <div className="error-message">{errors.VehicleModels}</div>
            )}
          </div>
          <div className="form-section">
            <h4 className="section-title">Phạm vi năm sản xuất *</h4>
            <div className="checkbox-grid">
              {PRODUCTION_YEARS.map((year) => (
                <label key={year.value} className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={formData.ProductionYears.includes(year.value)}
                    onChange={() =>
                      handleArrayToggle("ProductionYears", year.value)
                    }
                  />
                  <span>{year.label}</span>
                </label>
              ))}
            </div>
            {errors.ProductionYears && (
              <div className="error-message">{errors.ProductionYears}</div>
            )}
          </div>
          <div className="form-section">
            <h4 className="section-title">Quận áp dụng (TP.HCM) *</h4>
            <div className="checkbox-grid regions-grid">
              {REGIONS.map((region) => (
                <label key={region.value} className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={formData.Regions.includes(region.value)}
                    onChange={() => handleArrayToggle("Regions", region.value)}
                  />
                  <span>{region.label}</span>
                </label>
              ))}
            </div>
            {errors.Regions && (
              <div className="error-message">{errors.Regions}</div>
            )}
          </div>
          <div className="form-actions">
            <button
              type="button"
              onClick={onCancel}
              className="btn btn-outline"
            >
              Hủy
            </button>
            <button type="submit" className="btn btn-danger">
              {recall ? "Cập nhật Recall" : "Tạo Recall"}
            </button>
          </div>
        </form>
      </div>
    );
  }

  if (isEVMStaff) {
    return (
      <div className="recall-form card">
        <div className="card-header">
          <h3 className="card-title">Bổ sung thông tin Recall</h3>
          <p className="card-subtitle">EVM_STAFF - Chi tiết vấn đề và xử lý</p>
        </div>
        <form onSubmit={handleSubmit} className="form">
          <div className="form-section info-section">
            <h4 className="section-title">Thông tin cơ bản (từ EVM_ADMIN)</h4>
            <div className="info-grid">
              <div className="info-item">
                <label>Tên Recall:</label>
                <span>{recall?.RecallName || "N/A"}</span>
              </div>
              <div className="info-item">
                <label>Model xe:</label>
                <span>
                  {recall?.VehicleModels?.map((id) => {
                    const vehicle = VEHICLE_TYPES.find((v) => v.id === id);
                    return vehicle?.name;
                  }).join(", ") || "N/A"}
                </span>
              </div>
              <div className="info-item">
                <label>Năm sản xuất:</label>
                <span>{recall?.ProductionYears?.join(", ") || "N/A"}</span>
              </div>
              <div className="info-item">
                <label>Quận:</label>
                <span>
                  {recall?.Regions?.map((r) => {
                    const region = REGIONS.find((reg) => reg.value === r);
                    return region?.label;
                  }).join(", ") || "N/A"}
                </span>
              </div>
            </div>
          </div>
          <div className="form-section">
            <h4 className="section-title">Chi tiết vấn đề</h4>
            <div className="form-group">
              <label className="form-label">Mô tả vấn đề *</label>
              <textarea
                name="IssueDescription"
                value={formData.IssueDescription}
                onChange={handleChange}
                className={`form-control ${
                  errors.IssueDescription ? "error" : ""
                }`}
                placeholder="Mô tả chi tiết vấn đề..."
                rows="4"
              />
              {errors.IssueDescription && (
                <div className="error-message">{errors.IssueDescription}</div>
              )}
              <small className="form-help">Ít nhất 20 ký tự</small>
            </div>
            <div className="form-group">
              <label className="form-label">Hành động yêu cầu *</label>
              <textarea
                name="RequiredAction"
                value={formData.RequiredAction}
                onChange={handleChange}
                className={`form-control ${
                  errors.RequiredAction ? "error" : ""
                }`}
                placeholder="Các bước xử lý..."
                rows="3"
              />
              {errors.RequiredAction && (
                <div className="error-message">{errors.RequiredAction}</div>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">Phụ tùng yêu cầu *</label>
              <input
                type="text"
                name="PartsRequired"
                value={formData.PartsRequired}
                onChange={handleChange}
                className={`form-control ${
                  errors.PartsRequired ? "error" : ""
                }`}
                placeholder="Pin, Cáp sạc..."
              />
              {errors.PartsRequired && (
                <div className="error-message">{errors.PartsRequired}</div>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">Ngày bắt đầu *</label>
              <input
                type="date"
                name="StartDate"
                value={formData.StartDate}
                onChange={handleChange}
                className={`form-control ${errors.StartDate ? "error" : ""}`}
              />
              {errors.StartDate && (
                <div className="error-message">{errors.StartDate}</div>
              )}
            </div>
          </div>
          <div className="recall-warning">
            <div className="warning-icon">⚠️</div>
            <div className="warning-content">
              <h5>Lưu ý quan trọng</h5>
              <ul>
                <li>Thông tin sẽ được gửi đến Service Centers</li>
                <li>Đảm bảo mô tả chi tiết và rõ ràng</li>
              </ul>
            </div>
          </div>
          <div className="form-actions">
            <button
              type="button"
              onClick={onCancel}
              className="btn btn-outline"
            >
              Hủy
            </button>
            <button type="submit" className="btn btn-danger">
              Lưu thông tin
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="recall-form card">
      <div className="card-header">
        <h3 className="card-title">Không có quyền truy cập</h3>
      </div>
      <div className="form-section">
        <p>Bạn không có quyền tạo hoặc chỉnh sửa Recall.</p>
        <button onClick={onCancel} className="btn btn-outline">
          Quay lại
        </button>
      </div>
    </div>
  );
}

export default RecallForm;
