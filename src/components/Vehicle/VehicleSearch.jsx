import React, { useState } from "react";
import "../../styles/VehicleSearch.css";

function VehicleSearch({ onSearch }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    onSearch(value, filterType);
  };

  const handleFilterChange = (e) => {
    const value = e.target.value;
    setFilterType(value);
    onSearch(searchTerm, value);
  };

  const clearSearch = () => {
    setSearchTerm("");
    setFilterType("all");
    onSearch("", "all");
  };

  return (
    <div className="vehicle-search card">
      <div className="search-row">
        <div className="search-group">
          <label className="search-label">Tìm kiếm</label>
          <div className="search-input-container">
            <input
              type="text"
              className="form-control search-input"
              placeholder="Nhập VIN, tên chủ xe, số điện thoại..."
              value={searchTerm}
              onChange={handleSearchChange}
            />
            <span className="search-icon">🔍</span>
          </div>
        </div>

        <div className="filter-group">
          <label className="search-label">Trạng thái</label>
          <select
            className="form-control"
            value={filterType}
            onChange={handleFilterChange}
          >
            <option value="all">Tất cả</option>
            <option value="Đang sử dụng">Đang sử dụng</option>
            <option value="Trong bảo hành">Trong bảo hành</option>
            <option value="Ngừng hoạt động">Ngừng hoạt động</option>
            <option value="Đã triệu hồi">Đã triệu hồi</option>
            <option value="Đã thanh lý">Đã thanh lý</option>
          </select>
        </div>

        <div className="search-actions">
          <button onClick={clearSearch} className="btn btn-outline">
            Xóa bộ lọc
          </button>
        </div>
      </div>
    </div>
  );
}

export default VehicleSearch;
