/* ==========================================================================
   NOTIFICATION SERVICE - Quản lý thông báo chiến dịch và recall
   ========================================================================== */

class NotificationService {
  constructor() {
    this.notifications = [];
  }

  // Gửi thông báo chiến dịch/recall cho Service Centers
  async sendCampaignNotification(campaignData, targetCenters = []) {
    try {
      const notification = {
        id: this.generateId(),
        type: campaignData.type, // 'campaign' or 'recall'
        campaignId: campaignData.id,
        title: campaignData.title,
        message: this.buildNotificationMessage(campaignData),
        targetCenters,
        status: 'pending',
        createdAt: new Date().toISOString(),
        sentAt: null,
        priority: campaignData.type === 'recall' ? 'high' : 'normal'
      };

      // Simulate API call to notification service
      await this.simulateApiCall(1000);
      
      notification.status = 'sent';
      notification.sentAt = new Date().toISOString();
      
      this.notifications.push(notification);
      
      return {
        success: true,
        notificationId: notification.id,
        message: `Thông báo ${campaignData.type} đã được gửi đến ${targetCenters.length} trung tâm dịch vụ`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Gửi thông báo khẩn cấp cho recall
  async sendUrgentRecallNotification(recallData) {
    try {
      const urgentNotification = {
        id: this.generateId(),
        type: 'urgent_recall',
        campaignId: recallData.id,
        title: `🚨 RECALL KHẨN CẤP: ${recallData.title}`,
        message: `Recall khẩn cấp cần được xử lý ngay lập tức. ${recallData.description}`,
        targetCenters: 'all', // Gửi cho tất cả trung tâm
        status: 'sent',
        createdAt: new Date().toISOString(),
        sentAt: new Date().toISOString(),
        priority: 'urgent'
      };

      this.notifications.push(urgentNotification);
      
      return {
        success: true,
        notificationId: urgentNotification.id,
        message: 'Thông báo khẩn cấp đã được gửi đến tất cả trung tâm dịch vụ'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Xác nhận nhận thông báo từ Service Center
  async confirmNotificationReceived(notificationId, centerId, response) {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      if (!notification.confirmations) {
        notification.confirmations = [];
      }
      
      notification.confirmations.push({
        centerId,
        confirmedAt: new Date().toISOString(),
        response: response || 'acknowledged'
      });
      
      return { success: true };
    }
    return { success: false, error: 'Notification not found' };
  }

  // Lấy danh sách thông báo
  getNotifications(filters = {}) {
    let filtered = [...this.notifications];
    
    if (filters.type) {
      filtered = filtered.filter(n => n.type === filters.type);
    }
    
    if (filters.status) {
      filtered = filtered.filter(n => n.status === filters.status);
    }
    
    if (filters.priority) {
      filtered = filtered.filter(n => n.priority === filters.priority);
    }
    
    return filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  // Build notification message
  buildNotificationMessage(campaignData) {
    const isRecall = campaignData.type === 'recall';
    
    if (isRecall) {
      return `
THÔNG BÁO RECALL: ${campaignData.title}

Vấn đề: ${campaignData.issue}
Số xe bị ảnh hưởng: ${campaignData.affectedVehicles || 0}
Hành động yêu cầu: ${campaignData.requiredAction}
Phụ tùng cần thiết: ${campaignData.partsRequired}

Vui lòng liên hệ ngay để nhận danh sách xe và lên kế hoạch xử lý.
Mức độ ưu tiên: ${campaignData.priority || 'Cao'}
      `.trim();
    } else {
      return `
THÔNG BÁO CHIẾN DỊCH DỊCH VỤ: ${campaignData.title}

Mô tả: ${campaignData.description}
Thời gian: ${campaignData.startDate} - ${campaignData.endDate}
Số xe dự kiến: ${campaignData.affectedVehicles || 0}
Yêu cầu: ${campaignData.requirements || 'Xem chi tiết trong hệ thống'}

Vui lòng chuẩn bị nguồn lực và lên kế hoạch thực hiện.
      `.trim();
    }
  }

  // Utility methods
  generateId() {
    return 'NTF' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }

  async simulateApiCall(delay = 500) {
    return new Promise(resolve => setTimeout(resolve, delay));
  }

  // Mock Service Centers data
  getServiceCenters() {
    return [
      { id: 'SC001', name: 'VinFast Hà Nội', location: 'Hà Nội', capacity: 50 },
      { id: 'SC002', name: 'VinFast TP.HCM', location: 'TP.HCM', capacity: 80 },
      { id: 'SC003', name: 'VinFast Đà Nẵng', location: 'Đà Nẵng', capacity: 30 },
      { id: 'SC004', name: 'VinFast Hải Phòng', location: 'Hải Phòng', capacity: 25 },
      { id: 'SC005', name: 'VinFast Cần Thơ', location: 'Cần Thơ', capacity: 35 }
    ];
  }
}

// Tạo singleton instance
const notificationService = new NotificationService();
export default notificationService;