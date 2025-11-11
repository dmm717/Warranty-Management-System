import React, { useState, useEffect } from "react";
import { ArrowLeft, Plus, Send, Edit } from "lucide-react";
import { evmInventoryAPI } from "../../services/api";
import AddSparePartModal from "./AddSparePartModal";
import TransferPartModal from "./TransferPartModal";
import EditSparePartModal from "./EditSparePartModal";
import "../../styles/PartsManagement.css";

function PartsByTypeView({ partTypeId, partTypeName, onBack }) {
  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPart, setSelectedPart] = useState(null);
  const [partTypeInfo, setPartTypeInfo] = useState(null);

  useEffect(() => {
    fetchPartsByType();
  }, [partTypeId]);

  const fetchPartsByType = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await evmInventoryAPI.searchByPartTypeQuery(partTypeId);
      
      // Filter chỉ lấy phụ tùng ACTIVE
      const allParts = response.data || [];
      const activeParts = allParts.filter(part => {
        return part.condition === "ACTIVE";
      });
      
      setParts(activeParts);

      // Lưu thông tin Part Type để dùng cho form thêm phụ tùng
      if (activeParts.length > 0 && activeParts[0].partTypeInfoDTO) {
        setPartTypeInfo({
          id: partTypeId,
          partName: partTypeName,
          manufacturer: activeParts[0].partTypeInfoDTO.manufacturer,
          vehicleType: activeParts[0].vehicleType,
        });
      } else {
        // Nếu chưa có phụ tùng nào, tạo info cơ bản
        setPartTypeInfo({
          id: partTypeId,
          partName: partTypeName,
          vehicleType: "VF3", // Default
        });
      }
    } catch (err) {
      console.error("Error fetching parts by type:", err);
      setError("Không thể tải danh sách phụ tùng");
      setParts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSuccess = () => {
    // Refresh danh sách sau khi thêm thành công
    fetchPartsByType();
  };

  const handleTransferClick = (part) => {
    setSelectedPart(part);
    setShowTransferModal(true);
  };

  const handleTransferSuccess = () => {
    // Refresh danh sách sau khi chuyển thành công
    fetchPartsByType();
  };

  const handleEditClick = (part) => {
    setSelectedPart(part);
    setShowEditModal(true);
  };

  const handleEditSuccess = () => {
    // Refresh danh sách sau khi sửa thành công
    fetchPartsByType();
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
        <h1>Danh sách phụ tùng: {partTypeName} ({parts.length} còn hàng)</h1>
        <button 
          className="btn btn-primary"
          onClick={() => setShowAddModal(true)}
        >
          <Plus size={20} />
          Thêm phụ tùng
        </button>
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
                <th>Serial Number</th>
                <th>Tên phụ tùng</th>
                <th>Loại xe</th>
                <th>Trạng thái</th>
                <th>Thông tin Part Type</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {parts.map((part, index) => (
                <tr key={part.id || index}>
                  <td>
                    <code className="serial-code">{part.id || "N/A"}</code>
                  </td>
                  <td>{part.name || "N/A"}</td>
                  <td>{part.vehicleType || "N/A"}</td>
                  <td>
                    <span
                      className={`status-badge status-${
                        part.condition?.toLowerCase() || "active"
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
                    <div className="action-buttons">
                      <button
                        className="btn-icon btn-edit"
                        onClick={() => handleEditClick(part)}
                        title="Sửa thông tin"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        className="btn-icon btn-transfer"
                        onClick={() => handleTransferClick(part)}
                        title="Chuyển sang SC"
                      >
                        <Send size={16} />
                      </button>
                    </div>
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
            Tổng số: <strong>{parts.length}</strong> phụ tùng
          </p>
        </div>
      )}

      {/* Add Spare Part Modal */}
      {partTypeInfo && (
        <AddSparePartModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={handleAddSuccess}
          partTypeInfo={partTypeInfo}
        />
      )}

      {/* Transfer Part Modal */}
      <TransferPartModal
        isOpen={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        onSuccess={handleTransferSuccess}
        part={selectedPart}
      />

      {/* Edit Spare Part Modal */}
      <EditSparePartModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSuccess={handleEditSuccess}
        part={selectedPart}
      />
    </div>
  );
}

export default PartsByTypeView;
