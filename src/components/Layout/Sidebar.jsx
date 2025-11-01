import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import "../../styles/Sidebar.css";

function Sidebar() {
  const location = useLocation();
  const { user } = useAuth();

  // Xác định tên Dashboard dựa trên role và branchOffice
  const getDashboardName = () => {
    if (user?.role === "SC_ADMIN" && user?.branchOffice) {
      return `Trung tâm ${user.branchOffice}`;
    }
    return "Dashboard";
  };

  const menuItems = [
    {
      path: "/",
      name: getDashboardName(),
      icon: "📊",
      roles: ["SC_STAFF", "SC_TECHNICAL", "SC_ADMIN", "EVM_STAFF", "EVM_ADMIN"],
    },
    {
      path: "/vehicles",
      name: "Quản lý xe",
      icon: "🚗",
      roles: ["SC_STAFF", "SC_TECHNICAL", "SC_ADMIN", "EVM_ADMIN"],
    },
    {
      path: "/warranty-claims",
      name: "Yêu cầu bảo hành",
      icon: "🔧",
      roles: ["SC_STAFF", "SC_TECHNICAL", "SC_ADMIN", "EVM_STAFF", "EVM_ADMIN"],
    },
    {
      path: "/parts",
      name: "Quản lý phụ tùng",
      icon: "⚙️",
      roles: ["SC_STAFF", "SC_ADMIN", "EVM_STAFF", "EVM_ADMIN"],
    },
    {
      path: "/campaigns",
      name: "Chiến dịch & Recall",
      icon: "📢",
      roles: ["SC_STAFF", "SC_ADMIN", "EVM_STAFF", "EVM_ADMIN"],
    },
    {
      path: "/reports",
      name: "Báo cáo",
      icon: "📈",
      roles: ["SC_STAFF", "SC_ADMIN", "EVM_STAFF", "EVM_ADMIN"],
    },
    {
      path: "/users",
      name: "Quản lý người dùng",
      icon: "👥",
      roles: ["SC_ADMIN", "EVM_ADMIN"],
    },
  ];

  const filteredMenuItems = menuItems.filter((item) =>
    item.roles.includes(user?.role)
  );

  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        <ul className="nav-list">
          {filteredMenuItems.map((item) => (
            <li key={item.path} className="nav-item">
              <Link
                to={item.path}
                className={`nav-link ${
                  location.pathname === item.path ? "active" : ""
                }`}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-text">{item.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}

export default Sidebar;
