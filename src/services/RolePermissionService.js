/* ==========================================================================
   ROLE PERMISSION SERVICE - Quản lý quyền truy cập theo role
   ========================================================================== */

import apiService from "./ApiService";

class RolePermissionService {
  constructor() {
    // These maps will be populated from the API
    this.permissions = {};
    this.permissionDescriptions = {};

    // Set default permissions first
    this.setDefaultPermissions();

    // DON'T automatically load from API - will be called after login
    // this.initializePermissions();
  }

  // Initialize permissions from API
  async initializePermissions() {
    try {
      const response = await apiService.get("/permissions/roles");

      if (response.success) {
        this.permissions = response.data.permissions || {};
        this.permissionDescriptions = response.data.descriptions || {};
      }
    } catch (error) {
      // Keep default permissions if API fails
      console.error("Failed to load permissions from API:", error);
    }
  }

  // Set default permissions as fallback
  setDefaultPermissions() {
    // Default permissions for each role
    this.permissions = {
      // EVM Staff - Nhân viên nhà sản xuất
      EVM_Staff: [
        "create_recall",
        "update_recall",
        "notify_campaign_to_sc",
        "view_affected_vehicles",
        "distribute_vehicles_to_centers",
        "confirm_manufacturer_report",
        "update_campaign_status_per_vehicle",
        "assign_work_to_technician",
      ],

      // Admin - Quản trị hệ thống
      Admin: [
        "create_recall",
        "update_recall",
        "notify_campaign_to_sc",
        "view_affected_vehicles",
        "distribute_vehicles_to_centers",
        "confirm_manufacturer_report",
        "update_campaign_status_per_vehicle",
        "assign_work_to_technician",
        // Admin có thêm quyền quản trị
        "manage_users",
        "manage_system_settings",
        "view_all_data",
      ],

      // SC Staff - Nhân viên trung tâm dịch vụ
      SC_Staff: [
        "view_affected_vehicles",
        "send_notification_to_sc",
        "confirm_appointment_date",
        "reject_campaign",
      ],

      // SC Admin - Quản lý trung tâm dịch vụ
      SC_Admin: [
        "view_affected_vehicles",
        "send_notification_to_sc",
        "confirm_appointment_date",
        "assign_work_to_technician",
        "reject_campaign",
        "record_and_report",
        "update_report",
        "manage_sc_staff",
        "manage_sc_resources",
        "manage_sc_settings",
        "view_sc_reports",
        "approve_sc_report",
        "assign_sc_roles",
        "view_sc_data",
        "confirm_appointment_for_all",
        "distribute_work_in_sc",
        "audit_sc_activity",
        "manage_sc_inventory",
        "manage_sc_finance",
        "manage_sc_campaigns",
        "update_sc_status",
        "view_sc_technicians",
        "manage_sc_technicians",
        "create_sc_staff",
        "create_sc_technician",
      ],

      // SC Technician - Kỹ thuật viên
      SC_Technician: ["update_work_results"],
    };

    // Default permission descriptions
    this.permissionDescriptions = {
      create_recall: "Tạo recall",
      update_recall: "Cập nhật recall",
      notify_campaign_to_sc: "Thông báo chiến dịch recall cho SC",
      view_affected_vehicles: "Xem danh sách xe thuộc diện chiến dịch",
      distribute_vehicles_to_centers:
        "Phân bổ danh sách xe đến các trung tâm dịch vụ",
      send_notification_to_sc: "Gửi thông báo cho SC",
      confirm_appointment_date: "Xác nhận ngày hẹn",
      assign_work_to_technician: "Phân công việc cho Technician",
      reject_campaign: "Reject chiến dịch",
      record_and_report: "Ghi nhận và báo cáo",
      update_work_results: "Cập nhật kết quả xử lý lên hệ thống",
      confirm_manufacturer_report: "Xác nhận báo cáo của hãng",
      update_report: "Cập nhật báo cáo",
      update_campaign_status_per_vehicle:
        "Cập nhật trạng thái chiến dịch cho từng xe",
      manage_sc_staff: "Quản lý nhân sự trung tâm dịch vụ",
      manage_sc_resources: "Quản lý tài nguyên trung tâm dịch vụ",
      manage_sc_settings: "Quản lý cài đặt trung tâm",
      view_sc_reports: "Xem báo cáo trung tâm",
      approve_sc_report: "Phê duyệt báo cáo trung tâm",
      assign_sc_roles: "Phân quyền trong trung tâm",
      view_sc_data: "Xem dữ liệu trung tâm",
      confirm_appointment_for_all: "Xác nhận lịch hẹn cho toàn bộ trung tâm",
      distribute_work_in_sc: "Phân phối công việc trong trung tâm",
      audit_sc_activity: "Kiểm tra nhật ký hoạt động trung tâm",
      manage_sc_inventory: "Quản lý kho vật tư trung tâm",
      manage_sc_finance: "Quản lý tài chính trung tâm",
      manage_sc_campaigns: "Quản lý chiến dịch trung tâm",
      update_sc_status: "Cập nhật trạng thái trung tâm",
      view_sc_technicians: "Xem danh sách kỹ thuật viên trung tâm",
      manage_sc_technicians: "Quản lý kỹ thuật viên trung tâm",
      create_sc_staff: "Tạo tài khoản SC Staff",
      create_sc_technician: "Tạo tài khoản SC Technician",
    };
  }

  // Kiểm tra user có quyền thực hiện action không
  hasPermission(userRole, permission) {
    if (!userRole || !permission) return false;

    const rolePermissions = this.permissions[userRole];
    if (!rolePermissions) return false;

    return rolePermissions.includes(permission);
  }

  // Check permissions from API
  async checkPermission(userId, permission) {
    try {
      const response = await apiService.post("/permissions/check", {
        userId,
        permission,
      });

      return response.success ? response.data.hasPermission : false;
    } catch (error) {
      console.error("Error checking permission:", error);
      // Fall back to client-side check if API call fails
      const userRole = localStorage.getItem("userRole");
      return this.hasPermission(userRole, permission);
    }
  }

  // Lấy tất cả quyền của một role
  async getRolePermissions(userRole) {
    try {
      const response = await apiService.get(`/permissions/roles/${userRole}`);
      return response.success
        ? response.data.permissions
        : this.permissions[userRole] || [];
    } catch (error) {
      console.error("Error getting role permissions:", error);
      // Fall back to local permissions if API call fails
      return this.permissions[userRole] || [];
    }
  }

  // Kiểm tra nhiều quyền cùng lúc
  hasAnyPermission(userRole, permissionList) {
    return permissionList.some((permission) =>
      this.hasPermission(userRole, permission)
    );
  }

  // Kiểm tra tất cả quyền
  hasAllPermissions(userRole, permissionList) {
    return permissionList.every((permission) =>
      this.hasPermission(userRole, permission)
    );
  }

  // Lấy danh sách quyền với mô tả
  async getPermissionDescriptions(userRole) {
    try {
      const response = await apiService.get(
        `/permissions/descriptions/${userRole}`
      );

      if (response.success) {
        return response.data.permissions;
      } else {
        // Fall back to local implementation
        const rolePermissions = await this.getRolePermissions(userRole);
        return rolePermissions.map((permission) => ({
          permission,
          description: this.permissionDescriptions[permission] || permission,
        }));
      }
    } catch (error) {
      console.error("Error getting permission descriptions:", error);
      // Fall back to local implementation
      const rolePermissions = this.permissions[userRole] || [];
      return rolePermissions.map((permission) => ({
        permission,
        description: this.permissionDescriptions[permission] || permission,
      }));
    }
  }

  // Kiểm tra quyền cho các chức năng cụ thể
  canCreateRecall(userRole) {
    return this.hasPermission(userRole, "create_recall");
  }

  canUpdateRecall(userRole) {
    return this.hasPermission(userRole, "update_recall");
  }

  canNotifyCampaignToSC(userRole) {
    return this.hasPermission(userRole, "notify_campaign_to_sc");
  }

  canViewAffectedVehicles(userRole) {
    return this.hasPermission(userRole, "view_affected_vehicles");
  }

  canDistributeVehicles(userRole) {
    return this.hasPermission(userRole, "distribute_vehicles_to_centers");
  }

  canSendNotificationToSC(userRole) {
    return this.hasPermission(userRole, "send_notification_to_sc");
  }

  canConfirmAppointmentDate(userRole) {
    return this.hasPermission(userRole, "confirm_appointment_date");
  }

  canAssignWorkToTechnician(userRole) {
    return this.hasPermission(userRole, "assign_work_to_technician");
  }

  canRejectCampaign(userRole) {
    return this.hasPermission(userRole, "reject_campaign");
  }

  canRecordAndReport(userRole) {
    return this.hasPermission(userRole, "record_and_report");
  }

  canUpdateWorkResults(userRole) {
    return this.hasPermission(userRole, "update_work_results");
  }

  canConfirmManufacturerReport(userRole) {
    return this.hasPermission(userRole, "confirm_manufacturer_report");
  }

  canUpdateReport(userRole) {
    return this.hasPermission(userRole, "update_report");
  }

  canUpdateCampaignStatusPerVehicle(userRole) {
    return this.hasPermission(userRole, "update_campaign_status_per_vehicle");
  }

  // Lấy danh sách actions được phép cho một màn hình/component
  getAvailableActions(userRole, screen) {
    const screenActions = {
      campaign_list: [
        {
          action: "create_recall",
          label: "Tạo Recall",
          permission: "create_recall",
        },
        {
          action: "view_campaigns",
          label: "Xem Chiến dịch",
          permission: "view_affected_vehicles",
        },
      ],
      campaign_detail: [
        {
          action: "update_recall",
          label: "Cập nhật Recall",
          permission: "update_recall",
        },
        {
          action: "notify_sc",
          label: "Thông báo SC",
          permission: "notify_campaign_to_sc",
        },
        {
          action: "distribute_vehicles",
          label: "Phân bổ xe",
          permission: "distribute_vehicles_to_centers",
        },
        {
          action: "confirm_appointment",
          label: "Xác nhận hẹn",
          permission: "confirm_appointment_date",
        },
        {
          action: "assign_work",
          label: "Phân công việc",
          permission: "assign_work_to_technician",
        },
        {
          action: "reject_campaign",
          label: "Từ chối",
          permission: "reject_campaign",
        },
        {
          action: "update_results",
          label: "Cập nhật kết quả",
          permission: "update_work_results",
        },
        {
          action: "confirm_report",
          label: "Xác nhận báo cáo",
          permission: "confirm_manufacturer_report",
        },
      ],
      vehicle_management: [
        {
          action: "view_vehicles",
          label: "Xem danh sách xe",
          permission: "view_affected_vehicles",
        },
        {
          action: "update_status",
          label: "Cập nhật trạng thái",
          permission: "update_campaign_status_per_vehicle",
        },
      ],
      report_management: [
        {
          action: "create_report",
          label: "Tạo báo cáo",
          permission: "record_and_report",
        },
        {
          action: "update_report",
          label: "Cập nhật báo cáo",
          permission: "update_report",
        },
        {
          action: "confirm_report",
          label: "Xác nhận báo cáo",
          permission: "confirm_manufacturer_report",
        },
      ],
    };

    const actions = screenActions[screen] || [];
    return actions.filter((action) =>
      this.hasPermission(userRole, action.permission)
    );
  }

  // Kiểm tra quyền truy cập API endpoint
  async canAccessEndpoint(userRole, endpoint, method = "GET") {
    try {
      // Check with API first
      const response = await apiService.post("/permissions/endpoint-access", {
        userRole,
        endpoint,
        method,
      });

      if (response.success) {
        return response.data.hasAccess;
      }
    } catch (error) {
      console.error("Error checking endpoint access:", error);
    }

    // Fall back to local implementation if API call fails
    const endpointPermissions = {
      // Campaign/Recall endpoints
      "POST /api/campaigns": ["create_recall"],
      "PUT /api/campaigns/:id": ["update_recall"],
      "GET /api/campaigns": ["view_affected_vehicles"],
      "GET /api/campaigns/:id/vehicles": ["view_affected_vehicles"],

      // Distribution endpoints
      "POST /api/campaigns/:id/distribute": ["distribute_vehicles_to_centers"],
      "POST /api/campaigns/:id/notify": [
        "notify_campaign_to_sc",
        "send_notification_to_sc",
      ],

      // Appointment endpoints
      "POST /api/appointments": ["confirm_appointment_date"],
      "PUT /api/appointments/:id": ["confirm_appointment_date"],

      // Work assignment endpoints
      "POST /api/work-assignments": ["assign_work_to_technician"],
      "PUT /api/work-assignments/:id": ["assign_work_to_technician"],

      // Results endpoints
      "PUT /api/work-results/:id": ["update_work_results"],
      "POST /api/reports": ["record_and_report"],
      "PUT /api/reports/:id": ["update_report"],
      "POST /api/reports/:id/confirm": ["confirm_manufacturer_report"],

      // Campaign status endpoints
      "PUT /api/campaigns/:id/vehicles/:vehicleId/status": [
        "update_campaign_status_per_vehicle",
      ],
    };

    const key = `${method} ${endpoint}`;
    const requiredPermissions = endpointPermissions[key];

    if (!requiredPermissions) return true; // Endpoint không được định nghĩa -> cho phép

    return this.hasAnyPermission(userRole, requiredPermissions);
  }

  // Validate user action với error message
  async validateAction(userRole, permission, actionName) {
    try {
      // Check with API first
      const response = await apiService.post("/permissions/validate", {
        userRole,
        permission,
        actionName,
      });

      if (response.success) {
        return response.data;
      }
    } catch (error) {
      console.error("Error validating action:", error);
    }

    // Fall back to local implementation if API call fails
    if (!this.hasPermission(userRole, permission)) {
      return {
        allowed: false,
        error: `Bạn không có quyền ${
          this.permissionDescriptions[permission] || actionName
        }`,
        errorCode: "PERMISSION_DENIED",
      };
    }

    return { allowed: true };
  }

  // Log action cho audit trail
  async logAction(userRole, userId, action, resourceId = null, details = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      userRole,
      userId,
      action,
      resourceId,
      details,
    };

    try {
      // Send log to API
      const response = await apiService.post("/audit/log", logEntry);
      return response.success ? response.data : logEntry;
    } catch (error) {
      console.error("Error logging action:", error);
      // Just log locally if API fails
      return logEntry;
    }
  }

  // Lấy menu items dựa trên quyền
  async getMenuItems(userRole) {
    try {
      // Get menu items from API
      const response = await apiService.get("/permissions/menu-items", {
        params: { userRole },
      });

      if (response.success) {
        return response.data.menuItems;
      }
    } catch (error) {
      console.error("Error fetching menu items:", error);
    }

    // Fall back to local implementation if API call fails
    const menuItems = [
      {
        id: "dashboard",
        label: "Dashboard",
        icon: "📊",
        path: "/dashboard",
        requiredPermissions: ["view_affected_vehicles"],
      },
      {
        id: "campaigns",
        label: "Quản lý Chiến dịch",
        icon: "📋",
        path: "/campaigns",
        requiredPermissions: ["view_affected_vehicles"],
        children: [
          {
            id: "campaign-list",
            label: "Danh sách Chiến dịch",
            path: "/campaigns",
            requiredPermissions: ["view_affected_vehicles"],
          },
          {
            id: "create-campaign",
            label: "Tạo Recall",
            path: "/campaigns/create",
            requiredPermissions: ["create_recall"],
          },
        ],
      },
      {
        id: "vehicles",
        label: "Quản lý Xe",
        icon: "🚗",
        path: "/vehicles",
        requiredPermissions: ["view_affected_vehicles"],
      },
      {
        id: "appointments",
        label: "Lịch hẹn",
        icon: "📅",
        path: "/appointments",
        requiredPermissions: [
          "confirm_appointment_date",
          "view_affected_vehicles",
        ],
      },
      {
        id: "work-assignments",
        label: "Phân công việc",
        icon: "👥",
        path: "/work-assignments",
        requiredPermissions: [
          "assign_work_to_technician",
          "update_work_results",
        ],
      },
      {
        id: "reports",
        label: "Báo cáo",
        icon: "📊",
        path: "/reports",
        requiredPermissions: [
          "record_and_report",
          "update_report",
          "confirm_manufacturer_report",
        ],
      },
    ];

    // Filter menu items dựa trên quyền
    return this.filterMenuItems(menuItems, userRole);
  }

  filterMenuItems(items, userRole) {
    return items.filter((item) => {
      // Kiểm tra quyền của item chính
      const hasPermission =
        !item.requiredPermissions ||
        this.hasAnyPermission(userRole, item.requiredPermissions);

      if (!hasPermission) return false;

      // Filter children nếu có
      if (item.children) {
        item.children = this.filterMenuItems(item.children, userRole);
      }

      return true;
    });
  }

  // Check if user has permission to access feature
  async canAccessFeature(userId, featureName) {
    try {
      const response = await apiService.post("/permissions/feature-access", {
        userId,
        featureName,
      });

      return response.success ? response.data.hasAccess : false;
    } catch (error) {
      console.error("Error checking feature access:", error);
      // Fall back to role based check
      const userRole = localStorage.getItem("userRole");
      const featurePermissionMap = {
        campaigns: ["view_affected_vehicles"],
        "create-recall": ["create_recall"],
        "work-assignments": [
          "assign_work_to_technician",
          "update_work_results",
        ],
        reports: [
          "record_and_report",
          "update_report",
          "confirm_manufacturer_report",
        ],
      };

      const requiredPermissions = featurePermissionMap[featureName] || [];
      return this.hasAnyPermission(userRole, requiredPermissions);
    }
  }
}

// Tạo singleton instance
const rolePermissionService = new RolePermissionService();
export default rolePermissionService;
