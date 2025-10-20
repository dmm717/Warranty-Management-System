/* ==========================================================================
   APPOINTMENT SCHEDULING SERVICE - Quản lí lịch hẹn và thời gian thực hiện
   ========================================================================== */

import apiService from './ApiService';

class AppointmentSchedulingService {
  // Tạo lịch hẹn cho chiến dịch
  async createCampaignSchedule(campaignId, distributionData, campaignType = 'recall') {
    try {
      const scheduleData = {
        campaignId,
        campaignType,
        distributionData
      };

      const response = await apiService.post('/schedules', scheduleData);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to create campaign schedule');
      }
      
      return {
        success: true,
        scheduleId: response.data.id,
        centerSchedules: response.data.centerSchedules,
        summary: response.data.summary
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Tạo lịch cho từng trung tâm
  async createCenterSchedule(distribution, campaignType) {
    try {
      const centerScheduleData = {
        distribution,
        campaignType
      };

      const response = await apiService.post('/schedules/centers', centerScheduleData);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to create center schedule');
      }
      
      return response.data;
    } catch (error) {
      throw new Error(`Error creating center schedule: ${error.message}`);
    }
  }

  // Xác nhận lịch hẹn từ Service Center
  async confirmCenterSchedule(scheduleId, centerId, confirmation) {
    try {
      const response = await apiService.put(`/schedules/${scheduleId}/centers/${centerId}/confirm`, confirmation);
      
      if (!response.success) {
        return { 
          success: false, 
          error: response.message || 'Failed to confirm center schedule' 
        };
      }
      
      return {
        success: true,
        message: 'Lịch hẹn đã được xác nhận thành công',
        centerSchedule: response.data.centerSchedule
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Gửi nhắc nhở lịch hẹn
  async sendAppointmentReminders(scheduleId, reminderType = 'day_before') {
    try {
      const reminderData = {
        scheduleId,
        reminderType
      };

      const response = await apiService.post(`/schedules/${scheduleId}/reminders`, reminderData);
      
      if (!response.success) {
        return { 
          success: false, 
          error: response.message || 'Failed to send appointment reminders' 
        };
      }
      
      return {
        success: true,
        remindersSent: response.data.remindersSent,
        reminders: response.data.reminders
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Cập nhật trạng thái lịch hẹn
  async updateAppointmentStatus(scheduleId, centerId, vehicleId, newStatus, note = '') {
    try {
      const updateData = {
        newStatus,
        note
      };

      const response = await apiService.put(
        `/schedules/${scheduleId}/centers/${centerId}/vehicles/${vehicleId}/status`, 
        updateData
      );
      
      if (!response.success) {
        return { 
          success: false, 
          error: response.message || 'Failed to update appointment status' 
        };
      }
      
      return {
        success: true,
        message: `Trạng thái lịch hẹn đã được cập nhật thành ${newStatus}`,
        vehicleSchedule: response.data.vehicleSchedule
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Lấy báo cáo lịch hẹn
  async getScheduleReport(scheduleId) {
    try {
      const response = await apiService.get(`/schedules/${scheduleId}/report`);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to get schedule report');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error getting schedule report:', error);
      return null;
    }
  }

  // Lấy slots khả dụng cho một trung tâm
  async getAvailableSlots(centerId) {
    try {
      const response = await apiService.get(`/centers/${centerId}/available-slots`);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to get available slots');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error getting available slots:', error);
      return [];
    }
  }

  // Tìm ngày khả dụng
  async findAvailableDates(centerId, daysNeeded) {
    try {
      const queryParams = `?daysNeeded=${daysNeeded}`;
      const response = await apiService.get(`/centers/${centerId}/available-dates${queryParams}`);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to find available dates');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error finding available dates:', error);
      return [];
    }
  }

  // Lấy tất cả lịch hẹn
  async getAllSchedules(filters = {}) {
    try {
      // Xây dựng query string từ filters
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value);
        }
      });

      const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
      const response = await apiService.get(`/schedules${query}`);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to get schedules');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error getting schedules:', error);
      return [];
    }
  }

  // Lấy một lịch hẹn cụ thể bằng ID
  async getScheduleById(scheduleId) {
    try {
      const response = await apiService.get(`/schedules/${scheduleId}`);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to get schedule');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error getting schedule:', error);
      return null;
    }
  }
}

// Tạo singleton instance
const appointmentSchedulingService = new AppointmentSchedulingService();
export default appointmentSchedulingService;