import React, { useState } from "react";
import "../../styles/UserList.css";

function UserList({ users, currentUser, onEdit, onDelete, onUpdateStatus }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Kiểm tra xem user hiện tại có quyền thay đổi trạng thái không
  const canChangeStatus = currentUser?.role === "EVM_ADMIN";

  const getStatusBadge = (accountStatus) => {
    // Map backend enum sang Vietnamese
    const statusMap = {
      ACTIVE: "Hoạt động",
      LOCKED: "Tạm khóa",
      INACTIVE: "Ngừng hoạt động",
    };

    const status = statusMap[accountStatus] || "Hoạt động";

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
      EVM_ADMIN: "role-admin",
      EVM_STAFF: "role-evm",
      SC_ADMIN: "role-admin",
      SC_STAFF: "role-sc-staff",
      SC_TECHNICAL: "role-sc-tech",
    };

    const roleNames = {
      EVM_ADMIN: "Quản lý EVM",
      EVM_STAFF: "Nhân viên EVM",
      SC_ADMIN: "Quản lý SC",
      SC_STAFF: "Nhân viên SC",
      SC_TECHNICAL: "Kỹ thuật viên SC",
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
      (user.username?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (user.email?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      String(user.id || "").includes(searchTerm);

    // Backend trả về roles là Set, lấy role đầu tiên
    const userRole = user.roles && user.roles.length > 0 ? user.roles[0] : null;
    const matchesRole = roleFilter === "all" || userRole === roleFilter;

    // Map backend accountStatus sang Vietnamese để filter
    const statusMap = {
      ACTIVE: "Hoạt động",
      LOCKED: "Tạm khóa",
      INACTIVE: "Ngừng hoạt động",
    };
    const userStatus = statusMap[user.accountStatus] || "Hoạt động";
    const matchesStatus = statusFilter === "all" || userStatus === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Kiểm tra có user nào là SC role không để hiển thị cột Khu vực
  const hasSCUsers = filteredUsers.some((user) => {
    const userRole = user.roles && user.roles.length > 0 ? user.roles[0] : null;
    return (
      userRole === "SC_ADMIN" ||
      userRole === "SC_STAFF" ||
      userRole === "SC_TECHNICAL"
    );
  });

  const getAvailableStatuses = (accountStatus) => {
    // Map backend enum sang Vietnamese
    const statusMap = {
      ACTIVE: "Hoạt động",
      LOCKED: "Tạm khóa",
      INACTIVE: "Ngừng hoạt động",
    };

    const currentStatus = statusMap[accountStatus] || "Hoạt động";

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
                {hasSCUsers && <th>Khu vực</th>}
                <th>Số điện thoại</th>
                <th>Ngày sinh</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => {
                // Backend trả về roles là Set/Array
                const userRole =
                  user.roles && user.roles.length > 0
                    ? user.roles[0]
                    : "Unknown";
                const userName = user.username || "N/A";
                const isSCRole =
                  userRole === "SC_ADMIN" ||
                  userRole === "SC_STAFF" ||
                  userRole === "SC_TECHNICAL";

                return (
                  <tr key={user.id}>
                    <td>
                      <div className="user-id">
                        <strong>{user.id}</strong>
                      </div>
                    </td>
                    <td>
                      <div className="user-info">
                        <div className="user-avatar">
                          {userName.charAt(0).toUpperCase()}
                        </div>
                        <strong>{userName}</strong>
                      </div>
                    </td>
                    <td>
                      <div className="user-email">{user.email}</div>
                    </td>
                    <td>{getRoleBadge(userRole)}</td>
                    {hasSCUsers && (
                      <td>
                        <div className="branch-office">
                          {isSCRole ? user.branchOffice || "N/A" : "—"}
                        </div>
                      </td>
                    )}
                    <td>
                      <div className="phone">{user.phoneNumber || "N/A"}</div>
                    </td>
                    <td>
                      <div className="date-of-birth">
                        {user.dateOfBirth
                          ? formatDate(user.dateOfBirth)
                          : "N/A"}
                      </div>
                    </td>
                    <td>
                      <div className="status-container">
                        <div
                          className="status-badge-wrapper"
                          title={
                            user.statusChangeReason
                              ? `Lý do: ${
                                  user.statusChangeReason
                                }\nThay đổi lúc: ${
                                  user.statusChangedAt
                                    ? new Date(
                                        user.statusChangedAt
                                      ).toLocaleString("vi-VN")
                                    : "N/A"
                                }`
                              : "Không có lý do"
                          }
                        >
                          {getStatusBadge(user.accountStatus)}
                        </div>
                        {/* Chỉ hiển thị nút thay đổi trạng thái nếu user là EVM_ADMIN */}
                        {canChangeStatus && (
                          <div className="status-actions">
                            {getAvailableStatuses(user.accountStatus).map(
                              (newStatus) => (
                                <button
                                  key={newStatus}
                                  onClick={() =>
                                    onUpdateStatus(user.id, newStatus)
                                  }
                                  className="btn btn-sm status-btn"
                                  title={`Chuyển sang ${newStatus}`}
                                >
                                  →{newStatus}
                                </button>
                              )
                            )}
                          </div>
                        )}
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
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
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
