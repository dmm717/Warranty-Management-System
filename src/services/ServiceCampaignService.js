/* ==========================================================================
   SERVICE CAMPAIGN SERVICE - Xử lý các API liên quan đến chiến dịch dịch vụ
   ========================================================================== */

import { serviceCampaignAPI } from './api';

class ServiceCampaignService {
  /**
   * Tạo campaign mới
   * @param {object} campaignData - Dữ liệu campaign
   * @returns {Promise<object>} Response với thông tin campaign
   */
  async createCampaign(campaignData) {
    try {
      const response = await serviceCampaignAPI.createCampaign(campaignData);

      if (response.success) {
        return {
          success: true,
          data: response.data,
          message: response.message || 'Tạo campaign thành công',
        };
      } else {
        return {
          success: false,
          message: response.message || 'Không thể tạo campaign',
          errors: response.errors,
        };
      }
    } catch (error) {
      console.error('Create campaign error:', error);
      return {
        success: false,
        message: 'Không thể kết nối đến server. Vui lòng thử lại sau.',
      };
    }
  }

  /**
   * Lấy danh sách campaigns
   * @param {object} params - { page, size, sortBy, sortDir }
   * @returns {Promise<object>} Response với danh sách campaigns
   */
  async getAllCampaigns(params = {}) {
    try {
      const response = await serviceCampaignAPI.getAllCampaigns(params);

      if (response.success) {
        return {
          success: true,
          data: response.data,
          message: response.message || 'Lấy danh sách campaigns thành công',
        };
      } else {
        return {
          success: false,
          message: response.message || 'Không thể lấy danh sách campaigns',
        };
      }
    } catch (error) {
      console.error('Get all campaigns error:', error);
      return {
        success: false,
        message: 'Không thể kết nối đến server. Vui lòng thử lại sau.',
      };
    }
  }

  /**
   * Lấy chi tiết campaign
   * @param {string} id - ID của campaign
   * @returns {Promise<object>} Response với chi tiết campaign
   */
  async getCampaignById(id) {
    try {
      const response = await serviceCampaignAPI.getCampaignById(id);

      if (response.success) {
        return {
          success: true,
          data: response.data,
          message: response.message || 'Lấy chi tiết campaign thành công',
        };
      } else {
        return {
          success: false,
          message: response.message || 'Không tìm thấy campaign',
        };
      }
    } catch (error) {
      console.error('Get campaign by id error:', error);
      return {
        success: false,
        message: 'Không thể kết nối đến server. Vui lòng thử lại sau.',
      };
    }
  }

  /**
   * Lấy báo cáo campaign
   * @param {string} id - ID của campaign
   * @returns {Promise<object>} Response với báo cáo
   */
  async getCampaignReport(id) {
    try {
      const response = await serviceCampaignAPI.getCampaignReport(id);

      if (response.success) {
        return {
          success: true,
          data: response.data,
          message: response.message || 'Lấy báo cáo thành công',
        };
      } else {
        return {
          success: false,
          message: response.message || 'Không thể lấy báo cáo',
        };
      }
    } catch (error) {
      console.error('Get campaign report error:', error);
      return {
        success: false,
        message: 'Không thể kết nối đến server. Vui lòng thử lại sau.',
      };
    }
  }

  /**
   * Cập nhật campaign
   * @param {string} id - ID của campaign
   * @param {object} data - Dữ liệu cập nhật
   * @returns {Promise<object>} Response
   */
  async updateCampaign(id, data) {
    try {
      const response = await serviceCampaignAPI.updateCampaign(id, data);

      if (response.success) {
        return {
          success: true,
          data: response.data,
          message: response.message || 'Cập nhật campaign thành công',
        };
      } else {
        return {
          success: false,
          message: response.message || 'Không thể cập nhật campaign',
          errors: response.errors,
        };
      }
    } catch (error) {
      console.error('Update campaign error:', error);
      return {
        success: false,
        message: 'Không thể kết nối đến server. Vui lòng thử lại sau.',
      };
    }
  }

  /**
   * Cập nhật ngày campaign
   * @param {string} id - ID của campaign
   * @param {string} startDate - Ngày bắt đầu (LocalDate format)
   * @param {string} endDate - Ngày kết thúc (LocalDate format)
   * @returns {Promise<object>} Response
   */
  async updateCampaignDates(id, startDate, endDate) {
    try {
      const response = await serviceCampaignAPI.updateCampaignDates(id, startDate, endDate);

      if (response.success) {
        return {
          success: true,
          data: response.data,
          message: response.message || 'Cập nhật ngày campaign thành công',
        };
      } else {
        return {
          success: false,
          message: response.message || 'Không thể cập nhật ngày campaign',
        };
      }
    } catch (error) {
      console.error('Update campaign dates error:', error);
      return {
        success: false,
        message: 'Không thể kết nối đến server. Vui lòng thử lại sau.',
      };
    }
  }

  /**
   * Xóa campaign
   * @param {string} id - ID của campaign
   * @returns {Promise<object>} Response
   */
  async deleteCampaign(id) {
    try {
      const response = await serviceCampaignAPI.deleteCampaign(id);

      if (response.success) {
        return {
          success: true,
          message: response.message || 'Xóa campaign thành công',
        };
      } else {
        return {
          success: false,
          message: response.message || 'Không thể xóa campaign',
        };
      }
    } catch (error) {
      console.error('Delete campaign error:', error);
      return {
        success: false,
        message: 'Không thể kết nối đến server. Vui lòng thử lại sau.',
      };
    }
  }

  /**
   * Gán nhiều loại xe cho campaign
   * @param {string} id - ID của campaign
   * @param {object} data - { vehicleTypeIds: [...] }
   * @returns {Promise<object>} Response
   */
  async assignVehicleTypes(id, vehicleTypeIds) {
    try {
      const response = await serviceCampaignAPI.assignVehicleTypes(id, { vehicleTypeIds });

      if (response.success) {
        return {
          success: true,
          data: response.data,
          message: response.message || 'Gán loại xe thành công',
        };
      } else {
        return {
          success: false,
          message: response.message || 'Không thể gán loại xe',
        };
      }
    } catch (error) {
      console.error('Assign vehicle types error:', error);
      return {
        success: false,
        message: 'Không thể kết nối đến server. Vui lòng thử lại sau.',
      };
    }
  }

  /**
   * Thêm 1 loại xe vào campaign
   * @param {string} id - ID của campaign
   * @param {string} vehicleTypeId - ID của loại xe
   * @returns {Promise<object>} Response
   */
  async addVehicleType(id, vehicleTypeId) {
    try {
      const response = await serviceCampaignAPI.addVehicleType(id, vehicleTypeId);

      if (response.success) {
        return {
          success: true,
          data: response.data,
          message: response.message || 'Thêm loại xe thành công',
        };
      } else {
        return {
          success: false,
          message: response.message || 'Không thể thêm loại xe',
        };
      }
    } catch (error) {
      console.error('Add vehicle type error:', error);
      return {
        success: false,
        message: 'Không thể kết nối đến server. Vui lòng thử lại sau.',
      };
    }
  }

  /**
   * Xóa loại xe khỏi campaign
   * @param {string} id - ID của campaign
   * @param {string} vehicleTypeId - ID của loại xe
   * @returns {Promise<object>} Response
   */
  async removeVehicleType(id, vehicleTypeId) {
    try {
      const response = await serviceCampaignAPI.removeVehicleType(id, vehicleTypeId);

      if (response.success) {
        return {
          success: true,
          data: response.data,
          message: response.message || 'Xóa loại xe thành công',
        };
      } else {
        return {
          success: false,
          message: response.message || 'Không thể xóa loại xe',
        };
      }
    } catch (error) {
      console.error('Remove vehicle type error:', error);
      return {
        success: false,
        message: 'Không thể kết nối đến server. Vui lòng thử lại sau.',
      };
    }
  }

  /**
   * Gán nhiều kỹ thuật viên cho campaign
   * @param {string} id - ID của campaign
   * @param {Array} technicianIds - Mảng ID kỹ thuật viên
   * @returns {Promise<object>} Response
   */
  async assignTechnicians(id, technicianIds) {
    try {
      const response = await serviceCampaignAPI.assignTechnicians(id, { technicianIds });

      if (response.success) {
        return {
          success: true,
          data: response.data,
          message: response.message || 'Gán kỹ thuật viên thành công',
        };
      } else {
        return {
          success: false,
          message: response.message || 'Không thể gán kỹ thuật viên',
        };
      }
    } catch (error) {
      console.error('Assign technicians error:', error);
      return {
        success: false,
        message: 'Không thể kết nối đến server. Vui lòng thử lại sau.',
      };
    }
  }

  /**
   * Thêm 1 kỹ thuật viên vào campaign
   * @param {string} id - ID của campaign
   * @param {string} technicianId - ID của kỹ thuật viên
   * @returns {Promise<object>} Response
   */
  async addTechnician(id, technicianId) {
    try {
      const response = await serviceCampaignAPI.addTechnician(id, technicianId);

      if (response.success) {
        return {
          success: true,
          data: response.data,
          message: response.message || 'Thêm kỹ thuật viên thành công',
        };
      } else {
        return {
          success: false,
          message: response.message || 'Không thể thêm kỹ thuật viên',
        };
      }
    } catch (error) {
      console.error('Add technician error:', error);
      return {
        success: false,
        message: 'Không thể kết nối đến server. Vui lòng thử lại sau.',
      };
    }
  }

  /**
   * Xóa kỹ thuật viên khỏi campaign
   * @param {string} id - ID của campaign
   * @param {string} technicianId - ID của kỹ thuật viên
   * @returns {Promise<object>} Response
   */
  async removeTechnician(id, technicianId) {
    try {
      const response = await serviceCampaignAPI.removeTechnician(id, technicianId);

      if (response.success) {
        return {
          success: true,
          data: response.data,
          message: response.message || 'Xóa kỹ thuật viên thành công',
        };
      } else {
        return {
          success: false,
          message: response.message || 'Không thể xóa kỹ thuật viên',
        };
      }
    } catch (error) {
      console.error('Remove technician error:', error);
      return {
        success: false,
        message: 'Không thể kết nối đến server. Vui lòng thử lại sau.',
      };
    }
  }

  /**
   * Helper: Format date sang LocalDate format (yyyy-MM-dd)
   */
  formatDateForBackend(date) {
    if (!date) return null;
    
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  }
}

// Tạo singleton instance
const serviceCampaignService = new ServiceCampaignService();
export default serviceCampaignService;
