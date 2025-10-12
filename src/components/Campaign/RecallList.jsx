import React from "react";
import "../../styles/RecallList.css";

function RecallList({ recalls, onEdit, onView, onUpdateStatus, userRole }) {
  const getStatusBadge = (status) => {
    const statusClasses = {
      "Chuẩn bị": "status-preparing",
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
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  const getProgressPercentage = (completed, total) => {
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const canUpdateStatus = () => {
    return userRole === "EVM_Staff" || userRole === "Admin";
  };

  const getAvailableStatuses = (currentStatus, approvalStatus) => {
    if (approvalStatus !== "Đã phê duyệt") return [];

    const statusFlow = {
      "Chuẩn bị": ["Đang thực hiện", "Hủy bỏ"],
      "Đang thực hiện": ["Tạm dừng", "Hoàn thành"],
      "Tạm dừng": ["Đang thực hiện", "Hủy bỏ"],
      "Hoàn thành": [],
      "Hủy bỏ": [],
    };
    return statusFlow[currentStatus] || [];
  };

  const getSeverityIcon = (issueDescription) => {
    const lowerDescription = issueDescription.toLowerCase();
    if (
      lowerDescription.includes("cháy") ||
      lowerDescription.includes("nổ") ||
      lowerDescription.includes("quá nhiệt")
    ) {
      return "🔥"; // High severity
    } else if (
      lowerDescription.includes("phanh") ||
      lowerDescription.includes("lái") ||
      lowerDescription.includes("an toàn")
    ) {
      return "⚠️"; // Medium severity
    }
    return "🔧"; // Low severity
  };

  if (recalls.length === 0) {
    return (
      <div className="no-data-container">
        <div className="no-data-icon">🚨</div>
        <h3>Chưa có recall nào</h3>
        <p>Tạo recall đầu tiên khi phát hiện vấn đề cần thu hồi</p>
      </div>
    );
  }

  return (
    <div className="recall-list">
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Mã recall</th>
              <th>Tên recall</th>
              <th>Vấn đề</th>
              <th>Ngày bắt đầu</th>
              <th>Tiến độ</th>
              <th>Phê duyệt</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {recalls.map((recall) => (
              <tr key={recall.Recall_ID}>
                <td>
                  <div className="recall-id">
                    <strong>{recall.Recall_ID}</strong>
                  </div>
                </td>
                <td>
                  <div className="recall-info">
                    <div className="recall-name">
                      <span className="severity-icon">
                        {getSeverityIcon(recall.IssueDescription)}
                      </span>
                      <strong>{recall.RecallName}</strong>
                    </div>
                    <small>Phụ tùng: {recall.PartsRequired}</small>
                  </div>
                </td>
                <td>
                  <div className="issue-description">
                    {recall.IssueDescription.length > 60
                      ? `${recall.IssueDescription.substring(0, 60)}...`
                      : recall.IssueDescription}
                  </div>
                </td>
                <td>
                  <div className="start-date">
                    {formatDate(recall.StartDate)}
                  </div>
                </td>
                <td>
                  <div className="progress-info">
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${getProgressPercentage(
                            recall.CompletedVehicles,
                            recall.AffectedVehicles
                          )}%`,
                        }}
                      ></div>
                    </div>
                    <div className="progress-text">
                      {recall.CompletedVehicles}/{recall.AffectedVehicles} xe (
                      {getProgressPercentage(
                        recall.CompletedVehicles,
                        recall.AffectedVehicles
                      )}
                      %)
                    </div>
                  </div>
                </td>
                <td>{getApprovalBadge(recall.EVMApprovalStatus)}</td>
                <td>
                  <div className="status-container">
                    {getStatusBadge(recall.Status)}
                    {canUpdateStatus() &&
                      getAvailableStatuses(
                        recall.Status,
                        recall.EVMApprovalStatus
                      ).length > 0 && (
                        <div className="status-actions">
                          {getAvailableStatuses(
                            recall.Status,
                            recall.EVMApprovalStatus
                          ).map((nextStatus) => (
                            <button
                              key={nextStatus}
                              onClick={() =>
                                onUpdateStatus(recall.Recall_ID, nextStatus)
                              }
                              className="btn btn-sm status-btn"
                              title={`Chuyển sang ${nextStatus}`}
                            >
                              →{nextStatus}
                            </button>
                          ))}
                        </div>
                      )}
                  </div>
                </td>
                <td>
                  <div className="action-buttons">
                    <button
                      onClick={() => onView(recall)}
                      className="btn btn-sm btn-outline"
                      title="Xem chi tiết"
                    >
                      👁️
                    </button>
                    {canUpdateStatus() && (
                      <button
                        onClick={() => onEdit(recall)}
                        className="btn btn-sm btn-outline"
                        title="Chỉnh sửa"
                      >
                        ✏️
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default RecallList;
