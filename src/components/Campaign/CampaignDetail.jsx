import React, { useState } from "react";
import "./CampaignDetail.css";

function CampaignDetail({ item, type, onEdit, onUpdateStatus, userRole }) {
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState("");

  if (!item) return null;

  const isRecall = type === "recall";

  const getStatusBadge = (status) => {
    const statusClasses = {
      "Chuẩn bị": "status-preparing",
      "Đang triển khai": "status-active",
      "Đang thực hiện": "status-active",
      "Tạm dừng": "status-paused",
      "Hoàn thành": "status-completed",
      "Hủy bỏ": "status-cancelled",
    };

    return (
      <span
        className={`status-badge ${
          statusClasses[status] || "status-preparing"
        }`}
      >
        {status}
      </span>
    );
  };

  const getApprovalBadge = (approvalStatus) => {
    const approvalClasses = {
      "Chờ phê duyệt": "approval-pending",
      "Đã phê duyệt": "approval-approved",
      "Từ chối": "approval-rejected",
    };

    return (
      <span
        className={`approval-badge ${
          approvalClasses[approvalStatus] || "approval-pending"
        }`}
      >
        {approvalStatus}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getProgressPercentage = () => {
    const completed = item.CompletedVehicles || 0;
    const total = item.AffectedVehicles || 0;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const canUpdateStatus = () => {
    return userRole === "EVM_Staff" || userRole === "Admin";
  };

  const getAvailableStatuses = () => {
    if (isRecall && item.EVMApprovalStatus !== "Đã phê duyệt") return [];

    const statusFlow = {
      "Chuẩn bị": isRecall
        ? ["Đang thực hiện", "Hủy bỏ"]
        : ["Đang triển khai", "Hủy bỏ"],
      "Đang triển khai": ["Tạm dừng", "Hoàn thành"],
      "Đang thực hiện": ["Tạm dừng", "Hoàn thành"],
      "Tạm dừng": isRecall
        ? ["Đang thực hiện", "Hủy bỏ"]
        : ["Đang triển khai", "Hủy bỏ"],
      "Hoàn thành": [],
      "Hủy bỏ": [],
    };
    return statusFlow[item.Status] || [];
  };

  const handleStatusUpdate = () => {
    if (newStatus && newStatus !== item.Status) {
      onUpdateStatus(
        isRecall ? item.Recall_ID : item.CampaignsID,
        newStatus,
        type
      );
      setShowStatusModal(false);
      setNewStatus("");
    }
  };

  // Mock timeline data
  const getTimeline = () => {
    const baseTimeline = [
      {
        status: "Tạo " + (isRecall ? "recall" : "chiến dịch"),
        date: item.StartDate,
        description: isRecall
          ? "Recall được tạo và chờ phê duyệt"
          : "Chiến dịch được lên kế hoạch",
        user: "EVM Staff",
        active: true,
      },
    ];

    if (isRecall) {
      baseTimeline.push({
        status: "Phê duyệt",
        date: item.EVMApprovalStatus === "Đã phê duyệt" ? item.StartDate : null,
        description: "EVM phê duyệt thực hiện recall",
        user: "EVM Management",
        active: item.EVMApprovalStatus === "Đã phê duyệt",
      });
    }

    baseTimeline.push(
      {
        status: "Triển khai",
        date: [
          "Đang triển khai",
          "Đang thực hiện",
          "Tạm dừng",
          "Hoàn thành",
        ].includes(item.Status)
          ? item.StartDate
          : null,
        description: isRecall
          ? "Bắt đầu thực hiện recall"
          : "Bắt đầu triển khai chiến dịch",
        user: "SC Team",
        active: [
          "Đang triển khai",
          "Đang thực hiện",
          "Tạm dừng",
          "Hoàn thành",
        ].includes(item.Status),
      },
      {
        status: "Hoàn thành",
        date: item.Status === "Hoàn thành" ? item.EndDate : null,
        description: isRecall ? "Recall hoàn tất" : "Chiến dịch kết thúc",
        user: "SC Team",
        active: item.Status === "Hoàn thành",
      }
    );

    return baseTimeline;
  };

  const timeline = getTimeline();

  return (
    <div className="campaign-detail">
      <div className="detail-header">
        <div className="item-basic-info">
          <h2>
            {isRecall
              ? `Recall #${item.Recall_ID}`
              : `Chiến dịch #${item.CampaignsID}`}
          </h2>
          <h3>{isRecall ? item.RecallName : item.CampaignsTypeName}</h3>
          <div className="item-meta">
            {getStatusBadge(item.Status)}
            {isRecall && getApprovalBadge(item.EVMApprovalStatus)}
            <span className="item-date">
              Bắt đầu: {formatDate(item.StartDate)}
            </span>
            {!isRecall && item.EndDate && (
              <span className="item-date">
                Kết thúc: {formatDate(item.EndDate)}
              </span>
            )}
          </div>
        </div>
        <div className="detail-actions">
          <button
            onClick={() => onEdit(item, type)}
            className="btn btn-outline"
          >
            <span>✏️</span>
            Chỉnh sửa
          </button>
          {canUpdateStatus() && getAvailableStatuses().length > 0 && (
            <button
              onClick={() => setShowStatusModal(true)}
              className="btn btn-primary"
            >
              <span>🔄</span>
              Cập nhật trạng thái
            </button>
          )}
        </div>
      </div>

      <div className="detail-content">
        <div className="detail-row">
          <div className="detail-col-8">
            <div className="info-sections">
              {/* Progress Overview */}
              <div className="info-section card">
                <h3 className="section-title">Tổng quan tiến độ</h3>
                <div className="progress-overview">
                  <div className="progress-stats">
                    <div className="stat-item">
                      <div className="stat-number">
                        {item.AffectedVehicles || 0}
                      </div>
                      <div className="stat-label">Xe bị ảnh hưởng</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-number">
                        {item.CompletedVehicles || 0}
                      </div>
                      <div className="stat-label">Đã hoàn thành</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-number">
                        {getProgressPercentage()}%
                      </div>
                      <div className="stat-label">Tiến độ</div>
                    </div>
                  </div>

                  <div className="progress-bar-large">
                    <div
                      className="progress-fill-large"
                      style={{ width: `${getProgressPercentage()}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="info-section card">
                <h3 className="section-title">Chi tiết</h3>
                <div className="detail-content-text">
                  <div className="info-item full-width">
                    <label>
                      {isRecall ? "Mô tả vấn đề" : "Mô tả chiến dịch"}
                    </label>
                    <div className="description-content">
                      {isRecall ? item.IssueDescription : item.Description}
                    </div>
                  </div>

                  {isRecall && (
                    <div className="info-item full-width">
                      <label>Hành động yêu cầu</label>
                      <div className="action-content">
                        {item.RequiredAction}
                      </div>
                    </div>
                  )}

                  <div className="info-grid">
                    <div className="info-item">
                      <label>Phụ tùng yêu cầu</label>
                      <span className="parts-required">
                        {isRecall ? item.PartsRequired : item.RequiredParts}
                      </span>
                    </div>
                    {item.NotificationSent && (
                      <div className="info-item">
                        <label>Thông báo khách hàng</label>
                        <span className="notification-status">
                          {item.NotificationSent ? "✅ Đã gửi" : "❌ Chưa gửi"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Affected Vehicles (Mock) */}
              <div className="info-section card">
                <h3 className="section-title">Xe bị ảnh hưởng</h3>
                <div className="affected-vehicles">
                  <div className="vehicle-models">
                    <div className="model-item">
                      <div className="model-name">VinFast VF8</div>
                      <div className="model-count">1,250 xe</div>
                    </div>
                    <div className="model-item">
                      <div className="model-name">VinFast VF9</div>
                      <div className="model-count">450 xe</div>
                    </div>
                  </div>

                  <div className="regions">
                    <h5>Phân bố theo khu vực:</h5>
                    <div className="region-list">
                      <div className="region-item">Hà Nội: 600 xe</div>
                      <div className="region-item">TP.HCM: 800 xe</div>
                      <div className="region-item">Đà Nẵng: 200 xe</div>
                      <div className="region-item">Khác: 100 xe</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="detail-col-4">
            {/* Timeline */}
            <div className="timeline-section card">
              <h3 className="section-title">Tiến trình thực hiện</h3>
              <div className="timeline">
                {timeline.map((timelineItem, index) => (
                  <div
                    key={index}
                    className={`timeline-item ${
                      timelineItem.active ? "active" : "inactive"
                    }`}
                  >
                    <div className="timeline-marker"></div>
                    <div className="timeline-content">
                      <div className="timeline-status">
                        {timelineItem.status}
                      </div>
                      {timelineItem.date && (
                        <div className="timeline-date">
                          {formatDate(timelineItem.date)}
                        </div>
                      )}
                      <div className="timeline-description">
                        {timelineItem.description}
                      </div>
                      <div className="timeline-user">
                        bởi {timelineItem.user}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="quick-actions-section card">
              <h3 className="section-title">Thao tác nhanh</h3>
              <div className="quick-actions">
                <button className="action-btn notification-btn">
                  <span>📧</span>
                  Gửi thông báo
                </button>
                <button className="action-btn report-btn">
                  <span>📊</span>
                  Xuất báo cáo
                </button>
                <button className="action-btn contact-btn">
                  <span>📞</span>
                  Liên hệ khách hàng
                </button>
                {isRecall && (
                  <button className="action-btn urgent-btn">
                    <span>🚨</span>
                    Báo cáo khẩn cấp
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status Update Modal */}
      {showStatusModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h4>Cập nhật trạng thái</h4>
              <button
                onClick={() => setShowStatusModal(false)}
                className="modal-close"
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p>
                Trạng thái hiện tại: <strong>{item.Status}</strong>
              </p>
              <div className="form-group">
                <label className="form-label">Chọn trạng thái mới</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="form-control"
                >
                  <option value="">-- Chọn trạng thái --</option>
                  {getAvailableStatuses().map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-actions">
              <button
                onClick={() => setShowStatusModal(false)}
                className="btn btn-outline"
              >
                Hủy
              </button>
              <button
                onClick={handleStatusUpdate}
                className="btn btn-primary"
                disabled={!newStatus}
              >
                Cập nhật
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CampaignDetail;
