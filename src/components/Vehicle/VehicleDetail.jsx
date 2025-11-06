import React, { useState, useEffect } from "react";
import { Car, User, Phone, Mail, Calendar, Gauge, MapPin, FileText, AlertTriangle } from "lucide-react";
import { vehicleAPI } from "../../services/api";
import { toast } from "react-toastify";
import "../../styles/VehicleDetail.css";

function VehicleDetail({ vehicleId, onBack }) {
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (vehicleId) {
      fetchVehicleDetail();
    }
  }, [vehicleId]);

  const fetchVehicleDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await vehicleAPI.getVehicleById(vehicleId);
      console.log("🚗 Vehicle data:", response.data);
      setVehicle(response.data);
    } catch (err) {
      console.error("Error fetching vehicle detail:", err);
      setError("Không thể tải thông tin xe. Vui lòng thử lại.");
      toast.error("Không thể tải thông tin xe");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="vehicle-detail">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Đang tải thông tin xe...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="vehicle-detail">
        <div className="error-state">
          <AlertTriangle size={48} color="#ef4444" />
          <p>{error}</p>
          <button className="btn btn-primary" onClick={fetchVehicleDetail}>
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  if (!vehicle) return null;

  return (
    <div className="vehicle-detail">
      {/* Header */}
      <div className="detail-header">
        <div className="item-basic-info">
          <h2>🚗 {vehicle.name || vehicle.vehicleName || "Chi tiết xe"}</h2>
          <div className="item-meta">
            <div className="vehicle-id-badge">{vehicle.vin || vehicle.id || vehicle.vehicleId}</div>
          </div>
        </div>
        <div className="detail-actions">
          <button className="btn btn-outline" onClick={onBack}>
            ← Quay lại
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="detail-content">
        <div className="detail-row">
          <div className="detail-col-8">
            <div className="info-sections">
              
              {/* Vehicle Image */}
              {vehicle.urlPicture && (
                <div className="info-section">
                  <div className="section-title">
                    <Car size={20} />
                    <h3>Hình ảnh xe</h3>
                  </div>
                  <div className="vehicle-image-container">
                    <img 
                      src={vehicle.urlPicture} 
                      alt={vehicle.name || "Vehicle"} 
                      className="vehicle-main-image"
                    />
                  </div>
                </div>
              )}

              {/* Basic Information */}
              <div className="info-section">
                <div className="section-title">
                  <FileText size={20} />
                  <h3>Thông tin cơ bản</h3>
                </div>
                <div className="info-grid">
                  <div className="info-item">
                    <label>VIN:</label>
                    <div className="value-text">{vehicle.vin || vehicle.id || vehicle.vehicleId || "N/A"}</div>
                  </div>
                  <div className="info-item">
                    <label>Tên xe:</label>
                    <div className="value-text">{vehicle.name || vehicle.vehicleName || "N/A"}</div>
                  </div>
                  <div className="info-item">
                    <label>Loại xe:</label>
                    <div className="value-text">{vehicle.electricVehicleType?.modelName || "N/A"}</div>
                  </div>
                  <div className="info-item">
                    <label>Năm sản xuất:</label>
                    <div className="value-text">{vehicle.electricVehicleType?.yearModelYear || vehicle.yearModelYear || "N/A"}</div>
                  </div>
                  <div className="info-item">
                    <label>Loại pin:</label>
                    <div className="value-text">{vehicle.electricVehicleType?.batteryType || vehicle.batteryType || "N/A"}</div>
                  </div>
                  <div className="info-item">
                    <label>Tổng số km:</label>
                    <div className="value-text">
                      {vehicle.totalKm ? `${vehicle.totalKm.toLocaleString()} km` : "N/A"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Owner Information */}
              <div className="info-section">
                <div className="section-title">
                  <User size={20} />
                  <h3>Thông tin chủ sở hữu</h3>
                </div>
                <div className="info-grid">
                  <div className="info-item">
                    <label>
                      <User size={16} />
                      Chủ sở hữu:
                    </label>
                    <div className="value-text">{vehicle.owner || "N/A"}</div>
                  </div>
                  <div className="info-item">
                    <label>
                      <Phone size={16} />
                      Số điện thoại:
                    </label>
                    <div className="value-text">{vehicle.phoneNumber || "N/A"}</div>
                  </div>
                  <div className="info-item full-width">
                    <label>
                      <Mail size={16} />
                      Email:
                    </label>
                    <div className="value-text">{vehicle.email || "N/A"}</div>
                  </div>
                </div>
              </div>

              {/* Timeline Section */}
              <div className="info-section">
                <div className="section-title">
                  <Calendar size={20} />
                  <h3>Thời gian</h3>
                </div>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Ngày mua:</label>
                    <div className="date-value">{formatDate(vehicle.purchaseDate)}</div>
                  </div>
                  <div className="info-item">
                    <label>Ngày sản xuất:</label>
                    <div className="date-value">{formatDate(vehicle.productionDate)}</div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Sidebar */}
          <div className="detail-col-4">
            
            {/* Service Center Info */}
            <div className="info-section">
              <div className="section-title">
                <MapPin size={20} />
                <h3>Trung tâm dịch vụ</h3>
              </div>
              <div className="service-center-info">
                <div className="service-center-name">
                  {vehicle.officeServiceCenter || "Chưa có thông tin"}
                </div>
              </div>
            </div>

            {/* Additional Stats */}
            <div className="info-section">
              <div className="section-title">
                <Gauge size={20} />
                <h3>Thống kê</h3>
              </div>
              <div className="stats-list">
                <div className="stat-item">
                  <label>Tổng số km:</label>
                  <div className="stat-value">
                    {vehicle.totalKm ? `${vehicle.totalKm.toLocaleString()} km` : "N/A"}
                  </div>
                </div>
                <div className="stat-item">
                  <label>Trạng thái:</label>
                  <div className="stat-value">
                    <span className="status-badge status-active">Hoạt động</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default VehicleDetail;
