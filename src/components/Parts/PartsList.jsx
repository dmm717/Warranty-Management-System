import React from "react";
import "../../styles/PartsList.css";

function PartsList({ parts, onEdit, onDelete, userRole }) {
  const getStatusBadge = (status, quantity) => {
    let statusClass = "status-available";
    let displayStatus = status;

    if (quantity === 0) {
      statusClass = "status-out-of-stock";
      displayStatus = "Hết hàng";
    } else if (quantity < 10) {
      statusClass = "status-low-stock";
      displayStatus = "Thiếu hàng";
    } else if (status === "Có sẵn") {
      statusClass = "status-available";
    }

    return (
      <span className={`status-badge ${statusClass}`}>{displayStatus}</span>
    );
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  const canEditDelete = () => {
    return userRole === "EVM_Staff" || userRole === "Admin";
  };

  if (parts.length === 0) {
    return (
      <div className="no-data-container">
        <div className="no-data-icon">⚙️</div>
        <h3>Không tìm thấy phụ tùng nào</h3>
        <p>Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc</p>
      </div>
    );
  }

  return (
    <div className="parts-list">
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Mã sản phẩm</th>
              <th>Tên sản phẩm</th>
              <th>Danh mục</th>
              <th>Hãng</th>
              <th>Số lượng</th>
              <th>Giá</th>
              <th>Bảo hành</th>
              <th>Trạng thái</th>
              {canEditDelete() && <th>Thao tác</th>}
            </tr>
          </thead>
          <tbody>
            {parts.map((part) => (
              <tr key={part.ID_Product_Serial_SC}>
                <td>
                  <div className="part-id">
                    <strong>{part.ID_Product_Serial_SC}</strong>
                  </div>
                </td>
                <td>
                  <div className="part-info">
                    <strong>{part.Name_Product}</strong>
                    <small>{part.Description}</small>
                  </div>
                </td>
                <td>
                  <span className="category-badge">{part.Part_Name}</span>
                </td>
                <td>{part.Brand}</td>
                <td>
                  <div className="quantity-info">
                    <strong
                      className={
                        part.Total_Amount_Of_Product < 10 ? "low-quantity" : ""
                      }
                    >
                      {part.Total_Amount_Of_Product}
                    </strong>
                    <small>đơn vị</small>
                  </div>
                </td>
                <td>
                  <div className="price-info">{formatCurrency(part.Price)}</div>
                </td>
                <td>
                  <div className="warranty-info">
                    {part.Warranty_Period} tháng
                  </div>
                </td>
                <td>
                  {getStatusBadge(part.Status, part.Total_Amount_Of_Product)}
                </td>
                {canEditDelete() && (
                  <td>
                    <div className="action-buttons">
                      <button
                        onClick={() => onEdit(part)}
                        className="btn btn-sm btn-outline"
                        title="Chỉnh sửa"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => onDelete(part.ID_Product_Serial_SC)}
                        className="btn btn-sm btn-danger"
                        title="Xóa"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default PartsList;
