import React from "react";
import "./ReportDetail.css";

function ReportDetail({ report, onEdit, userRole }) {
  if (!report) return null;

  const getStatusBadge = (status) => {
    const statusClasses = {
      "Đang xử lý": "status-processing",
      "Hoàn thành": "status-completed",
      "Từ chối": "status-rejected",
      "Chờ duyệt": "status-pending",
    };

    return (
      <span
        className={`status-badge ${statusClasses[status] || "status-pending"}`}
      >
        {status}
      </span>
    );
  };

  const getPriorityBadge = (priority) => {
    const priorityClasses = {
      Cao: "priority-high",
      "Trung bình": "priority-medium",
      Thấp: "priority-low",
    };

    return (
      <span
        className={`priority-badge ${
          priorityClasses[priority] || "priority-medium"
        }`}
      >
        {priority}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const canEdit = () => {
    return userRole === "EVM_Staff" || userRole === "Admin";
  };

  return (
    <div className="report-detail">
      <div className="detail-header">
        <div className="report-basic-info">
          <h2>Báo cáo #{report.ID_Report}</h2>
          <h3>{report.ReportName}</h3>
          <div className="report-meta">
            {getStatusBadge(report.Status)}
            {getPriorityBadge(report.Priority)}
            <span className="report-date">
              {formatDate(report.CreatedDate)}
            </span>
          </div>
        </div>
        <div className="detail-actions">
          {canEdit() && (
            <button onClick={() => onEdit(report)} className="btn btn-outline">
              <span>✏️</span>
              Chỉnh sửa
            </button>
          )}
          <button className="btn btn-primary">
            <span>📊</span>
            Xuất báo cáo
          </button>
        </div>
      </div>

      <div className="detail-content">
        <div className="detail-row">
          <div className="detail-col-8">
            <div className="info-sections">
              {/* Report Information */}
              <div className="info-section card">
                <h3 className="section-title">Thông tin báo cáo</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Loại báo cáo</label>
                    <span className="report-type">{report.ReportType}</span>
                  </div>
                  <div className="info-item">
                    <label>Ngày tạo</label>
                    <span>{formatDate(report.CreatedDate)}</span>
                  </div>
                  <div className="info-item">
                    <label>Nhân viên SC</label>
                    <span>{report.SC_StaffID}</span>
                  </div>
                  <div className="info-item">
                    <label>Nhân viên EVM</label>
                    <span>{report.EVM_Staff_ID}</span>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="info-section card">
                <h3 className="section-title">Nội dung chi tiết</h3>
                <div className="content-text">
                  <div className="info-item full-width">
                    <label>Mô tả</label>
                    <div className="description-content">
                      {report.Description}
                    </div>
                  </div>

                  {report.Error && report.Error !== "Không có" && (
                    <div className="info-item full-width">
                      <label>Lỗi/Vấn đề</label>
                      <div className="error-content">{report.Error}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Links */}
              {(report.CampaignsID || report.Recall_ID) && (
                <div className="info-section card">
                  <h3 className="section-title">Liên kết</h3>
                  <div className="links-content">
                    {report.CampaignsID && (
                      <div className="link-item">
                        <span className="link-icon">📢</span>
                        <div className="link-info">
                          <strong>Chiến dịch liên quan</strong>
                          <span>#{report.CampaignsID}</span>
                        </div>
                      </div>
                    )}
                    {report.Recall_ID && (
                      <div className="link-item">
                        <span className="link-icon">🚨</span>
                        <div className="link-info">
                          <strong>Recall liên quan</strong>
                          <span>#{report.Recall_ID}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Charts/Data Visualization */}
              <div className="info-section card">
                <h3 className="section-title">Dữ liệu & Biểu đồ</h3>
                <div className="chart-placeholder">
                  <div className="chart-mockup">
                    <div className="chart-title">Thống kê theo thời gian</div>
                    <div className="chart-bars">
                      <div className="bar" style={{ height: "60%" }}></div>
                      <div className="bar" style={{ height: "80%" }}></div>
                      <div className="bar" style={{ height: "45%" }}></div>
                      <div className="bar" style={{ height: "90%" }}></div>
                      <div className="bar" style={{ height: "70%" }}></div>
                    </div>
                    <div className="chart-labels">
                      <span>T5</span>
                      <span>T6</span>
                      <span>T7</span>
                      <span>T8</span>
                      <span>T9</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="detail-col-4">
            {/* Summary Stats */}
            <div className="summary-section card">
              <h3 className="section-title">Tổng quan</h3>
              <div className="summary-stats">
                <div className="stat-item">
                  <div className="stat-number">234</div>
                  <div className="stat-label">Tổng số case</div>
                </div>
                <div className="stat-item">
                  <div className="stat-number">189</div>
                  <div className="stat-label">Đã giải quyết</div>
                </div>
                <div className="stat-item">
                  <div className="stat-number">22</div>
                  <div className="stat-label">Đang xử lý</div>
                </div>
                <div className="stat-item">
                  <div className="stat-number">5.2</div>
                  <div className="stat-label">Thời gian TB (ngày)</div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="actions-section card">
              <h3 className="section-title">Thao tác</h3>
              <div className="action-buttons">
                <button className="action-btn export-btn">
                  <span>📄</span>
                  Xuất PDF
                </button>
                <button className="action-btn excel-btn">
                  <span>📊</span>
                  Xuất Excel
                </button>
                <button className="action-btn email-btn">
                  <span>📧</span>
                  Gửi email
                </button>
                <button className="action-btn print-btn">
                  <span>🖨️</span>
                  In báo cáo
                </button>
              </div>
            </div>

            {/* Report History */}
            <div className="history-section card">
              <h3 className="section-title">Lịch sử thay đổi</h3>
              <div className="history-timeline">
                <div className="history-item">
                  <div className="history-date">09/10/2025</div>
                  <div className="history-action">Tạo báo cáo</div>
                  <div className="history-user">SC Staff</div>
                </div>
                <div className="history-item">
                  <div className="history-date">08/10/2025</div>
                  <div className="history-action">Cập nhật dữ liệu</div>
                  <div className="history-user">EVM Staff</div>
                </div>
                <div className="history-item">
                  <div className="history-date">07/10/2025</div>
                  <div className="history-action">Phê duyệt</div>
                  <div className="history-user">Admin</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReportDetail;
