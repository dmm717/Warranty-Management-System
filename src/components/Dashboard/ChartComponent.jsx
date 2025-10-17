import React from "react";
import "../../styles/ChartComponent.css";

function ChartComponent({ userRole }) {
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
  };

  const currentData = chartData[userRole] || chartData.SC_Staff;
  const maxValue = Math.max(
    ...currentData.data.flatMap((item) => [
      item.pending,
      item.approved,
      item.rejected,
    ])
  );

  return (
    <div className="chart-component card">
      <div className="card-header">
        <h3 className="card-title">{currentData.title}</h3>
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
          {currentData.data.map((item, index) => (
            <div key={index} className="bar-group">
              <div className="bar-container">
                <div
                  className="bar bar-pending"
                  style={{ height: `${(item.pending / maxValue) * 100}%` }}
                  title={`Chờ xử lý: ${item.pending}`}
                ></div>
                <div
                  className="bar bar-approved"
                  style={{ height: `${(item.approved / maxValue) * 100}%` }}
                  title={`Đã duyệt: ${item.approved}`}
                ></div>
                <div
                  className="bar bar-rejected"
                  style={{ height: `${(item.rejected / maxValue) * 100}%` }}
                  title={`Từ chối: ${item.rejected}`}
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
