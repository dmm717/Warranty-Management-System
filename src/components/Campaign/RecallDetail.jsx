import React, { useState, useEffect } from "react";
import { Calendar, AlertTriangle, Users, Car, FileText, Clock, RefreshCw, UserPlus } from "lucide-react";
import { recallAPI, recallDistrictAPI, vehicleAPI, scTechnicianAPI } from "../../services/api";
import { RECALL_VEHICLE_STATUS_OPTIONS } from "../../constants";
import { toast } from "react-toastify";
import { useAuth } from "../../contexts/AuthContext";
import VehicleDetail from "../Vehicle/VehicleDetail";
import "../../styles/RecallDetail.css";

function RecallDetail({ recallId, onBack }) {
  const { user } = useAuth();
  const [recall, setRecall] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [assigningVehicles, setAssigningVehicles] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);
  const [showVehicleDetail, setShowVehicleDetail] = useState(false);
  const [showAssignTechModal, setShowAssignTechModal] = useState(false);
  const [availableTechnicians, setAvailableTechnicians] = useState([]);

  useEffect(() => {
    if (recallId) {
      fetchRecallDetail();
    }
  }, [recallId]);

  // Chặn scroll của body khi modal mở
  useEffect(() => {
    if (showAssignTechModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    // Cleanup khi component unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showAssignTechModal]);

  const fetchRecallDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await recallAPI.getRecallById(recallId);
      console.log("🔍 Recall data:", response.data);
      console.log("🚗 Vehicles:", response.data?.vehicleBasicInfoDTOS);
      console.log("👨‍🔧 Technicians:", response.data?.technicianBasicDTOS);
      
      const recallData = response.data;
      
      // Fetch trạng thái thực của từng xe từ API
      if (recallData.vehicleBasicInfoDTOS && recallData.vehicleBasicInfoDTOS.length > 0) {
        const vehiclesWithStatus = await Promise.all(
          recallData.vehicleBasicInfoDTOS.map(async (vehicle) => {
            try {
              const vehicleId = vehicle.vehicleId || vehicle.vin;
              const detailResponse = await recallAPI.getRecallVehicleDetail(recallId, vehicleId);
              console.log(`📊 Status for vehicle ${vehicleId}:`, detailResponse.data);
              return {
                ...vehicle,
                status: detailResponse.data?.recallVehicleStatus || "PENDING"
              };
            } catch (err) {
              console.error(`❌ Error fetching status for vehicle ${vehicle.vehicleId}:`, err);
              return {
                ...vehicle,
                status: "PENDING"
              };
            }
          })
        );
        
        console.log("✅ Vehicles with status:", vehiclesWithStatus);
        recallData.vehicleBasicInfoDTOS = vehiclesWithStatus;
      }
      
      setRecall(recallData);
    } catch (err) {
      console.error("Error fetching recall detail:", err);
      setError("Không thể tải thông tin recall. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleAutoAssignVehicles = async () => {
    try {
      setAssigningVehicles(true);
      
      // 1. Lấy danh sách vehicle type IDs từ recall
      const vehicleTypeIds = recall.vehicleTypeInfoDTOS?.map(vt => vt.id) || [];
      
      if (vehicleTypeIds.length === 0) {
        toast.warning("Recall này chưa có vehicle type nào");
        return;
      }

      // 2. Lấy tất cả xe từ backend (có thể cần phân trang nếu số lượng lớn)
      const vehiclesResponse = await vehicleAPI.getAllVehicles({ 
        page: 0, 
        size: 1000 // Lấy tất cả xe
      });
      
      const allVehicles = vehiclesResponse.data?.content || [];
      
      // 3. Filter xe có vehicleType matching
      const matchingVehicles = allVehicles.filter(vehicle => 
        vehicleTypeIds.includes(vehicle.electricVehicleTypeId || vehicle.vehicleTypeId)
      );

      if (matchingVehicles.length === 0) {
        toast.info("Không tìm thấy xe nào có loại xe phù hợp");
        return;
      }

      // 4. Loop gọi API add từng xe vào recall
      let successCount = 0;
      let errorCount = 0;

      toast.info(`Đang gán ${matchingVehicles.length} xe vào recall...`);

      for (const vehicle of matchingVehicles) {
        try {
          await recallAPI.addVehicleToRecall(recallId, vehicle.vin || vehicle.id);
          successCount++;
        } catch (err) {
          console.error(`Failed to add vehicle ${vehicle.vin}:`, err);
          errorCount++;
        }
      }

      // 5. Show result
      if (successCount > 0) {
        toast.success(`Đã gán thành công ${successCount} xe vào recall!`);
        // Refresh recall detail
        await fetchRecallDetail();
      }
      
      if (errorCount > 0) {
        toast.warning(`Có ${errorCount} xe không thể gán (có thể đã được gán trước đó)`);
      }

    } catch (err) {
      console.error("Error auto-assigning vehicles:", err);
      toast.error(err.message || "Có lỗi xảy ra khi gán xe");
    } finally {
      setAssigningVehicles(false);
    }
  };

  const handleViewVehicleDetail = (vehicleId) => {
    setSelectedVehicleId(vehicleId);
    setShowVehicleDetail(true);
  };

  const handleBackFromVehicle = () => {
    setShowVehicleDetail(false);
    setSelectedVehicleId(null);
  };

  const handleOpenAssignTechModal = async () => {
    try {
      // Fetch danh sách technicians từ SC Technician API
      const response = await scTechnicianAPI.getAllTechnicians({ page: 0, size: 100 });
      console.log("👨‍🔧 Available technicians:", response.data);
      
      let technicians = response.data?.content || [];
      
      // Lọc chỉ lấy technicians cùng branchOffice với user hiện tại
      if (user?.branchOffice) {
        technicians = technicians.filter(tech => 
          tech.branchOffice === user.branchOffice
        );
        console.log(`✅ Filtered technicians for branch "${user.branchOffice}":`, technicians);
      }
      
      setAvailableTechnicians(technicians);
      setShowAssignTechModal(true);
    } catch (err) {
      console.error("Error fetching technicians:", err);
      toast.error("Không thể tải danh sách kỹ thuật viên");
    }
  };

  const handleAssignTechnician = async (technicianId) => {
    try {
      console.log("🔄 Adding technician:", technicianId, "to recall:", recallId);
      
      const response = await recallAPI.addTechnicianToRecall(recallId, technicianId);
      console.log("✅ Add technician response:", response);
      
      toast.success("Đã gán kỹ thuật viên");
      
      // Refresh data to show updated technician list
      console.log("🔄 Refreshing recall data...");
      await fetchRecallDetail();
      console.log("✅ Recall data refreshed");
      
      setShowAssignTechModal(false);
    } catch (err) {
      console.error("❌ Error adding technician:", err);
      console.error("❌ Error response:", err.response?.data);
      toast.error(err.response?.data?.message || "Không thể gán kỹ thuật viên");
    }
  };

  const handleVehicleStatusChange = async (vehicleId, newStatus) => {
    try {
      // Cập nhật state local ngay lập tức
      setRecall(prevRecall => ({
        ...prevRecall,
        vehicleBasicInfoDTOS: prevRecall.vehicleBasicInfoDTOS.map(vehicle => 
          (vehicle.vehicleId === vehicleId || vehicle.vin === vehicleId)
            ? { ...vehicle, status: newStatus }
            : vehicle
        )
      }));

      // Gọi API để lưu vào backend
      await recallAPI.updateRecallVehicleStatus(recallId, vehicleId, {
        status: newStatus
      });
      
      toast.success("Đã cập nhật trạng thái xe");
    } catch (err) {
      console.error("Error updating vehicle status:", err);
      toast.error("Không thể cập nhật trạng thái xe");
      
      // Rollback nếu API thất bại
      await fetchRecallDetail();
    }
  };

  // Nếu đang xem vehicle detail, hiển thị VehicleDetail component
  if (showVehicleDetail && selectedVehicleId) {
    return <VehicleDetail vehicleId={selectedVehicleId} onBack={handleBackFromVehicle} />;
  }

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
          <button className="btn btn-outline" onClick={onBack}>
            ← Quay lại
          </button>
          <button 
            className="btn btn-secondary"
            onClick={handleOpenAssignTechModal}
          >
            <UserPlus size={16} />
            Gán kỹ thuật viên
          </button>
          <button 
            className="btn btn-primary"
            onClick={handleAutoAssignVehicles}
            disabled={assigningVehicles || recall.status === 'COMPLETED'}
          >
            {assigningVehicles ? (
              <>
                <RefreshCw size={16} className="spinning" />
                Đang gán xe...
              </>
            ) : (
              <>
                <Car size={16} />
                Tự động gán xe
              </>
            )}
          </button>
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
              {recall.vehicleBasicInfoDTOS && recall.vehicleBasicInfoDTOS.length > 0 ? (
                <div className="info-section">
                  <div className="section-title">
                    <Car size={20} />
                    <h3>Xe bị ảnh hưởng ({recall.vehicleBasicInfoDTOS.length})</h3>
                  </div>
                  <div className="vehicles-list">
                    {recall.vehicleBasicInfoDTOS.map((vehicle, index) => (
                      <div 
                        key={vehicle.vehicleId || vehicle.vin || index} 
                        className="vehicle-item-with-status"
                      >
                        <div 
                          className="vehicle-info clickable"
                          onClick={() => handleViewVehicleDetail(vehicle.vehicleId || vehicle.vin)}
                        >
                          {(vehicle.vehicleName || vehicle.modelName) && (
                            <span className="vehicle-model">🚗 {vehicle.vehicleName || vehicle.modelName}</span>
                          )}
                          <span className="vin-number">📋 VIN: {vehicle.vehicleId || vehicle.vin || vehicle.id || `Xe #${index + 1}`}</span>
                          {vehicle.yearModelYear && (
                            <span className="vehicle-year-badge">📅 {vehicle.yearModelYear}</span>
                          )}
                          {vehicle.batteryType && (
                            <span className="vehicle-battery-badge">🔋 {vehicle.batteryType}</span>
                          )}
                        </div>
                        <div className="vehicle-status-control" onClick={(e) => e.stopPropagation()}>
                          <label>Trạng thái:</label>
                          <select
                            className="status-select"
                            value={vehicle.status || "PENDING"}
                            onChange={(e) => handleVehicleStatusChange(vehicle.vehicleId || vehicle.vin, e.target.value)}
                          >
                            {RECALL_VEHICLE_STATUS_OPTIONS.map(option => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                  {recall.vehicleBasicInfoDTOS.length > 50 && (
                    <div className="vehicle-summary">
                      <p>Hiển thị tất cả {recall.vehicleBasicInfoDTOS.length} xe bị ảnh hưởng</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="info-section">
                  <div className="section-title">
                    <Car size={20} />
                    <h3>Xe bị ảnh hưởng</h3>
                  </div>
                  <div className="empty-state">
                    <AlertTriangle size={32} color="#fb923c" />
                    <p>Chưa có xe nào được gán vào recall này</p>
                    <p className="hint">Nhấn nút "Tự động gán xe" để tự động tìm và gán xe theo loại xe đã chọn</p>
                  </div>
                </div>
              )}

              {/* Vehicle Types Section */}
              {recall.vehicleTypeInfoDTOS && recall.vehicleTypeInfoDTOS.length > 0 && (
                <div className="info-section">
                  <div className="section-title">
                    <Car size={20} />
                    <h3>Loại xe bị ảnh hưởng ({recall.vehicleTypeInfoDTOS.length})</h3>
                  </div>
                  <div className="vehicle-types-list">
                    {recall.vehicleTypeInfoDTOS.map((type) => (
                      <div key={type.id} className="vehicle-type-chip">
                        <div className="vehicle-type-name">{type.modelName}</div>
                        <div className="vehicle-type-details">
                          <span className="vehicle-year">{type.yearModelYear}</span>
                          <span className="vehicle-battery">{type.batteryType}</span>
                        </div>
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
            {recall.technicianBasicDTOS && recall.technicianBasicDTOS.length > 0 && (
              <div className="info-section">
                <div className="section-title">
                  <Users size={20} />
                  <h3>Kỹ thuật viên ({recall.technicianBasicDTOS.length})</h3>
                </div>
                <div className="technicians-list">
                  {recall.technicianBasicDTOS.map((tech) => (
                    <div key={tech.id} className="technician-item">
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
            {(!recall.technicianBasicDTOS || recall.technicianBasicDTOS.length === 0) &&
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

      {/* Assign Technician Modal */}
      {showAssignTechModal && (
        <div className="modal-overlay" onClick={() => setShowAssignTechModal(false)}>
          <div className="modal-content assign-tech-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <UserPlus size={24} />
                Gán kỹ thuật viên
              </h2>
              <button className="modal-close" onClick={() => setShowAssignTechModal(false)}>
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="technician-list">
                {availableTechnicians.length === 0 ? (
                  <div className="empty-state">
                    <p>Không có kỹ thuật viên nào</p>
                  </div>
                ) : (
                  availableTechnicians.map(tech => {
                    const isAssigned = recall.technicianBasicDTOS?.some(t => t.id === tech.id);
                    return (
                      <div key={tech.id} className="technician-card">
                        <div className="tech-info">
                          <div className="tech-avatar">
                            {tech.name?.charAt(0).toUpperCase() || "T"}
                          </div>
                          <div className="tech-details">
                            <div className="tech-name">{tech.name || "N/A"}</div>
                            {tech.email && <div className="tech-email">{tech.email}</div>}
                            {tech.branchOffice && (
                              <div className="tech-branch">📍 {tech.branchOffice}</div>
                            )}
                          </div>
                        </div>
                        <button
                          className={`btn ${isAssigned ? "btn-success" : "btn-primary"}`}
                          onClick={() => handleAssignTechnician(tech.id)}
                          disabled={isAssigned}
                        >
                          {isAssigned ? "✓ Đã gán" : "Gán"}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowAssignTechModal(false)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RecallDetail;
