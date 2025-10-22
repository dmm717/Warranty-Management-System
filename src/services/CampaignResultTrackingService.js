

import apiService from './ApiService';

class CampaignResultTrackingService {
  // Bắt đầu theo dõi chiến dịch
  async initializeCampaignTracking(campaignId, assignmentData, scheduleData) {
    try {
      const response = await apiService.post('/api/campaigns/tracking/initialize', {
        campaignId,
        assignmentData,
        scheduleData
      });
      return response;
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to initialize campaign tracking'
      };
    }
  }

  // Cập nhật kết quả công việc
  async updateWorkOrderResult(trackingId, workOrderId, resultData) {
    try {
      const response = await apiService.put(`/api/campaigns/tracking/${trackingId}/workorders/${workOrderId}`, resultData);
      return response;
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to update work order result'
      };
    }
  }

  // Bắt đầu công việc
  async startWorkOrder(trackingId, workOrderId, technicianId) {
    try {
      const response = await apiService.put(`/api/campaigns/tracking/${trackingId}/workorders/${workOrderId}/start`, {
        technicianId
      });
      return response;
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to start work order'
      };
    }
  }

  // Lấy báo cáo tiến độ chiến dịch
  async getCampaignProgressReport(trackingId) {
    try {
      const response = await apiService.get(`/api/campaigns/tracking/${trackingId}/progress`);
      return response;
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to get campaign progress report'
      };
    }
  }

  // Lấy báo cáo chi tiết theo trung tâm
  async getCenterDetailReport(trackingId, centerId) {
    try {
      const response = await apiService.get(`/api/campaigns/tracking/${trackingId}/centers/${centerId}`);
      return response;
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to get center detail report'
      };
    }
  }

  // Tạo báo cáo cuối chiến dịch
  async generateFinalCampaignReport(trackingId) {
    try {
      const response = await apiService.get(`/api/campaigns/tracking/${trackingId}/final-report`);
      return response;
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to generate final campaign report'
      };
    }
  }

  // Lấy thông tin tiến độ theo ngày
  async getDailyProgress(trackingId) {
    try {
      const response = await apiService.get(`/api/campaigns/tracking/${trackingId}/daily-progress`);
      return response;
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to get daily progress'
      };
    }
  }

  // Lấy thông tin hiệu suất kỹ thuật viên
  async getTechnicianPerformance(trackingId) {
    try {
      const response = await apiService.get(`/api/campaigns/tracking/${trackingId}/technician-performance`);
      return response;
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to get technician performance'
      };
    }
  }

  // Lấy các vấn đề phổ biến
  async getCommonIssues(trackingId) {
    try {
      const response = await apiService.get(`/api/campaigns/tracking/${trackingId}/common-issues`);
      return response;
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to get common issues'
      };
    }
  }

  // Lấy phân phối mức độ hài lòng
  async getSatisfactionDistribution(trackingId) {
    try {
      const response = await apiService.get(`/api/campaigns/tracking/${trackingId}/satisfaction-distribution`);
      return response;
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to get satisfaction distribution'
      };
    }
  }

  // Tạo đề xuất cải thiện
  async generateRecommendations(trackingId) {
    try {
      const response = await apiService.get(`/api/campaigns/tracking/${trackingId}/recommendations`);
      return response;
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to generate recommendations'
      };
    }
  }
}

// Tạo singleton instance
const campaignResultTrackingService = new CampaignResultTrackingService();
export default campaignResultTrackingService;