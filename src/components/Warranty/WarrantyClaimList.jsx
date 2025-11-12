import { Check, Wrench, X, Play, Eye, Edit, Trash2 } from "lucide-react";
import React from "react";
import Swal from "sweetalert2";
import "../../styles/WarrantyClaimList.css";

function WarrantyClaimList({
  claims,
  onEdit,
  onView,
  onUpdateStatus,
  onDelete,
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
      ASSIGNED_TO_TECHNICIAN: "status-assigned",
      INSPECTION_COMPLETED: "status-inspected",
      PENDING_PARTS: "status-pending-parts",
    };

    const statusLabels = {
      PENDING: "Chờ duyệt",
      IN_PROGRESS: "Đang xử lý",
      APPROVED: "Đã duyệt",
      REJECTED: "Từ chối",
      COMPLETED: "Hoàn thành",
      CANCELLED: "Đã hủy",
      ASSIGNED_TO_TECHNICIAN: "👨‍🔧 Đã phân công",
      INSPECTION_COMPLETED: "✅ Kiểm tra xong",
      PENDING_PARTS: "⏳ Chờ phụ tùng",
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
    // SC_ADMIN: Có quyền duyệt/từ chối yêu cầu PENDING
    if (userRole === "SC_ADMIN") {
      return ["PENDING"].includes(status);
    }
    // SC_STAFF và SC_TECHNICAL: KHÔNG hiển thị button ở list
    // Vì các action này sẽ làm trong WarrantyClaimDetail
    // APPROVED → có button "Bắt Đầu Công Việc" trong detail (SC_TECHNICAL)
    // IN_PROGRESS → có button "Tiếp Tục Công Việc" trong detail (SC_TECHNICAL)
    // COMPLETED → không có button nào nữa
    return false;
  };

  const getNextStatus = (currentStatus) => {
    const statusFlow = {
      PENDING: ["APPROVED", "REJECTED"], // Chỉ SC_ADMIN mới duyệt/từ chối
      // APPROVED → không có button ở list (phải vào detail để assign technician và start work)
      // IN_PROGRESS → không có button ở list (phải vào detail để làm workflow)
      // COMPLETED → không có button
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
            {claims.map((claim) => {
              return (
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
                    <div
                      className="vehicle-info"
                      style={{ background: "transparent" }}
                    >
                      <strong style={{ background: "transparent" }}>
                        {claim.vehicleName || "N/A"}
                      </strong>
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
                                onClick={async () => {
                                  // Nếu là REJECT, yêu cầu nhập lý do
                                  if (nextStatus === "REJECTED") {
                                    const result = await Swal.fire({
                                      title: "Từ chối yêu cầu bảo hành",
                                      input: "textarea",
                                      inputLabel: "Lý do từ chối",
                                      inputPlaceholder:
                                        "Nhập lý do từ chối yêu cầu bảo hành...",
                                      inputValidator: (value) => {
                                        if (!value || value.trim() === "") {
                                          return "Bạn cần nhập lý do từ chối!";
                                        }
                                      },
                                      showCancelButton: true,
                                      confirmButtonText: "Từ chối",
                                      cancelButtonText: "Hủy",
                                      confirmButtonColor: "#d33",
                                    });

                                    if (result.isConfirmed) {
                                      onUpdateStatus(
                                        claim.claimId,
                                        nextStatus,
                                        result.value
                                      );
                                    }
                                  } else if (nextStatus === "APPROVED") {
                                    // Confirm approve
                                    const result = await Swal.fire({
                                      title: "Duyệt yêu cầu bảo hành",
                                      text: `Bạn có chắc muốn duyệt yêu cầu ${claim.claimId}?`,
                                      icon: "question",
                                      showCancelButton: true,
                                      confirmButtonText: "Duyệt",
                                      cancelButtonText: "Hủy",
                                      confirmButtonColor: "#28a745",
                                    });

                                    if (result.isConfirmed) {
                                      onUpdateStatus(claim.claimId, nextStatus);
                                    }
                                  } else {
                                    // Các status khác
                                    onUpdateStatus(claim.claimId, nextStatus);
                                  }
                                }}
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
                      {/* Chỉ hiển thị nút chỉnh sửa khi claim bị REJECTED - để SC_STAFF sửa lại và gửi lại */}
                      {(userRole === "SC_STAFF" ||
                        userRole === "SC_TECHNICAL") &&
                        claim.status === "REJECTED" && (
                          <button
                            onClick={() => onEdit(claim)}
                            className="btn btn-sm btn-outline"
                            title="Chỉnh sửa và gửi lại"
                          >
                            <Edit size={16} />
                          </button>
                        )}
                      {/* EVM_STAFF có quyền xóa yêu cầu bảo hành */}
                      {userRole === "EVM_STAFF" && onDelete && (
                        <button
                          onClick={async () => {
                            const result = await Swal.fire({
                              title: "Xác nhận xóa",
                              text: `Bạn có chắc muốn xóa yêu cầu bảo hành ${claim.claimId}?`,
                              icon: "warning",
                              showCancelButton: true,
                              confirmButtonColor: "#d33",
                              cancelButtonColor: "#3085d6",
                              confirmButtonText: "Xóa",
                              cancelButtonText: "Hủy",
                            });

                            if (result.isConfirmed) {
                              onDelete(claim.claimId);
                            }
                          }}
                          className="btn btn-sm btn-danger"
                          title="Xóa yêu cầu bảo hành"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default WarrantyClaimList;
