import React, { useState } from "react";
import { PARTS_STATUS } from "../../constants";
import "../../styles/PartsSearch.css";

function PartsSearch({ onSearch, availableCategories = [] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const statusOptions = PARTS_STATUS;

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    onSearch(value, categoryFilter, statusFilter);
  };

  const handleCategoryChange = (e) => {
    const value = e.target.value;
    setCategoryFilter(value);
    onSearch(searchTerm, value, statusFilter);
  };

  const handleStatusChange = (e) => {
    const value = e.target.value;
    setStatusFilter(value);
    onSearch(searchTerm, categoryFilter, value);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setCategoryFilter("all");
    setStatusFilter("all");
    onSearch("", "all", "all");
  };

  return (
    <div className="parts-search card">
      <div className="search-row">
        <div className="search-group">
          <label className="search-label">Tìm kiếm</label>
          <div className="search-input-container">
            <input
              type="text"
              className="form-control search-input"
              placeholder="Nhập tên phụ tùng, mã sản phẩm..."
              value={searchTerm}
              onChange={handleSearchChange}
            />
            <span className="search-icon">🔍</span>
          </div>
        </div>

        <div className="filter-group">
          <label className="search-label">Danh mục</label>
          <select
            className="form-control"
            value={categoryFilter}
            onChange={handleCategoryChange}
          >
            <option value="all">Tất cả</option>
            {availableCategories.map((category, index) => (
              <option key={index} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label className="search-label">Trạng thái</label>
          <select
            className="form-control"
            value={statusFilter}
            onChange={handleStatusChange}
          >
            <option value="all">Tất cả</option>
            {statusOptions.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>

        <div className="search-actions">
          <button onClick={clearFilters} className="btn btn-outline">
            Xóa bộ lọc
          </button>
        </div>
      </div>
    </div>
  );
}

export default PartsSearch;
