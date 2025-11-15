import React, { useState, useEffect } from "react";
import { AlertTriangle, FileText, Eye, Edit, Plus } from "lucide-react";
import "../../styles/RecallList.css";
import { VEHICLE_TYPES, REGIONS, RECALL_STATUS } from "../../constants";

function RecallList({ recalls, onEdit, onView, userRole, onDelete }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const isEVMAdmin = userRole === "EVM_ADMIN";
  const isEVMStaff = userRole === "EVM_STAFF";
  const isSCAdmin = userRole === "SC_ADMIN";
  const isSCStaff = userRole === "SC_STAFF";
  const isSCTechnical = userRole === "SC_TECHNICAL";
  
  // Filter recalls based on debounced search term
  const filteredRecalls = recalls && recalls.length > 0 ? recalls.filter(recall =>
    (recall.Recall_ID && recall.Recall_ID.toString().toLowerCase().includes(debouncedSearchTerm.toLowerCase())) ||
    (recall.RecallName && recall.RecallName.toLowerCase().includes(debouncedSearchTerm.toLowerCase())) ||
    (recall.Description && recall.Description.toLowerCase().includes(debouncedSearchTerm.toLowerCase())) ||
    (recall.VehicleModels && Array.isArray(recall.VehicleModels) &&
     recall.VehicleModels.some(modelId => {
       const vehicle = VEHICLE_TYPES.find(v => v.id === modelId);
       return vehicle && vehicle.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
     })) 
     
  ) : [];

  const getStatusBadge = (status) => {
    const statusClasses = {
      INACTIVE: "status-pending",
      ACTIVE: "status-in-progress",
      COMPLETE: "status-completed",
    };

    const statusLabels = {
      INACTIVE: RECALL_STATUS.INACTIVE,
      ACTIVE: RECALL_STATUS.ACTIVE,
      COMPLETE: RECALL_STATUS.COMPLETE,
    };

    return (
      <span
        className={`status-badge ${statusClasses[status] || "status-pending"}`}
      >
        {statusLabels[status] || status}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  const getModelNames = (modelIds) => {
    if (!Array.isArray(modelIds) || modelIds.length === 0) return "N/A";
    return modelIds
      .map((id) => {
        const vehicle = VEHICLE_TYPES.find((v) => v.id === id);
        return vehicle ? vehicle.name : id;
      })
      .join(", ");
  };

  const getRegionNames = (regionIds) => {
    if (!Array.isArray(regionIds) || regionIds.length === 0) return "HCM";
    return regionIds
      .map((id) => {
        const region = REGIONS.find((r) => r.value === id);
        return region ? region.label : id;
      })
      .join(", ");
  };

  if (!recalls || recalls.length === 0) {
    return (
      <div className="no-data-container">
        <div className="no-data-icon">
          <AlertTriangle size={48} />
        </div>
        <h3>Chưa có recall nào</h3>
        <p>
          {isEVMAdmin
            ? "Tạo recall mới khi phát hiện vấn đề"
            : "Chưa có recall nào cần xử lý"}
        </p>
      </div>
    );
  }

  // ============================================
  // VIEW FOR EVM_ADMIN
  // ============================================
  if (isEVMAdmin) {
    return (
      <div className="recall-list">
        {/* Search Input */}
        <div className="search-container">
          <input
            type="text"
            placeholder="Tìm kiếm recall theo mã, tên, mô tả, model xe hoặc khu vực..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
            >
              Xóa
            </button>
          )}
        </div>

        {/* Results Count */}
        <div className="results-count">
          Hiển thị {filteredRecalls.length} / {(recalls && recalls.length) || 0} recall
          {searchTerm && ` (tìm kiếm: "${searchTerm}")`}
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Mã Recall</th>
                <th>Tên Recall</th>
                <th>Model xe</th>
                <th>Phạm vi</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecalls.length > 0 ? (
                filteredRecalls.map((recall) => (
                  <tr key={recall.Recall_ID}>
                    <td>
                      <div className="recall-id">
                        <strong>{recall.Recall_ID}</strong>
                      </div>
                    </td>
                    <td>
                      <div className="recall-name">
                        <strong>{recall.RecallName || "N/A"}</strong>
                      </div>
                    </td>
                    <td>
                      <div className="model-info">
                        {getModelNames(recall.VehicleModels)}
                      </div>
                    </td>
                    <td>
                      <div className="scope-info">
                        
                        <div>
                          <strong>Quận:</strong> {getRegionNames(recall.Regions)}
                        </div>
                        
                      </div>
                    </td>
                    <td>{getStatusBadge(recall.Status)}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          onClick={() => onView(recall)}
                          className="btn btn-sm btn-outline"
                          title="Xem chi tiết"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => onEdit(recall)}
                          className="btn btn-sm btn-outline"
                          title="Chỉnh sửa"
                        >
                          <Edit size={16} />
                        </button>
                        {onDelete && (
                          <button
                            onClick={() => {
                              if (
                                window.confirm(
                                  `Bạn có chắc chắn muốn xóa recall "${recall.RecallName}"?`
                                )
                              ) {
                                onDelete(recall.Recall_ID);
                              }
                            }}
                            className="btn btn-sm btn-danger"
                            title="Xóa"
                          >
                            <Trash size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
                ) : (
                  <tr className="no-results-row">
                    <td colSpan="6">
                      {searchTerm ? `Không tìm thấy recall nào phù hợp với "${searchTerm}"` : 'Không có recall nào'}
                    </td>
                  </tr>
                )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ============================================
  // VIEW FOR EVM_STAFF
  // ============================================
  if (isEVMStaff) {
    // Filter only recalls that have basic info (created by EVM_ADMIN)
    const availableRecalls = recalls.filter(
      (r) => r.RecallName && r.VehicleModels
    );

    if (availableRecalls.length === 0) {
      return (
        <div className="no-data-container">
          <div className="no-data-icon"><File size={48} /></div>
          <h3>Chưa có recall nào</h3>
          <p>Đang chờ EVM_ADMIN tạo recall mới</p>
        </div>
      );
    }

    return (
      <div className="recall-list">
        {/* Search Input */}
        <div className="search-container">
          <input
            type="text"
            placeholder="Tìm kiếm recall theo mã, tên, mô tả, model xe hoặc khu vực..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
            >
              Xóa
            </button>
          )}
        </div>

        {/* Results Count */}
        <div className="results-count">
          Hiển thị {filteredRecalls.length} / {(recalls && recalls.length) || 0} recall
          {searchTerm && ` (tìm kiếm: "${searchTerm}")`}
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Mã Recall</th>
                <th>Tên Recall</th>
                <th>Model xe</th>
                <th>Phạm vi</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecalls.length > 0 ? (
                filteredRecalls.map((recall) => (
                <tr key={recall.Recall_ID}>
                  <td>
                    <div className="recall-id">
                      <strong>{recall.Recall_ID}</strong>
                    </div>
                  </td>
                  <td>
                    <div className="recall-name">
                      <strong>{recall.RecallName || "N/A"}</strong>
                    </div>
                  </td>
                  <td>
                    <div className="model-info">
                      {getModelNames(recall.VehicleModels)}
                    </div>
                  </td>
                  <td>
                    <div className="scope-info">
                      
                      <div>
                        <strong>Quận:</strong> {getRegionNames(recall.Regions)}
                      </div>
                      
                    </div>
                  </td>
                  <td>{getStatusBadge(recall.Status)}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        onClick={() => onView(recall)}
                        className="btn btn-sm btn-outline"
                        title="Xem chi tiết"
                      >
                        <Eye size={16} />
                      </button>
                      
                      
                    </div>
                  </td>
                </tr>
              ))
              ) : (
                <tr className="no-results-row">
                  <td colSpan="6">
                    {searchTerm ? `Không tìm thấy recall nào phù hợp với "${searchTerm}"` : 'Không có recall nào'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ============================================
  // VIEW FOR SC_ADMIN - Read-only access
  // ============================================
  if (isSCAdmin || isSCStaff || isSCTechnical) {
    if (filteredRecalls.length === 0) {
      return (
        <div className="no-data-container">
          <div className="no-data-icon">
            <AlertTriangle size={48} />
          </div>
          <h3>Chưa có recall nào</h3>
          <p>{isSCTechnical ? "Bạn chưa được gán vào recall nào" : "Chưa có recall nào được tạo"}</p>
        </div>
      );
    }

    return (
      <div className="recall-list">
        {/* Search Input */}
        <div className="search-container">
          <input
            type="text"
            placeholder="Tìm kiếm recall theo mã, tên, mô tả, model xe hoặc khu vực..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
            >
              Xóa
            </button>
          )}
        </div>

        {/* Results Count */}
        <div className="results-count">
          Hiển thị {filteredRecalls.length} / {(recalls && recalls.length) || 0} recall
          {searchTerm && ` (tìm kiếm: "${searchTerm}")`}
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Mã Recall</th>
                <th>Tên Recall</th>
                <th>Model xe</th>
                <th>Vấn đề</th>
                <th>Ngày bắt đầu</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecalls.length > 0 ? (
                filteredRecalls.map((recall) => (
                <tr key={recall.Recall_ID}>
                  <td>
                    <div className="recall-id">
                      <strong>{recall.Recall_ID}</strong>
                    </div>
                  </td>
                  <td>
                    <div className="recall-name">
                      <strong>{recall.RecallName || "N/A"}</strong>
                    </div>
                  </td>
                  <td>
                    <div className="model-info">
                      {getModelNames(recall.VehicleModels)}
                    </div>
                  </td>
                  <td>
                    <div className="issue-cell">
                      {recall.IssueDescription ? (
                        recall.IssueDescription.length > 60 ? (
                          `${recall.IssueDescription.substring(0, 60)}...`
                        ) : (
                          recall.IssueDescription
                        )
                      ) : (
                        <em className="text-muted">Chưa có thông tin</em>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="date-cell">
                      {formatDate(recall.StartDate)}
                    </div>
                  </td>
                  <td>{getStatusBadge(recall.Status)}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        onClick={() => onView(recall)}
                        className="btn btn-sm btn-outline"
                        title="Xem chi tiết"
                      >
                        <Eye size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
              ) : (
                <tr className="no-results-row">
                  <td colSpan="7">
                    {searchTerm ? `Không tìm thấy recall nào phù hợp với "${searchTerm}"` : 'Không có recall nào'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Default view
  return (
    <div className="recall-list">
      <div className="no-data-container">
        <p>Không có quyền xem danh sách Recall</p>
      </div>
    </div>
  );
}

export default RecallList;
