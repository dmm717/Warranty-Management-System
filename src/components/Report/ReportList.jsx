import React, { useState } from "react";
import { Clock, CheckCircle, XCircle, PauseCircle, Eye, Target, Edit, Trash2, BarChart3, Search } from "lucide-react";
import "../../styles/ReportList.css";
import rolePermissionService from "../../services/RolePermissionService";

function ReportList({ reports, onEdit, onView, onDelete, onAssign, userRole }) {
  // console.log("ReportList received reports:", reports);
  // console.log("ReportList received userRole:", userRole);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const getStatusBadge = (status) => {
    const getStatusClass = (status) => {
      const normalized = status?.toLowerCase().trim();
      if (normalized.includes('đang xử lý') || normalized.includes('processing')) return 'status-processing';
      if (normalized.includes('hoàn thành') || normalized.includes('completed') || normalized.includes('approved')) return 'status-completed';
      if (normalized.includes('từ chối') || normalized.includes('rejected')) return 'status-rejected';
      if (normalized.includes('chờ duyệt') || normalized.includes('pending')) return 'status-pending';
      return 'status-pending';
    };

    const statusConfig = {
      "status-processing": { class: "status-processing", icon: <Clock size={14} /> },
      "status-completed": { class: "status-completed", icon: <CheckCircle size={14} /> },
      "status-rejected": { class: "status-rejected", icon: <XCircle size={14} /> },
      "status-pending": { class: "status-pending", icon: <PauseCircle size={14} /> },
    };

    const statusClass = getStatusClass(status);
    const config = statusConfig[statusClass];

    return (
      <span className={`status-badge ${config.class}`}>
        {config.icon} {status}
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

  const canViewReports = () => {
    return rolePermissionService.hasPermission(userRole, "record_and_report") ||
           rolePermissionService.hasPermission(userRole, "update_report") ||
           rolePermissionService.hasPermission(userRole, "confirm_manufacturer_report") ||
           canEditDelete();
  };

  const getReportTypeDisplay = (report) => {
    if (report.serviceCampaignId != null) {
      return "Service Campaign";
    }
    if (report.recallId != null) {
      return "Recall";
    }
    if (report.warrantyClaimId != null) {
      return "Yêu cầu bảo hành";
    }
    return "Báo cáo chưa được phân loại";
  };

  const filteredReports = reports.filter((report) => {
    const matchesSearch =
      (report.ReportName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (report.Description || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (report.ID_Report || "").toLowerCase().includes(searchTerm.toLowerCase());

    let matchesType = true;
    if (typeFilter !== "all") {
      switch (typeFilter) {
        case "serviceCampaign":
          matchesType = report.serviceCampaignId != null;
          break;
        case "recall":
          matchesType = report.recallId != null;
          break;
        case "warrantyClaim":
          matchesType = report.warrantyClaimId != null;
          break;
        default:
          matchesType = true;
      }
    }

    const matchesStatus =
      statusFilter === "all" || report.Status === statusFilter;

    const finalMatch = matchesSearch && matchesType && matchesStatus;

    return finalMatch;
  });

  // console.log("Filtered reports:", filteredReports);
  // console.log("Filter states - search:", searchTerm, "type:", typeFilter, "status:", statusFilter);

  const reportTypes = [
    { value: "serviceCampaign", label: "Báo cáo chiến dịch dịch vụ (có serviceCampaignId)" },
    { value: "recall", label: "Báo cáo Recall (có recallId)" },
    { value: "warrantyClaim", label: "Báo cáo yêu cầu bảo hành (có warrantyClaimId)" },
  ];

  if (filteredReports.length === 0 && reports.length === 0) {
    return (
      <div className="no-data-container">
        <div className="no-data-icon"><BarChart3 size={48} /></div>
        <h3>Chưa có báo cáo nào</h3>
        <p>Tạo báo cáo đầu tiên để theo dõi và phân tích dữ liệu</p>
      </div>
    );
  }

  // Kiểm tra quyền xem reports
  if (!canViewReports()) {
    return (
      <div className="no-data-container">
        <div className="no-data-icon">🚫</div>
        <h3>Không có quyền truy cập</h3>
        <p>Bạn không có quyền xem danh sách báo cáo</p>
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
                <option key={type.value} value={type.value}>
                  {type.label}
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
                  <span className="detail-value">{getReportTypeDisplay(report)}</span>
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
                  <Eye size={16} /> Xem
                </button>
                {canEditDelete() && (
                  <>
                    <button
                      onClick={() => onAssign(report)}
                      className="btn btn-sm btn-outline"
                      title="Assign Campaign/Recall"
                    >
                      <Target size={16} /> Assign
                    </button>
                    <button
                      onClick={() => onEdit(report)}
                      className="btn btn-sm btn-outline"
                      title="Chỉnh sửa"
                    >
                      <Edit size={16} /> Sửa
                    </button>
                    <button
                      onClick={() => onDelete(report.ID_Report)}
                      className="btn btn-sm btn-danger"
                      title="Xóa"
                    >
                      <Trash2 size={16} /> Xóa
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
          <div className="no-results-icon"><Search size={48} /></div>
          <h3>Không tìm thấy báo cáo</h3>
          <p>Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc</p>
        </div>
      )}
    </div>
  );
}

export default ReportList;
