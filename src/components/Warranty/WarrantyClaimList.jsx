import React from "react";
import "../../styles/WarrantyClaimList.css";

function WarrantyClaimList({
  claims,
  onEdit,
  onView,
  onUpdateStatus,
  userRole,
}) {
  const getStatusBadge = (status) => {
    const statusClasses = {
      PENDING: "status-pending",
      APPROVED: "status-approved",
      REJECTED: "status-rejected",
      IN_PROGRESS: "status-processing",
      COMPLETED: "status-completed",
      "Chờ duyệt": "status-pending",
      "Đã duyệt": "status-approved",
      "Từ chối": "status-rejected",
      "Đang xử lý": "status-processing",
      "Hoàn thành": "status-completed",
    };

    const statusLabels = {
      PENDING: "Chờ duyệt",
      APPROVED: "Đã duyệt",
      REJECTED: "Từ chối",
      IN_PROGRESS: "Đang xử lý",
      COMPLETED: "Hoàn thành",
    };

    const displayStatus = statusLabels[status] || status;

    return (
      <span
        className={`status-badge ${
          statusClasses[status] ||
          statusClasses[displayStatus] ||
          "status-pending"
        }`}
      >
        {displayStatus}
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
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const canUpdateStatus = (status) => {
    if (userRole === "EVM_STAFF" || userRole === "EVM_ADMIN") {
      return ["Chờ duyệt", "Đã duyệt"].includes(status);
    }
    if (userRole === "SC_STAFF" || userRole === "SC_TECHNICAL") {
      return ["Đã duyệt", "Đang xử lý"].includes(status);
    }
    return false;
  };

  const getNextStatus = (currentStatus) => {
    const statusFlow = {
      "Chờ duyệt": ["Đã duyệt", "Từ chối"],
      "Đã duyệt": ["Đang xử lý"],
      "Đang xử lý": ["Hoàn thành"],
    };
    return statusFlow[currentStatus] || [];
  };

  if (claims.length === 0) {
    return (
      <div className="no-data-container">
        <div className="no-data-icon">🔧</div>
        <h3>Không tìm thấy yêu cầu bảo hành nào</h3>
        <p>Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc</p>
      </div>
    );
  }

  return (
    <div className="warranty-claim-list">
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Mã claim</th>
              <th>Khách hàng</th>
              <th>Xe</th>
              <th>Vấn đề</th>
              <th>Ngày tạo</th>
              <th>Độ ưu tiên</th>
              <th>Chi phí ước tính</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {claims.map((claim) => (
              <tr key={claim.claimId || claim.ClaimID}>
                <td>
                  <div className="claim-id">
                    <strong>{claim.claimId || claim.ClaimID}</strong>
                  </div>
                </td>
                <td>
                  <div className="customer-info">
                    <strong>{claim.customerName || claim.CustomerName}</strong>
                    <small>{claim.phoneNumber || claim.CustomerPhone}</small>
                  </div>
                </td>
                <td>
                  <div className="vehicle-info">
                    <strong>
                      {claim.vehicleName || claim.VehicleName || "N/A"}
                    </strong>
                    <small>{claim.vehicleId || claim.VIN || "N/A"}</small>
                  </div>
                </td>
                <td>
                  <div className="issue-description">
                    {(claim.issueDescription || claim.IssueDescription || "")
                      .length > 50
                      ? `${(
                          claim.issueDescription || claim.IssueDescription
                        ).substring(0, 50)}...`
                      : claim.issueDescription || claim.IssueDescription}
                  </div>
                </td>
                <td>{formatDate(claim.claimDate || claim.ClaimDate)}</td>
                <td>
                  {claim.Priority ? (
                    getPriorityBadge(claim.Priority)
                  ) : (
                    <span className="priority-badge priority-medium">
                      Trung bình
                    </span>
                  )}
                </td>
                <td>
                  <div className="cost-info">
                    {claim.EstimatedCost
                      ? formatCurrency(claim.EstimatedCost)
                      : "Chưa ước tính"}
                  </div>
                </td>
                <td>
                  <div className="status-container">
                    {getStatusBadge(claim.status || claim.Status)}
                    {canUpdateStatus(claim.status || claim.Status) && (
                      <div className="status-actions">
                        {getNextStatus(claim.status || claim.Status).map(
                          (nextStatus) => (
                            <button
                              key={nextStatus}
                              onClick={() =>
                                onUpdateStatus(
                                  claim.claimId || claim.ClaimID,
                                  nextStatus
                                )
                              }
                              className="btn btn-sm status-btn"
                              title={`Chuyển sang ${nextStatus}`}
                            >
                              →{nextStatus}
                            </button>
                          )
                        )}
                      </div>
                    )}
                  </div>
                </td>
                <td>
                  <div className="action-buttons">
                    <button
                      onClick={() => onView(claim)}
                      className="btn btn-sm btn-outline"
                      title="Xem chi tiết"
                    >
                      👁️
                    </button>
                    <button
                      onClick={() => onEdit(claim)}
                      className="btn btn-sm btn-outline"
                      title="Chỉnh sửa"
                    >
                      ✏️
                    </button>
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

export default WarrantyClaimList;
