import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { LayoutDashboard, Car, Wrench, Package, Users, FileText, Megaphone, UserCircle } from "lucide-react";
import "../../styles/Sidebar.css";

function Sidebar() {
  const location = useLocation();
  const { user } = useAuth();

  const menuItems = [
    {
      path: "/",
      name: "Dashboard",
      icon: <LayoutDashboard size={20} />,
      roles: ["SC_STAFF", "SC_TECHNICAL", "SC_ADMIN", "EVM_STAFF", "EVM_ADMIN"],
    },
    {
      path: "/vehicles",
      name: "Quản lý xe",
      icon: <Car size={20} />,
      roles: ["SC_STAFF", "SC_TECHNICAL", "SC_ADMIN", "EVM_STAFF", "EVM_ADMIN"],
    },
    {
      path: "/warranty-claims",
      name: "Yêu cầu bảo hành",
      icon: <Wrench size={20} />,
      roles: ["SC_STAFF", "SC_TECHNICAL", "SC_ADMIN", "EVM_STAFF", "EVM_ADMIN"],
    },
    {
      path: "/parts",
      name: "Quản lý phụ tùng",
      icon: <Package size={20} />,
      roles: ["SC_STAFF", "SC_ADMIN", "EVM_STAFF", "EVM_ADMIN"],
    },
    {
      path: "/campaigns",
      name: "Chiến dịch & Recall",
      icon: <Megaphone size={20} />,
      roles: ["SC_STAFF", "SC_ADMIN", "EVM_STAFF", "EVM_ADMIN"],
    },
    {
      path: "/reports",
      name: "Báo cáo",
      icon: <FileText size={20} />,
      roles: ["SC_STAFF", "SC_ADMIN", "EVM_STAFF", "EVM_ADMIN"],
    },
    {
      path: "/users",
      name: "Quản lý người dùng",
      icon: <Users size={20} />,
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
