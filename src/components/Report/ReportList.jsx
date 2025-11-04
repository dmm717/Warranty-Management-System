import React, { useState } from "react";
import "../../styles/ReportList.css";

function ReportList({ reports, onEdit, onView, onDelete, onAssign, userRole }) {
  // console.log("ReportList received reports:", reports);
  // console.log("ReportList received userRole:", userRole);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

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
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  const canEditDelete = () => {
    return userRole === "SC_ADMIN" || userRole === "EVM_STAFF" || userRole === "EVM_ADMIN" || userRole === "Admin";
  };

  const filteredReports = reports.filter((report) => {
    const matchesSearch =
      (report.ReportName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (report.Description || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (report.ID_Report || "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType =
      typeFilter === "all" || report.ReportType === typeFilter;
    const matchesStatus =
      statusFilter === "all" || report.Status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  // console.log("Filtered reports:", filteredReports);
  // console.log("Filter states - search:", searchTerm, "type:", typeFilter, "status:", statusFilter);

  const reportTypes = [
    "Warranty Analysis",
    "Campaign Performance",
    "Recall Progress",
    "Parts Analysis",
    "Service Quality",
    "Customer Satisfaction",
  ];

  if (filteredReports.length === 0 && reports.length === 0) {
    return (
      <div className="no-data-container">
        <div className="no-data-icon">📊</div>
        <h3>Chưa có báo cáo nào</h3>
        <p>Tạo báo cáo đầu tiên để theo dõi và phân tích dữ liệu</p>
      </div>
    );
  }

  return (
    <div className="report-list">
      <div className="report-filters card">
        <div className="filters-row">
          <div className="search-group">
            <label className="filter-label">Tìm kiếm</label>
            <div className="search-input-container">
              <input
                type="text"
                className="form-control search-input"
                placeholder="Tìm theo tên, mô tả, mã báo cáo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <span className="search-icon">🔍</span>
            </div>
          </div>

          <div className="filter-group">
            <label className="filter-label">Loại báo cáo</label>
            <select
              className="form-control"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">Tất cả</option>
              {reportTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">Trạng thái</label>
            <select
              className="form-control"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Tất cả</option>
              <option value="Đang xử lý">Đang xử lý</option>
              <option value="Hoàn thành">Hoàn thành</option>
              <option value="Chờ duyệt">Chờ duyệt</option>
              <option value="Từ chối">Từ chối</option>
            </select>
          </div>

          <div className="filter-actions">
            <button
              onClick={() => {
                setSearchTerm("");
                setTypeFilter("all");
                setStatusFilter("all");
              }}
              className="btn btn-outline btn-sm"
            >
              Xóa bộ lọc
            </button>
          </div>
        </div>
      </div>

      <div className="reports-grid">
        {filteredReports.map((report) => (
          <div key={report.ID_Report} className="report-card">
            <div className="report-card-header">
              <div className="report-meta">
                <span className="report-id">{report.ID_Report}</span>
                <div className="report-badges">
                  {getPriorityBadge(report.Priority)}
                  {getStatusBadge(report.Status)}
                </div>
              </div>
            </div>

            <div className="report-card-body">
              <h4 className="report-title">{report.ReportName}</h4>
              <p className="report-description">
                {report.Description.length > 100
                  ? `${report.Description.substring(0, 100)}...`
                  : report.Description}
              </p>

              <div className="report-details">
                <div className="detail-item">
                  <span className="detail-label">Loại:</span>
                  <span className="detail-value">{report.ReportType}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Ngày tạo:</span>
                  <span className="detail-value">
                    {formatDate(report.CreatedDate)}
                  </span>
                </div>
                {report.Error && report.Error !== "Không có" && (
                  <div className="detail-item">
                    <span className="detail-label">Lỗi:</span>
                    <span className="detail-value error-text">
                      {report.Error}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="report-card-footer">
              <div className="report-actions">
                <button
                  onClick={() => onView(report)}
                  className="btn btn-sm btn-outline"
                  title="Xem chi tiết"
                >
                  👁️ Xem
                </button>
                {canEditDelete() && (
                  <>
                    <button
                      onClick={() => onAssign(report)}
                      className="btn btn-sm btn-outline"
                      title="Assign Campaign/Recall"
                    >
                      🎯 Assign
                    </button>
                    <button
                      onClick={() => onEdit(report)}
                      className="btn btn-sm btn-outline"
                      title="Chỉnh sửa"
                    >
                      ✏️ Sửa
                    </button>
                    <button
                      onClick={() => onDelete(report.ID_Report)}
                      className="btn btn-sm btn-danger"
                      title="Xóa"
                    >
                      🗑️ Xóa
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredReports.length === 0 && reports.length > 0 && (
        <div className="no-results-container">
          <div className="no-results-icon">🔍</div>
          <h3>Không tìm thấy báo cáo</h3>
          <p>Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc</p>
        </div>
      )}
    </div>
  );
}

export default ReportList;
