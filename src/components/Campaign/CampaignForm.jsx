import React, { useState, useEffect } from "react";
import "./CampaignForm.css";

function CampaignForm({ campaign, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    CampaignsTypeName: "",
    StartDate: "",
    EndDate: "",
    RequiredParts: "",
    Description: "",
    Status: "Chuẩn bị",
    CompletedVehicles: 0,
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (campaign) {
      setFormData(campaign);
    }
  }, [campaign]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (formData.CompletedVehicles < 0) {
      newErrors.CompletedVehicles = "Số xe hoàn thành không được âm";//PQD_fix_v1
    }
    if (!formData.CampaignsTypeName.trim()) {
      newErrors.CampaignsTypeName = "Tên chiến dịch là bắt buộc";
    }

    if (!formData.StartDate) {
      newErrors.StartDate = "Ngày bắt đầu là bắt buộc";
    }

    if (!formData.EndDate) {
      newErrors.EndDate = "Ngày kết thúc là bắt buộc";
    }

    if (
      formData.StartDate &&
      formData.EndDate &&
      formData.StartDate >= formData.EndDate
    ) {
      newErrors.EndDate = "Ngày kết thúc phải sau ngày bắt đầu";
    }

    if (!formData.Description.trim()) {
      newErrors.Description = "Mô tả là bắt buộc";
    }

    if (!formData.RequiredParts.trim()) {
      newErrors.RequiredParts = "Phụ tùng yêu cầu là bắt buộc";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSave(formData);
    }
  };

  return (
    <div className="campaign-form card">
      <div className="card-header">
        <h3 className="card-title">
          {campaign ? "Chỉnh sửa chiến dịch" : "Tạo chiến dịch mới"}
        </h3>
      </div>

      <form onSubmit={handleSubmit} className="form">
        <div className="form-section">
          <h4 className="section-title">Thông tin cơ bản</h4>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Tên chiến dịch *</label>
              <input
                type="text"
                name="CampaignsTypeName"
                value={formData.CampaignsTypeName}
                onChange={handleChange}
                className={`form-control ${
                  errors.CampaignsTypeName ? "error" : ""
                }`}
                placeholder="Cập nhật phần mềm BMS"
              />
              {errors.CampaignsTypeName && (
                <div className="error-message">{errors.CampaignsTypeName}</div>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">Trạng thái</label>
              <select
                name="Status"
                value={formData.Status}
                onChange={handleChange}
                className="form-control"
              >
                <option value="Chuẩn bị">Chuẩn bị</option>
                <option value="Đang triển khai">Đang triển khai</option>
                <option value="Tạm dừng">Tạm dừng</option>
                <option value="Hoàn thành">Hoàn thành</option>
                <option value="Hủy bỏ">Hủy bỏ</option>
              </select>
            </div>
          </div>

          <div className="form-row">
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
            <div className="form-group">
              <label className="form-label">Ngày kết thúc *</label>
              <input
                type="date"
                name="EndDate"
                value={formData.EndDate}
                onChange={handleChange}
                className={`form-control ${errors.EndDate ? "error" : ""}`}
              />
              {errors.EndDate && (
                <div className="error-message">{errors.EndDate}</div>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Phụ tùng yêu cầu *</label>
              <input
                type="text"
                name="RequiredParts"
                value={formData.RequiredParts}
                onChange={handleChange}
                className={`form-control ${
                  errors.RequiredParts ? "error" : ""
                }`}
                placeholder="Cáp sạc Type 2, Pin Lithium..."
              />
              {errors.RequiredParts && (
                <div className="error-message">{errors.RequiredParts}</div>
              )}
              <small className="form-help">
                Nhập "Không" nếu không cần phụ tùng
              </small>
            </div>
            {/* ✅ Thêm ô nhập số xe hoàn thành */}
            <div className="form-group">
              <label className="form-label">Số xe hoàn thành</label>
              <input
                type="number"
                name="CompletedVehicles"
                value={formData.CompletedVehicles}
                onChange={handleChange}
                min="0"
                className={`form-control ${
                  errors.CompletedVehicles ? "error" : ""
                }`}
                placeholder="Nhập số xe đã hoàn thành"
              />
              {errors.CompletedVehicles && (
                <div className="error-message">{errors.CompletedVehicles}</div>
              )}
            </div>
          </div>
          

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Mô tả chi tiết *</label>
              <textarea
                name="Description"
                value={formData.Description}
                onChange={handleChange}
                className={`form-control ${errors.Description ? "error" : ""}`}
                placeholder="Mô tả chi tiết về chiến dịch, mục đích, đối tượng áp dụng..."
                rows="4"
              />
              {errors.Description && (
                <div className="error-message">{errors.Description}</div>
              )}
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" onClick={onCancel} className="btn btn-outline">
            Hủy
          </button>
          <button type="submit" className="btn btn-primary">
            {campaign ? "Cập nhật" : "Tạo chiến dịch"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CampaignForm;
