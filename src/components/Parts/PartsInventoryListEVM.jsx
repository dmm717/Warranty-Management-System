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
  const [skipFetch, setSkipFetch] = useState(() => {
    // Kiểm tra sessionStorage để nhớ trạng thái skip fetch
    return sessionStorage.getItem('skipPartsCountFetch') === 'true';
  });

  // Fetch count cho tất cả parts khi component mount hoặc inventory thay đổi
  useEffect(() => {
    if (inventory && inventory.length > 0) {

      if (skipFetch) {
        // Nếu skip fetch, sử dụng totalAmountOfProduct từ inventory data
        const counts = {};
        inventory.forEach(item => {
          counts[item.id] = item.totalAmountOfProduct ?? 0;
        });
        setPartCounts(counts);
      } else {
        // Ưu tiên dùng totalAmountOfProduct từ API getAllPartTypes
        const hasAllCounts = inventory.every(item => item.totalAmountOfProduct !== undefined && item.totalAmountOfProduct !== null);

        if (hasAllCounts) {
          const counts = {};
          inventory.forEach(item => {
            counts[item.id] = item.totalAmountOfProduct;
          });
          setPartCounts(counts);
        } else {
          // Chỉ fetch những item thiếu count
          fetchMissingPartCounts();
        }
      }
    }
  }, [inventory, skipFetch]);

  const fetchMissingPartCounts = async () => {
    const counts = {};
    let errorCount = 0;
    const MAX_ERRORS = 3; // Nếu có 3 lỗi liên tiếp, skip fetch

    // Đầu tiên, set count từ totalAmountOfProduct cho những item đã có
    inventory.forEach(item => {
      if (item.totalAmountOfProduct !== undefined && item.totalAmountOfProduct !== null) {
        counts[item.id] = item.totalAmountOfProduct;
      }
    });

    // Chỉ fetch những item thiếu count
    const itemsToFetch = inventory.filter(item =>
      item.totalAmountOfProduct === undefined || item.totalAmountOfProduct === null
    );

    for (let i = 0; i < itemsToFetch.length; i++) {
      const item = itemsToFetch[i];

      // Nếu đã có quá nhiều lỗi, skip các requests còn lại
      if (errorCount >= MAX_ERRORS) {
        console.warn(`[PartsInventoryListEVM] Too many API errors (${errorCount}). Skipping remaining fetches for this session.`);
        setSkipFetch(true);
        sessionStorage.setItem('skipPartsCountFetch', 'true');
        // Sử dụng 0 cho các items còn lại
        for (let j = i; j < itemsToFetch.length; j++) {
          counts[itemsToFetch[j].id] = 0;
        }
        break;
      }

      try {
        const response = await evmInventoryAPI.searchByPartTypeQuery(item.id);

        // Check if response is successful
        if (!response.success) {
          errorCount++;
          if (errorCount === 1) {
            console.warn(`[PartsInventoryListEVM] API error detected. Will skip remaining requests after ${MAX_ERRORS} errors.`);
          }
          counts[item.id] = 0; // Fallback to 0
          continue;
        }

        // Reset error count on success
        errorCount = 0;

        // Filter chỉ lấy phụ tùng ACTIVE (không lấy TRANSFERRED)
        const allParts = response.data || [];
        const activeParts = allParts.filter(part => {
          return part.condition === "ACTIVE";
        });

        counts[item.id] = activeParts.length;
      } catch (error) {
        errorCount++;
        if (errorCount === 1) {
          console.error(`[PartsInventoryListEVM] Network error:`, error);
        }
        counts[item.id] = 0; // Fallback to 0
      }

      // Thêm delay nhỏ giữa các requests
      if (i < itemsToFetch.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
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
