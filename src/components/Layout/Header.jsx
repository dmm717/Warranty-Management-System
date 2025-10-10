import React from "react";
import { useAuth } from "../../contexts/AuthContext";
import "./Header.css";

function Header() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="header">
      <div className="header-left">
        <img
          src="/api/placeholder/150/40"
          alt="VinFast Logo"
          className="header-logo"
        />
        <h1>Hệ thống quản lý bảo hành</h1>
      </div>

      <div className="header-right">
        <div className="user-info">
          <div className="user-avatar">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="user-details">
            <span className="user-name">{user?.name}</span>
            <span className="user-role">{user?.role}</span>
          </div>
        </div>

        <button onClick={handleLogout} className="btn btn-outline logout-btn">
          Đăng xuất
        </button>
      </div>
    </header>
  );
}

export default Header;
