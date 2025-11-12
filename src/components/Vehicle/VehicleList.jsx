import React, { useState } from "react";
import { Car, Phone, Mail, Edit, Trash2 } from "lucide-react";
import "../../styles/VehicleList.css";

function VehicleList({ vehicles, onEdit, onDelete }) {
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  const handleImageClick = (vehicle) => {
    if (
      vehicle.Picture &&
      vehicle.Picture !== "default-vehicle.jpg" &&
      vehicle.Picture !== ""
    ) {
      setSelectedImage(vehicle.Picture);
      setSelectedVehicle(vehicle);
    }
  };

  const closeImageModal = () => {
    setSelectedImage(null);
    setSelectedVehicle(null);
  };
  const getStatusBadge = (status) => {
    const statusClasses = {
      ACTIVE: "status-active",
      IN_WARRANTY: "status-warranty",
      INACTIVE: "status-inactive",
      RECALLED: "status-recalled",
      RETIRED: "status-retired",
      "Đang sử dụng": "status-active",
      "Trong bảo hành": "status-warranty",
      "Ngừng hoạt động": "status-inactive",
      "Đã triệu hồi": "status-recalled",
      "Đã thanh lý": "status-retired",
    };

    const statusLabels = {
      ACTIVE: "Đang sử dụng",
      IN_WARRANTY: "Trong bảo hành",
      INACTIVE: "Ngừng hoạt động",
      RECALLED: "Đã triệu hồi",
      RETIRED: "Đã thanh lý",
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
        <div className="no-data-icon">
          <Car size={48} />
        </div>
        <h3>Không tìm thấy xe nào</h3>
        <p>Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc</p>
      </div>
    );
  }

  return (
    <>
      {/* Image Modal */}
      {selectedImage && (
        <div
          className="image-modal-overlay"
          onClick={(e) => {
            // Đóng khi click vào bất kỳ đâu trừ ảnh
            if (!e.target.classList.contains("image-modal-img")) {
              closeImageModal();
            }
          }}
        >
          <div className="image-modal-content">
            <div className="image-modal-header">
              <h3>{selectedVehicle?.Vehicle_Name}</h3>
              <p>{selectedVehicle?.VIN}</p>
            </div>
            <div className="image-modal-body">
              <img
                src={selectedImage}
                alt={selectedVehicle?.Vehicle_Name}
                className="image-modal-img"
              />
            </div>
          </div>
        </div>
      )}

      <div className="vehicle-list">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Hình ảnh</th>
                <th>VIN</th>
                <th>Tên xe</th>
                <th>Chủ xe</th>
                <th>Liên hệ</th>
                <th>Số KM</th>
                <th>Ngày mua</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((vehicle) => (
                <tr key={vehicle.vehicleId}>
                  <td>
                    <div
                      className="vehicle-image-cell"
                      onClick={() => handleImageClick(vehicle)}
                      style={{
                        cursor:
                          vehicle.Picture &&
                          vehicle.Picture !== "default-vehicle.jpg" &&
                          vehicle.Picture !== ""
                            ? "pointer"
                            : "default",
                      }}
                    >
                      {vehicle.Picture &&
                      vehicle.Picture !== "default-vehicle.jpg" &&
                      vehicle.Picture !== "" ? (
                        <img
                          src={vehicle.Picture}
                          alt={vehicle.Vehicle_Name}
                          className="vehicle-thumbnail"
                          onError={(e) => {
                            e.target.style.display = "none";
                            e.target.nextSibling.style.display = "flex";
                          }}
                        />
                      ) : null}
                      <div
                        className="vehicle-placeholder"
                        style={{
                          display:
                            vehicle.Picture &&
                            vehicle.Picture !== "default-vehicle.jpg" &&
                            vehicle.Picture !== ""
                              ? "none"
                              : "flex",
                        }}
                      >
                        <Car size={24} />
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="vin-cell">
                      <strong>{vehicle.VIN}</strong>
                    </div>
                  </td>
                  <td>
                    <div className="vehicle-name">
                      {vehicle.Vehicle_Name}
                      {vehicle.Vehicle_Type && (
                        <small className="vehicle-type">
                          ({vehicle.Vehicle_Type})
                        </small>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="owner-cell">
                      <strong>{vehicle.Owner}</strong>
                    </div>
                  </td>
                  <td>
                    <div className="contact-cell">
                      <div>
                        <Phone
                          size={14}
                          style={{ display: "inline", marginRight: "4px" }}
                        />{" "}
                        {vehicle.Phone_Number}
                      </div>
                      <small>
                        <Mail
                          size={12}
                          style={{ display: "inline", marginRight: "4px" }}
                        />{" "}
                        {vehicle.Email}
                      </small>
                    </div>
                  </td>
                  <td>{formatKM(vehicle.Total_KM || 0)}</td>
                  <td>
                    {vehicle.Purchase_Date
                      ? formatDate(vehicle.Purchase_Date)
                      : "N/A"}
                  </td>
                  <td>{getStatusBadge(vehicle.Status)}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        onClick={() => onEdit(vehicle)}
                        className="btn btn-sm btn-outline"
                        title="Chỉnh sửa"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => onDelete(vehicle.vehicleId)}
                        className="btn btn-sm btn-danger"
                        title="Xóa"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

export default VehicleList;
