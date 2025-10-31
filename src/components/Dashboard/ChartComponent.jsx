import React, { useState, useEffect } from "react";
import { warrantyClaimAPI } from "../../services/api";
import "../../styles/ChartComponent.css";

function ChartComponent({ userRole }) {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadChartData = async () => {
      setLoading(true);
      try {
        // Tính toán chart data từ warranty claims
        await calculateChartFromClaims();
      } catch (err) {
        console.error("Error loading chart data:", err);
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

      if (response.success && response.data?.content) {
        const claims = response.data.content;

        // Phân tích data THỰC từ claims
        // Group theo tháng từ claimDate
        const now = new Date();
        const monthsData = [];

        for (let i = 5; i >= 0; i--) {
          const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthName = `T${targetDate.getMonth() + 1}`;

          // Lọc claims trong tháng này
          const monthClaims = claims.filter((claim) => {
            if (!claim.claimDate) return false;
            const claimDate = new Date(claim.claimDate);
            return (
              claimDate.getMonth() === targetDate.getMonth() &&
              claimDate.getFullYear() === targetDate.getFullYear()
            );
          });

          monthsData.push({
            month: monthName,
            pending: monthClaims.filter((c) => c.status === "PENDING").length,
            approved: monthClaims.filter(
              (c) => c.status === "APPROVED" || c.status === "COMPLETED"
            ).length,
            rejected: monthClaims.filter((c) => c.status === "REJECTED").length,
          });
        }

        setChartData({
          title:
            userRole === "EVM_STAFF" || userRole === "EVM_ADMIN"
              ? "Phân tích yêu cầu bảo hành 6 tháng gần đây"
              : "Thống kê yêu cầu bảo hành 6 tháng gần đây",
          data: monthsData,
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

  return (
    <div className="chart-component card">
      <div className="card-header">
        <h3 className="card-title">{chartData.title}</h3>
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
                ></div>
              </div>
              <div className="bar-label">{item.month}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ChartComponent;
