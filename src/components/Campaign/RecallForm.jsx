import React, { useState, useEffect } from "react";
import "../../styles/RecallForm.css";
import { VEHICLE_TYPES } from "../../constants";
import { useAuth } from "../../contexts/AuthContext";

function RecallForm({ recall, onSave, onCancel }) {
  const { user } = useAuth();
  const isEVMAdmin = user?.role === "EVM_ADMIN";
  const isEVMStaff = user?.role === "EVM_STAFF";

  const [formData, setFormData] = useState({
    RecallName: "",
    VehicleModels: [],
    StartDate: "",
    PartsRequired: "",
    IssueDescription: "",
    RequiredExpertise: "",
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
        StartDate: recall.StartDate || "",
        PartsRequired: recall.PartsRequired || "",
        IssueDescription: recall.IssueDescription || "",
        RequiredExpertise: recall.RequiredExpertise || "",
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

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.RecallName.trim()) {
      newErrors.RecallName = "Tên recall là bắt buộc";
    }
    
    if (formData.VehicleModels.length === 0) {
      newErrors.VehicleModels = "Phải chọn ít nhất một model xe";
    }
    
    if (!formData.StartDate) {
      newErrors.StartDate = "Thời gian bắt đầu là bắt buộc";
    }
    
    if (!formData.IssueDescription.trim()) {
      newErrors.IssueDescription = "Mô tả vấn đề là bắt buộc";
    } else if (formData.IssueDescription.length < 20) {
      newErrors.IssueDescription = "Mô tả vấn đề phải có ít nhất 20 ký tự";
    }
    
    if (!formData.RequiredExpertise.trim()) {
      newErrors.RequiredExpertise = "Chuyên môn để sửa là bắt buộc";
    }
    
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = validateForm();

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    onSave(formData);
  };

  return (
    <div className="recall-form card">
      <div className="card-header">
        <h3 className="card-title">
          {recall ? "Chỉnh sửa Recall" : "Tạo Recall mới"}
        </h3>
        <p className="card-subtitle">
          Thông tin recall và danh sách xe bị ảnh hưởng
        </p>
      </div>
      <form onSubmit={handleSubmit} className="form">
        {/* Tên Recall */}
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

        {/* List Vehicle Models */}
        <div className="form-section">
          <h4 className="section-title">Danh sách xe bị ảnh hưởng *</h4>
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

        {/* Thời gian bắt đầu */}
        <div className="form-section">
          <div className="form-group">
            <label className="form-label">Thời gian bắt đầu *</label>
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

        {/* Phụ tùng cần thiết (nullable) */}
        <div className="form-section">
          <div className="form-group">
            <label className="form-label">Phụ tùng cần thiết</label>
            <input
              type="text"
              name="PartsRequired"
              value={formData.PartsRequired}
              onChange={handleChange}
              className="form-control"
              placeholder="VD: Pin, Cáp sạc, Động cơ... (Có thể để trống)"
            />
            <small className="form-help">
              Để trống nếu chưa xác định được phụ tùng cụ thể
            </small>
          </div>
        </div>

        {/* Issue Description */}
        <div className="form-section">
          <div className="form-group">
            <label className="form-label">Mô tả vấn đề (Issue Description) *</label>
            <textarea
              name="IssueDescription"
              value={formData.IssueDescription}
              onChange={handleChange}
              className={`form-control ${
                errors.IssueDescription ? "error" : ""
              }`}
              placeholder="Mô tả chi tiết vấn đề kỹ thuật cần recall..."
              rows="5"
            />
            {errors.IssueDescription && (
              <div className="error-message">{errors.IssueDescription}</div>
            )}
            <small className="form-help">Tối thiểu 20 ký tự</small>
          </div>
        </div>

        {/* Chuyên môn để sửa */}
        <div className="form-section">
          <div className="form-group">
            <label className="form-label">Chuyên môn để sửa *</label>
            <textarea
              name="RequiredExpertise"
              value={formData.RequiredExpertise}
              onChange={handleChange}
              className={`form-control ${
                errors.RequiredExpertise ? "error" : ""
              }`}
              placeholder="VD: Kỹ thuật viên điện, Kỹ thuật viên pin, Kỹ thuật viên cơ khí..."
              rows="3"
            />
            {errors.RequiredExpertise && (
              <div className="error-message">{errors.RequiredExpertise}</div>
            )}
            <small className="form-help">
              Mô tả chuyên môn/kỹ năng cần thiết để xử lý recall này
            </small>
          </div>
        </div>

        {/* Warning */}
        <div className="recall-warning">
          <div className="warning-icon">⚠️</div>
          <div className="warning-content">
            <h5>Lưu ý quan trọng</h5>
            <ul>
              <li>Thông tin recall sẽ được gửi đến tất cả Service Centers</li>
              <li>Danh sách xe bị ảnh hưởng sẽ được tự động cập nhật</li>
              <li>Đảm bảo mô tả vấn đề và chuyên môn cần thiết rõ ràng</li>
            </ul>
          </div>
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <button type="button" onClick={onCancel} className="btn btn-outline">
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

export default RecallForm;
