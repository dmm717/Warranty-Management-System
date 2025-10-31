import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { warrantyClaimAPI, vehicleAPI } from "../../services/api";
import StatsCard from "./StatsCard";
import ChartComponent from "./ChartComponent";
import RecentActivity from "./RecentActivity";
import EVMStaffDashboard from "./EVMStaffDashboard";
import { Check, X, FileClock, Bike, Wrench, Clock } from 'lucide-react';
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
        // Tính toán stats trực tiếp từ ElectricVehicle và WarrantyClaim APIs
        await fetchStatsFromAPIs();
      } catch (err) {
        console.error("Error loading dashboard:", err);
        setError("Không thể tải dữ liệu dashboard");
      } finally {
        setLoading(false);
      }
    };

    // Skip loading for EVM_STAFF as they have dedicated dashboard
    if (user?.role !== "EVM_STAFF") {
      loadDashboard();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role]);

  // If user is EVM_STAFF, show specialized dashboard
  if (user?.role === "EVM_STAFF") {
    return <EVMStaffDashboard />;
  }

  const fetchStatsFromAPIs = async () => {
    try {
      const role = user?.role;
      let stats = [];

      // Lấy dữ liệu từ các API có sẵn
      const [vehiclesResponse, claimsResponse] = await Promise.all([
        vehicleAPI.getAllVehicles({ page: 0, size: 1000 }),
        warrantyClaimAPI.getAllClaims({ page: 0, size: 1000 }),
      ]);

      // ApiService trả về response.data = backend's data.data
      // Backend trả: { success: true, data: { content: [...], totalElements: 100 }, message: "..." }
      // ApiService xử lý: { success: true, data: { content: [...], totalElements: 100 }, message: "..." }
      const vehicles =
        vehiclesResponse.success && vehiclesResponse.data?.content
          ? vehiclesResponse.data.content
          : [];
      const claims =
        claimsResponse.success && claimsResponse.data?.content
          ? claimsResponse.data.content
          : [];

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
            icon: <Bike size={31} className="bike-icon" />,
            color: "blue",
          },
          {
            title: "Yêu cầu bảo hành",
            value: claims.length.toString(),
            icon: <Wrench size={30} className="wrench-icon" />,
            color: "orange",
          },
          {
            title: "Đã hoàn thành",
            value: claims
              .filter((c) => c.status === "COMPLETED")
              .length.toString(),
            icon: <Check size={30} className="check-icon" />,
            color: "green",
          },
          {
            title: "Đang xử lý",
            value: claims
              .filter(
                (c) => c.status === "PENDING" || c.status === "IN_PROGRESS"
              )
              .length.toString(),
            icon: <Clock size={30} className="clock-icon" />,
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
            icon: <FileClock size={30} className="fileclock-icon" />,
            color: "orange",
          },
          {
            title: "Đã phê duyệt",
            value: claims
              .filter(
                (c) => c.status === "APPROVED" || c.status === "COMPLETED"
              )
              .length.toString(),
            icon: <Check size={30} className="check-icon" />,
            color: "green",
          },
          {
            title: "Từ chối",
            value: claims
              .filter((c) => c.status === "REJECTED")
              .length.toString(),
            icon: <X size={30} className="x-icon" />,
            color: "red",
          },
          {
            title: "Tổng số xe",
            value: vehicles.length.toString(),
            icon: <Bike size={24} className="bike-icon" />,
            color: "blue",
          },
        ];
      }

      setStatsData(stats);
    } catch (err) {
      console.error("Error fetching stats:", err);
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

      

      <div className="dashboard-row">
          <div className="dashboard-col-8">
            
            <div className="stats-grid">
              {statsData.map((stat, index) => (
                <StatsCard key={index} {...stat} />
              ))}
            </div>
            <ChartComponent userRole={user?.role} />
          </div>
          <div className="dashboard-col-4">
            <RecentActivity userRole={user?.role} />
          </div>
        </div>
    </div>
  );
}

export default Dashboard;
