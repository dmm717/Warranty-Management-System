import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { warrantyClaimAPI } from "../../services/api";
import StatsCard from "./StatsCard";
import { Wrench, FileText, Check, X, BarChart3, AlertTriangle } from "lucide-react";
import "../../styles/Dashboard.css";
import "../../styles/EVMStaffDashboard.css";

function EVMStaffDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    pendingApproval: 0,
    approvedToday: 0,
    rejectedToday: 0,
    overdueApproval: 0,
    totalThisMonth: 0,
  });
  const [pendingClaims, setPendingClaims] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [claimsByType, setClaimsByType] = useState([]);
  const [claimsBySC, setClaimsBySC] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch all claims
      const response = await warrantyClaimAPI.getAllClaims({
        page: 0,
        size: 1000,
      });

      if (response.success && response.data?.content) {
        const claims = response.data.content;
        calculateStats(claims);
        preparePendingClaims(claims);
        prepareChartData(claims);
        prepareRecentActivities(claims);
      }
    } catch (error) {
      console.error("Error loading dashboard:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const calculateStats = (claims) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const overdueCutoff = new Date(now - 48 * 60 * 60 * 1000); // 48 hours ago

    const stats = {
      pendingApproval: claims.filter(
        (c) => c.status === "PENDING" || c.status === "PENDING_APPROVAL"
      ).length,

      approvedToday: claims.filter((c) => {
        if (c.status !== "APPROVED") return false;
        const updatedDate = new Date(c.lastModifiedDate || c.createdDate);
        return updatedDate >= today;
      }).length,

      rejectedToday: claims.filter((c) => {
        if (c.status !== "REJECTED") return false;
        const updatedDate = new Date(c.lastModifiedDate || c.createdDate);
        return updatedDate >= today;
      }).length,

      overdueApproval: claims.filter((c) => {
        if (c.status !== "PENDING" && c.status !== "PENDING_APPROVAL")
          return false;
        const createdDate = new Date(c.createdDate);
        return createdDate < overdueCutoff;
      }).length,

      totalThisMonth: claims.filter((c) => {
        const createdDate = new Date(c.createdDate);
        return createdDate >= monthStart;
      }).length,
    };

    setStats(stats);
  };

  const preparePendingClaims = (claims) => {
    const pending = claims
      .filter((c) => c.status === "PENDING" || c.status === "PENDING_APPROVAL")
      .sort((a, b) => new Date(a.createdDate) - new Date(b.createdDate))
      .slice(0, 10); // Top 10 oldest pending

    setPendingClaims(pending);
  };

  const prepareChartData = (claims) => {
    // Group by issue type
    const typeCount = {};
    claims.forEach((c) => {
      const type = c.issueType || c.defectType || "Khác";
      typeCount[type] = (typeCount[type] || 0) + 1;
    });
    setClaimsByType(
      Object.entries(typeCount).map(([name, value]) => ({ name, value }))
    );

    // Group by Service Center
    const scCount = {};
    claims.forEach((c) => {
      const sc = c.serviceCenterName || c.branchOffice || "N/A";
      scCount[sc] = (scCount[sc] || 0) + 1;
    });
    setClaimsBySC(
      Object.entries(scCount)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5) // Top 5 SCs
    );
  };

  const prepareRecentActivities = (claims) => {
    const recent = claims
      .filter((c) => c.status === "APPROVED" || c.status === "REJECTED")
      .sort(
        (a, b) =>
          new Date(b.lastModifiedDate || b.createdDate) -
          new Date(a.lastModifiedDate || a.createdDate)
      )
      .slice(0, 5);

    setRecentActivities(recent);
  };

  const getWaitingTime = (createdDate) => {
    const now = new Date();
    const created = new Date(createdDate);
    const hours = Math.floor((now - created) / (1000 * 60 * 60));

    if (hours < 1) return "< 1h";
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  };

  const isOverdue = (createdDate) => {
    const now = new Date();
    const created = new Date(createdDate);
    const hours = (now - created) / (1000 * 60 * 60);
    return hours > 48;
  };

  const handleReviewClaim = (claimId) => {
    navigate(`/warranty/${claimId}`);
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading">Đang tải dữ liệu...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Dashboard - EVM Staff</h1>
        <p className="dashboard-subtitle">Quản lý xét duyệt yêu cầu bảo hành</p>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <StatsCard
          title="Chờ xét duyệt"
          value={stats.pendingApproval}
          icon={<FileText size={24} />}
          color="orange"
          subtitle="Cần hành động ngay"
        />
        <StatsCard
          title="Đã phê duyệt hôm nay"
          value={stats.approvedToday}
          icon={<Check size={24} />}
          color="green"
          subtitle="Năng suất ngày"
        />
        <StatsCard
          title="Đã từ chối hôm nay"
          value={stats.rejectedToday}
          icon={<X size={24} />}
          color="red"
          subtitle="Kiểm soát từ chối"
        />
        <StatsCard
          title="Quá hạn xử lý"
          value={stats.overdueApproval}
          icon={<AlertTriangle size={24} />}
          color="purple"
          subtitle="> 48 giờ"
        />
        <StatsCard
          title="Tổng yêu cầu tháng này"
          value={stats.totalThisMonth}
          icon={<BarChart3 size={24} />}
          color="blue"
          subtitle="Khối lượng công việc"
        />
      </div>

      {/* Priority Queue */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2>
            <FileText size={20} style={{ display: 'inline', marginRight: '8px' }} />
            Danh sách yêu cầu cần xử lý
          </h2>
          <button
            className="btn btn-primary"
            onClick={() => navigate("/warranty")}
          >
            Xem tất cả
          </button>
        </div>

        <div className="pending-claims-table">
          {pendingClaims.length === 0 ? (
            <div className="empty-state">
              <p>✨ Không có yêu cầu chờ xét duyệt</p>
            </div>
          ) : (
            <table className="claims-table">
              <thead>
                <tr>
                  <th>Claim ID</th>
                  <th>VIN</th>
                  <th>Service Center</th>
                  <th>Loại lỗi</th>
                  <th>Thời gian chờ</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {pendingClaims.map((claim) => (
                  <tr
                    key={claim.id}
                    className={
                      isOverdue(claim.createdDate) ? "overdue-row" : ""
                    }
                  >
                    <td>
                      <strong>#{claim.id}</strong>
                    </td>
                    <td>{claim.vin || "N/A"}</td>
                    <td>
                      {claim.serviceCenterName || claim.branchOffice || "N/A"}
                    </td>
                    <td>{claim.issueType || claim.defectType || "N/A"}</td>
                    <td>
                      <span
                        className={
                          isOverdue(claim.createdDate) ? "overdue-badge" : ""
                        }
                      >
                        {getWaitingTime(claim.createdDate)}
                        {isOverdue(claim.createdDate) && <AlertTriangle size={14} style={{ display: 'inline', marginLeft: '4px' }} />}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => handleReviewClaim(claim.id)}
                      >
                        Xét duyệt
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-grid">
        {/* Claims by Type */}
        <div className="dashboard-card">
          <h3><Wrench size={20} style={{ display: 'inline', marginRight: '8px' }} /> Loại lỗi thường gặp</h3>
          <div className="chart-container">
            {claimsByType.length === 0 ? (
              <p className="empty-chart">Chưa có dữ liệu</p>
            ) : (
              <div className="simple-bar-chart">
                {claimsByType.slice(0, 5).map((item, index) => (
                  <div key={index} className="bar-item">
                    <span className="bar-label">{item.name}</span>
                    <div className="bar-wrapper">
                      <div
                        className="bar-fill"
                        style={{
                          width: `${
                            (item.value /
                              Math.max(...claimsByType.map((i) => i.value))) *
                            100
                          }%`,
                          backgroundColor: `hsl(${index * 60}, 70%, 60%)`,
                        }}
                      />
                      <span className="bar-value">{item.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Claims by SC */}
        <div className="dashboard-card">
          <h3>🏢 Top 5 Service Centers</h3>
          <div className="chart-container">
            {claimsBySC.length === 0 ? (
              <p className="empty-chart">Chưa có dữ liệu</p>
            ) : (
              <div className="simple-bar-chart">
                {claimsBySC.map((item, index) => (
                  <div key={index} className="bar-item">
                    <span className="bar-label">{item.name}</span>
                    <div className="bar-wrapper">
                      <div
                        className="bar-fill"
                        style={{
                          width: `${
                            (item.value /
                              Math.max(...claimsBySC.map((i) => i.value))) *
                            100
                          }%`,
                          backgroundColor: "#3b82f6",
                        }}
                      />
                      <span className="bar-value">{item.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="dashboard-section">
        <h2>🕐 Hoạt động gần đây</h2>
        <div className="activity-list">
          {recentActivities.length === 0 ? (
            <div className="empty-state">
              <p>Chưa có hoạt động nào</p>
            </div>
          ) : (
            <ul>
              {recentActivities.map((claim) => (
                <li key={claim.id} className="activity-item">
                  <span
                    className={`activity-icon ${
                      claim.status === "APPROVED" ? "approved" : "rejected"
                    }`}
                  >
                    {claim.status === "APPROVED" ? <Check size={16} /> : <X size={16} />}
                  </span>
                  <div className="activity-content">
                    <p>
                      <strong>Claim #{claim.id}</strong> - {claim.vin}
                      <span
                        className={`status-badge ${claim.status.toLowerCase()}`}
                      >
                        {claim.status === "APPROVED"
                          ? "Đã phê duyệt"
                          : "Đã từ chối"}
                      </span>
                    </p>
                    <small>
                      {new Date(
                        claim.lastModifiedDate || claim.createdDate
                      ).toLocaleString("vi-VN")}
                    </small>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <button
          className="action-btn primary"
          onClick={() => navigate("/warranty")}
        >
          <FileText size={20} className="action-icon" />
          <span className="action-text">Xét duyệt ngay</span>
        </button>
        <button
          className="action-btn secondary"
          onClick={() => navigate("/warranty?search=")}
        >
          <span className="action-icon">🔍</span>
          <span className="action-text">Tìm kiếm claim</span>
        </button>
        <button
          className="action-btn secondary"
          onClick={() => navigate("/report")}
        >
          <BarChart3 size={20} className="action-icon" />
          <span className="action-text">Báo cáo của tôi</span>
        </button>
      </div>
    </div>
  );
}

export default EVMStaffDashboard;
