import React, { useState, useEffect } from "react";
import { serviceCampaignAPI, recallAPI } from "../../services/api";
import "../../styles/ReportForm.css";

function ReportForm({ report, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    ReportName: "",
    Description: "",
    Error: "",
    Image: "",
    referenceType: "", // "RECALL" or "SERVICE_CAMPAIGN"
    recallId: "",
    serviceCampaignId: "",
  });

  const [errors, setErrors] = useState({});
  const [recalls, setRecalls] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  useEffect(() => {
    if (report) {
      setFormData(report);
    }
    fetchRecallsAndCampaigns();
  }, [report]);

  const fetchRecallsAndCampaigns = async () => {
    try {
      setLoadingOptions(true);
      
      // Fetch recalls using recallAPI
      // console.log("Fetching recalls...");
      const recallsRes = await recallAPI.getAllRecalls({ page: 0, size: 100 });
      // console.log("Recalls response:", recallsRes);
      if (recallsRes.success && recallsRes.data) {
        const recallsData = recallsRes.data.content || recallsRes.data || [];
        // console.log("Recalls data:", recallsData);
        setRecalls(recallsData);
      }

      // Fetch campaigns
      // console.log("Fetching campaigns...");
      const campaignsRes = await serviceCampaignAPI.getAllCampaigns({ page: 0, size: 100 });
      // console.log("Campaigns response:", campaignsRes);
      if (campaignsRes.success && campaignsRes.data) {
        const campaignsData = campaignsRes.data.content || campaignsRes.data || [];
        // console.log("Campaigns data:", campaignsData);
        setCampaigns(campaignsData);
      }
    } catch (error) {
      console.error("Error fetching recalls/campaigns:", error);
    } finally {
      setLoadingOptions(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // If changing reference type, clear the IDs
    if (name === "referenceType") {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        recallId: "",
        serviceCampaignId: "",
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
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

    if (!formData.ReportName.trim()) {
      newErrors.ReportName = "Tên báo cáo là bắt buộc";
    }

    if (!formData.Description.trim()) {
      newErrors.Description = "Mô tả là bắt buộc";
    } else if (formData.Description.length < 10) {
      newErrors.Description = "Mô tả phải có ít nhất 10 ký tự";
    }

    // Validate reference type and ID
    if (formData.referenceType) {
      if (formData.referenceType === "RECALL" && !formData.recallId) {
        newErrors.recallId = "Vui lòng chọn một Recall";
      }
      if (formData.referenceType === "SERVICE_CAMPAIGN" && !formData.serviceCampaignId) {
        newErrors.serviceCampaignId = "Vui lòng chọn một Service Campaign";
      }
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
          </div>

          <div className="form-group">
            <label className="form-label">Mô tả *</label>
            <textarea
              name="Description"
              value={formData.Description}
              onChange={handleChange}
              className={`form-control ${errors.Description ? "error" : ""}`}
              placeholder="Mô tả chi tiết về báo cáo..."
              rows="4"
            />
            {errors.Description && (
              <div className="error-message">{errors.Description}</div>
            )}
          </div>

          <div className="form-row">
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
          <h4 className="section-title">Liên kết Recall/Campaign (Tùy chọn)</h4>
          
          <div className="form-group">
            <label className="form-label">Chọn loại liên kết</label>
            <select
              name="referenceType"
              value={formData.referenceType}
              onChange={handleChange}
              className="form-control"
            >
              <option value="">-- Không liên kết --</option>
              <option value="RECALL">Recall</option>
              <option value="SERVICE_CAMPAIGN">Service Campaign</option>
            </select>
          </div>

          {formData.referenceType === "RECALL" && (
            <div className="form-group">
              <label className="form-label">Chọn Recall *</label>
              <select
                name="recallId"
                value={formData.recallId}
                onChange={handleChange}
                className={`form-control ${errors.recallId ? "error" : ""}`}
                disabled={loadingOptions}
              >
                <option value="">-- Chọn Recall --</option>
                {recalls.map((recall) => (
                  <option key={recall.id} value={recall.id}>
                    {recall.name || recall.id}
                  </option>
                ))}
              </select>
              {errors.recallId && (
                <div className="error-message">{errors.recallId}</div>
              )}
            </div>
          )}

          {formData.referenceType === "SERVICE_CAMPAIGN" && (
            <div className="form-group">
              <label className="form-label">Chọn Service Campaign *</label>
              <select
                name="serviceCampaignId"
                value={formData.serviceCampaignId}
                onChange={handleChange}
                className={`form-control ${errors.serviceCampaignId ? "error" : ""}`}
                disabled={loadingOptions}
              >
                <option value="">-- Chọn Campaign --</option>
                {campaigns.map((campaign) => (
                  <option key={campaign.id} value={campaign.id}>
                    {campaign.campaignName || campaign.name || campaign.id || "Unnamed"}
                  </option>
                ))}
              </select>
              {errors.serviceCampaignId && (
                <div className="error-message">{errors.serviceCampaignId}</div>
              )}
            </div>
          )}
        </div>

        <div className="form-section">
          <h4 className="section-title">Hình ảnh (Tùy chọn)</h4>
          <div className="form-group">
            <label className="form-label">URL Hình ảnh</label>
            <input
              type="text"
              name="Image"
              value={formData.Image}
              onChange={handleChange}
              className="form-control"
              placeholder="https://example.com/image.jpg"
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="button" onClick={onCancel} className="btn btn-outline">
            Hủy
          </button>
          <button type="submit" className="btn btn-primary">
            {report ? "Cập nhật" : "Tạo báo cáo"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ReportForm;
