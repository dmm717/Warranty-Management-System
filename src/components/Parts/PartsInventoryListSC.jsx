import React, { useState, useEffect } from "react";
import { PARTS_INVENTORY_STATUS } from "../../constants";
import { scInventoryAPI } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import { Eye } from "lucide-react";
import "../../styles/PartsManagement.css";

function PartsInventoryListSC({ inventory, onViewPartsByType }) {
  const { user } = useAuth();
  const [partCounts, setPartCounts] = useState({});

  // Fetch count cho tất cả parts khi component mount hoặc inventory thay đổi
  useEffect(() => {
    if (inventory && inventory.length > 0 && user?.branchOffice) {
      fetchAllPartCounts();
    }
  }, [inventory, user?.branchOffice]);

  const fetchAllPartCounts = async () => {
    const counts = {};
    
    // Lấy office branch từ user
    const officeBranch = user?.branchOffice;
    
    if (!officeBranch) {
      console.warn("No office branch found for user");
      return;
    }
    
    // Fetch count cho từng part type theo office branch
    for (const item of inventory) {
      try {
        // Sử dụng search API thay vì count API để có thể filter vehicleVinId
        const response = await scInventoryAPI.searchByBranchAndPartType(officeBranch, item.id);
        // Filter chỉ đếm parts ACTIVE và chưa gán (vehicleVinId === null)
        const unmappedParts = (response.data || []).filter(part => 
          part.condition === "ACTIVE" && !part.vehicleVinId
        );
        counts[item.id] = unmappedParts.length;
      } catch (error) {
        console.error(`Error fetching count for SC part ${item.id}:`, error);
        counts[item.id] = 0;
      }
    }
    
    setPartCounts(counts);
  };

  const [editingStatus] = useState(null);

  if (!inventory || inventory.length === 0) {
    return (
      <div className="empty-state">
        <p>Không có phụ tùng nào trong kho SC</p>
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

  const generateSerialDisplay = (itemId, stock) => {
    // Display Part Type ID with count
    // itemId = ID_Products_Part_Type_SC (e.g., "SC-PT001", "SC-PT002")
    // This is the PART TYPE, not individual product serials
    // Count is fetched from /api/spare-parts/sc/count/office_branch
    
    if (stock === undefined) return "Đang tải...";
    if (stock === 0) return `${itemId} (Hết hàng)`;
    return `${itemId} (${stock} cái)`;
  };

  const handleViewPartsByType = (partTypeId, partName) => {
    if (onViewPartsByType) {
      onViewPartsByType(partTypeId, partName);
    }
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
            // Sử dụng count từ API theo office branch
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
                  <span
                    className={`status-badge status-${currentStatus.toLowerCase()}`}
                  >
                    {getStockLabel(currentStatus)}
                  </span>
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
    </div>
  );
}

export default PartsInventoryListSC;
