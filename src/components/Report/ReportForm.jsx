import React, { useState, useEffect } from "react";
import "./ReportForm.css";

function ReportForm({ report, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    ReportName: "",
    Description: "",
    ReportType: "",
    Priority: "Trung bình",
    Error: "",
    CampaignsID: "",
    Recall_ID: "",
    EVM_Staff_ID: "",
  });

  const [errors, setErrors] = useState({});

  const reportTypes = [
    "Warranty Analysis",
    "Campaign Performance",
    "Recall Progress",
    "Parts Analysis",
    "Service Quality",
    "Customer Satisfaction",
    "Monthly Summary",
    "Annual Review",
  ];

  useEffect(() => {
    if (report) {
      setFormData(report);
    }
  }, [report]);

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

    if (!formData.ReportName.trim()) {
      newErrors.ReportName = "Tên báo cáo là bắt buộc";
    }

    if (!formData.Description.trim()) {
      newErrors.Description = "Mô tả là bắt buộc";
    } else if (formData.Description.length < 10) {
      newErrors.Description = "Mô tả phải có ít nhất 10 ký tự";
    }

    if (!formData.ReportType) {
      newErrors.ReportType = "Loại báo cáo là bắt buộc";
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
    <div className="report-form card">
      <div className="card-header">
        <h3 className="card-title">
          {report ? "Chỉnh sửa báo cáo" : "Tạo báo cáo mới"}
        </h3>
      </div>

      <form onSubmit={handleSubmit} className="form">
        <div className="form-section">
          <h4 className="section-title">Thông tin cơ bản</h4>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Tên báo cáo *</label>
              <input
                type="text"
                name="ReportName"
                value={formData.ReportName}
                onChange={handleChange}
                className={`form-control ${errors.ReportName ? "error" : ""}`}
                placeholder="Báo cáo lỗi pin tháng 9/2024"
              />
              {errors.ReportName && (
                <div className="error-message">{errors.ReportName}</div>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">Loại báo cáo *</label>
              <select
                name="ReportType"
                value={formData.ReportType}
                onChange={handleChange}
                className={`form-control ${errors.ReportType ? "error" : ""}`}
              >
                <option value="">Chọn loại báo cáo</option>
                {reportTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              {errors.ReportType && (
                <div className="error-message">{errors.ReportType}</div>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Độ ưu tiên</label>
              <select
                name="Priority"
                value={formData.Priority}
                onChange={handleChange}
                className="form-control"
              >
                <option value="Thấp">Thấp</option>
                <option value="Trung bình">Trung bình</option>
                <option value="Cao">Cao</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Lỗi/Vấn đề</label>
              <input
                type="text"
                name="Error"
                value={formData.Error}
                onChange={handleChange}
                className="form-control"
                placeholder="Mô tả lỗi (nếu có)"
              />
              <small className="form-help">Để trống nếu không có lỗi</small>
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
                placeholder="Mô tả chi tiết nội dung và mục đích của báo cáo..."
                rows="4"
              />
              {errors.Description && (
                <div className="error-message">{errors.Description}</div>
              )}
              <small className="form-help">Ít nhất 10 ký tự</small>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h4 className="section-title">Liên kết (Tùy chọn)</h4>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">ID Chiến dịch</label>
              <input
                type="text"
                name="CampaignsID"
                value={formData.CampaignsID}
                onChange={handleChange}
                className="form-control"
                placeholder="SC001"
              />
              <small className="form-help">
                Liên kết với chiến dịch cụ thể
              </small>
            </div>
            <div className="form-group">
              <label className="form-label">ID Recall</label>
              <input
                type="text"
                name="Recall_ID"
                value={formData.Recall_ID}
                onChange={handleChange}
                className="form-control"
                placeholder="RC001"
              />
              <small className="form-help">Liên kết với recall cụ thể</small>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">ID Nhân viên EVM</label>
              <input
                type="text"
                name="EVM_Staff_ID"
                value={formData.EVM_Staff_ID}
                onChange={handleChange}
                className="form-control"
                placeholder="EVM001"
              />
              <small className="form-help">Nhân viên EVM phụ trách</small>
            </div>
          </div>
        </div>

        <div className="report-preview">
          <h4 className="section-title">Xem trước báo cáo</h4>
          <div className="preview-content">
            <div className="preview-header">
              <h5>{formData.ReportName || "Tên báo cáo"}</h5>
              <span className="preview-type">
                {formData.ReportType || "Loại báo cáo"}
              </span>
            </div>
            <div className="preview-body">
              <p>
                {formData.Description || "Mô tả báo cáo sẽ hiển thị ở đây..."}
              </p>
              {formData.Error && (
                <div className="preview-error">
                  <strong>Lỗi:</strong> {formData.Error}
                </div>
              )}
            </div>
            <div className="preview-meta">
              <span>Độ ưu tiên: {formData.Priority}</span>
              <span>Ngày tạo: {new Date().toLocaleDateString("vi-VN")}</span>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" onClick={onCancel} className="btn btn-outline">
            Hủy
          </button>
          <button type="submit" className="btn btn-primary">
            {report ? "Cập nhật báo cáo" : "Tạo báo cáo"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ReportForm;
