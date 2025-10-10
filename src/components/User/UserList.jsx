import React, { useState } from "react";
import "./UserList.css";

function UserList({ users, onEdit, onDelete, onUpdateStatus }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const getStatusBadge = (status) => {
    const statusClasses = {
      "Hoạt động": "status-active",
      "Tạm khóa": "status-locked",
      "Ngừng hoạt động": "status-inactive",
    };

    return (
      <span
        className={`status-badge ${statusClasses[status] || "status-active"}`}
      >
        {status}
      </span>
    );
  };

  const getRoleBadge = (role) => {
    const roleClasses = {
      Admin: "role-admin",
      EVM_Staff: "role-evm",
      SC_Staff: "role-sc-staff",
      SC_Technician: "role-sc-tech",
    };

    const roleNames = {
      Admin: "Quản trị viên",
      EVM_Staff: "Nhân viên EVM",
      SC_Staff: "Nhân viên SC",
      SC_Technician: "Kỹ thuật viên SC",
    };

    return (
      <span className={`role-badge ${roleClasses[role] || "role-sc-staff"}`}>
        {roleNames[role] || role}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesStatus =
      statusFilter === "all" || user.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const getAvailableStatuses = (currentStatus) => {
    const statusFlow = {
      "Hoạt động": ["Tạm khóa", "Ngừng hoạt động"],
      "Tạm khóa": ["Hoạt động", "Ngừng hoạt động"],
      "Ngừng hoạt động": ["Hoạt động"],
    };
    return statusFlow[currentStatus] || [];
  };

  return (
    <div className="user-list">
      <div className="user-filters card">
        <div className="filters-row">
          <div className="search-group">
            <label className="filter-label">Tìm kiếm</label>
            <div className="search-input-container">
              <input
                type="text"
                className="form-control search-input"
                placeholder="Tìm theo tên, email, ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <span className="search-icon">🔍</span>
            </div>
          </div>

          <div className="filter-group">
            <label className="filter-label">Vai trò</label>
            <select
              className="form-control"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="all">Tất cả</option>
              <option value="Admin">Quản trị viên</option>
              <option value="EVM_Staff">Nhân viên EVM</option>
              <option value="SC_Staff">Nhân viên SC</option>
              <option value="SC_Technician">Kỹ thuật viên SC</option>
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">Trạng thái</label>
            <select
              className="form-control"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Tất cả</option>
              <option value="Hoạt động">Hoạt động</option>
              <option value="Tạm khóa">Tạm khóa</option>
              <option value="Ngừng hoạt động">Ngừng hoạt động</option>
            </select>
          </div>

          <div className="filter-actions">
            <button
              onClick={() => {
                setSearchTerm("");
                setRoleFilter("all");
                setStatusFilter("all");
              }}
              className="btn btn-outline btn-sm"
            >
              Xóa bộ lọc
            </button>
          </div>
        </div>
      </div>

      <div className="users-table">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tên người dùng</th>
                <th>Email</th>
                <th>Vai trò</th>
                <th>Phòng ban</th>
                <th>Số điện thoại</th>
                <th>Ngày tham gia</th>
                <th>Đăng nhập cuối</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="user-id">
                      <strong>{user.id}</strong>
                    </div>
                  </td>
                  <td>
                    <div className="user-info">
                      <div className="user-avatar">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <strong>{user.name}</strong>
                    </div>
                  </td>
                  <td>
                    <div className="user-email">{user.email}</div>
                  </td>
                  <td>{getRoleBadge(user.role)}</td>
                  <td>
                    <div className="department">{user.department}</div>
                  </td>
                  <td>
                    <div className="phone">{user.phone}</div>
                  </td>
                  <td>{formatDate(user.joinDate)}</td>
                  <td>
                    <div className="last-login">
                      {user.lastLogin === "Chưa đăng nhập" ? (
                        <span className="never-login">Chưa đăng nhập</span>
                      ) : (
                        formatDate(user.lastLogin)
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="status-container">
                      {getStatusBadge(user.status)}
                      <div className="status-actions">
                        {getAvailableStatuses(user.status).map((newStatus) => (
                          <button
                            key={newStatus}
                            onClick={() => onUpdateStatus(user.id, newStatus)}
                            className="btn btn-sm status-btn"
                            title={`Chuyển sang ${newStatus}`}
                          >
                            →{newStatus}
                          </button>
                        ))}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        onClick={() => onEdit(user)}
                        className="btn btn-sm btn-outline"
                        title="Chỉnh sửa"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => onDelete(user.id)}
                        className="btn btn-sm btn-danger"
                        title="Xóa"
                        disabled={user.role === "Admin"}
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredUsers.length === 0 && users.length > 0 && (
        <div className="no-results-container">
          <div className="no-results-icon">🔍</div>
          <h3>Không tìm thấy người dùng</h3>
          <p>Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc</p>
        </div>
      )}
    </div>
  );
}

export default UserList;
