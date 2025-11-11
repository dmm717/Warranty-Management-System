import React, { useState } from "react";
import "../../styles/CampaignDetail.css";
import notificationService from "../../services/NotificationService";
import vehicleDistributionService from "../../services/VehicleDistributionService";
import appointmentSchedulingService from "../../services/AppointmentSchedulingService";
import workAssignmentService from "../../services/WorkAssignmentService";
import campaignResultTrackingService from "../../services/CampaignResultTrackingService";
import rolePermissionService from "../../services/RolePermissionService";
import { useAuth } from "../../contexts/AuthContext";
import { Wrench } from "lucide-react";

function CampaignDetail({ item, type, onEdit, onUpdateStatus, userRole }) {
  const { user } = useAuth();
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [processLog, setProcessLog] = useState([]);

  // Get current user role from context or props
  const currentUserRole = user?.role || userRole;

  if (!item) return null;

  const isRecall = type === "recall";

  const getStatusBadge = (status) => {
    const statusClasses = {
      "Chuẩn bị": "status-preparing",
      "Đang triển khai": "status-active",
      "Đang thực hiện": "status-active",
      "Tạm dừng": "status-paused",
      "Hoàn thành": "status-completed",
      "Hủy bỏ": "status-cancelled",
    };

    return (
      <span
        className={`status-badge ${
          statusClasses[status] || "status-preparing"
        }`}
      >
        {status}
      </span>
    );
  };

  const getApprovalBadge = (approvalStatus) => {
    const approvalClasses = {
      "Chờ phê duyệt": "approval-pending",
      "Đã phê duyệt": "approval-approved",
      "Từ chối": "approval-rejected",
    };

    return (
      <span
        className={`approval-badge ${
          approvalClasses[approvalStatus] || "approval-pending"
        }`}
      >
        {approvalStatus}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getProgressPercentage = () => {
    const completed = item.CompletedVehicles || 0;
    const total = item.AffectedVehicles || 0;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const canUpdateStatus = () => {
    return rolePermissionService.canUpdateRecall(currentUserRole);
  };

  const getAvailableStatuses = () => {
    if (isRecall && item.EVMApprovalStatus !== "Đã phê duyệt") return [];

    const statusFlow = {
      "Chuẩn bị": isRecall
        ? ["Đang thực hiện", "Hủy bỏ"]
        : ["Đang triển khai", "Hủy bỏ"],
      "Đang triển khai": ["Tạm dừng", "Hoàn thành"],
      "Đang thực hiện": ["Tạm dừng", "Hoàn thành"],
      "Tạm dừng": isRecall
        ? ["Đang thực hiện", "Hủy bỏ"]
        : ["Đang triển khai", "Hủy bỏ"],
      "Hoàn thành": [],
      "Hủy bỏ": [],
    };
    return statusFlow[item.Status] || [];
  };

  const handleStatusUpdate = () => {
    if (newStatus && newStatus !== item.Status) {
      onUpdateStatus(
        isRecall ? item.Recall_ID : item.CampaignsID,
        newStatus,
        type
      );
      setShowStatusModal(false);
      setNewStatus("");
    }
  };

  // Mock timeline data
  const getTimeline = () => {
    const baseTimeline = [
      {
        status: "Tạo " + (isRecall ? "recall" : "chiến dịch"),
        date: item.StartDate,
        description: isRecall
          ? "Recall được tạo và chờ phê duyệt"
          : "Chiến dịch được lên kế hoạch",
        user: "EVM Staff",
        active: true,
      },
    ];

    if (isRecall) {
      baseTimeline.push({
        status: "Phê duyệt",
        date: item.EVMApprovalStatus === "Đã phê duyệt" ? item.StartDate : null,
        description: "EVM phê duyệt thực hiện recall",
        user: "EVM Management",
        active: item.EVMApprovalStatus === "Đã phê duyệt",
      });
    }

    baseTimeline.push(
      {
        status: "Triển khai",
        date: [
          "Đang triển khai",
          "Đang thực hiện",
          "Tạm dừng",
          "Hoàn thành",
        ].includes(item.Status)
          ? item.StartDate
          : null,
        description: isRecall
          ? "Bắt đầu thực hiện recall"
          : "Bắt đầu triển khai chiến dịch",
        user: "SC Team",
        active: [
          "Đang triển khai",
          "Đang thực hiện",
          "Tạm dừng",
          "Hoàn thành",
        ].includes(item.Status),
      },
      {
        status: "Hoàn thành",
        date: item.Status === "Hoàn thành" ? item.EndDate : null,
        description: isRecall ? "Recall hoàn tất" : "Chiến dịch kết thúc",
        user: "SC Team",
        active: item.Status === "Hoàn thành",
      }
    );

    return baseTimeline;
  };

  const timeline = getTimeline();

  // 🔧 Handler functions for new services với kiểm tra quyền
  const handleSendNotification = async () => {
    // Kiểm tra quyền trước khi thực hiện
    const validation = rolePermissionService.validateAction(
      currentUserRole,
      "notify_campaign_to_sc",
      "gửi thông báo chiến dịch"
    );

    if (!validation.allowed) {
      setProcessLog((prev) => [...prev, `❌ ${validation.error}`]);
      return;
    }

    setIsProcessing(true);
    try {
      // Log action cho audit trail
      rolePermissionService.logAction(
        currentUserRole,
        user?.id,
        "notify_campaign_to_sc",
        isRecall ? item.Recall_ID : item.CampaignsID,
        { type: isRecall ? "recall" : "campaign" }
      );

      const result = await notificationService.sendCampaignNotification(
        isRecall ? item.Recall_ID : item.CampaignsID,
        {
          type: isRecall ? "recall" : "campaign",
          title: isRecall ? item.RecallName : item.CampaignsTypeName,
          description: isRecall ? item.IssueDescription : item.Description,
          urgency: isRecall ? "high" : "medium",
          requiredAction: isRecall
            ? item.RequiredAction
            : "Thực hiện theo hướng dẫn",
        }
      );

      if (result.success) {
        setProcessLog((prev) => [
          ...prev,
          `✅ Đã gửi thông báo đến ${result.notificationsSent} trung tâm`,
        ]);
      } else {
        setProcessLog((prev) => [
          ...prev,
          `❌ Lỗi gửi thông báo: ${result.error}`,
        ]);
      }
    } catch (error) {
      setProcessLog((prev) => [...prev, `❌ Lỗi: ${error.message}`]);
    }
    setIsProcessing(false);
  };

  const handleUrgentNotification = async () => {
    // Kiểm tra quyền gửi thông báo khẩn cấp
    const validation = rolePermissionService.validateAction(
      currentUserRole,
      "notify_campaign_to_sc",
      "gửi thông báo khẩn cấp"
    );

    if (!validation.allowed) {
      setProcessLog((prev) => [...prev, `❌ ${validation.error}`]);
      return;
    }

    setIsProcessing(true);
    try {
      rolePermissionService.logAction(
        currentUserRole,
        user?.id,
        "send_urgent_notification",
        item.Recall_ID,
        { type: "urgent_recall" }
      );

      const result = await notificationService.sendUrgentRecallNotification(
        item.Recall_ID,
        {
          severity: "critical",
          issueType: "safety",
          immediateAction: item.RequiredAction,
          description: item.IssueDescription,
          deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        }
      );

      if (result.success) {
        setProcessLog((prev) => [
          ...prev,
          `🚨 Đã gửi thông báo khẩn cấp đến ${result.notificationsSent} trung tâm`,
        ]);
      } else {
        setProcessLog((prev) => [
          ...prev,
          `❌ Lỗi gửi thông báo khẩn cấp: ${result.error}`,
        ]);
      }
    } catch (error) {
      setProcessLog((prev) => [...prev, `❌ Lỗi: ${error.message}`]);
    }
    setIsProcessing(false);
  };

  const handleStartWorkflow = async () => {
    // Kiểm tra quyền phân bổ xe (chỉ EVM Staff và Admin)
    const validation = rolePermissionService.validateAction(
      currentUserRole,
      "distribute_vehicles_to_centers",
      "khởi động quy trình workflow"
    );

    if (!validation.allowed) {
      setProcessLog((prev) => [...prev, `❌ ${validation.error}`]);
      return;
    }

    setIsProcessing(true);
    setProcessLog([]);

    try {
      const campaignId = isRecall ? item.Recall_ID : item.CampaignsID;

      rolePermissionService.logAction(
        currentUserRole,
        user?.id,
        "start_campaign_workflow",
        campaignId,
        { type: isRecall ? "recall" : "campaign" }
      );

      // Step 1: Get vehicles for campaign (cần quyền view_affected_vehicles)
      if (!rolePermissionService.canViewAffectedVehicles(currentUserRole)) {
        throw new Error("Không có quyền xem danh sách xe bị ảnh hưởng");
      }

      setProcessLog((prev) => [
        ...prev,
        "🔍 Đang lấy danh sách xe bị ảnh hưởng...",
      ]);
      const vehicles = await vehicleDistributionService.getVehiclesByCampaign(
        campaignId,
        isRecall ? "recall" : "campaign"
      );

      // Step 2: Distribute vehicles to service centers (cần quyền distribute_vehicles_to_centers)
      setProcessLog((prev) => [
        ...prev,
        "📍 Đang phân bổ xe đến các trung tâm dịch vụ...",
      ]);
      const distributionResult =
        await vehicleDistributionService.distributeVehiclesToCenters(
          campaignId,
          vehicles,
          { method: "geographic" }
        );

      if (!distributionResult.success) {
        throw new Error(distributionResult.error);
      }

      setProcessLog((prev) => [
        ...prev,
        `✅ Đã phân bổ ${vehicles.length} xe đến ${distributionResult.distributions.length} trung tâm`,
      ]);

      // Step 3: Create appointment schedule
      setProcessLog((prev) => [...prev, "📅 Đang tạo lịch hẹn..."]);
      const scheduleResult =
        await appointmentSchedulingService.createCampaignSchedule(
          campaignId,
          distributionResult,
          isRecall ? "recall" : "campaign"
        );

      if (!scheduleResult.success) {
        throw new Error(scheduleResult.error);
      }

      setProcessLog((prev) => [
        ...prev,
        `✅ Đã tạo lịch hẹn cho ${scheduleResult.centerSchedules.length} trung tâm`,
      ]);

      // Step 4: Create work assignments (auto-assign, SC sẽ confirm sau)
      setProcessLog((prev) => [
        ...prev,
        "👥 Đang tạo khung phân công công việc...",
      ]);
      const assignmentResult =
        await workAssignmentService.createCampaignWorkAssignments(
          campaignId,
          scheduleResult,
          isRecall ? "recall" : "campaign"
        );

      if (!assignmentResult.success) {
        throw new Error(assignmentResult.error);
      }

      setProcessLog((prev) => [
        ...prev,
        `✅ Đã tạo ${assignmentResult.summary.totalWorkOrders} work order cho ${assignmentResult.summary.totalTechnicians} kỹ thuật viên`,
      ]);

      // Step 5: Initialize result tracking
      setProcessLog((prev) => [
        ...prev,
        "📊 Đang khởi tạo theo dõi kết quả...",
      ]);
      const trackingResult =
        await campaignResultTrackingService.initializeCampaignTracking(
          campaignId,
          assignmentResult,
          scheduleResult
        );

      if (!trackingResult.success) {
        throw new Error(trackingResult.error);
      }

      setProcessLog((prev) => [
        ...prev,
        `✅ Đã khởi tạo theo dõi cho ${trackingResult.centerResults.length} trung tâm`,
      ]);

      // workflow data updated (internal)

      setProcessLog((prev) => [
        ...prev,
        "🎉 Quy trình chiến dịch đã được khởi động thành công!",
      ]);
      setProcessLog((prev) => [
        ...prev,
        "ℹ️ Service Center sẽ xác nhận lịch hẹn và phân công cụ thể",
      ]);
    } catch (error) {
      setProcessLog((prev) => [
        ...prev,
        `❌ Lỗi trong quy trình: ${error.message}`,
      ]);
    }

    setIsProcessing(false);
  };

  return (
    <div className="campaign-detail">
      <div className="detail-header">
        <div className="item-basic-info">
          <h2>
            {isRecall
              ? `Recall #${item.Recall_ID}`
              : `Chiến dịch #${item.CampaignsID}`}
          </h2>
          <h3>{isRecall ? item.RecallName : item.CampaignsTypeName}</h3>
          <div className="item-meta">
            {getStatusBadge(item.Status)}
            {isRecall && getApprovalBadge(item.EVMApprovalStatus)}
            <span className="item-date">
              Bắt đầu: {formatDate(item.StartDate)}
            </span>
            {!isRecall && item.EndDate && (
              <span className="item-date">
                Kết thúc: {formatDate(item.EndDate)}
              </span>
            )}
          </div>
        </div>
        <div className="detail-actions">
          {rolePermissionService.canUpdateRecall(currentUserRole) && (
            <button
              onClick={() => onEdit(item, type)}
              className="btn btn-outline"
            >
              <span>✏️</span>
              Chỉnh sửa
            </button>
          )}
          {canUpdateStatus() && getAvailableStatuses().length > 0 && (
            <button
              onClick={() => setShowStatusModal(true)}
              className="btn btn-primary"
            >
              <span>🔄</span>
              Cập nhật trạng thái
            </button>
          )}
        </div>
      </div>

      <div className="detail-content">
        <div className="detail-row">
          <div className="detail-col-8">
            <div className="info-sections">
              {/* Progress Overview */}
              <div className="info-section card">
                <h3 className="section-title">Tổng quan tiến độ</h3>
                <div className="progress-overview">
                  <div className="progress-stats">
                    <div className="stat-item">
                      <div className="stat-number">
                        {item.AffectedVehicles || 0}
                      </div>
                      <div className="stat-label">Xe bị ảnh hưởng</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-number">
                        {item.CompletedVehicles || 0}
                      </div>
                      <div className="stat-label">Đã hoàn thành</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-number">
                        {getProgressPercentage()}%
                      </div>
                      <div className="stat-label">Tiến độ</div>
                    </div>
                  </div>

                  <div className="progress-bar-large">
                    <div
                      className="progress-fill-large"
                      style={{ width: `${getProgressPercentage()}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="info-section card">
                <h3 className="section-title">Chi tiết</h3>
                <div className="detail-content-text">
                  <div className="info-item full-width">
                    <label>
                      {isRecall ? "Mô tả vấn đề" : "Mô tả chiến dịch"}
                    </label>
                    <div className="description-content">
                      {isRecall ? item.IssueDescription : item.Description}
                    </div>
                  </div>

                  {isRecall && (
                    <div className="info-item full-width">
                      <label>Hành động yêu cầu</label>
                      <div className="action-content">
                        {item.RequiredAction}
                      </div>
                    </div>
                  )}

                  <div className="info-grid">
                    <div className="info-item">
                      <label>Phụ tùng yêu cầu</label>
                      <span className="parts-required">
                        {isRecall ? item.PartsRequired : item.RequiredParts}
                      </span>
                    </div>
                    {item.NotificationSent && (
                      <div className="info-item">
                        <label>Thông báo khách hàng</label>
                        <span className="notification-status">
                          {item.NotificationSent ? "✅ Đã gửi" : "❌ Chưa gửi"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Affected Vehicles (Mock) */}
              <div className="info-section card">
                <h3 className="section-title">Xe bị ảnh hưởng</h3>
                <div className="affected-vehicles">
                  <div className="vehicle-models">
                    <div className="model-item">
                      <div className="model-name">VinFast VF8</div>
                      <div className="model-count">1,250 xe</div>
                    </div>
                    <div className="model-item">
                      <div className="model-name">VinFast VF9</div>
                      <div className="model-count">450 xe</div>
                    </div>
                  </div>

                  <div className="regions">
                    <h5>Phân bố theo khu vực:</h5>
                    <div className="region-list">
                      <div className="region-item">Hà Nội: 600 xe</div>
                      <div className="region-item">TP.HCM: 800 xe</div>
                      <div className="region-item">Đà Nẵng: 200 xe</div>
                      <div className="region-item">Khác: 100 xe</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="detail-col-4">
            {/* Timeline */}
            <div className="timeline-section card">
              <h3 className="section-title">Tiến trình thực hiện</h3>
              <div className="timeline">
                {timeline.map((timelineItem, index) => (
                  <div
                    key={index}
                    className={`timeline-item ${
                      timelineItem.active ? "active" : "inactive"
                    }`}
                  >
                    <div className="timeline-marker"></div>
                    <div className="timeline-content">
                      <div className="timeline-status">
                        {timelineItem.status}
                      </div>
                      {timelineItem.date && (
                        <div className="timeline-date">
                          {formatDate(timelineItem.date)}
                        </div>
                      )}
                      <div className="timeline-description">
                        {timelineItem.description}
                      </div>
                      <div className="timeline-user">
                        bởi {timelineItem.user}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="quick-actions-section card">
              <h3 className="section-title">Thao tác nhanh</h3>
              <div className="quick-actions">
                {rolePermissionService.canNotifyCampaignToSC(
                  currentUserRole
                ) && (
                  <button
                    className="action-btn notification-btn"
                    onClick={handleSendNotification}
                    disabled={isProcessing}
                  >
                    <span>📧</span>
                    Gửi thông báo
                  </button>
                )}

                {rolePermissionService.canDistributeVehicles(
                  currentUserRole
                ) && (
                  <button
                    className="action-btn workflow-btn"
                    onClick={handleStartWorkflow}
                    disabled={isProcessing}
                  >
                    <span>⚙️</span>
                    Khởi động quy trình
                  </button>
                )}

                {rolePermissionService.canRecordAndReport(currentUserRole) && (
                  <button className="action-btn report-btn">
                    <span>📊</span>
                    Xuất báo cáo
                  </button>
                )}

                {/* Contact button - available for all roles */}
                <button className="action-btn contact-btn">
                  <span>📞</span>
                  Liên hệ khách hàng
                </button>

                {/* Urgent notification - chỉ cho EVM Staff và Admin với recall */}
                {isRecall &&
                  rolePermissionService.canNotifyCampaignToSC(
                    currentUserRole
                  ) && (
                    <button
                      className="action-btn urgent-btn"
                      onClick={handleUrgentNotification}
                      disabled={isProcessing}
                    >
                      <span>🚨</span>
                      Báo cáo khẩn cấp
                    </button>
                  )}

                {/* SC specific actions */}
                {rolePermissionService.canConfirmAppointmentDate(
                  currentUserRole
                ) && (
                  <button className="action-btn appointment-btn">
                    <span>📅</span>
                    Xác nhận lịch hẹn
                  </button>
                )}

                {rolePermissionService.canAssignWorkToTechnician(
                  currentUserRole
                ) && (
                  <button className="action-btn assign-btn">
                    <span>👥</span>
                    Phân công việc
                  </button>
                )}

                {rolePermissionService.canRejectCampaign(currentUserRole) && (
                  <button className="action-btn reject-btn">
                    <span>❌</span>
                    Từ chối chiến dịch
                  </button>
                )}

                {/* Technician specific actions */}
                {rolePermissionService.canUpdateWorkResults(
                  currentUserRole
                ) && (
                  <button className="action-btn results-btn">
                    <Wrench size={18} style={{ marginRight: '6px' }} />
                    Cập nhật kết quả
                  </button>
                )}
              </div>
            </div>

            {/* Process Log */}
            {processLog.length > 0 && (
              <div className="process-log-section card">
                <h3 className="section-title">
                  Nhật ký quy trình
                  {isProcessing && <span className="loading-spinner">⏳</span>}
                </h3>
                <div className="process-log">
                  {processLog.map((log, index) => (
                    <div key={index} className="log-entry">
                      <span className="log-time">
                        {new Date().toLocaleTimeString("vi-VN")}
                      </span>
                      <span className="log-message">{log}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status Update Modal */}
      {showStatusModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h4>Cập nhật trạng thái</h4>
              <button
                onClick={() => setShowStatusModal(false)}
                className="modal-close"
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p>
                Trạng thái hiện tại: <strong>{item.Status}</strong>
              </p>
              <div className="form-group">
                <label className="form-label">Chọn trạng thái mới</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="form-control"
                >
                  <option value="">-- Chọn trạng thái --</option>
                  {getAvailableStatuses().map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-actions">
              <button
                onClick={() => setShowStatusModal(false)}
                className="btn btn-outline"
              >
                Hủy
              </button>
              <button
                onClick={handleStatusUpdate}
                className="btn btn-primary"
                disabled={!newStatus}
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

export default CampaignDetail;
