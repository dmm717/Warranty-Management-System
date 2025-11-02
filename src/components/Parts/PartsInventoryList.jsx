import React, { useState } from "react";
import { PARTS_INVENTORY_STATUS } from "../../constants";
import "../../styles/PartsManagement.css";

function PartsInventoryList({ inventory, onUpdateStock }) {
  const [editingStatus, setEditingStatus] = useState(null);

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

  const generateSerialDisplay = (itemId, stock) => {
    // Generate a simplified serial preview (in real implementation, fetch from backend)
    // Serials are stored in ProductsSparePartsEVM table (ID_Product_Serial_EVM)
    // Format: {PartTypeId}-{RandomSerial} (e.g., "EVM-PT001-A3F7", "EVM-PT001-B2E9")
    //
    // Serial generation logic:
    // 1. When stock is OUT_OF_STOCK (totalAmountOfProduct = 0)
    // 2. And new stock is added (restocking event)
    // 3. Backend generates random serials for each unit:
    //    - Format: {PartTypeId}-{4 random alphanumeric chars}
    //    - Example: EVM-PT003-1A2B, EVM-PT003-3C4D, etc.
    // 4. Each serial links to its ProductsSparePartsTypeEVM via partType relationship
    //
    // When displaying:
    // - If stock > 0: Show first serial + count (e.g., "EVM-PT003-XXXX (50 cái)")
    // - If stock = 0: Show "Hết hàng - cần nhập mới"

    if (stock === 0) return "Hết hàng - cần nhập mới";
    return `${itemId}-XXXX (${stock} cái)`;
  };

  return (
    <div className="parts-list-container">
      <table className="parts-table">
        <thead>
          <tr>
            <th>Serials</th>
            <th>Tên phụ tùng</th>
            <th>Nhà sản xuất</th>
            <th>Năm</th>
            <th>Tồn kho</th>
            <th>Giá</th>
            <th>Tình trạng</th>
          </tr>
        </thead>
        <tbody>
          {inventory.map((item) => {
            const stock = item.totalAmountOfProduct || 0;
            // Always calculate status from stock amount
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
                    <span
                      className={`status-badge status-${currentStatus.toLowerCase()}`}
                      onClick={() => setEditingStatus(item.id)}
                      style={{ cursor: "pointer" }}
                      title="Click để thay đổi"
                    >
                      {getStockLabel(currentStatus)}
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default PartsInventoryList;
