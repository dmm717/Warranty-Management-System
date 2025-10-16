import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import "./Sidebar.css";

function Sidebar() {
  const location = useLocation();
  const { user } = useAuth();

  const menuItems = [
    {
      path: "/",
      name: "Dashboard",
      icon: "📊",
      roles: ["SC_Staff", "SC_Technician", "EVM_Staff", "Admin"],
    },
    {
      path: "/vehicles",
      name: "Quản lý xe",
      icon: "🚗",
      roles: ["SC_Staff", "SC_Technician", "EVM_Staff", "Admin"],
    },
    {
      path: "/warranty-claims",
      name: "Yêu cầu bảo hành",
      icon: "🔧",
      roles: ["SC_Staff", "SC_Technician", "EVM_Staff", "Admin"],
    },
    {
      path: "/parts",
      name: "Quản lý phụ tùng",
      icon: "⚙️",
      roles: ["SC_Staff", "EVM_Staff", "Admin"],
    },
    {
      path: "/campaigns",
      name: "Chiến dịch & Recall",
      icon: "📢",
      roles: ["SC_Staff", "EVM_Staff", "Admin"],
    },
    {
      path: "/reports",
      name: "Báo cáo",
      icon: "📈",
      roles: ["SC_Staff", "EVM_Staff", "Admin"],
    },
    
    {
      path: "/users",
      name: "Quản lý người dùng",
      icon: "👥",
      roles: ["Admin"],
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
                className={`nav-link ${location.pathname === item.path ? "active" : ""
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
