import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import vinLogo from "../../assets/Vin.jfif";
import "../../styles/Header.css";

function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  
  const handleLogout = () => {
    logout();
  };
  
  const handleProfileClick = () => {
    navigate("/profile");
    setShowDropdown(false);
  };

  return (
    <header className="header">
      <div className="header-left">
        <img
          src={vinLogo}
          alt="VinFast Logo"
          className="header-logo"
        />
        <h1>Hệ thống quản lý bảo hành</h1>
      </div>

      <div className="header-right">
        <div className="user-info" onClick={() => setShowDropdown(!showDropdown)}>
          <div className="user-avatar">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="user-details">
            <span className="user-name">{user?.name}</span>
            <span className="user-email">{user?.email}</span>
          </div>
          
          {showDropdown && (
            <div className="user-dropdown">
              <div className="dropdown-item" onClick={handleProfileClick}>
                <i className="fas fa-user"></i> Thông tin cá nhân
              </div>
              <div className="dropdown-item" onClick={handleLogout}>
                <i className="fas fa-sign-out-alt"></i> Đăng xuất
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
