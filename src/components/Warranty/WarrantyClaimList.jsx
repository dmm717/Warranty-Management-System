import React from "react";
import { Check, Wrench, X, Play, Eye, Edit } from 'lucide-react';
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
      IN_PROGRESS: "status-processing",
      APPROVED: "status-approved",
      REJECTED: "status-rejected",
      COMPLETED: "status-completed",
      CANCELLED: "status-cancelled",
    };

    const statusLabels = {
      PENDING: "Chờ duyệt",
      IN_PROGRESS: "Đang xử lý",
      APPROVED: "Đã duyệt",
      REJECTED: "Từ chối",
      COMPLETED: "Hoàn thành",
      CANCELLED: "Đã hủy",
    };

    const displayStatus = statusLabels[status] || status;

    return (
      <span
        className={`status-badge ${statusClasses[status] || "status-pending"}`}
      >
        {displayStatus}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  const canUpdateStatus = (status) => {
    if (userRole === "EVM_STAFF" || userRole === "EVM_ADMIN") {
      return ["PENDING"].includes(status);
    }
    if (userRole === "SC_STAFF" || userRole === "SC_TECHNICAL") {
      return ["APPROVED", "IN_PROGRESS"].includes(status);
    }
    return false;
  };

  const getNextStatus = (currentStatus) => {
    const statusFlow = {
      PENDING: ["APPROVED", "REJECTED"],
      APPROVED: ["IN_PROGRESS"],
      IN_PROGRESS: ["COMPLETED"],
    };
    return statusFlow[currentStatus] || [];
  };

  const getStatusButtonConfig = (status) => {
    const configs = {
      APPROVED: {
        label: "Duyệt",
        className: "btn-approve",
        icon: <Check size={14} />,
      },
      REJECTED: {
        label: "Từ chối",
        className: "btn-reject",
        icon: <X size={14} />,
      },
      IN_PROGRESS: {
        label: "Bắt đầu xử lý",
        className: "btn-process",
        icon: <Play size={14} />,
      },
      COMPLETED: {
        label: "Hoàn thành",
        className: "btn-complete",
        icon: <Check size={14} />,
      },
    };
    return configs[status] || { label: status, className: "", icon: "" };
  };

  if (claims.length === 0) {
    return (
      <div className="no-data-container">
        <div className="no-data-icon">
          <Wrench size={48} />
        </div>
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
              <th>Ngày tạo</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {claims.map((claim) => (
              <tr key={claim.claimId}>
                <td>
                  <div className="claim-id">
                    <strong>{claim.claimId}</strong>
                  </div>
                </td>
                <td>
                  <div className="customer-info">
                    <strong>{claim.customerName}</strong>
                    <small>{claim.customerPhone}</small>
                  </div>
                </td>
                <td>
                  <div className="vehicle-info">
                    <strong>{claim.vehicleName || "N/A"}</strong>
                  </div>
                </td>
                <td>{formatDate(claim.claimDate)}</td>
                <td>
                  <div className="status-container">
                    {getStatusBadge(claim.status)}
                    {canUpdateStatus(claim.status) && (
                      <div className="status-actions">
                        {getNextStatus(claim.status).map((nextStatus) => {
                          const config = getStatusButtonConfig(nextStatus);
                          return (
                            <button
                              key={nextStatus}
                              onClick={() =>
                                onUpdateStatus(claim.claimId, nextStatus)
                              }
                              className={`btn btn-sm status-action-btn ${config.className}`}
                              title={config.label}
                            >
                              <span className="btn-icon">{config.icon}</span>
                              <span className="btn-text">{config.label}</span>
                            </button>
                          );
                        })}
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
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => onEdit(claim)}
                      className="btn btn-sm btn-outline"
                      title="Chỉnh sửa"
                    >
                      <Edit size={16} />
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
