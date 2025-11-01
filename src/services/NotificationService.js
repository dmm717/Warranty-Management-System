/* ==========================================================================
   NOTIFICATION SERVICE - Quản lý thông báo chiến dịch và recall
   ========================================================================== */

import apiService from "./ApiService";

class NotificationService {
  constructor() {
    // No need to store notifications locally - will use API endpoints
  }

  // Gửi thông báo chiến dịch cho Service Centers
  async sendCampaignNotification(campaignData, targetCenters = []) {
    try {
      const notificationData = {
        type: campaignData.type, // 'campaign' or 'recall'
        campaignId: campaignData.id,
        title: campaignData.title,
        message: this.buildNotificationMessage(campaignData),
        targetCenters,
        priority: campaignData.type === "recall" ? "high" : "normal",
      };

      // Send notification data to API
      const response = await apiService.post(
        "/notifications/campaign",
        notificationData
      );

      if (response.success) {
        return {
          success: true,
          notificationId: response.data.id,
          message: `Thông báo ${campaignData.type} đã được gửi đến ${targetCenters.length} trung tâm dịch vụ`,
        };
      } else {
        throw new Error(response.message || "Failed to send notification");
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Gửi thông báo yêu cầu bảo hành mới cho SC_ADMIN
  async sendWarrantyClaimNotification(claimData) {
    try {
      // Format data theo DTO của backend: WarrantyClaimNotificationRequest
      const notificationData = {
        claimId: claimData.claimId,
        customerName: claimData.customerName,
        branchOffice: claimData.branchOffice,
        createdBy: claimData.createdBy || "SC_STAFF",
        priority: claimData.priority || "normal",
      };

      // Send notification data to API
      const response = await apiService.post(
        "/notifications/warranty-claim",
        notificationData
      );

      if (response.success) {
        return {
          success: true,
          notificationId: response.data?.id,
          message: "Thông báo đã được gửi đến SC_ADMIN",
        };
      } else {
        throw new Error(response.message || "Failed to send notification");
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Gửi thông báo khẩn cấp cho recall
  async sendUrgentRecallNotification(recallData) {
    try {
      const urgentNotificationData = {
        type: "urgent_recall",
        campaignId: recallData.id,
        title: `🚨 RECALL KHẨN CẤP: ${recallData.title}`,
        message: `Recall khẩn cấp cần được xử lý ngay lập tức. ${recallData.description}`,
        targetCenters: "all", // Gửi cho tất cả trung tâm
        priority: "urgent",
      };

      // Send urgent notification to API
      const response = await apiService.post(
        "/notifications/urgent",
        urgentNotificationData
      );

      if (response.success) {
        return {
          success: true,
          notificationId: response.data.id,
          message:
            "Thông báo khẩn cấp đã được gửi đến tất cả trung tâm dịch vụ",
        };
      } else {
        throw new Error(
          response.message || "Failed to send urgent notification"
        );
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Xác nhận nhận thông báo từ Service Center
  async confirmNotificationReceived(notificationId, centerId, response) {
    try {
      const confirmationData = {
        notificationId,
        centerId,
        response: response || "acknowledged",
      };

      const result = await apiService.post(
        "/notifications/confirm",
        confirmationData
      );
      return result;
    } catch (error) {
      return {
        success: false,
        error: error.message || "Failed to confirm notification",
      };
    }
  }

  // Lấy danh sách thông báo
  async getNotifications(filters = {}) {
    try {
      const result = await apiService.get("/notifications", {
        params: filters,
      });

      return result.success ? result.data : [];
    } catch {
      return [];
    }
  }

  // Build notification message
  buildNotificationMessage(campaignData) {
    const isRecall = campaignData.type === "recall";

    if (isRecall) {
      return `
THÔNG BÁO RECALL: ${campaignData.title}

Vấn đề: ${campaignData.issue}
Số xe bị ảnh hưởng: ${campaignData.affectedVehicles || 0}
Hành động yêu cầu: ${campaignData.requiredAction}
Phụ tùng cần thiết: ${campaignData.partsRequired}

Vui lòng liên hệ ngay để nhận danh sách xe và lên kế hoạch xử lý.
Mức độ ưu tiên: ${campaignData.priority || "Cao"}
      `.trim();
    } else {
      return `
THÔNG BÁO CHIẾN DỊCH DỊCH VỤ: ${campaignData.title}

Mô tả: ${campaignData.description}
Thời gian: ${campaignData.startDate} - ${campaignData.endDate}
Số xe dự kiến: ${campaignData.affectedVehicles || 0}
Yêu cầu: ${campaignData.requirements || "Xem chi tiết trong hệ thống"}

Vui lòng chuẩn bị nguồn lực và lên kế hoạch thực hiện.
      `.trim();
    }
  }

  // Lấy danh sách trung tâm dịch vụ
  async getServiceCenters() {
    try {
      const response = await apiService.get("/service-centers");
      return response.success ? response.data : [];
    } catch {
      return [];
    }
  }

  // Lấy chi tiết thông báo theo ID
  async getNotificationById(id) {
    try {
      const response = await apiService.get(`/notifications/${id}`);
      return response.success ? response.data : null;
    } catch {
      return null;
    }
  }
}

// Tạo singleton instance
const notificationService = new NotificationService();
export default notificationService;
