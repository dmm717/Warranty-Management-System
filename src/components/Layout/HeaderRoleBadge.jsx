import React from "react";
import "./HeaderRoleBadge.css";
import rolePermissionService from "../../services/RolePermissionService";
import { useAuth } from "../../contexts/AuthContext";

function HeaderRoleBadge({ onClick }) {
  const { user } = useAuth();

  if (!user) return null;

  const roleColors = {
    EVM_Staff: "#3c4de7",
    Admin: "#dc2626",
    SC_Staff: "#059669",
    SC_Admin: "#d97706",
    SC_Technician: "#7c3aed",
  };

  const roleShortNames = {
    EVM_Staff: "EVM",
    Admin: "ADM",
    SC_Staff: "SC",
    SC_Admin: "SC+",
    SC_Technician: "TECH",
  };

  const roleDescriptions = {
    EVM_Staff: "Nhân viên Nhà sản xuất",
    Admin: "Quản trị hệ thống",
    SC_Staff: "Nhân viên Trung tâm dịch vụ",
    SC_Admin: "Quản lý Trung tâm dịch vụ",
    SC_Technician: "Kỹ thuật viên",
  };

  return (
    <div
      className="header-role-badge"
      style={{ backgroundColor: roleColors[user.role] }}
      onClick={onClick}
      title={`${roleDescriptions[user.role]} - Click để xem quyền`}
    >
      <div className="role-short">{roleShortNames[user.role]}</div>
    </div>
  );
}

export default HeaderRoleBadge;
