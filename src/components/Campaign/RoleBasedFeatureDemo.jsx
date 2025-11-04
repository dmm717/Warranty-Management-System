import React, { useState } from "react";
import "./RoleBasedFeatureDemo.css";
import rolePermissionService from "../../services/RolePermissionService";
import { useAuth } from "../../contexts/AuthContext";
import { 
  Wrench, Car, Package, Megaphone, FileText, 
  Edit, Mail, MapPin, Calendar, Users, 
  X, BarChart3, Check, RefreshCw 
} from "lucide-react";

function RoleBasedFeatureDemo() {
  const { user } = useAuth();
  const [selectedFeature, setSelectedFeature] = useState(null);

  const features = [
    {
      id: "create_recall",
      name: "Tạo recall",
      description: "Tạo chiến dịch recall mới",
      roles: ["EVM_Staff", "Admin"],
      icon: <FileText size={24} />,
    },
    {
      id: "update_recall",
      name: "Cập nhật recall",
      description: "Chỉnh sửa thông tin recall",
      roles: ["EVM_Staff", "Admin"],
      icon: <Edit size={24} />,
    },
    {
      id: "notify_campaign_to_sc",
      name: "Thông báo chiến dịch recall cho SC",
      description: "Gửi thông báo đến service center",
      roles: ["EVM_Staff", "Admin"],
      icon: <Mail size={24} />,
    },
    {
      id: "view_affected_vehicles",
      name: "Xem danh sách xe thuộc diện chiến dịch",
      description: "Truy cập danh sách xe bị ảnh hưởng",
      roles: ["SC_Staff", "SC_Admin", "EVM_Staff", "Admin"],
      icon: <Car size={24} />,
    },
    {
      id: "distribute_vehicles_to_centers",
      name: "Phân bổ danh sách xe đến các trung tâm dịch vụ",
      description: "Phân chia xe theo địa lý và công suất",
      roles: ["EVM_Staff", "Admin"],
      icon: <MapPin size={24} />,
    },
    {
      id: "send_notification_to_sc",
      name: "Gửi thông báo cho SC",
      description: "SC gửi thông báo nội bộ",
      roles: ["SC_Staff", "SC_Admin"],
      icon: <Megaphone size={24} />,
    },
    {
      id: "confirm_appointment_date",
      name: "Xác nhận ngày hẹn",
      description: "Xác nhận lịch hẹn với khách hàng",
      roles: ["SC_Staff", "SC_Admin"],
      icon: <Calendar size={24} />,
    },
    {
      id: "assign_work_to_technician",
      name: "Phân công việc cho Technician",
      description: "Giao việc cho kỹ thuật viên",
      roles: ["SC_Staff", "SC_Admin"],
      icon: <Users size={24} />,
    },
    {
      id: "reject_campaign",
      name: "Reject chiến dịch",
      description: "Từ chối thực hiện chiến dịch",
      roles: ["SC_Staff", "SC_Admin"],
      icon: <X size={24} />,
    },
    {
      id: "record_and_report",
      name: "Ghi nhận và báo cáo",
      description: "Tạo báo cáo thực hiện",
      roles: ["SC_Staff", "SC_Admin"],
      icon: <BarChart3 size={24} />,
    },
    {
      id: "update_work_results",
      name: "Cập nhật kết quả xử lý lên hệ thống",
      description: "Technician cập nhật kết quả công việc",
      roles: ["SC_Technician"],
      icon: <Wrench size={24} />,
    },
    {
      id: "confirm_manufacturer_report",
      name: "Xác nhận báo cáo của hãng",
      description: "EVM xác nhận báo cáo từ SC",
      roles: ["EVM_Staff", "Admin"],
      icon: <Check size={24} />,
    },
    {
      id: "update_report",
      name: "Cập nhật báo cáo",
      description: "SC cập nhật báo cáo",
      roles: ["SC_Staff", "SC_Admin"],
      icon: <FileText size={24} />,
    },
    {
      id: "update_campaign_status_per_vehicle",
      name: "Cập nhật trạng thái chiến dịch cho từng xe",
      description: "Cập nhật status từng xe",
      roles: ["EVM_Staff", "Admin"],
      icon: <RefreshCw size={24} />,
    },
  ];

  const canAccess = (feature) => {
    return rolePermissionService.hasPermission(user?.role, feature.id);
  };

  const getRoleColor = (role) => {
    const colors = {
      EVM_Staff: "#3c4de7",
      Admin: "#dc2626",
      SC_Staff: "#059669",
      SC_Admin: "#d97706",
      SC_Technician: "#7c3aed",
    };
    return colors[role] || "#6b7280";
  };

  const handleFeatureClick = (feature) => {
    if (canAccess(feature)) {
      setSelectedFeature(feature);
      // Simulate action
      setTimeout(() => {
        setSelectedFeature(null);
      }, 2000);
    }
  };

  return (
    <div className="role-feature-demo">
      <div className="demo-header">
        <h2>🔐 Demo chức năng theo Role</h2>
        <p>Click vào các chức năng để test quyền truy cập theo role của bạn</p>
      </div>

      <div className="current-role">
        <span>Role hiện tại: </span>
        <span
          className="role-badge-small"
          style={{ backgroundColor: getRoleColor(user?.role) }}
        >
          {user?.role}
        </span>
      </div>

      <div className="features-grid">
        {features.map((feature) => {
          const hasAccess = canAccess(feature);
          return (
            <div
              key={feature.id}
              className={`feature-card ${
                hasAccess ? "accessible" : "restricted"
              } ${selectedFeature?.id === feature.id ? "executing" : ""}`}
              onClick={() => handleFeatureClick(feature)}
            >
              <div className="feature-icon">{feature.icon}</div>

              <div className="feature-content">
                <div className="feature-name">{feature.name}</div>
                <div className="feature-description">{feature.description}</div>

                <div className="feature-roles">
                  <span className="roles-label">Roles:</span>
                  <div className="roles-list">
                    {feature.roles.map((role) => (
                      <span
                        key={role}
                        className={`role-tag ${
                          user?.role === role ? "current" : ""
                        }`}
                        style={{
                          backgroundColor: getRoleColor(role),
                          opacity: user?.role === role ? 1 : 0.6,
                        }}
                      >
                        {role}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="access-indicator">
                {hasAccess ? (
                  <span className="access-granted">✅</span>
                ) : (
                  <span className="access-denied">🚫</span>
                )}
              </div>

              {selectedFeature?.id === feature.id && (
                <div className="execution-overlay">
                  <div className="execution-spinner">⚙️</div>
                  <div className="execution-text">Đang thực hiện...</div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="demo-legend">
        <div className="legend-item">
          <span className="legend-icon">✅</span>
          <span>Có quyền truy cập</span>
        </div>
        <div className="legend-item">
          <span className="legend-icon">🚫</span>
          <span>Không có quyền</span>
        </div>
        <div className="legend-item">
          <span className="legend-icon">⚙️</span>
          <span>Đang thực hiện</span>
        </div>
      </div>
    </div>
  );
}

export default RoleBasedFeatureDemo;
