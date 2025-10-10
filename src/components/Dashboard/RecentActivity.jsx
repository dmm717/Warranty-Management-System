import React from "react";
import "./RecentActivity.css";

function RecentActivity({ userRole }) {
  // Mock data cho hoạt động gần đây
  const activities = {
    SC_Staff: [
      {
        id: 1,
        type: "warranty_claim",
        title: "Yêu cầu bảo hành mới",
        description: "VF8 - VIN: VF8ABC123456 - Lỗi pin",
        time: "2 phút trước",
        status: "pending",
      },
      {
        id: 2,
        type: "vehicle_register",
        title: "Đăng ký xe mới",
        description: "VF9 - Khách hàng: Nguyễn Văn A",
        time: "15 phút trước",
        status: "completed",
      },
      {
        id: 3,
        type: "parts_request",
        title: "Yêu cầu phụ tùng",
        description: "Pin 12V cho VF8ABC123456",
        time: "1 giờ trước",
        status: "approved",
      },
      {
        id: 4,
        type: "campaign",
        title: "Thông báo chiến dịch",
        description: "Recall pin cho VF8 2023",
        time: "2 giờ trước",
        status: "info",
      },
    ],
    EVM_Staff: [
      {
        id: 1,
        type: "claim_approval",
        title: "Phê duyệt bảo hành",
        description: "Claim #WC001 - Thay pin VF8",
        time: "5 phút trước",
        status: "approved",
      },
      {
        id: 2,
        type: "parts_allocation",
        title: "Phân bổ phụ tùng",
        description: "50 bộ pin gửi SC Hà Nội",
        time: "30 phút trước",
        status: "completed",
      },
      {
        id: 3,
        type: "report_analysis",
        title: "Phân tích báo cáo",
        description: "Báo cáo lỗi motor tháng 9",
        time: "1 giờ trước",
        status: "in_progress",
      },
    ],
  };

  const currentActivities = activities[userRole] || activities.SC_Staff;

  const getActivityIcon = (type) => {
    const icons = {
      warranty_claim: "🔧",
      vehicle_register: "🚗",
      parts_request: "📦",
      campaign: "📢",
      claim_approval: "✅",
      parts_allocation: "🚚",
      report_analysis: "📊",
    };
    return icons[type] || "📋";
  };

  const getStatusClass = (status) => {
    const classes = {
      pending: "status-pending",
      completed: "status-completed",
      approved: "status-approved",
      info: "status-info",
      in_progress: "status-in-progress",
    };
    return classes[status] || "status-pending";
  };

  return (
    <div className="recent-activity card">
      <div className="card-header">
        <h3 className="card-title">Hoạt động gần đây</h3>
      </div>
      <div className="activity-list">
        {currentActivities.map((activity) => (
          <div key={activity.id} className="activity-item">
            <div className="activity-icon">
              {getActivityIcon(activity.type)}
            </div>
            <div className="activity-content">
              <h4 className="activity-title">{activity.title}</h4>
              <p className="activity-description">{activity.description}</p>
              <div className="activity-meta">
                <span className="activity-time">{activity.time}</span>
                <span
                  className={`activity-status ${getStatusClass(
                    activity.status
                  )}`}
                >
                  {activity.status}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="activity-footer">
        <button className="btn btn-outline btn-sm">Xem tất cả</button>
      </div>
    </div>
  );
}

export default RecentActivity;
