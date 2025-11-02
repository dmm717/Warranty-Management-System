import React from "react";
import { PARTS_REQUEST_STATUS } from "../../constants";
import "../../styles/PartsList.css";

function PartsList({ parts, onEdit, onDelete, userRole}) {
  const getStatusBadge = (status) => {
    const statusClasses = {
      PENDING: "status-pending",
      APPROVED: "status-approved",
      REJECTED: "status-rejected",
      ORDERED: "status-ordered",
      IN_TRANSIT: "status-in-transit",
      DELIVERED: "status-delivered",
      COMPLETED: "status-completed",
      CANCELLED: "status-cancelled",
    };

    const displayStatus = PARTS_REQUEST_STATUS[status] || status;

    return (
      <span className={`status-badge ${statusClasses[status] || "status-pending"}`}>
        {displayStatus}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  const canEditDelete = () => {
    return userRole === "EVM_STAFF" || userRole === "EVM_ADMIN";
  };

  if (parts.length === 0) {
    return (
      <div className="no-data-container">
        <div className="no-data-icon">⚙️</div>
        <h3>Không tìm thấy yêu cầu phụ tùng nào</h3>
        <p>Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc</p>
      </div>
    );
  }

  return (
    <div className="parts-list">
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Mã yêu cầu</th>
              <th>Mã phụ tùng</th>
              <th>Tên phụ tùng</th>
              <th>Loại</th>
              <th>Số lượng</th>
              <th>Xe</th>
              <th>Ngày yêu cầu</th>
              <th>Trạng thái</th>
              {canEditDelete() && <th>Thao tác</th>}
            </tr>
          </thead>
          <tbody>
            {parts.map((request) => (
              <tr key={request.id}>
                <td>
                  <div className="request-id">
                    <strong>{request.id}</strong>
                  </div>
                </td>
                <td>
                  <div className="part-number">
                    {request.partNumber}
                  </div>
                </td>
                <td>
                  <div className="part-info">
                    <strong>{request.partName}</strong>
                  </div>
                </td>
                <td>
                  <div className="part-type">
                    {request.partTypeName}
                  </div>
                </td>
                <td>
                  <div className="quantity">
                    <strong>{request.quantity}</strong>
                  </div>
                </td>
                <td>
                  <div className="vehicle-info">
                    {request.vehicle ? (
                      <>
                        <strong>{request.vehicle.vehicleName}</strong>
                        <small>{request.vehicle.owner}</small>
                      </>
                    ) : (
                      "N/A"
                    )}
                  </div>
                </td>
                <td>{formatDate(request.requestDate)}</td>
                <td>
                  {getStatusBadge(reqtuest.staus)}
                </td>
                {canEditDelete() && (
                  <td>
                    <div className="action-buttons">
                      <button
                        onClick={() => onEdit(request)}
                        className="btn btn-sm btn-outline"
                        title="Chỉnh sửa"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => onDelete(request.id)}
                        className="btn btn-sm btn-danger"
                        title="Xóa"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default PartsList;
