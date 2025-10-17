import React, { useState } from "react";
import "./RoleTestingPage.css";
import { useAuth } from "../../contexts/AuthContext";
import RoleBasedFeatureDemo from "./RoleBasedFeatureDemo";
import RolePermissionIndicator from "./RolePermissionIndicator";

function RoleTestingPage() {
  const { user, login } = useAuth();
  const [selectedRole, setSelectedRole] = useState(user?.role || "EVM_Staff");

  const testUsers = {
    EVM_Staff: {
      id: "EVM001",
      name: "Nguyễn Văn Minh",
      email: "evm_staff@vinfast.com",
      role: "EVM_Staff",
      department: "Manufacturing",
    },
    Admin: {
      id: "ADM001",
      name: "Trần Thị Admin",
      email: "admin@vinfast.com",
      role: "Admin",
      department: "IT",
    },
    SC_Staff: {
      id: "SC001",
      name: "Lê Hoàng Nam",
      email: "sc_staff@vinfast.com",
      role: "SC_Staff",
      department: "Service Center",
    },
    SC_Admin: {
      id: "SCA001",
      name: "Phạm Thị Lan",
      email: "sc_admin@vinfast.com",
      role: "SC_Admin",
      department: "Service Center",
    },
    SC_Technician: {
      id: "SCT001",
      name: "Hoàng Văn Tài",
      email: "sc_tech@vinfast.com",
      role: "SC_Technician",
      department: "Service Center",
    },
  };

  const handleRoleSwitch = async (role) => {
    const testUser = testUsers[role];
    if (testUser) {
      // Simulate login với user mới
      await login({
        email: testUser.email,
        password: "password123",
      });
      setSelectedRole(role);
    }
  };

  const roleDescriptions = {
    EVM_Staff: {
      name: "EVM Staff - Nhân viên Nhà sản xuất",
      color: "#3c4de7",
      description:
        "Có quyền tạo recall, phân bổ xe, thông báo SC, xác nhận báo cáo",
      permissions: 7,
    },
    Admin: {
      name: "Admin - Quản trị hệ thống",
      color: "#dc2626",
      description: "Có tất cả quyền của EVM Staff + quyền quản trị hệ thống",
      permissions: 10,
    },
    SC_Staff: {
      name: "SC Staff - Nhân viên Trung tâm dịch vụ",
      color: "#059669",
      description: "Xem xe, xác nhận hẹn, phân công việc, ghi nhận báo cáo",
      permissions: 6,
    },
    SC_Admin: {
      name: "SC Admin - Quản lý Trung tâm dịch vụ",
      color: "#d97706",
      description: "Có tất cả quyền của SC Staff + quản lý nhân sự SC",
      permissions: 8,
    },
    SC_Technician: {
      name: "SC Technician - Kỹ thuật viên",
      color: "#7c3aed",
      description: "Chỉ có quyền cập nhật kết quả công việc được giao",
      permissions: 1,
    },
  };

  return (
    <div className="role-testing-page">
      <div className="page-header">
        <h1>🧪 Role Testing Environment</h1>
        <p>Test các chức năng theo từng role để kiểm tra hệ thống phân quyền</p>
      </div>

      <div className="role-switcher">
        <h3>Chuyển đổi Role để test:</h3>
        <div className="role-buttons">
          {Object.keys(testUsers).map((role) => {
            const roleInfo = roleDescriptions[role];
            const isActive = user?.role === role;

            return (
              <button
                key={role}
                className={`role-switch-btn ${isActive ? "active" : ""}`}
                style={{
                  backgroundColor: isActive ? roleInfo.color : "transparent",
                  borderColor: roleInfo.color,
                  color: isActive ? "white" : roleInfo.color,
                }}
                onClick={() => handleRoleSwitch(role)}
              >
                <div className="role-switch-content">
                  <div className="role-switch-name">{roleInfo.name}</div>
                  <div className="role-switch-permissions">
                    {roleInfo.permissions} quyền
                  </div>
                  <div className="role-switch-description">
                    {roleInfo.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="current-user-info">
        <div className="user-card">
          <div className="user-avatar-large">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="user-info-text">
            <h3>{user?.name}</h3>
            <p>{user?.email}</p>
            <p>{user?.department}</p>
          </div>
          <div className="role-indicator">
            <RolePermissionIndicator showDetails={false} />
          </div>
        </div>
      </div>

      <div className="testing-area">
        <RoleBasedFeatureDemo />
      </div>

      <div className="role-comparison">
        <h3>📊 So sánh quyền giữa các Role:</h3>
        <div className="comparison-table">
          <div className="table-header">
            <div className="feature-col">Chức năng</div>
            <div className="role-col">EVM Staff</div>
            <div className="role-col">Admin</div>
            <div className="role-col">SC Staff</div>
            <div className="role-col">SC Admin</div>
            <div className="role-col">SC Tech</div>
          </div>

          {[
            { feature: "Tạo recall", permissions: ["EVM_Staff", "Admin"] },
            { feature: "Cập nhật recall", permissions: ["EVM_Staff", "Admin"] },
            { feature: "Thông báo SC", permissions: ["EVM_Staff", "Admin"] },
            {
              feature: "Xem xe bị ảnh hưởng",
              permissions: ["EVM_Staff", "Admin", "SC_Staff", "SC_Admin"],
            },
            { feature: "Phân bổ xe", permissions: ["EVM_Staff", "Admin"] },
            { feature: "Xác nhận hẹn", permissions: ["SC_Staff", "SC_Admin"] },
            {
              feature: "Phân công việc",
              permissions: ["SC_Staff", "SC_Admin"],
            },
            {
              feature: "Reject chiến dịch",
              permissions: ["SC_Staff", "SC_Admin"],
            },
            {
              feature: "Ghi nhận báo cáo",
              permissions: ["SC_Staff", "SC_Admin"],
            },
            { feature: "Cập nhật kết quả", permissions: ["SC_Technician"] },
            {
              feature: "Xác nhận báo cáo hãng",
              permissions: ["EVM_Staff", "Admin"],
            },
            {
              feature: "Cập nhật trạng thái xe",
              permissions: ["EVM_Staff", "Admin"],
            },
          ].map((row, index) => (
            <div key={index} className="table-row">
              <div className="feature-col">{row.feature}</div>
              <div className="role-col">
                {row.permissions.includes("EVM_Staff") ? "✅" : "❌"}
              </div>
              <div className="role-col">
                {row.permissions.includes("Admin") ? "✅" : "❌"}
              </div>
              <div className="role-col">
                {row.permissions.includes("SC_Staff") ? "✅" : "❌"}
              </div>
              <div className="role-col">
                {row.permissions.includes("SC_Admin") ? "✅" : "❌"}
              </div>
              <div className="role-col">
                {row.permissions.includes("SC_Technician") ? "✅" : "❌"}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default RoleTestingPage;
