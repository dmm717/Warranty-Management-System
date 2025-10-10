import React, { useState } from "react";
import "./ReportChart.css";

function ReportChart({ reportData }) {
  const [activeChart, setActiveChart] = useState("warranty");

  const renderWarrantyChart = () => {
    const { warrantyStats } = reportData;
    const total = warrantyStats?.totalClaims || 0;
    const approved = warrantyStats?.approvedClaims || 0;
    const rejected = warrantyStats?.rejectedClaims || 0;
    const pending = warrantyStats?.pendingClaims || 0;

    return (
      <div className="chart-section">
        <h3>Thống kê yêu cầu bảo hành</h3>
        <div className="stats-overview">
          <div className="stat-card approved">
            <div className="stat-number">{approved}</div>
            <div className="stat-label">Đã duyệt</div>
            <div className="stat-percentage">
              {total > 0 ? Math.round((approved / total) * 100) : 0}%
            </div>
          </div>
          <div className="stat-card rejected">
            <div className="stat-number">{rejected}</div>
            <div className="stat-label">Từ chối</div>
            <div className="stat-percentage">
              {total > 0 ? Math.round((rejected / total) * 100) : 0}%
            </div>
          </div>
          <div className="stat-card pending">
            <div className="stat-number">{pending}</div>
            <div className="stat-label">Chờ xử lý</div>
            <div className="stat-percentage">
              {total > 0 ? Math.round((pending / total) * 100) : 0}%
            </div>
          </div>
          <div className="stat-card total">
            <div className="stat-number">{total}</div>
            <div className="stat-label">Tổng cộng</div>
            <div className="stat-percentage">100%</div>
          </div>
        </div>

        <div className="pie-chart">
          <div className="pie-chart-container">
            <div
              className="pie-slice approved-slice"
              style={{
                "--percentage": `${total > 0 ? (approved / total) * 100 : 0}%`,
              }}
            ></div>
            <div className="pie-center">
              <div className="pie-total">{total}</div>
              <div className="pie-label">Claims</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderPartsChart = () => {
    const { partFailureStats } = reportData;
    const maxFailures = Math.max(
      ...(partFailureStats?.map((p) => p.failures) || [0])
    );

    return (
      <div className="chart-section">
        <h3>Phân tích lỗi theo phụ tùng</h3>
        <div className="parts-chart">
          {partFailureStats?.map((part, index) => (
            <div key={index} className="part-item">
              <div className="part-info">
                <span className="part-name">{part.part}</span>
                <span className="part-count">{part.failures} lỗi</span>
              </div>
              <div className="part-bar">
                <div
                  className="part-fill"
                  style={{ width: `${(part.failures / maxFailures) * 100}%` }}
                ></div>
              </div>
              <span className="part-percentage">{part.percentage}%</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderTrendsChart = () => {
    const { monthlyTrends } = reportData;
    const maxClaims = Math.max(...(monthlyTrends?.map((m) => m.claims) || [0]));

    return (
      <div className="chart-section">
        <h3>Xu hướng theo tháng</h3>
        <div className="trends-chart">
          <div className="trend-bars">
            {monthlyTrends?.map((month, index) => (
              <div key={index} className="month-group">
                <div className="bars-container">
                  <div
                    className="bar claims-bar"
                    style={{ height: `${(month.claims / maxClaims) * 100}%` }}
                    title={`Claims: ${month.claims}`}
                  ></div>
                  <div
                    className="bar resolved-bar"
                    style={{ height: `${(month.resolved / maxClaims) * 100}%` }}
                    title={`Resolved: ${month.resolved}`}
                  ></div>
                  <div
                    className="bar pending-bar"
                    style={{ height: `${(month.pending / maxClaims) * 100}%` }}
                    title={`Pending: ${month.pending}`}
                  ></div>
                </div>
                <div className="month-label">{month.month}</div>
              </div>
            ))}
          </div>
          <div className="trend-legend">
            <div className="legend-item">
              <div className="legend-color claims-color"></div>
              <span>Yêu cầu mới</span>
            </div>
            <div className="legend-item">
              <div className="legend-color resolved-color"></div>
              <span>Đã giải quyết</span>
            </div>
            <div className="legend-item">
              <div className="legend-color pending-color"></div>
              <span>Chờ xử lý</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="report-chart">
      <div className="chart-tabs">
        <button
          className={`chart-tab ${activeChart === "warranty" ? "active" : ""}`}
          onClick={() => setActiveChart("warranty")}
        >
          📊 Bảo hành
        </button>
        <button
          className={`chart-tab ${activeChart === "parts" ? "active" : ""}`}
          onClick={() => setActiveChart("parts")}
        >
          ⚙️ Phụ tùng
        </button>
        <button
          className={`chart-tab ${activeChart === "trends" ? "active" : ""}`}
          onClick={() => setActiveChart("trends")}
        >
          📈 Xu hướng
        </button>
      </div>

      <div className="chart-content">
        {activeChart === "warranty" && renderWarrantyChart()}
        {activeChart === "parts" && renderPartsChart()}
        {activeChart === "trends" && renderTrendsChart()}
      </div>

      <div className="chart-actions">
        <button className="btn btn-outline">
          <span>📄</span>
          Xuất PDF
        </button>
        <button className="btn btn-outline">
          <span>📊</span>
          Xuất Excel
        </button>
        <button className="btn btn-primary">
          <span>📧</span>
          Chia sẻ
        </button>
      </div>
    </div>
  );
}

export default ReportChart;
