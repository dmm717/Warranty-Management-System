import React from "react";
import "./RolePermissionIndicator.css";
import rolePermissionService from "../../services/RolePermissionService";
import { useAuth } from "../../contexts/AuthContext";

function RolePermissionIndicator({
  showDetails = false,
  showPermissionCount = true,
  showRoleOnly = false,
}) {
  const { user } = useAuth();

  if (!user) return null;

  const userPermissions = rolePermissionService.getPermissionDescriptions(
    user.role
  );
  const roleColors = {
    EVM_Staff: "#3c4de7",
    Admin: "#dc2626",
    SC_Staff: "#059669",
    SC_Admin: "#d97706",
    SC_Technician: "#7c3aed",
  };

  const roleDescriptions = {
    EVM_Staff: "Nhân viên Nhà sản xuất",
    Admin: "Quản trị hệ thống",
    SC_Staff: "Nhân viên Trung tâm dịch vụ",
    SC_Admin: "Quản lý Trung tâm dịch vụ",
    SC_Technician: "Kỹ thuật viên",
  };

  return (
    <div className="role-permission-indicator">
      <div
        className="role-badge"
        style={{ backgroundColor: roleColors[user.role] }}
      >
        <div className="role-info">
          <div className="role-name">{roleDescriptions[user.role]}</div>
          {!showRoleOnly && <div className="user-name">{user.name}</div>}
        </div>
        {showPermissionCount && (
          <div className="permission-count">{userPermissions.length} quyền</div>
        )}
      </div>

      {showDetails && (
        <div className="permissions-detail">
          <h4>Quyền truy cập:</h4>
          <div className="permissions-list">
            {userPermissions.map((perm, index) => (
              <div key={index} className="permission-item">
                <span className="permission-icon">✓</span>
                <span className="permission-text">{perm.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default RolePermissionIndicator;
