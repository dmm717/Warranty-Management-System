import React from "react";
import "../../styles/VehicleList.css";

function VehicleList({ vehicles, onEdit, onDelete }) {
  const getStatusBadge = (status) => {
    const statusClasses = {
      ACTIVE: "status-active",
      INACTIVE: "status-inactive",
      MAINTENANCE: "status-maintenance",
      WARRANTY: "status-warranty",
      "Đang sử dụng": "status-active",
      "Bảo hành": "status-warranty",
      "Bảo dưỡng": "status-maintenance",
      "Ngừng hoạt động": "status-inactive",
    };

    const statusLabels = {
      ACTIVE: "Đang sử dụng",
      INACTIVE: "Ngừng hoạt động",
      MAINTENANCE: "Bảo dưỡng",
      WARRANTY: "Bảo hành",
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  const formatKM = (km) => {
    return new Intl.NumberFormat("vi-VN").format(km) + " km";
  };

  if (vehicles.length === 0) {
    return (
      <div className="no-data-container">
        <div className="no-data-icon">🚗</div>
        <h3>Không tìm thấy xe nào</h3>
        <p>Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc</p>
      </div>
    );
  }

  return (
    <div className="vehicle-list">
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>VIN</th>
              <th>Tên xe</th>
              <th>Chủ xe</th>
              <th>Liên hệ</th>
              <th>Số KM</th>
              <th>Ngày sản xuất</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.map((vehicle) => (
              <tr key={vehicle.vehicleId || vehicle.Vehicle_ID}>
                <td>
                  <div className="vin-cell">
                    <strong>{vehicle.vehicleId || vehicle.VIN}</strong>
                    <small>ID: {vehicle.vehicleId || vehicle.Vehicle_ID}</small>
                  </div>
                </td>
                <td>
                  <div className="vehicle-name">
                    {vehicle.vehicleName || vehicle.Vehicle_Name}
                  </div>
                </td>
                <td>
                  <div className="owner-cell">
                    <strong>{vehicle.owner || vehicle.Owner}</strong>
                  </div>
                </td>
                <td>
                  <div className="contact-cell">
                    <div>{vehicle.phoneNumber || vehicle.Phone_Number}</div>
                    <small>{vehicle.email || vehicle.Email}</small>
                  </div>
                </td>
                <td>{formatKM(vehicle.totalKm || vehicle.Total_KM || 0)}</td>
                <td>
                  {formatDate(
                    vehicle.productionDate || vehicle.Production_Date
                  )}
                </td>
                <td>{getStatusBadge(vehicle.status || vehicle.Status)}</td>
                <td>
                  <div className="action-buttons">
                    <button
                      onClick={() => onEdit(vehicle)}
                      className="btn btn-sm btn-outline"
                      title="Chỉnh sửa"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() =>
                        onDelete(vehicle.vehicleId || vehicle.Vehicle_ID)
                      }
                      className="btn btn-sm btn-danger"
                      title="Xóa"
                    >
                      🗑️
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

export default VehicleList;
