<<<<<<< HEAD
import React, { useState } from "react";
import "../../styles/ChartComponent.css";

function ChartComponent({ userRole }) {
  const [yearFilter, setYearFilter] = useState("2025");
  
  // Mock data cho biểu đồ - replace với real data
  const chartData = {
    SC_Staff: {
      title: "Thống kê yêu cầu bảo hành theo tháng",
      data: [
        { month: "T1", pending: 15, approved: 25, rejected: 3 },
        { month: "T2", pending: 12, approved: 30, rejected: 2 },
        { month: "T3", pending: 18, approved: 28, rejected: 4 },
        { month: "T4", pending: 20, approved: 35, rejected: 1 },
        { month: "T5", pending: 16, approved: 32, rejected: 5 },
        { month: "T6", pending: 14, approved: 38, rejected: 2 },
        { month: "T7", pending: 19, approved: 30, rejected: 3 },
        { month: "T8", pending: 22, approved: 32, rejected: 2 },
        { month: "T9", pending: 18, approved: 36, rejected: 4 },
        { month: "T10", pending: 21, approved: 42, rejected: 3 },
        { month: "T11", pending: 16, approved: 38, rejected: 1 },
        { month: "T12", pending: 19, approved: 40, rejected: 2 },
      ],
    },
    EVM_Staff: {
      title: "Phân tích hỏng hóc theo loại phụ tùng",
      data: [
        { month: "Pin", pending: 25, approved: 45, rejected: 5 },
        { month: "Motor", pending: 18, approved: 32, rejected: 3 },
        { month: "BMS", pending: 12, approved: 28, rejected: 2 },
        { month: "Inverter", pending: 8, approved: 15, rejected: 1 },
        { month: "Sạc", pending: 15, approved: 25, rejected: 4 },
        { month: "Khác", pending: 10, approved: 20, rejected: 2 },
      ],
    },
=======
import React, { useState, useEffect } from "react";
import { dashboardAPI, warrantyClaimAPI } from "../../services/api";
import "../../styles/ChartComponent.css";

function ChartComponent({ userRole }) {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadChartData = async () => {
      setLoading(true);
      try {
        // Thử gọi API chart data nếu BE có implement
        const response = await dashboardAPI.getChartData("warranty");

        if (response.success && response.data) {
          setChartData(response.data);
        } else {
          // Fallback: Tính toán từ warranty claims
          await calculateChartFromClaims();
        }
      } catch {
        // Fallback: Tính toán từ warranty claims
        await calculateChartFromClaims();
      } finally {
        setLoading(false);
      }
    };

    loadChartData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userRole]);

  const calculateChartFromClaims = async () => {
    try {
      const response = await warrantyClaimAPI.getAllClaims({
        page: 0,
        size: 1000,
      });

      if (response.success && response.data.content) {
        // In future, we can analyze actual claims data
        // For now, use mock data for chart visualization

        // Group claims by month (simplified - last 6 months)
        const months = ["T1", "T2", "T3", "T4", "T5", "T6"];
        const data = months.map(() => ({
          pending: Math.floor(Math.random() * 30) + 10,
          approved: Math.floor(Math.random() * 40) + 20,
          rejected: Math.floor(Math.random() * 8) + 1,
        }));

        setChartData({
          title:
            userRole === "EVM_STAFF" || userRole === "EVM_ADMIN"
              ? "Phân tích hỏng hóc theo loại phụ tùng"
              : "Thống kê yêu cầu bảo hành theo tháng",
          data: months.map((month, index) => ({ month, ...data[index] })),
        });
      }
    } catch (error) {
      console.error("Error calculating chart data:", error);
      // Set default chart data
      setChartData({
        title: "Thống kê yêu cầu bảo hành theo tháng",
        data: [],
      });
    }
>>>>>>> origin/main
  };

  if (loading) {
    return (
      <div className="chart-component card">
        <div className="card-header">
          <h3 className="card-title">Đang tải biểu đồ...</h3>
        </div>
      </div>
    );
  }

  if (!chartData || !chartData.data || chartData.data.length === 0) {
    return (
      <div className="chart-component card">
        <div className="card-header">
          <h3 className="card-title">Không có dữ liệu</h3>
        </div>
      </div>
    );
  }

  const maxValue = Math.max(
    ...chartData.data.flatMap((item) => [
      item.pending || 0,
      item.approved || 0,
      item.rejected || 0,
    ])
  );
  
  // Calculate total for each month
  const calculateTotal = (item) => item.pending + item.approved + item.rejected;
  
  // Format for display
  const formatNumber = (num) => num.toLocaleString('vi-VN');

  return (
    <div className="chart-component card">
      <div className="card-header">
<<<<<<< HEAD
        <h3 className="card-title">{currentData.title}</h3>
        {userRole === "SC_Staff" && (
          <div className="chart-filter">
            <select 
              value={yearFilter} 
              onChange={(e) => setYearFilter(e.target.value)}
              className="year-filter"
            >
              <option value="2023">2023</option>
              <option value="2024">2024</option>
              <option value="2025">2025</option>
            </select>
          </div>
        )}
=======
        <h3 className="card-title">{chartData.title}</h3>
>>>>>>> origin/main
      </div>
      <div className="chart-container">
        <div className="chart-legend">
          <div className="legend-item">
            <div className="legend-color pending"></div>
            <span>Chờ xử lý</span>
          </div>
          <div className="legend-item">
            <div className="legend-color approved"></div>
            <span>Đã duyệt</span>
          </div>
          <div className="legend-item">
            <div className="legend-color rejected"></div>
            <span>Từ chối</span>
          </div>
        </div>
        <div className="chart-bars">
          {chartData.data.map((item, index) => (
            <div key={index} className="bar-group">
              <div className="bar-container">
                <div
                  className="bar bar-pending"
<<<<<<< HEAD
                  style={{ height: `${(item.pending / maxValue) * 100}%` }}
                  title={`Chờ xử lý: ${formatNumber(item.pending)}`}
                ></div>
                <div
                  className="bar bar-approved"
                  style={{ height: `${(item.approved / maxValue) * 100}%` }}
                  title={`Đã duyệt: ${formatNumber(item.approved)}`}
                ></div>
                <div
                  className="bar bar-rejected"
                  style={{ height: `${(item.rejected / maxValue) * 100}%` }}
                  title={`Từ chối: ${formatNumber(item.rejected)}`}
=======
                  style={{
                    height: `${((item.pending || 0) / maxValue) * 100}%`,
                  }}
                  title={`Chờ xử lý: ${item.pending || 0}`}
                ></div>
                <div
                  className="bar bar-approved"
                  style={{
                    height: `${((item.approved || 0) / maxValue) * 100}%`,
                  }}
                  title={`Đã duyệt: ${item.approved || 0}`}
                ></div>
                <div
                  className="bar bar-rejected"
                  style={{
                    height: `${((item.rejected || 0) / maxValue) * 100}%`,
                  }}
                  title={`Từ chối: ${item.rejected || 0}`}
>>>>>>> origin/main
                ></div>
              </div>
              <div className="bar-label">{item.month}</div>
              <div className="bar-total">{formatNumber(calculateTotal(item))}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ChartComponent;
