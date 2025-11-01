import React, { useState } from "react";
import { WARRANTY_CLAIM_STATUS_OPTIONS } from "../../constants";
import "../../styles/ClaimSearch.css";

function ClaimSearch({ onSearch }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    onSearch(value, statusFilter);
  };

  const handleStatusChange = (e) => {
    const value = e.target.value;
    setStatusFilter(value);
    onSearch(searchTerm, value);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    onSearch("", "all");
  };

  return (
    <div className="claim-search card">
      <div className="search-row">
        <div className="search-group">
          <label className="search-label">Tìm kiếm</label>
          <div className="search-input-container">
            <input
              type="text"
              className="form-control search-input"
              placeholder="Nhập mã claim, tên xe, tên khách hàng, số điện thoại..."
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
            value={statusFilter}
            onChange={handleStatusChange}
          >
            <option value="all">Tất cả</option>
            {WARRANTY_CLAIM_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
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

export default ClaimSearch;
