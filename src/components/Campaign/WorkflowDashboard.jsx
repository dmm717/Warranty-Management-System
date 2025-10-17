import React, { useState, useEffect } from "react";
import "./WorkflowDashboard.css";
import notificationService from "../../services/NotificationService";
import vehicleDistributionService from "../../services/VehicleDistributionService";
import appointmentSchedulingService from "../../services/AppointmentSchedulingService";
import workAssignmentService from "../../services/WorkAssignmentService";
import campaignResultTrackingService from "../../services/CampaignResultTrackingService";
import reportConfirmationService from "../../services/ReportConfirmationService";

function WorkflowDashboard() {
  const [workflowStats, setWorkflowStats] = useState({
    activeCampaigns: 0,
    pendingDistributions: 0,
    scheduledAppointments: 0,
    activeAssignments: 0,
    trackingProgress: 0,
    pendingReports: 0,
  });

  const [recentActivities, setRecentActivities] = useState([]);
  const [urgentItems, setUrgentItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);

      // Simulate loading dashboard data
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mock data for demonstration
      setWorkflowStats({
        activeCampaigns: 12,
        pendingDistributions: 5,
        scheduledAppointments: 156,
        activeAssignments: 89,
        trackingProgress: 78,
        pendingReports: 3,
      });

      setRecentActivities([
        {
          id: 1,
          type: "notification",
          message: "Gửi thông báo recall VF8 đến 5 trung tâm dịch vụ",
          timestamp: new Date(Date.now() - 30 * 60 * 1000),
          status: "completed",
        },
        {
          id: 2,
          type: "distribution",
          message: "Phân bổ 120 xe VF9 cho chiến dịch bảo trì",
          timestamp: new Date(Date.now() - 60 * 60 * 1000),
          status: "in_progress",
        },
        {
          id: 3,
          type: "appointment",
          message: "Tạo lịch hẹn cho recall khẩn cấp - 45 xe",
          timestamp: new Date(Date.now() - 90 * 60 * 1000),
          status: "completed",
        },
        {
          id: 4,
          type: "assignment",
          message: "Phân công 8 kỹ thuật viên cho chiến dịch RCL001",
          timestamp: new Date(Date.now() - 120 * 60 * 1000),
          status: "completed",
        },
        {
          id: 5,
          type: "report",
          message: "Báo cáo chiến dịch CAM003 chờ xác nhận từ nhà sản xuất",
          timestamp: new Date(Date.now() - 180 * 60 * 1000),
          status: "pending",
        },
      ]);

      setUrgentItems([
        {
          id: 1,
          type: "report",
          title: "Báo cáo recall RCL005 sắp hết hạn",
          description: "Còn 6 giờ để nhà sản xuất xác nhận",
          priority: "critical",
          dueDate: new Date(Date.now() + 6 * 60 * 60 * 1000),
        },
        {
          id: 2,
          type: "appointment",
          title: "15 lịch hẹn cần xác nhận ngày mai",
          description: "Khách hàng VF8 cho chiến dịch CAM002",
          priority: "high",
          dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
        {
          id: 3,
          type: "distribution",
          title: "Phân bổ xe cho recall khẩn cấp",
          description: "RCL006 - 89 xe VF9 cần phân bổ ngay",
          priority: "critical",
          dueDate: new Date(Date.now() + 2 * 60 * 60 * 1000),
        },
      ]);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getActivityIcon = (type) => {
    const icons = {
      notification: "📧",
      distribution: "📍",
      appointment: "📅",
      assignment: "👥",
      tracking: "📊",
      report: "📋",
    };
    return icons[type] || "📌";
  };

  const getActivityStatusClass = (status) => {
    return `activity-status status-${status}`;
  };

  const getPriorityClass = (priority) => {
    return `priority-${priority}`;
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (minutes < 60) {
      return `${minutes} phút trước`;
    } else {
      return `${hours} giờ trước`;
    }
  };

  const formatTimeRemaining = (dueDate) => {
    const now = new Date();
    const diff = dueDate - now;
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 24) {
      return `${hours} giờ`;
    } else {
      const days = Math.floor(hours / 24);
      return `${days} ngày`;
    }
  };

  if (isLoading) {
    return (
      <div className="workflow-dashboard loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Đang tải dữ liệu workflow...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="workflow-dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <h1>🚗 VinFast Workflow Management</h1>
          <p>Quản lý quy trình chiến dịch và recall toàn diện</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-outline" onClick={loadDashboardData}>
            <span>🔄</span>
            Làm mới
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <div className="stat-number">{workflowStats.activeCampaigns}</div>
            <div className="stat-label">Chiến dịch đang hoạt động</div>
          </div>
          <div className="stat-trend positive">+2</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📍</div>
          <div className="stat-content">
            <div className="stat-number">
              {workflowStats.pendingDistributions}
            </div>
            <div className="stat-label">Phân bổ chờ xử lý</div>
          </div>
          <div className="stat-trend neutral">0</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <div className="stat-number">
              {workflowStats.scheduledAppointments}
            </div>
            <div className="stat-label">Lịch hẹn đã lên</div>
          </div>
          <div className="stat-trend positive">+12</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <div className="stat-number">{workflowStats.activeAssignments}</div>
            <div className="stat-label">Phân công đang thực hiện</div>
          </div>
          <div className="stat-trend positive">+5</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-number">{workflowStats.trackingProgress}%</div>
            <div className="stat-label">Tiến độ trung bình</div>
          </div>
          <div className="stat-trend positive">+3%</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <div className="stat-number">{workflowStats.pendingReports}</div>
            <div className="stat-label">Báo cáo chờ xác nhận</div>
          </div>
          <div className="stat-trend warning">!</div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="content-row">
          {/* Recent Activities */}
          <div className="content-col-8">
            <div className="card activities-card">
              <div className="card-header">
                <h3>Hoạt động gần đây</h3>
                <span className="activity-count">
                  {recentActivities.length} hoạt động
                </span>
              </div>
              <div className="activities-list">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="activity-item">
                    <div className="activity-icon">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="activity-content">
                      <div className="activity-message">{activity.message}</div>
                      <div className="activity-meta">
                        <span className="activity-time">
                          {formatTimeAgo(activity.timestamp)}
                        </span>
                        <span
                          className={getActivityStatusClass(activity.status)}
                        >
                          {activity.status === "completed"
                            ? "Hoàn thành"
                            : activity.status === "in_progress"
                            ? "Đang xử lý"
                            : "Chờ xử lý"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Urgent Items */}
          <div className="content-col-4">
            <div className="card urgent-card">
              <div className="card-header">
                <h3>🚨 Cần xử lý gấp</h3>
                <span className="urgent-count">{urgentItems.length} mục</span>
              </div>
              <div className="urgent-list">
                {urgentItems.map((item) => (
                  <div
                    key={item.id}
                    className={`urgent-item ${getPriorityClass(item.priority)}`}
                  >
                    <div className="urgent-header">
                      <div className="urgent-title">{item.title}</div>
                      <div className="urgent-time">
                        {formatTimeRemaining(item.dueDate)}
                      </div>
                    </div>
                    <div className="urgent-description">{item.description}</div>
                    <div className="urgent-actions">
                      <button className="btn btn-sm btn-primary">
                        Xử lý ngay
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card quick-actions-card">
              <div className="card-header">
                <h3>Thao tác nhanh</h3>
              </div>
              <div className="quick-actions-grid">
                <button className="quick-action-btn">
                  <span>📧</span>
                  <div>Gửi thông báo</div>
                </button>
                <button className="quick-action-btn">
                  <span>📍</span>
                  <div>Phân bổ xe</div>
                </button>
                <button className="quick-action-btn">
                  <span>📅</span>
                  <div>Tạo lịch hẹn</div>
                </button>
                <button className="quick-action-btn">
                  <span>👥</span>
                  <div>Phân công việc</div>
                </button>
                <button className="quick-action-btn">
                  <span>📊</span>
                  <div>Theo dõi tiến độ</div>
                </button>
                <button className="quick-action-btn">
                  <span>📋</span>
                  <div>Tạo báo cáo</div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WorkflowDashboard;
