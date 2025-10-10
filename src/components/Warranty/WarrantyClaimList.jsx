import React from "react";
import "./WarrantyClaimList.css";

function WarrantyClaimList({
  claims,
  onEdit,
  onView,
  onUpdateStatus,
  userRole,
}) {
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
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const canUpdateStatus = (status) => {
    if (userRole === "EVM_Staff" || userRole === "Admin") {
      return ["Chờ duyệt", "Đã duyệt"].includes(status);
    }
    if (userRole === "SC_Staff" || userRole === "SC_Technician") {
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
              <tr key={claim.ClaimID}>
                <td>
                  <div className="claim-id">
                    <strong>{claim.ClaimID}</strong>
                  </div>
                </td>
                <td>
                  <div className="customer-info">
                    <strong>{claim.CustomerName}</strong>
                    <small>{claim.CustomerPhone}</small>
                  </div>
                </td>
                <td>
                  <div className="vehicle-info">
                    <strong>{claim.VehicleName}</strong>
                    <small>{claim.VIN}</small>
                  </div>
                </td>
                <td>
                  <div className="issue-description">
                    {claim.IssueDescription.length > 50
                      ? `${claim.IssueDescription.substring(0, 50)}...`
                      : claim.IssueDescription}
                  </div>
                </td>
                <td>{formatDate(claim.ClaimDate)}</td>
                <td>{getPriorityBadge(claim.Priority)}</td>
                <td>
                  <div className="cost-info">
                    {claim.EstimatedCost
                      ? formatCurrency(claim.EstimatedCost)
                      : "Chưa ước tính"}
                  </div>
                </td>
                <td>
                  <div className="status-container">
                    {getStatusBadge(claim.Status)}
                    {canUpdateStatus(claim.Status) && (
                      <div className="status-actions">
                        {getNextStatus(claim.Status).map((nextStatus) => (
                          <button
                            key={nextStatus}
                            onClick={() =>
                              onUpdateStatus(claim.ClaimID, nextStatus)
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
