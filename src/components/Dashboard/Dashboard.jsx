import React from "react";
import { useAuth } from "../../contexts/AuthContext";
import StatsCard from "./StatsCard";
import ChartComponent from "./ChartComponent";
import RecentActivity from "./RecentActivity";
import "../../styles/Dashboard.css";

function Dashboard() {
  const { user } = useAuth();

  // Mock data - replace with real API calls
  const statsData = {
    SC_Staff: [
      {
        title: "Tổng số xe đăng ký",
        value: "1,234",
        icon: "🚗",
        color: "blue",
      },
      { title: "Yêu cầu bảo hành", value: "89", icon: "🔧", color: "orange" },
      { title: "Đã hoàn thành", value: "56", icon: "✅", color: "green" },
      { title: "Đang xử lý", value: "33", icon: "⏳", color: "yellow" },
    ],
    SC_Technician: [
      { title: "Nhiệm vụ được giao", value: "15", icon: "🔧", color: "blue" },
      { title: "Đã hoàn thành", value: "12", icon: "✅", color: "green" },
      { title: "Đang thực hiện", value: "3", icon: "⏳", color: "orange" },
      { title: "Quá hạn", value: "0", icon: "⚠️", color: "red" },
    ],
    EVM_Staff: [
      { title: "Yêu cầu chờ duyệt", value: "25", icon: "📋", color: "orange" },
      { title: "Đã phê duyệt", value: "156", icon: "✅", color: "green" },
      { title: "Từ chối", value: "8", icon: "❌", color: "red" },
      { title: "Phụ tùng thiếu", value: "5", icon: "📦", color: "yellow" },
    ],
    Admin: [
      { title: "Tổng người dùng", value: "342", icon: "👥", color: "blue" },
      { title: "Trung tâm dịch vụ", value: "25", icon: "🏢", color: "green" },
      {
        title: "Chiến dịch đang chạy",
        value: "3",
        icon: "📢",
        color: "orange",
      },
      { title: "Báo cáo mới", value: "12", icon: "📊", color: "purple" },
    ],
  };

  const currentStats = statsData[user?.role] || statsData.SC_Staff;

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p>Chào mừng trở lại, {user?.name}!</p>
      </div>

      <div className="stats-grid">
        {currentStats.map((stat, index) => (
          <StatsCard key={index} {...stat} />
        ))}
      </div>

      <div className="dashboard-content">
        <div className="dashboard-row">
          <div className="dashboard-col-8">
            <ChartComponent userRole={user?.role} />
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
