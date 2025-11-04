import React, { useState, useEffect } from "react";
import { serviceCampaignAPI, recallAPI, warrantyClaimAPI } from "../../services/api";
import "../../styles/ReportForm.css";

function ReportForm({ report, onSave, onCancel, mode = "create" }) {
  const [formData, setFormData] = useState({
    ReportName: "",
    Description: "",
    Error: "",
    Image: "",
    referenceType: "", // "RECALL" or "SERVICE_CAMPAIGN" or "WARRANTY_CLAIM"
    recallId: "",
    serviceCampaignId: "",
    warrantyClaimId: "",
  });

  const [errors, setErrors] = useState({});
  const [recalls, setRecalls] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [warrantyClaims, setWarrantyClaims] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [imagePreview, setImagePreview] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (report) {
      // Determine referenceType from existing serviceCampaignId or recallId or warrantyClaimId
      let referenceType = "";
      if (report.serviceCampaignId) {
        referenceType = "SERVICE_CAMPAIGN";
      } else if (report.recallId) {
        referenceType = "RECALL";
      } else if (report.warrantyClaimId) {
        referenceType = "WARRANTY_CLAIM";
      }

      setFormData({
        ...report,
        referenceType: referenceType,
      });

      // Set image preview if report has image
      if (report.Image || report.image) {
        setImagePreview(report.Image || report.image);
      }
    }
    fetchRecallsAndCampaigns();
  }, [report]);

  // Check if report already has an assignment
  const hasExistingAssignment = report && (report.serviceCampaignId || report.recallId || report.warrantyClaimId);

  const fetchRecallsAndCampaigns = async () => {
    try {
      setLoadingOptions(true);
      
      const recallsRes = await recallAPI.getAllRecalls({ page: 0, size: 100 });
      if (recallsRes.success && recallsRes.data) {
        const recallsData = recallsRes.data.content || recallsRes.data || [];
        setRecalls(recallsData);
      }

      const campaignsRes = await serviceCampaignAPI.getAllCampaigns({ page: 0, size: 100 });
      if (campaignsRes.success && campaignsRes.data) {
        const campaignsData = campaignsRes.data.content || campaignsRes.data || [];
        setCampaigns(campaignsData);
      }

      const claimsRes = await warrantyClaimAPI.getAllClaims({ page: 0, size: 100 });
      if (claimsRes.success && claimsRes.data) {
        const claimsData = claimsRes.data.content || claimsRes.data || [];
        setWarrantyClaims(claimsData);
      }
    } catch (error) {
      console.error("Error fetching recalls/campaigns/claims:", error);
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
        warrantyClaimId: "",
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

  const handleImageFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setErrors(prev => ({ ...prev, Image: "Vui lòng chọn file ảnh" }));
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, Image: "Kích thước ảnh không được vượt quá 5MB" }));
      return;
    }

    try {
      setUploadingImage(true);
      
      // Convert to base64
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64String = event.target.result;
        setFormData(prev => ({ ...prev, Image: base64String }));
        setImagePreview(base64String);
        setUploadingImage(false);
      };
      reader.onerror = () => {
        setErrors(prev => ({ ...prev, Image: "Lỗi khi đọc file ảnh" }));
        setUploadingImage(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error converting image:", error);
      setErrors(prev => ({ ...prev, Image: "Không thể xử lý ảnh" }));
      setUploadingImage(false);
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
      if (formData.referenceType === "WARRANTY_CLAIM" && !formData.warrantyClaimId) {
        newErrors.warrantyClaimId = "Vui lòng chọn một Warranty Claim";
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
          {mode === "assign" ? "Assign Campaign/Recall" : report ? "Chỉnh sửa báo cáo" : "Tạo báo cáo mới"}
        </h3>
      </div>

      <form onSubmit={handleSubmit} className="form">
        {mode !== "assign" && (
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

          {mode === "edit" && (
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Trạng thái</label>
                <select
                  name="Status"
                  value={formData.Status || "PENDING"}
                  onChange={handleChange}
                  className="form-control"
                >
                  <option value="PENDING">Pending</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>
            </div>
          )}

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
        )}

        {mode === "assign" && (
          <div className="form-section">
            <h4 className="section-title">Assign Campaign/Recall/Warranty Claim</h4>
            
            {hasExistingAssignment && mode === "assign" && (
              <div className="assignment-warning">
                <strong>⚠️ Báo cáo này đã được assign!</strong>
                <small>
                  {report.serviceCampaignId && `Service Campaign: ${report.serviceCampaignId}`}
                  {report.recallId && `Recall: ${report.recallId}`}
                  {report.warrantyClaimId && `Warranty Claim: ${report.warrantyClaimId}`}
                </small>
                <small>Một báo cáo chỉ có thể assign cho một loại. Vui lòng chọn báo cáo khác.</small>
              </div>
            )}
            
            <div className="form-group">
              <label className="form-label">Chọn loại liên kết</label>
              <select
                name="referenceType"
                value={formData.referenceType}
                onChange={handleChange}
                className="form-control"
                disabled={hasExistingAssignment}
              >
                <option value="">-- Không liên kết --</option>
                <option value="RECALL">Recall</option>
                <option value="SERVICE_CAMPAIGN">Service Campaign</option>
                <option value="WARRANTY_CLAIM">Warranty Claim</option>
              </select>
              {hasExistingAssignment && (
                <small className="form-help" style={{ color: 'rgba(239, 68, 68, 0.8)' }}>
                  Không thể thay đổi vì báo cáo đã được assign
                </small>
              )}
            </div>

            {formData.referenceType === "RECALL" && (
            <div className="form-group">
              <label className="form-label">Chọn Recall *</label>
              <select
                name="recallId"
                value={formData.recallId}
                onChange={handleChange}
                className={`form-control ${errors.recallId ? "error" : ""}`}
                disabled={loadingOptions || hasExistingAssignment}
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
                disabled={loadingOptions || hasExistingAssignment}
              >
                <option value="">-- Chọn Campaign --</option>
                {campaigns.map((campaign) => (
                  <option key={campaign.campaignsId || campaign.id} value={campaign.campaignsId || campaign.id}>
                    {campaign.campaignsTypeName || campaign.campaignName || campaign.name || campaign.campaignsId || campaign.id || "Unnamed"}
                  </option>
                ))}
              </select>
              {errors.serviceCampaignId && (
                <div className="error-message">{errors.serviceCampaignId}</div>
              )}
            </div>
          )}

          {formData.referenceType === "WARRANTY_CLAIM" && (
            <div className="form-group">
              <label className="form-label">Chọn Warranty Claim *</label>
              <select
                name="warrantyClaimId"
                value={formData.warrantyClaimId}
                onChange={handleChange}
                className={`form-control ${errors.warrantyClaimId ? "error" : ""}`}
                disabled={loadingOptions || hasExistingAssignment}
              >
                <option value="">-- Chọn Warranty Claim --</option>
                {warrantyClaims.map((claim) => {
                  const claimId = claim.claimId || claim.id;
                  const vin = claim.vin || claim.vehicleVin || claim.vehicleVIN;
                  const customerName = claim.customerName || claim.ownerName;
                  
                  return (
                    <option key={claimId} value={claimId}>
                      {claimId}{vin ? ` - ${vin}` : ''}{customerName ? ` - ${customerName}` : ''}
                    </option>
                  );
                })}
              </select>
              {errors.warrantyClaimId && (
                <div className="error-message">{errors.warrantyClaimId}</div>
              )}
            </div>
          )}
          </div>
        )}

        {mode !== "assign" && (
        <div className="form-section">
          <h4 className="section-title">Hình ảnh (Tùy chọn)</h4>
          
          <div className="form-group">
            <label className="form-label">Tải ảnh lên</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageFileChange}
              className="form-control"
              disabled={uploadingImage}
            />
            {uploadingImage && (
              <small className="form-help" style={{ color: '#60A5FA' }}>
                Đang xử lý ảnh...
              </small>
            )}
            {errors.Image && (
              <div className="error-message">{errors.Image}</div>
            )}
            <small className="form-help">
              Chọn file ảnh (JPG, PNG, GIF). Tối đa 5MB
            </small>
          </div>

          {imagePreview ? (
            <div className="form-group">
              <label className="form-label">Xem trước</label>
              <div style={{ 
                marginTop: '8px', 
                borderRadius: '8px', 
                overflow: 'hidden',
                maxWidth: '300px',
                border: '1px solid rgba(255, 255, 255, 0.12)'
              }}>
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  style={{ width: '100%', display: 'block' }}
                />
              </div>
            </div>
          ) : (
            <div className="form-group">
              <label className="form-label">Xem trước</label>
              <div style={{ 
                marginTop: '8px', 
                padding: '40px 20px',
                borderRadius: '8px', 
                border: '1px dashed rgba(255, 255, 255, 0.2)',
                textAlign: 'center',
                color: 'rgba(255, 255, 255, 0.5)'
              }}>
                Chưa có ảnh
              </div>
            </div>
          )}

          
        </div>
        )}

        <div className="form-actions">
          <button type="button" onClick={onCancel} className="btn btn-outline">
            Hủy
          </button>
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={mode === "assign" && hasExistingAssignment}
          >
            {report ? "Cập nhật" : "Tạo báo cáo"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ReportForm;
