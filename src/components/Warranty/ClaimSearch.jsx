import React, { useState } from "react";
import "../../styles/ClaimSearch.css";

function ClaimSearch({ onSearch }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    onSearch(value, statusFilter, priorityFilter);
  };

  const handleStatusChange = (e) => {
    const value = e.target.value;
    setStatusFilter(value);
    onSearch(searchTerm, value, priorityFilter);
  };

  const handlePriorityChange = (e) => {
    const value = e.target.value;
    setPriorityFilter(value);
    onSearch(searchTerm, statusFilter, value);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setPriorityFilter("all");
    onSearch("", "all", "all");
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
              placeholder="Nhập mã claim, VIN, tên khách hàng..."
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
            <option value="Chờ duyệt">Chờ duyệt</option>
            <option value="Đã duyệt">Đã duyệt</option>
            <option value="Từ chối">Từ chối</option>
            <option value="Đang xử lý">Đang xử lý</option>
            <option value="Hoàn thành">Hoàn thành</option>
          </select>
        </div>

        <div className="filter-group">
          <label className="search-label">Độ ưu tiên</label>
          <select
            className="form-control"
            value={priorityFilter}
            onChange={handlePriorityChange}
          >
            <option value="all">Tất cả</option>
            <option value="Cao">Cao</option>
            <option value="Trung bình">Trung bình</option>
            <option value="Thấp">Thấp</option>
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
