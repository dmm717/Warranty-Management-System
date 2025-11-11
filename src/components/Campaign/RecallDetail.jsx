import React, { useState, useEffect } from "react";
import { Calendar, AlertTriangle, Users, Car, FileText, Clock, RefreshCw, UserPlus } from "lucide-react";
import { recallAPI, vehicleAPI, scTechnicianAPI } from "../../services/api";
import { RECALL_VEHICLE_STATUS_OPTIONS, VEHICLE_TYPES, RECALL_STATUS } from "../../constants";
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
  const [showAssignVehicleTypesModal, setShowAssignVehicleTypesModal] = useState(false);
  const [availableVehicleTypes, setAvailableVehicleTypes] = useState([]);
  const [showDatePickerModal, setShowDatePickerModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [updatingVehicleId, setUpdatingVehicleId] = useState(null);
  const isEVMAdmin = user?.role === "EVM_ADMIN";
  const isEVMStaff = user?.role === "EVM_STAFF";
  const isSCAdmin = user?.role === "SC_ADMIN";
  const isSCStaff = user?.role === "SC_STAFF";
  const isSCTechnical = user?.role === "SC_TECHNICAL";

  // Phân quyền cho các chức năng
  const canAssignTechnicians = isEVMAdmin || isEVMStaff|| isSCAdmin;
  const canAssignVehicleTypes = isEVMAdmin || isEVMStaff;
  const canAutoAssignVehicles = isEVMAdmin || isEVMStaff ;
  const canUpdateVehicleStatus = isSCAdmin || isSCStaff || isSCTechnical || isEVMAdmin || isEVMStaff;

  useEffect(() => {
    if (recallId) {
      fetchRecallDetail();
    }
  }, [recallId]);

  // Chặn scroll của body khi modal mở
  useEffect(() => {
    if (showAssignTechModal || showAssignVehicleTypesModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup khi component unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showAssignTechModal, showAssignVehicleTypesModal]);

  const fetchRecallDetail = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("🔄 Fetching recall detail for ID:", recallId);
      const response = await recallAPI.getRecallById(recallId);

      const recallData = response.data;
      console.log("📋 Raw recall data:", recallData);
      console.log("📋 Vehicle types before processing:", recallData.vehicleTypeInfoDTOS);

      // Fetch trạng thái thực của từng xe từ API
      if (recallData.vehicleBasicInfoDTOS && recallData.vehicleBasicInfoDTOS.length > 0) {
        const vehiclesWithStatus = await Promise.all(
          recallData.vehicleBasicInfoDTOS.map(async (vehicle) => {
            try {
              const vehicleId = vehicle.vehicleId || vehicle.vin;
              const detailResponse = await recallAPI.getRecallVehicleDetail(recallId, vehicleId);
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

        // attach fetched vehicle statuses
        recallData.vehicleBasicInfoDTOS = vehiclesWithStatus;
      }

      console.log("✅ Final recall data with vehicle types:", recallData.vehicleTypeInfoDTOS);
      setRecall(recallData);

      console.log("✅ Recall detail fetched successfully");
    } catch (err) {
      console.error("❌ Error fetching recall detail:", err);
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

      let technicians = response.data?.content || [];

      // Lọc chỉ lấy technicians cùng branchOffice với user hiện tại
      if (user?.branchOffice) {
        technicians = technicians.filter(tech =>
          tech.branchOffice === user.branchOffice
        );
        // filtered technicians for branch
      }

      setAvailableTechnicians(technicians);
      setShowAssignTechModal(true);
    } catch (err) {
      console.error("Error fetching technicians:", err);
      toast.error("Không thể tải danh sách kỹ thuật viên");
    }
  };

  const handleOpenAssignVehicleTypesModal = async () => {
    try {
      console.log("🔄 Opening assign vehicle types modal...");

      // Map VEHICLE_TYPES to the format expected by the modal
      const vehicleTypesFromConstants = VEHICLE_TYPES.map((vt, index) => ({
        id: vt.id, // Use actual vehicle type IDs like "EVT001", "EVT002", etc.
        modelName: vt.name,
        yearModelYear: "2023", // Default year
        batteryType: "Lithium-ion" // Default battery type
      }));

      console.log("📋 Available vehicle types from constants:", vehicleTypesFromConstants);
      console.log("📋 Current recall vehicle types:", recall.vehicleTypeInfoDTOS);

      setAvailableVehicleTypes(vehicleTypesFromConstants);
      setShowAssignVehicleTypesModal(true);

      console.log("✅ Assign vehicle types modal opened successfully");
    } catch (err) {
      console.error("❌ Error fetching vehicle types:", err);
      toast.error("Không thể tải danh sách loại xe");
    }
  };

  const handleAssignTechnician = async (technicianId) => {
    try {
      await recallAPI.addTechnicianToRecall(recallId, technicianId);
      toast.success("Đã gán kỹ thuật viên");
      // Refresh data to show updated technician list
      await fetchRecallDetail();

      setShowAssignTechModal(false);
    } catch (err) {
      console.error("❌ Error adding technician:", err);
      console.error("❌ Error response:", err.response?.data);
      toast.error(err.response?.data?.message || "Không thể gán kỹ thuật viên");
    }
  };

  const handleAssignVehicleType = async (vehicleTypeId) => {
    try {
      console.log("🚗 Assigning vehicle type:", vehicleTypeId, "to recall:", recallId);

      // Use the proper API method for single vehicle type assignment
      console.log("🔧 Using recallAPI.addVehicleTypeToRecall method");
      await recallAPI.addVehicleTypeToRecall(recallId, vehicleTypeId);

      console.log("✅ Successfully assigned vehicle type:", vehicleTypeId);
      toast.success("Đã gán loại xe");

      // Refresh data to show updated vehicle type list
      console.log("🔄 Refreshing recall data after vehicle type assignment...");
      await fetchRecallDetail();

      console.log("✅ Recall data refreshed, closing modal");
      setShowAssignVehicleTypesModal(false);
    } catch (err) {
      console.error("❌ Error adding vehicle type:", err);
      console.error("❌ Error response:", err.response?.data);
      console.error("❌ Error status:", err.response?.status);
      toast.error(err.response?.data?.message || err.message || "Không thể gán loại xe");
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

  const handleUpdateReturnDate = (vehicleId, currentReturnDate) => {
    setUpdatingVehicleId(vehicleId);
    setSelectedDate(currentReturnDate || "");
    setShowDatePickerModal(true);
  };

  const handleConfirmDateUpdate = async () => {
    if (!selectedDate) {
      toast.error("Vui lòng chọn ngày trả xe");
      return;
    }

    try {
      // Gọi API để cập nhật return date
      await vehicleAPI.updateReturnDate(updatingVehicleId, selectedDate);

      // Cập nhật state local
      setRecall(prevRecall => ({
        ...prevRecall,
        vehicleBasicInfoDTOS: prevRecall.vehicleBasicInfoDTOS.map(vehicle =>
          (vehicle.vehicleId === updatingVehicleId || vehicle.vin === updatingVehicleId)
            ? { ...vehicle, returnDate: selectedDate }
            : vehicle
        )
      }));

      toast.success("Đã cập nhật ngày trả xe");
      setShowDatePickerModal(false);
      setSelectedDate("");
      setUpdatingVehicleId(null);
    } catch (err) {
      console.error("Error updating return date:", err);
      toast.error("Không thể cập nhật ngày trả xe");
    }
  };

  // Nếu đang xem vehicle detail, hiển thị VehicleDetail component
  if (showVehicleDetail && selectedVehicleId) {
    return <VehicleDetail vehicleId={selectedVehicleId} onBack={handleBackFromVehicle} />;
  }

  const getStatusBadge = (status) => {
    const statusClasses = {
      [RECALL_STATUS.ACTIVE]: "status-active",
      [RECALL_STATUS.INACTIVE]: "status-inactive",
      [RECALL_STATUS.COMPLETE]: "status-completed",
      CANCELLED: "status-cancelled",
    };

    const statusLabels = {
      [RECALL_STATUS.ACTIVE]: "Đang hoạt động",
      [RECALL_STATUS.INACTIVE]: "Chưa kích hoạt",
      [RECALL_STATUS.COMPLETE]: "Hoàn thành",
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
            disabled={!canAssignTechnicians}
            title={!canAssignTechnicians ? "Chỉ EVM_ADMIN và EVM_STAFF mới có thể gán kỹ thuật viên" : ""}
          >
            <UserPlus size={16} />
            Gán kỹ thuật viên
          </button>
          <button
            className="btn btn-secondary"
            onClick={handleOpenAssignVehicleTypesModal}
            disabled={!canAssignVehicleTypes}
            title={!canAssignVehicleTypes ? "Chỉ EVM_ADMIN và EVM_STAFF mới có thể gán loại xe" : ""}
          >
            <Car size={16} />
            Gán loại xe
          </button>
          <button
            className="btn btn-primary"
            onClick={handleAutoAssignVehicles}
            disabled={assigningVehicles || recall.status === RECALL_STATUS.COMPLETE || !canAutoAssignVehicles}
            title={!canAutoAssignVehicles ? "Chỉ EVM_ADMIN, EVM_STAFF và SC_ADMIN mới có thể tự động gán xe" : ""}
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
                    <h3>
                      Xe bị ảnh hưởng ({recall.vehicleBasicInfoDTOS.length})
                      {(() => {
                        const statusCounts = recall.vehicleBasicInfoDTOS.reduce((acc, vehicle) => {
                          const status = vehicle.status || "PENDING";
                          acc[status] = (acc[status] || 0) + 1;
                          return acc;
                        }, {});

                        const statusParts = [];
                        if (statusCounts.COMPLETED) statusParts.push(`${statusCounts.COMPLETED} hoàn thành`);
                        if (statusCounts.IN_PROGRESS) statusParts.push(`${statusCounts.IN_PROGRESS} đang xử lý`);
                        if (statusCounts.PENDING) statusParts.push(`${statusCounts.PENDING} chờ xử lý`);

                        return statusParts.length > 0 ? ` - ${statusParts.join(", ")}` : "";
                      })()}
                    </h3>
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
                            <span className="vehicle-model"><Car size={20} /> {vehicle.vehicleName || vehicle.modelName}</span>
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
                          {/* Hiển thị return date khi status là SCHEDULED */}
                          {vehicle.status === "SCHEDULED" && (
                            <div className="return-date-info">
                              <div className="return-date-content">
                                <span className="return-date-text">
                                  📅 Ngày trả xe: {vehicle.returnDate ? formatDate(vehicle.returnDate) : "Chưa cập nhật"}
                                </span>
                                {canUpdateVehicleStatus && (
                                  <button
                                    className="update-return-date-btn"
                                    onClick={() => handleUpdateReturnDate(vehicle.vehicleId || vehicle.vin, vehicle.returnDate)}
                                  >
                                    Cập nhật
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                          
                          <label>Trạng thái:</label>
                          <select
                            className="status-select"
                            value={vehicle.status || "PENDING"}
                            onChange={(e) => handleVehicleStatusChange(vehicle.vehicleId || vehicle.vin, e.target.value)}
                            disabled={!canUpdateVehicleStatus}
                            title={!canUpdateVehicleStatus ? "Chỉ SC_ADMIN, SC_STAFF và SC_TECHNICAL mới có thể cập nhật trạng thái xe" : ""}
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

              {/* Vehicle Status Summary */}
              {recall.vehicleBasicInfoDTOS && recall.vehicleBasicInfoDTOS.length > 0 && (
                <div className="info-section">
                  <div className="section-title">
                    <Clock size={20} />
                    <h3>Tóm tắt trạng thái xe</h3>
                  </div>
                  <div className="status-summary">
                    {(() => {
                      const statusCounts = recall.vehicleBasicInfoDTOS.reduce((acc, vehicle) => {
                        const status = vehicle.status || "PENDING";
                        acc[status] = (acc[status] || 0) + 1;
                        return acc;
                      }, {});

                      const total = recall.vehicleBasicInfoDTOS.length;
                      const completed = statusCounts.COMPLETED || 0;
                      const inProgress = statusCounts.IN_PROGRESS || 0;
                      const pending = statusCounts.PENDING || 0;

                      return (
                        <div className="status-summary-grid">
                          <div className="status-summary-item">
                            <div className="status-count total">{total}</div>
                            <div className="status-label">Tổng số xe</div>
                          </div>
                          <div className="status-summary-item">
                            <div className="status-count completed">{completed}</div>
                            <div className="status-label">Hoàn thành</div>
                            <div className="status-percentage">
                              {total > 0 ? Math.round((completed / total) * 100) : 0}%
                            </div>
                          </div>
                          <div className="status-summary-item">
                            <div className="status-count in-progress">{inProgress}</div>
                            <div className="status-label">Đang xử lý</div>
                            <div className="status-percentage">
                              {total > 0 ? Math.round((inProgress / total) * 100) : 0}%
                            </div>
                          </div>
                          <div className="status-summary-item">
                            <div className="status-count pending">{pending}</div>
                            <div className="status-label">Chờ xử lý</div>
                            <div className="status-percentage">
                              {total > 0 ? Math.round((pending / total) * 100) : 0}%
                            </div>
                          </div>
                        </div>
                      );
                    })()}
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
                  {console.log("🎯 Rendering vehicle types section:", recall.vehicleTypeInfoDTOS)}
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

      {showAssignVehicleTypesModal && (
        <div className="modal-overlay" onClick={() => setShowAssignVehicleTypesModal(false)}>
          <div className="modal-content assign-tech-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <Car size={24} />
                Gán loại xe
              </h2>
              <button className="modal-close" onClick={() => setShowAssignVehicleTypesModal(false)}>
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="technician-list">
                {availableVehicleTypes.length === 0 ? (
                  <div className="empty-state">
                    <p>Không có loại xe nào</p>
                  </div>
                ) : (
                  availableVehicleTypes.map(vehicleType => {
                    const isAssigned = recall.vehicleTypeInfoDTOS?.some(vt => vt.id === vehicleType.id);
                    console.log(`🔍 Checking vehicle type ${vehicleType.id} (${vehicleType.modelName}): isAssigned =`, isAssigned);
                    return (
                      <div key={vehicleType.id} className="technician-card">
                        <div className="tech-info">
                          <div className="tech-avatar">
                            {vehicleType.modelName?.charAt(0).toUpperCase() || "V"}
                          </div>
                          <div className="tech-details">
                            <div className="tech-name">{vehicleType.modelName || "N/A"}</div>
                            <div className="tech-email">
                              {vehicleType.yearModelYear} - {vehicleType.batteryType}
                            </div>
                          </div>
                        </div>
                        <button
                          className={`btn ${isAssigned ? "btn-success" : "btn-primary"}`}
                          onClick={() => handleAssignVehicleType(vehicleType.id)}
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
              <button className="btn btn-outline" onClick={() => setShowAssignVehicleTypesModal(false)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Date Picker Modal */}
      {showDatePickerModal && (
        <div className="modal-overlay" onClick={() => setShowDatePickerModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📅 Cập nhật ngày trả xe</h3>
            </div>

            <div className="modal-body">
              <label>Chọn ngày trả xe:</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-outline"
                onClick={() => {
                  setShowDatePickerModal(false);
                  setSelectedDate("");
                  setUpdatingVehicleId(null);
                }}
              >
                Hủy
              </button>
              <button
                className="btn btn-primary"
                onClick={handleConfirmDateUpdate}
                disabled={!selectedDate}
              >
                Cập nhật
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RecallDetail;
