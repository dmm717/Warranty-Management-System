import React, { useState, useEffect } from "react";
import "../../styles/CampaignForm.css";

function CampaignForm({ campaign, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    CampaignsTypeName: "",
    StartDate: "",
    EndDate: "",
    RequiredParts: "",
    Description: "",
    Status: "PLANNED", // Luôn là PLANNED khi EVM_ADMIN tạo mới
    CompletedVehicles: 0,
    YearScope: "", // Phạm vi năm sản xuất (VD: 2020-2023)
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (campaign) {
      // Map campaign data to form fields (handle both camelCase and PascalCase)
      setFormData({
        CampaignsTypeName:
          campaign.CampaignsTypeName ||
          campaign.campaignsTypeName ||
          campaign.campaignName ||
          "",
        StartDate: campaign.StartDate || campaign.startDate || "",
        EndDate: campaign.EndDate || campaign.endDate || "",
        RequiredParts: campaign.RequiredParts || campaign.requiredParts || "",
        Description: campaign.Description || campaign.description || "",
        Status: campaign.Status || campaign.status || "PLANNED",
        CompletedVehicles:
          campaign.CompletedVehicles || campaign.completedVehicles || 0,
        YearScope: campaign.YearScope || campaign.yearScope || "",
      });
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
      newErrors.CompletedVehicles = "Số xe hoàn thành không được âm"; //PQD_fix_v1
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

    if (!formData.Description || !formData.Description.trim()) {
      newErrors.Description = "Mô tả là bắt buộc";
    }

    if (!formData.RequiredParts || !formData.RequiredParts.trim()) {
      newErrors.RequiredParts = "Phụ tùng yêu cầu là bắt buộc";
    }

    if (!formData.YearScope || !formData.YearScope.trim()) {
      newErrors.YearScope = "Phạm vi năm sản xuất là bắt buộc";
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
          {campaign ? "Chỉnh sửa Service Campaign" : "Tạo Service Campaign mới"}
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
            {/* Status field - hidden, luôn là PLANNED khi tạo mới */}
            {campaign && (
              <div className="form-group">
                <label className="form-label">Trạng thái</label>
                <input
                  type="text"
                  value={
                    campaign.status === "PLANNED"
                      ? "Chuẩn bị"
                      : campaign.status === "ACTIVE"
                      ? "Đang triển khai"
                      : campaign.status === "PAUSED"
                      ? "Dừng"
                      : campaign.status === "COMPLETED"
                      ? "Hoàn thành"
                      : campaign.status === "CANCELLED"
                      ? "Hủy bỏ"
                      : campaign.status
                  }
                  className="form-control"
                  disabled
                  readOnly
                />
                <small className="form-help">
                  Trạng thái được thay đổi thông qua danh sách chiến dịch
                </small>
              </div>
            )}
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

            {/* ✅ Thêm phạm vi năm sản xuất */}
            <div className="form-group">
              <label className="form-label">Phạm vi năm sản xuất *</label>
              <input
                type="text"
                name="YearScope"
                value={formData.YearScope}
                onChange={handleChange}
                className={`form-control ${errors.YearScope ? "error" : ""}`}
                placeholder="VD: 2020-2023 hoặc 2022"
              />
              {errors.YearScope && (
                <div className="error-message">{errors.YearScope}</div>
              )}
              <small className="form-help">
                Năm sản xuất của các dòng xe áp dụng chiến dịch
              </small>
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
            {campaign ? "Cập nhật" : "Tạo Service Campaign"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CampaignForm;
