import React, { useState, useEffect } from "react";
import { Target, AlertTriangle } from "lucide-react";
import { serviceCampaignAPI, recallAPI } from "../../services/api";
import "../../styles/ReportDetail.css";

function ReportDetail({ report, onEdit, userRole }) {
  const [campaignName, setCampaignName] = useState("");
  const [recallName, setRecallName] = useState("");

  useEffect(() => {
    const fetchCampaignAndRecallNames = async () => {
      try {
        // Fetch campaign name if serviceCampaignId exists
        if (report.serviceCampaignId) {
          const campaignsRes = await serviceCampaignAPI.getAllCampaigns({ page: 0, size: 1000 });
          if (campaignsRes.success && campaignsRes.data) {
            const campaignsData = campaignsRes.data.content || campaignsRes.data || [];
            const campaign = campaignsData.find(c => c.campaignsId === report.serviceCampaignId);
            if (campaign) {
              setCampaignName(campaign.campaignsTypeName || campaign.campaignName || "Unnamed Campaign");
            }
          }
        }

        // Fetch recall name if recallId exists
        if (report.recallId) {
          const recallsRes = await recallAPI.getAllRecalls({ page: 0, size: 1000 });
          if (recallsRes.success && recallsRes.data) {
            const recallsData = recallsRes.data.content || recallsRes.data || [];
            const recall = recallsData.find(r => r.id === report.recallId);
            if (recall) {
              setRecallName(recall.name || "Unnamed Recall");
            }
          }
        }
      } catch (error) {
        console.error("Error fetching campaign/recall names:", error);
      }
    };

    if (report) {
      fetchCampaignAndRecallNames();
    }
  }, [report]);

  if (!report) return null;

  const getStatusBadge = (status) => {
    const statusMap = {
      "PENDING": { label: "Chờ duyệt", class: "status-pending" },
      "APPROVED": { label: "Đã duyệt", class: "status-completed" },
      "REJECTED": { label: "Từ chối", class: "status-rejected" },
      "IN_PROGRESS": { label: "Đang xử lý", class: "status-processing" },
      "COMPLETED": { label: "Hoàn thành", class: "status-completed" },
    };

    const statusInfo = statusMap[status] || { label: status, class: "status-pending" };

    return (
      <span className={`status-badge ${statusInfo.class}`}>
        {statusInfo.label}
      </span>
    );
  };

  const getPriorityBadge = (priority) => {
    const priorityClasses = {
      Cao: "priority-high",
      "Trung bình": "priority-medium",
      Thấp: "priority-low",
    };

    return (
      <span
        className={`priority-badge ${priorityClasses[priority] || "priority-medium"
          }`}
      >
        {priority}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const canEdit = () => {
    return userRole === "EVM_STAFF" || userRole === "EVM_ADMIN" || userRole === "SC_ADMIN";
  };

  return (
    <div className="report-detail">
      <div className="detail-header">
        <div className="report-basic-info">
          <h2>Báo cáo {report.ReportName || report.title} </h2>
          <h3>#{report.ID_Report || report.id}</h3>
          <div className="report-meta">
            {getStatusBadge(report.Status || report.status)}
            {report.Priority && getPriorityBadge(report.Priority)}
            <span className="report-date">
              {formatDate(report.CreatedDate || report.createdAt)}
            </span>
          </div>
        </div>
        <div className="detail-actions">
          {canEdit() && (
            <button onClick={() => onEdit(report)} className="btn btn-outline">
              <span>✏️</span>
              Chỉnh sửa
            </button>
          )}
        </div>
      </div>

      <div className="detail-content">
        <div className="detail-row">
          <div className="detail-col-8">
            <div className="info-sections">
              {/* Report Information */}
              <div className="info-section card">
                <h3 className="section-title">Thông tin báo cáo</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Tiêu đề</label>
                    <span className="report-type">{report.ReportName || report.title}</span>
                  </div>
                  <div className="info-item">
                    <label>Trạng thái</label>
                    {getStatusBadge(report.Status || report.status)}
                  </div>
                  <div className="info-item">
                    <label>Loại báo cáo</label>
                    <span>{report.ReportType || "General Report"}</span>
                  </div>
                  <div className="info-item">
                    <label>Ngày tạo</label>
                    <span>{formatDate(report.CreatedDate || report.createdAt)}</span>
                  </div>
                </div>
              </div>

              {/* Links to Campaign/Recall */}
              {(report.serviceCampaignId || report.recallId) && (
                <div className="info-section card">
                  <h3 className="section-title">Chiến dịch liên quan</h3>
                  <div className="links-content">
                    {report.serviceCampaignId && (
                      <div className="link-item">
                        <Target size={20} style={{ color: '#4CAF50' }} />
                        <div className="link-info">
                          <strong>Service Campaign</strong>
                          <span>{campaignName || report.serviceCampaignId}</span>
                          <small>ID: {report.serviceCampaignId}</small>
                        </div>
                      </div>
                    )}
                    {report.recallId && (
                      <div className="link-item">
                        <AlertTriangle size={20} style={{ color: '#FF9800' }} />
                        <div className="link-info">
                          <strong>Recall</strong>
                          <span>{recallName || report.recallId}</span>
                          <small>ID: {report.recallId}</small>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Content */}
              <div className="info-section card">
                <h3 className="section-title">Nội dung chi tiết</h3>
                <div className="content-text">
                  <div className="info-item full-width">
                    <label>Mô tả</label>
                    <div className="description-content">
                      {report.Description || report.description}
                    </div>
                  </div>

                  {(report.Error || report.error) && (
                    <div className="info-item full-width">
                      <label>Lỗi/Vấn đề</label>
                      <div className="error-content">{report.Error || report.error}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Image */}
              {(report.Image || report.image) && (
                <div className="info-section card">
                  <h3 className="section-title">Hình ảnh</h3>
                  <div className="image-content">
                    <img
                      src={report.Image || report.image}
                      alt="Report"
                      style={{ maxWidth: "100%", borderRadius: "8px" }}
                    />
                  </div>
                </div>
              )}


            </div>
          </div>

          <div className="detail-col-4">
            {/* Summary Stats */}
            <div className="summary-section card">
              <h3 className="section-title">Thông tin thêm</h3>
              <div className="summary-stats">
                {report.ScStaffId && (
                  <div className="info-item">
                    <label>SC Staff ID</label>
                    <span>{report.ScStaffId}</span>
                  </div>
                )}
                {report.EvmAdminId && (
                  <div className="info-item">
                    <label>EVM Admin ID</label>
                    <span>{report.EvmAdminId}</span>
                  </div>
                )}
                {report.warrantyClaimId && (
                  <div className="info-item">
                    <label>Warranty Claim ID</label>
                    <span>{report.warrantyClaimId}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReportDetail;
