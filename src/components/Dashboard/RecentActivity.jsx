import React, { useState, useEffect } from "react";
import { warrantyClaimAPI } from "../../services/api";
import "../../styles/RecentActivity.css";

function RecentActivity({ userRole }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadActivities = async () => {
      setLoading(true);
      try {
        // Lấy recent claims
        await fetchRecentClaims();
      } catch (err) {
        console.error("Error loading activities:", err);
      } finally {
        setLoading(false);
      }
    };

    loadActivities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userRole]);

  const fetchRecentClaims = async () => {
    try {
      const response = await warrantyClaimAPI.getAllClaims({
        page: 0,
        size: 5,
        sortBy: "claimDate",
        sortDir: "desc",
      });

      if (response.success && response.data?.content) {
        const claims = response.data.content;

        // Transform claims to activities
        const recentActivities = claims.map((claim, index) => ({
          id: claim.claimId || index,
          type: "warranty_claim",
          title: "Yêu cầu bảo hành",
          description: `${claim.vehicleVin || "N/A"} - ${
            claim.issueDescription || "Không có mô tả"
          }`,
          time: getTimeAgo(claim.claimDate),
          status: claim.status?.toLowerCase() || "pending",
        }));

        setActivities(recentActivities);
      }
    } catch (error) {
      console.error("Error fetching recent claims:", error);
      setActivities([]);
    }
  };

  const getTimeAgo = (dateString) => {
    if (!dateString) return "N/A";

    try {
      // dateString format from BE: dd-MM-yyyy
      const parts = dateString.split("-");
      if (parts.length === 3) {
        const date = new Date(parts[2], parts[1] - 1, parts[0]);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 60) return `${diffMins} phút trước`;
        if (diffHours < 24) return `${diffHours} giờ trước`;
        if (diffDays < 30) return `${diffDays} ngày trước`;
        return dateString;
      }
    } catch {
      return dateString;
    }

    return dateString;
  };

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
      rejected: "status-rejected",
      info: "status-info",
      in_progress: "status-in-progress",
    };
    return classes[status] || "status-pending";
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: "CHỜ DUYỆT",
      completed: "HOÀN THÀNH",
      approved: "ĐÃ DUYỆT",
      rejected: "TỪ CHỐI",
      in_progress: "ĐANG XỬ LÝ",
    };
    return labels[status] || status?.toUpperCase() || "N/A";
  };

  if (loading) {
    return (
      <div className="recent-activity card">
        <div className="card-header">
          <h3 className="card-title">Hoạt động gần đây</h3>
        </div>
        <div className="activity-list">
          <p style={{ padding: "20px", textAlign: "center" }}>Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="recent-activity card">
      <div className="card-header">
        <h3 className="card-title">Hoạt động gần đây</h3>
      </div>
      <div className="activity-list">
        {activities.length === 0 ? (
          <p style={{ padding: "20px", textAlign: "center" }}>
            Không có hoạt động gần đây
          </p>
        ) : (
          activities.map((activity) => (
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
                    {getStatusLabel(activity.status)}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      <div className="activity-footer">
        <button className="btn btn-outline btn-sm">Xem tất cả</button>
      </div>
    </div>
  );
}

export default RecentActivity;
