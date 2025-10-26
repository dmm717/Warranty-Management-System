import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { dashboardAPI, warrantyClaimAPI, vehicleAPI } from "../../services/api";
import StatsCard from "./StatsCard";
import ChartComponent from "./ChartComponent";
import RecentActivity from "./RecentActivity";
import "../../styles/Dashboard.css";

function Dashboard() {
  const { user } = useAuth();
  const [statsData, setStatsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      setError(null);

      try {
        // Thử gọi API dashboard nếu BE có implement
        // Nếu chưa có API, sẽ fallback sang tính toán từ các API khác
        const statsResponse = await dashboardAPI.getStats();

        if (statsResponse.success && statsResponse.data) {
          setStatsData(statsResponse.data.stats || []);
        } else {
          // Fallback: Tính toán stats từ các API khác
          await fetchStatsFromOtherAPIs();
        }
      } catch {
        console.log(
          "Dashboard API not available, using fallback stats calculation"
        );
        // Fallback: Tính toán stats từ các API khác
        await fetchStatsFromOtherAPIs();
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role]);

  const fetchStatsFromOtherAPIs = async () => {
    try {
      const role = user?.role;
      let stats = [];

      // Lấy dữ liệu từ các API có sẵn
      const [vehiclesResponse, claimsResponse] = await Promise.all([
        vehicleAPI.getAllVehicles({ page: 0, size: 1000 }),
        warrantyClaimAPI.getAllClaims({ page: 0, size: 1000 }),
      ]);

      const vehicles = vehiclesResponse.success
        ? vehiclesResponse.data.content
        : [];
      const claims = claimsResponse.success ? claimsResponse.data.content : [];

      // Tính toán stats dựa trên role
      if (
        role === "SC_STAFF" ||
        role === "SC_TECHNICAL" ||
        role === "SC_ADMIN"
      ) {
        stats = [
          {
            title: "Tổng số xe đăng ký",
            value: vehicles.length.toString(),
            icon: "🚗",
            color: "blue",
          },
          {
            title: "Yêu cầu bảo hành",
            value: claims.length.toString(),
            icon: "🔧",
            color: "orange",
          },
          {
            title: "Đã hoàn thành",
            value: claims
              .filter((c) => c.status === "COMPLETED")
              .length.toString(),
            icon: "✅",
            color: "green",
          },
          {
            title: "Đang xử lý",
            value: claims
              .filter(
                (c) => c.status === "PENDING" || c.status === "IN_PROGRESS"
              )
              .length.toString(),
            icon: "⏳",
            color: "yellow",
          },
        ];
      } else if (role === "EVM_STAFF" || role === "EVM_ADMIN") {
        stats = [
          {
            title: "Yêu cầu chờ duyệt",
            value: claims
              .filter((c) => c.status === "PENDING")
              .length.toString(),
            icon: "📋",
            color: "orange",
          },
          {
            title: "Đã phê duyệt",
            value: claims
              .filter(
                (c) => c.status === "APPROVED" || c.status === "COMPLETED"
              )
              .length.toString(),
            icon: "✅",
            color: "green",
          },
          {
            title: "Từ chối",
            value: claims
              .filter((c) => c.status === "REJECTED")
              .length.toString(),
            icon: "❌",
            color: "red",
          },
          {
            title: "Tổng số xe",
            value: vehicles.length.toString(),
            icon: "�",
            color: "blue",
          },
        ];
      }

      setStatsData(stats);
    } catch (err) {
      console.error("Error fetching stats from other APIs:", err);
      setError("Không thể tải dữ liệu thống kê");
      // Set default empty stats để tránh crash
      setStatsData([]);
    }
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div className="dashboard-header">
          <h1>Dashboard</h1>
          <p>Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p>Chào mừng trở lại, {user?.name || user?.username}!</p>
      </div>

      {error && (
        <div
          className="error-message"
          style={{
            padding: "12px",
            backgroundColor: "#fee",
            color: "#c00",
            borderRadius: "4px",
            marginBottom: "16px",
          }}
        >
          {error}
        </div>
      )}

      <div className="stats-grid">
        {statsData.map((stat, index) => (
          <StatsCard key={index} {...stat} />
        ))}
      </div>

      <div className="dashboard-content">
        <div className="dashboard-row">
          <div className="dashboard-col-8">
            <div className="stats-grid">
              {currentStats.map((stat, index) => (
                <StatsCard key={index} {...stat} />
              ))}
            </div>
            <div className="Chart-dashboard">
              <ChartComponent userRole={user?.role} />
            </div>
          </div>

          <div className="dashboard-col-4">
            <RecentActivity userRole={user?.role} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
