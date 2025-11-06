import React, { useState, useEffect } from "react";
import { PARTS_INVENTORY_STATUS } from "../../constants";
import { useAuth } from "../../contexts/AuthContext";
import PartsRequestForm from "./PartsRequestForm";
import { evmInventoryAPI } from "../../services/api";
import { Eye } from "lucide-react";
import "../../styles/PartsManagement.css";

function PartsInventoryListEVM({ inventory, onUpdateStock, onRequestCreated, onViewPartsByType }) {
  const { user } = useAuth();
  const [editingStatus, setEditingStatus] = useState(null);
  const [requestFormOpen, setRequestFormOpen] = useState(false);
  const [selectedPart, setSelectedPart] = useState(null);
  const [partCounts, setPartCounts] = useState({});

  // Fetch count cho tất cả parts khi component mount hoặc inventory thay đổi
  useEffect(() => {
    if (inventory && inventory.length > 0) {
      fetchAllPartCounts();
    }
  }, [inventory]);

  const fetchAllPartCounts = async () => {
    const counts = {};
    
    // Fetch count cho từng part type - CHỈ đếm những phụ tùng còn hàng (ACTIVE)
    for (const item of inventory) {
      try {
        const response = await evmInventoryAPI.searchByPartTypeId(item.id);
        // Filter chỉ lấy phụ tùng ACTIVE (không lấy TRANSFERRED)
        const allParts = response.data || [];
        const activeParts = allParts.filter(part => part.condition === "ACTIVE");
        counts[item.id] = activeParts.length;
      } catch (error) {
        console.error(`Error fetching count for part ${item.id}:`, error);
        counts[item.id] = 0;
      }
    }
    
    setPartCounts(counts);
  };

  if (!inventory || inventory.length === 0) {
    return (
      <div className="empty-state">
        <p>Không có phụ tùng nào trong kho</p>
      </div>
    );
  }

  const getStockStatus = (stock) => {
    if (stock > 10) return "IN_STOCK";
    if (stock > 0) return "LOW_STOCK";
    return "OUT_OF_STOCK";
  };

  const getStockLabel = (status) => {
    const statusObj = PARTS_INVENTORY_STATUS.find((s) => s.value === status);
    return statusObj ? statusObj.label : "N/A";
  };

  const handleStatusChange = (itemId, newStatus) => {
    if (onUpdateStock) {
      onUpdateStock(itemId, newStatus);
    }
    setEditingStatus(null);
  };

  const openRequestForm = (part) => {
    setSelectedPart(part);
    setRequestFormOpen(true);
  };

  const handleRequestSuccess = () => {
    setRequestFormOpen(false);
    if (onRequestCreated) {
      onRequestCreated();
    }
  };

  const handleViewPartsByType = (partTypeId, partName) => {
    if (onViewPartsByType) {
      onViewPartsByType(partTypeId, partName);
    }
  };

  // Check if user can request parts (SC_ADMIN or SC_STAFF)
  const canRequestParts =
    user && (user.role === "SC_ADMIN" || user.role === "SC_STAFF");

  const generateSerialDisplay = (itemId, stock) => {
    // Display Part Type ID with count
    // itemId = ID_Products_Part_Type_EVM (e.g., "EVM-PT001", "EVM-PT002")
    // This is the PART TYPE, not individual product serials
    // Count shows how many individual units exist for this part type
    
    if (stock === undefined) return "Đang tải...";
    if (stock === 0) return `${itemId} (Hết hàng)`;
    return `${itemId} (${stock} cái)`;
  };

  return (
    <div className="parts-list-container">
      <table className="parts-table">
        <thead>
          <tr>
            <th>Mã loại phụ tùng</th>
            <th>Tên phụ tùng</th>
            <th>Nhà sản xuất</th>
            <th>Năm</th>
            <th>Tồn kho</th>
            <th>Giá</th>
            <th>Tình trạng</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {inventory.map((item) => {
            // Sử dụng count từ API thay vì totalAmountOfProduct
            const stock = partCounts[item.id] ?? item.totalAmountOfProduct ?? 0;
            // Tính toán status dựa vào số lượng tồn kho thực tế
            const currentStatus = getStockStatus(stock);

            return (
              <tr key={item.id}>
                <td>
                  <div className="serial-cell">
                    <code>{generateSerialDisplay(item.id, stock)}</code>
                  </div>
                </td>
                <td>
                  <div className="part-info">
                    <strong>{item.partName}</strong>
                    {item.description && (
                      <small className="text-muted">{item.description}</small>
                    )}
                  </div>
                </td>
                <td>{item.manufacturer || "N/A"}</td>
                <td>{item.yearModelYear || "N/A"}</td>
                <td>
                  <span
                    className={`stock-badge ${
                      stock > 10
                        ? "stock-high"
                        : stock > 0
                        ? "stock-low"
                        : "stock-out"
                    }`}
                  >
                    {stock} cái
                  </span>
                </td>
                <td className="price-cell">
                  {item.price
                    ? new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }).format(item.price)
                    : "N/A"}
                </td>
                <td>
                  {editingStatus === item.id ? (
                    <select
                      className="status-select"
                      defaultValue={currentStatus}
                      onChange={(e) =>
                        handleStatusChange(item.id, e.target.value)
                      }
                      onBlur={() => setEditingStatus(null)}
                      autoFocus
                    >
                      {PARTS_INVENTORY_STATUS.map((status) => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="status-cell">
                      <span
                        className={`status-badge status-${currentStatus.toLowerCase()}`}
                        onClick={() => setEditingStatus(item.id)}
                        style={{ cursor: "pointer" }}
                        title="Click để thay đổi"
                      >
                        {getStockLabel(currentStatus)}
                      </span>
                      {canRequestParts &&
                        (currentStatus === "LOW_STOCK" ||
                          currentStatus === "OUT_OF_STOCK") && (
                          <button
                            className="btn-request-parts"
                            onClick={() => openRequestForm(item)}
                            title="Tạo yêu cầu nhập hàng"
                          >
                            Nhập hàng
                          </button>
                        )}
                    </div>
                  )}
                </td>
                <td>
                  <button
                    className="btn-icon btn-view"
                    onClick={() => handleViewPartsByType(item.id, item.partName)}
                    title="Xem danh sách phụ tùng"
                  >
                    <Eye size={16} />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Parts Request Form Modal */}
      <PartsRequestForm
        isOpen={requestFormOpen}
        onClose={() => setRequestFormOpen(false)}
        onSuccess={handleRequestSuccess}
        prefilledPart={selectedPart}
        userInfo={user}
      />
    </div>
  );
}

export default PartsInventoryListEVM;
