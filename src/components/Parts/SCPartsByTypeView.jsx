import React, { useState, useEffect } from "react";
import { ArrowLeft, Link } from "lucide-react";
import { scInventoryAPI } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import MapPartToVehicleModal from "./MapPartToVehicleModal";
import "../../styles/PartsManagement.css";

function SCPartsByTypeView({ partTypeId, partTypeName, onBack }) {
  const { user } = useAuth();
  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showMapModal, setShowMapModal] = useState(false);
  const [selectedPart, setSelectedPart] = useState(null);

  useEffect(() => {
    fetchPartsByType();
  }, [partTypeId]);

  const fetchPartsByType = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Lấy office branch từ user
      const officeBranch = user?.branchOffice;
      
      if (!officeBranch) {
        throw new Error("Không tìm thấy thông tin chi nhánh");
      }

      const response = await scInventoryAPI.searchByBranchAndPartType(officeBranch, partTypeId);
      const allParts = response.data || [];
      
      // Filter chỉ lấy phụ tùng ACTIVE và chưa gán cho xe (vehicleVinId === null)
      const activeParts = allParts.filter(part => {
        const isAssigned = part.vehicleVinId !== null && part.vehicleVinId !== undefined;
        return part.condition === "ACTIVE" && !isAssigned;
      });
      
      setParts(activeParts);
    } catch (err) {
      console.error("Error fetching SC parts by type:", err);
      setError("Không thể tải danh sách phụ tùng");
      setParts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMapPart = (part) => {
    setSelectedPart(part);
    setShowMapModal(true);
  };

  const handleCloseMapModal = () => {
    setShowMapModal(false);
    setSelectedPart(null);
  };

  const handleMapSuccess = () => {
    fetchPartsByType(); // Refresh list after mapping
  };

  if (loading) {
    return (
      <div className="parts-management-container">
        <div className="loading-state">
          <p>Đang tải danh sách phụ tùng...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="parts-management-container">
      {/* Header */}
      <div className="parts-header">
        <button className="btn-back" onClick={onBack}>
          <ArrowLeft size={20} />
          Quay lại
        </button>
        <h1>Danh sách phụ tùng SC: {partTypeName} ({parts.length} còn hàng)</h1>
      </div>

      {/* Error State */}
      {error && (
        <div className="error-state">
          <p>{error}</p>
        </div>
      )}

      {/* Empty State */}
      {!error && parts.length === 0 && (
        <div className="empty-state">
          <p>Không có phụ tùng nào</p>
        </div>
      )}

      {/* Parts Table */}
      {!error && parts.length > 0 && (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: "15%" }}>Serial Number</th>
                <th style={{ width: "20%" }}>Tên phụ tùng</th>
                <th style={{ width: "12%" }}>Chi nhánh</th>
                <th style={{ width: "10%" }}>Loại xe</th>
                <th style={{ width: "10%" }}>Trạng thái</th>
                <th style={{ width: "23%" }}>Thông tin Part Type</th>
                <th style={{ width: "10%" }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {parts.map((part, index) => (
                <tr key={part.id || index}>
                  <td>
                    <code className="serial-code">{part.id || "N/A"}</code>
                  </td>
                  <td>{part.name || "N/A"}</td>
                  <td>{part.officeBranch || user?.branchOffice || "N/A"}</td>
                  <td>{part.vehicleType || "N/A"}</td>
                  <td>
                    <span
                      className={`status-badge ${
                        part.condition === "ACTIVE"
                          ? "status-active"
                          : part.condition === "TRANSFERRED"
                          ? "status-transferred"
                          : ""
                      }`}
                    >
                      {part.condition === "ACTIVE"
                        ? "Hoạt động"
                        : part.condition === "TRANSFERRED"
                        ? "Đã chuyển"
                        : part.condition || "N/A"}
                    </span>
                  </td>
                  <td>
                    <div className="description-cell">
                      {part.partTypeInfoDTO ? (
                        <>
                          <strong>{part.partTypeInfoDTO.partName || "N/A"}</strong>
                          {part.partTypeInfoDTO.manufacturer && (
                            <div className="text-muted">
                              Nhà SX: {part.partTypeInfoDTO.manufacturer}
                            </div>
                          )}
                          {part.partTypeInfoDTO.price && (
                            <div className="text-muted">
                              Giá: {new Intl.NumberFormat("vi-VN", {
                                style: "currency",
                                currency: "VND",
                              }).format(part.partTypeInfoDTO.price)}
                            </div>
                          )}
                        </>
                      ) : (
                        "—"
                      )}
                    </div>
                  </td>
                  <td>
                    {!part.vehicleVinId ? (
                      <button
                        className="btn-icon"
                        onClick={() => handleMapPart(part)}
                        title="Gán cho xe"
                        style={{
                          background: "rgba(96, 165, 250, 0.1)",
                          borderColor: "rgba(96, 165, 250, 0.3)",
                          color: "#60a5fa"
                        }}
                      >
                        <Link size={16} />
                      </button>
                    ) : (
                      <span className="text-muted" style={{ fontSize: "0.85em" }}>
                        Đã gán
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary */}
      {!error && parts.length > 0 && (
        <div className="parts-summary">
          <p>
            Chi nhánh: <strong>{user?.branchOffice || "N/A"}</strong> | 
            Tổng số: <strong>{parts.length}</strong> phụ tùng
          </p>
        </div>
      )}

      {/* Map Part to Vehicle Modal */}
      {showMapModal && selectedPart && (
        <MapPartToVehicleModal
          part={selectedPart}
          onClose={handleCloseMapModal}
          onSuccess={handleMapSuccess}
        />
      )}
    </div>
  );
}

export default SCPartsByTypeView;
