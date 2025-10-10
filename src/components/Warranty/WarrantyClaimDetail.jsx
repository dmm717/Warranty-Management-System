import React, { useState } from "react";
import "./WarrantyClaimDetail.css";

function WarrantyClaimDetail({ claim, onEdit, onUpdateStatus, userRole }) {
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState("");

  if (!claim) return null;

  const getStatusBadge = (status) => {
    const statusClasses = {
      "Chờ duyệt": "status-pending",
      "Đã duyệt": "status-approved",
      "Từ chối": "status-rejected",
      "Đang xử lý": "status-processing",
      "Hoàn thành": "status-completed",
    };

    return (
      <span
        className={`status-badge ${statusClasses[status] || "status-pending"}`}
      >
        {status}
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
        className={`priority-badge ${
          priorityClasses[priority] || "priority-medium"
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const canUpdateStatus = () => {
    if (userRole === "EVM_Staff" || userRole === "Admin") {
      return ["Chờ duyệt", "Đã duyệt"].includes(claim.Status);
    }
    if (userRole === "SC_Staff" || userRole === "SC_Technician") {
      return ["Đã duyệt", "Đang xử lý"].includes(claim.Status);
    }
    return false;
  };

  const getAvailableStatuses = () => {
    const statusFlow = {
      "Chờ duyệt": ["Đã duyệt", "Từ chối"],
      "Đã duyệt": ["Đang xử lý"],
      "Đang xử lý": ["Hoàn thành"],
    };
    return statusFlow[claim.Status] || [];
  };

  const handleStatusUpdate = () => {
    if (newStatus && newStatus !== claim.Status) {
      onUpdateStatus(claim.ClaimID, newStatus);
      setShowStatusModal(false);
      setNewStatus("");
    }
  };

  // Mock timeline data
  const timeline = [
    {
      status: "Tạo yêu cầu",
      date: claim.ClaimDate,
      description: "Yêu cầu bảo hành được tạo",
      user: "SC Staff",
      active: true,
    },
    {
      status: "Chờ duyệt",
      date: claim.ClaimDate,
      description: "Đang chờ EVM xem xét",
      user: "System",
      active: claim.Status !== "Chờ duyệt",
    },
    {
      status: "Đã duyệt",
      date:
        claim.Status === "Đã duyệt" ||
        claim.Status === "Đang xử lý" ||
        claim.Status === "Hoàn thành"
          ? "2024-10-02"
          : null,
      description: "EVM đã phê duyệt yêu cầu",
      user: "EVM Staff",
      active: ["Đã duyệt", "Đang xử lý", "Hoàn thành"].includes(claim.Status),
    },
    {
      status: "Đang xử lý",
      date:
        claim.Status === "Đang xử lý" || claim.Status === "Hoàn thành"
          ? "2024-10-03"
          : null,
      description: "Bắt đầu thực hiện bảo hành",
      user: "SC Technician",
      active: ["Đang xử lý", "Hoàn thành"].includes(claim.Status),
    },
    {
      status: "Hoàn thành",
      date: claim.Status === "Hoàn thành" ? "2024-10-05" : null,
      description: "Bảo hành hoàn tất, xe đã giao khách",
      user: "SC Staff",
      active: claim.Status === "Hoàn thành",
    },
  ];

  return (
    <div className="warranty-claim-detail">
      <div className="detail-header">
        <div className="claim-basic-info">
          <h2>Yêu cầu bảo hành #{claim.ClaimID}</h2>
          <div className="claim-meta">
            {getStatusBadge(claim.Status)}
            {getPriorityBadge(claim.Priority)}
            <span className="claim-date">{formatDate(claim.ClaimDate)}</span>
          </div>
        </div>
        <div className="detail-actions">
          <button onClick={() => onEdit(claim)} className="btn btn-outline">
            <span>✏️</span>
            Chỉnh sửa
          </button>
          {canUpdateStatus() && (
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
              {/* Vehicle Information */}
              <div className="info-section card">
                <h3 className="section-title">Thông tin xe</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <label>VIN</label>
                    <span className="vin-value">{claim.VIN}</span>
                  </div>
                  <div className="info-item">
                    <label>Tên xe</label>
                    <span>{claim.VehicleName}</span>
                  </div>
                  <div className="info-item">
                    <label>Vehicle ID</label>
                    <span>{claim.Vehicle_ID}</span>
                  </div>
                </div>
              </div>

              {/* Customer Information */}
              <div className="info-section card">
                <h3 className="section-title">Thông tin khách hàng</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Tên khách hàng</label>
                    <span>{claim.CustomerName}</span>
                  </div>
                  <div className="info-item">
                    <label>Số điện thoại</label>
                    <span>{claim.CustomerPhone}</span>
                  </div>
                  <div className="info-item">
                    <label>Email</label>
                    <span>{claim.Email}</span>
                  </div>
                </div>
              </div>

              {/* Issue Details */}
              <div className="info-section card">
                <h3 className="section-title">Chi tiết vấn đề</h3>
                <div className="issue-content">
                  <div className="info-item full-width">
                    <label>Mô tả vấn đề</label>
                    <div className="issue-description">
                      {claim.IssueDescription}
                    </div>
                  </div>
                  {claim.DiagnosisResult && (
                    <div className="info-item full-width">
                      <label>Kết quả chẩn đoán</label>
                      <div className="diagnosis-result">
                        {claim.DiagnosisResult}
                      </div>
                    </div>
                  )}
                  <div className="info-grid">
                    <div className="info-item">
                      <label>Chi phí ước tính</label>
                      <span className="cost-value">
                        {claim.EstimatedCost
                          ? formatCurrency(claim.EstimatedCost)
                          : "Chưa ước tính"}
                      </span>
                    </div>
                    <div className="info-item">
                      <label>Nhân viên phụ trách</label>
                      <span>{claim.SC_StaffID}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="detail-col-4">
            {/* Timeline */}
            <div className="timeline-section card">
              <h3 className="section-title">Tiến trình xử lý</h3>
              <div className="timeline">
                {timeline.map((item, index) => (
                  <div
                    key={index}
                    className={`timeline-item ${
                      item.active ? "active" : "inactive"
                    }`}
                  >
                    <div className="timeline-marker"></div>
                    <div className="timeline-content">
                      <div className="timeline-status">{item.status}</div>
                      {item.date && (
                        <div className="timeline-date">
                          {formatDate(item.date)}
                        </div>
                      )}
                      <div className="timeline-description">
                        {item.description}
                      </div>
                      <div className="timeline-user">bởi {item.user}</div>
                    </div>
                  </div>
                ))}
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
                Trạng thái hiện tại: <strong>{claim.Status}</strong>
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

export default WarrantyClaimDetail;
