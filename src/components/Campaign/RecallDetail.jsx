import React, { useState, useEffect } from "react";
import { Calendar, AlertTriangle, Users, Car, FileText, Clock } from "lucide-react";
import { recallAPI } from "../../services/api";
import "../../styles/RecallDetail.css";

function RecallDetail({ recallId, onBack }) {
  const [recall, setRecall] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (recallId) {
      fetchRecallDetail();
    }
  }, [recallId]);

  const fetchRecallDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await recallAPI.getRecallById(recallId);
      setRecall(response.data);
    } catch (err) {
      console.error("Error fetching recall detail:", err);
      setError("Không thể tải thông tin recall. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      ACTIVE: "status-active",
      INACTIVE: "status-inactive",
      COMPLETED: "status-completed",
      CANCELLED: "status-cancelled",
    };

    const statusLabels = {
      ACTIVE: "Đang hoạt động",
      INACTIVE: "Chưa kích hoạt",
      COMPLETED: "Hoàn thành",
      CANCELLED: "Đã hủy",
    };

    return (
      <span className={`status-badge ${statusClasses[status] || "status-inactive"}`}>
        {statusLabels[status] || status}
      </span>
    );
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
      <div className="recall-detail">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="recall-detail">
        <div className="error-state">
          <AlertTriangle size={48} color="#ef4444" />
          <p>{error}</p>
          <button className="btn btn-primary" onClick={fetchRecallDetail}>
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  if (!recall) return null;

  return (
    <div className="recall-detail">
      {/* Header */}
      <div className="detail-header">
        <div className="item-basic-info">
          <h2>{recall.name || "Recall"}</h2>
          <div className="item-meta">
            <div className="recall-id-badge">{recall.id}</div>
            {getStatusBadge(recall.status)}
            <span className={`notification-badge ${recall.notificationSent ? "sent" : "pending"}`}>
              {recall.notificationSent ? "✓ Đã gửi thông báo" : "⏳ Chưa gửi thông báo"}
            </span>
          </div>
        </div>
        <div className="detail-actions">
          
        </div>
      </div>

      {/* Content */}
      <div className="detail-content">
        <div className="detail-row">
          <div className="detail-col-8">
            <div className="info-sections">
              {/* Basic Information */}
              <div className="info-section">
                <div className="section-title">
                  <FileText size={20} />
                  <h3>Thông tin cơ bản</h3>
                </div>
                <div className="info-item full-width">
                  <label>Mô tả vấn đề:</label>
                  <p className="description-text">
                    {recall.description || "Không có mô tả"}
                  </p>
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
                    <label>Ngày bắt đầu:</label>
                    <div className="date-value">{formatDate(recall.startDate)}</div>
                  </div>
                  <div className="info-item">
                    <label>Ngày kết thúc:</label>
                    <div className="date-value">{formatDate(recall.endDate)}</div>
                  </div>
                </div>
              </div>

              {/* Affected Vehicles Section */}
              {recall.vehicles && recall.vehicles.length > 0 && (
                <div className="info-section">
                  <div className="section-title">
                    <Car size={20} />
                    <h3>Xe bị ảnh hưởng ({recall.vehicles.length})</h3>
                  </div>
                  <div className="vehicles-list">
                    {recall.vehicles.slice(0, 20).map((vehicle, index) => (
                      <div key={index} className="vehicle-item">
                        <span className="vin-number">{vehicle.vin || vehicle.id}</span>
                        {vehicle.model && <span className="vehicle-model">{vehicle.model}</span>}
                      </div>
                    ))}
                    {recall.vehicles.length > 20 && (
                      <div className="more-items">
                        +{recall.vehicles.length - 20} xe khác...
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Vehicle Types Section */}
              {recall.vehicleTypes && recall.vehicleTypes.length > 0 && (
                <div className="info-section">
                  <div className="section-title">
                    <Car size={20} />
                    <h3>Loại xe bị ảnh hưởng</h3>
                  </div>
                  <div className="vehicle-types-list">
                    {recall.vehicleTypes.map((type, index) => (
                      <div key={index} className="vehicle-type-chip">
                        {type.name || type.typeName || type.id}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="detail-col-4">
            {/* Assigned Technicians Section */}
            {recall.technicians && recall.technicians.length > 0 && (
              <div className="info-section">
                <div className="section-title">
                  <Users size={20} />
                  <h3>Kỹ thuật viên ({recall.technicians.length})</h3>
                </div>
                <div className="technicians-list">
                  {recall.technicians.map((tech, index) => (
                    <div key={index} className="technician-item">
                      <div className="technician-avatar">
                        {tech.name ? tech.name.charAt(0).toUpperCase() : "T"}
                      </div>
                      <div className="technician-info">
                        <div className="technician-name">{tech.name || "N/A"}</div>
                        {tech.email && <div className="technician-email">{tech.email}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Related Reports Section */}
            {recall.reports && recall.reports.length > 0 && (
              <div className="info-section">
                <div className="section-title">
                  <FileText size={20} />
                  <h3>Báo cáo ({recall.reports.length})</h3>
                </div>
                <div className="reports-list">
                  {recall.reports.map((report, index) => (
                    <div key={index} className="report-item">
                      <span className="report-id">{report.id || report.reportId}</span>
                      <span className="report-title">{report.title || "No title"}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty state for sidebar */}
            {(!recall.technicians || recall.technicians.length === 0) &&
              (!recall.reports || recall.reports.length === 0) && (
                <div className="info-section">
                  <div className="empty-state">
                    <Clock size={48} />
                    <p>Chưa có thông tin bổ sung</p>
                  </div>
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default RecallDetail;
