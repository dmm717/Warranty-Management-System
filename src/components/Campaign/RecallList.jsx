import React from "react";
import "../../styles/RecallList.css";
import { VEHICLE_TYPES, REGIONS } from "../../constants";

function RecallList({ recalls, onEdit, onView, userRole, onDelete }) {
  const isEVMAdmin = userRole === "EVM_ADMIN";
  const isEVMStaff = userRole === "EVM_STAFF";

  const getStatusBadge = (status) => {
    const statusClasses = {
      Pending: "status-pending",
      "In Progress": "status-active",
      Completed: "status-completed",
      Cancelled: "status-cancelled",
    };

    const statusLabels = {
      Pending: "Chờ xử lý",
      "In Progress": "Đang xử lý",
      Completed: "Hoàn thành",
      Cancelled: "Đã hủy",
    };

    return (
      <span
        className={`status-badge ${statusClasses[status] || "status-pending"}`}
      >
        {statusLabels[status] || status}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  const getModelNames = (modelIds) => {
    if (!Array.isArray(modelIds) || modelIds.length === 0) return "N/A";
    return modelIds
      .map((id) => {
        const vehicle = VEHICLE_TYPES.find((v) => v.id === id);
        return vehicle ? vehicle.name : id;
      })
      .join(", ");
  };

  const getRegionNames = (regionIds) => {
    if (!Array.isArray(regionIds) || regionIds.length === 0) return "N/A";
    return regionIds
      .map((id) => {
        const region = REGIONS.find((r) => r.value === id);
        return region ? region.label : id;
      })
      .join(", ");
  };

  if (recalls.length === 0) {
    return (
      <div className="no-data-container">
        <div className="no-data-icon">🚨</div>
        <h3>Chưa có recall nào</h3>
        <p>
          {isEVMAdmin
            ? "Tạo recall mới khi phát hiện vấn đề"
            : "Chưa có recall nào cần xử lý"}
        </p>
      </div>
    );
  }

  // ============================================
  // VIEW FOR EVM_ADMIN
  // ============================================
  if (isEVMAdmin) {
    return (
      <div className="recall-list">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Mã Recall</th>
                <th>Tên Recall</th>
                <th>Model xe</th>
                <th>Phạm vi</th>
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
                    <div className="recall-name">
                      <strong>{recall.RecallName || "N/A"}</strong>
                    </div>
                  </td>
                  <td>
                    <div className="model-info">
                      {getModelNames(recall.VehicleModels)}
                    </div>
                  </td>
                  <td>
                    <div className="scope-info">
                      <div>
                        <strong>Năm:</strong>{" "}
                        {recall.ProductionYears?.join(", ") || "N/A"}
                      </div>
                      <div>
                        <strong>Quận:</strong> {getRegionNames(recall.Regions)}
                      </div>
                    </div>
                  </td>
                  <td>{getStatusBadge(recall.Status)}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        onClick={() => onView(recall)}
                        className="btn btn-sm btn-outline"
                        title="Xem chi tiết"
                      >
                        👁️
                      </button>
                      <button
                        onClick={() => onEdit(recall)}
                        className="btn btn-sm btn-outline"
                        title="Chỉnh sửa"
                      >
                        ✏️
                      </button>
                      {/* EVM_ADMIN có quyền xóa recall */}
                      {onDelete && (
                        <button
                          onClick={() => {
                            if (
                              window.confirm(
                                `Bạn có chắc chắn muốn xóa recall "${recall.RecallName}"?`
                              )
                            ) {
                              onDelete(recall.Recall_ID);
                            }
                          }}
                          className="btn btn-sm btn-danger"
                          title="Xóa"
                        >
                          🗑️
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

  // ============================================
  // VIEW FOR EVM_STAFF
  // ============================================
  if (isEVMStaff) {
    // Filter only recalls that have basic info (created by EVM_ADMIN)
    const availableRecalls = recalls.filter(
      (r) => r.RecallName && r.VehicleModels
    );

    if (availableRecalls.length === 0) {
      return (
        <div className="no-data-container">
          <div className="no-data-icon">📋</div>
          <h3>Chưa có recall nào</h3>
          <p>Đang chờ EVM_ADMIN tạo recall mới</p>
        </div>
      );
    }

    return (
      <div className="recall-list">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Mã Recall</th>
                <th>Tên Recall</th>
                <th>Vấn đề</th>
                <th>Ngày bắt đầu</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {availableRecalls.map((recall) => (
                <tr key={recall.Recall_ID}>
                  <td>
                    <div className="recall-id">
                      <strong>{recall.Recall_ID}</strong>
                    </div>
                  </td>
                  <td>
                    <div className="recall-name-cell">
                      <strong>{recall.RecallName}</strong>
                      {!recall.IssueDescription && (
                        <span className="badge badge-warning">
                          Chưa bổ sung
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="issue-cell">
                      {recall.IssueDescription ? (
                        recall.IssueDescription.length > 60 ? (
                          `${recall.IssueDescription.substring(0, 60)}...`
                        ) : (
                          recall.IssueDescription
                        )
                      ) : (
                        <em className="text-muted">Chưa có thông tin</em>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="date-cell">
                      {formatDate(recall.StartDate)}
                    </div>
                  </td>
                  <td>{getStatusBadge(recall.Status)}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        onClick={() => onView(recall)}
                        className="btn btn-sm btn-outline"
                        title="Xem chi tiết"
                      >
                        👁️
                      </button>
                      {/* EVM_STAFF chỉ có thể xem, không thể chỉnh sửa */}
                      {/* EVM_STAFF có quyền xóa recall */}
                      {onDelete && (
                        <button
                          onClick={() => {
                            if (
                              window.confirm(
                                `Bạn có chắc chắn muốn xóa recall "${recall.RecallName}"?`
                              )
                            ) {
                              onDelete(recall.Recall_ID);
                            }
                          }}
                          className="btn btn-sm btn-danger"
                          title="Xóa"
                        >
                          🗑️
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

  // Default view
  return (
    <div className="recall-list">
      <div className="no-data-container">
        <p>Không có quyền xem danh sách Recall</p>
      </div>
    </div>
  );
}

export default RecallList;
