import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { Check, Wrench, Package, AlertTriangle, Megaphone, Bell } from 'lucide-react';
import { useNavigate } from "react-router-dom";
import { notificationAPI } from "../../services/api";
import "./NotificationBell.css";

function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const fetchUnreadNotifications = async () => {
    if (!user?.id) {
      return;
    }

    try {
      const response = await notificationAPI.getUnreadNotifications(user.id);

      if (response.success && response.data) {
        setNotifications(response.data);
        setUnreadCount(response.data.length);
      }
    } catch {
      // Silent fail for notification fetching
    }
  };

  useEffect(() => {
    if (user && user.role !== "SC_TECHNICAL") {
      fetchUnreadNotifications();
      // Poll every 30 seconds
      const interval = setInterval(fetchUnreadNotifications, 30000);
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    // Close dropdown when clicking outside
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Don't show notification bell for SC_TECHNICAL
  if (!user || user.role === "SC_TECHNICAL") {
    return null;
  }

  const handleBellClick = () => {
    setShowDropdown(!showDropdown);
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      const response = await notificationAPI.markAsRead(notificationId);

      if (response.success) {
        // Remove from unread list
        setNotifications(notifications.filter((n) => n.id !== notificationId));
        setUnreadCount(Math.max(0, unreadCount - 1));
      }
    } catch {
      // Silent fail
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user?.id || notifications.length === 0) return;

    try {
      setLoading(true);
      const response = await notificationAPI.markAllAsRead(user.id);

      if (response.success) {
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  };

  const getNotificationIcon = (type) => {
    const icons = {
      WARRANTY_CLAIM: "🔧",
      WARRANTY_CLAIM_APPROVED: "✅",
      WARRANTY_CLAIM_REJECTED: "❌",
      PARTS_REQUEST: "📦",
      PARTS_REQUEST_APPROVED: "✅",
      PARTS_REQUEST_REJECTED: "❌",
      RECALL: "🚨",
      SERVICE_CAMPAIGN: "📢",
    };
    return icons[type] || "🔔";
  };

  const handleNotificationClick = async (notification) => {
    try {
      // Đánh dấu đã đọc
      await handleMarkAsRead(notification.id);

      // Navigate dựa vào type
      if (
        notification.type === "WARRANTY_CLAIM" ||
        notification.type === "WARRANTY_CLAIM_APPROVED" ||
        notification.type === "WARRANTY_CLAIM_REJECTED"
      ) {
        // Navigate đến trang warranty claims với claimId
        navigate("/warranty-claims", {
          state: {
            highlightClaimId: notification.relatedEntityId,
            fromNotification: true,
          },
        });
      } else if (
        notification.type === "PARTS_REQUEST" ||
        notification.type === "PARTS_REQUEST_APPROVED" ||
        notification.type === "PARTS_REQUEST_REJECTED"
      ) {
        // Navigate đến trang parts management với requestId
        navigate("/parts", {
          state: {
            highlightRequestId: notification.relatedEntityId,
            fromNotification: true,
            activeTab: "requests", // Tự động chuyển sang tab requests
          },
        });
      }

      // Đóng dropdown
      setShowDropdown(false);
    } catch {
      // Silent fail
    }
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Vừa xong";
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return date.toLocaleDateString("vi-VN");
  };

  return (
    <div className="notification-bell-container" ref={dropdownRef}>
      <button className="notification-bell-button" onClick={handleBellClick}>
        <Bell size={20} className="bell-icon" />
        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h4>Thông báo</h4>
            {notifications.length > 0 && (
              <button
                className="mark-all-read-btn"
                onClick={handleMarkAllAsRead}
                disabled={loading}
              >
                Đánh dấu tất cả đã đọc
              </button>
            )}
          </div>

          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="no-notifications">
                <Check size={48} className="no-notif-icon" />
                <p>Không có thông báo mới</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="notification-item"
                  onClick={() => handleNotificationClick(notification)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="notif-icon">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="notif-content">
                    <h5 className="notif-title">{notification.title}</h5>
                    <p className="notif-message">{notification.message}</p>
                    <span className="notif-time">
                      {formatTimeAgo(notification.createdAt)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="notification-footer">
              <a href="/notifications" className="view-all-link">
                Xem tất cả thông báo
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
