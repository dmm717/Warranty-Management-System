/* ==========================================================================
   WORK ASSIGNMENT SERVICE - Phân công công việc cho kỹ thuật viên
   ========================================================================== */

import apiService from './ApiService';

class WorkAssignmentService {
  // Tạo phân công công việc cho chiến dịch
  async createCampaignWorkAssignments(campaignId, scheduleData, campaignType = 'recall') {
    try {
      // Prepare assignment data for API
      const assignmentData = {
        campaignId,
        campaignType,
        centerSchedules: scheduleData.centerSchedules
      };
      
      // Send work assignment request to API
      const response = await apiService.post('/work-assignments/campaigns', assignmentData);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to create work assignments');
      }
      
      return {
        success: true,
        assignmentId: response.data.id,
        centerAssignments: response.data.centerAssignments,
        summary: response.data.summary
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Tạo phân công cho từng trung tâm
  async createCenterAssignment(centerSchedule, campaignType) {
    const availableTechnicians = this.getTechniciansByCenter(centerSchedule.centerId);
    const workOrders = [];
    
    // Phân chia xe cho các kỹ thuật viên
    const vehiclesPerTechnician = Math.ceil(
      centerSchedule.vehicleSchedules.length / availableTechnicians.length
    );

    let technicianIndex = 0;
    const technicianWorkloads = new Map();

    centerSchedule.vehicleSchedules.forEach((vehicleSchedule, index) => {
      const technician = availableTechnicians[technicianIndex];
      
      // Tạo work order cho mỗi xe
      const workOrder = {
        id: this.generateWorkOrderId(),
        vehicleId: vehicleSchedule.vehicleId,
        vin: vehicleSchedule.vin,
        owner: vehicleSchedule.owner,
        appointmentDate: vehicleSchedule.appointmentDate,
        timeSlot: vehicleSchedule.timeSlot,
        technicianId: technician.id,
        technicianName: technician.name,
        workType: this.getWorkTypeForCampaign(campaignType),
        estimatedDuration: this.getEstimatedDuration(campaignType),
        priority: this.getPriorityLevel(campaignType),
        status: 'assigned',
        createdAt: new Date().toISOString(),
        instructions: this.getWorkInstructions(campaignType),
        checklistItems: this.getChecklistItems(campaignType)
      };

      workOrders.push(workOrder);
      
      // Track workload
      if (!technicianWorkloads.has(technician.id)) {
        technicianWorkloads.set(technician.id, 0);
      }
      technicianWorkloads.set(
        technician.id, 
        technicianWorkloads.get(technician.id) + 1
      );

      // Rotate to next technician
      if ((index + 1) % vehiclesPerTechnician === 0) {
        technicianIndex = (technicianIndex + 1) % availableTechnicians.length;
      }
    });

    const centerAssignment = {
      centerId: centerSchedule.centerId,
      centerName: centerSchedule.centerName,
      totalWorkOrders: workOrders.length,
      assignedTechnicians: availableTechnicians.length,
      workOrders: workOrders,
      technicianWorkloads: Array.from(technicianWorkloads.entries()).map(([techId, count]) => ({
        technicianId: techId,
        technicianName: availableTechnicians.find(t => t.id === techId)?.name,
        assignedVehicles: count,
        estimatedHours: count * this.getEstimatedDuration(campaignType)
      })),
      status: 'assigned',
      createdAt: new Date().toISOString()
    };

    return centerAssignment;
  }

  // Cập nhật tiến độ công việc
  async updateWorkProgress(workOrderId, progress, technicianId, note = '') {
    try {
      const progressData = {
        workOrderId,
        technicianId,
        progress,
        note
      };
      
      // Send update request to API
      const response = await apiService.put(`/work-orders/${workOrderId}/progress`, progressData);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to update work progress');
      }
      
      return {
        success: true,
        message: 'Tiến độ công việc đã được cập nhật',
        workOrder: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Lấy danh sách công việc của kỹ thuật viên
  async getTechnicianWorkload(technicianId, startDate = null, endDate = null) {
    try {
      const params = { technicianId };
      
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      
      const response = await apiService.get('/technicians/workload', { params });
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch technician workload');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching technician workload:', error);
      return {
        technicianId,
        totalWorkOrders: 0,
        completedOrders: 0,
        inProgressOrders: 0,
        pendingOrders: 0,
        workOrders: []
      };
    }
  }

  // Reassign công việc
  async reassignWork(workOrderId, newTechnicianId, reason = '') {
    try {
      const reassignData = {
        workOrderId,
        newTechnicianId,
        reason
      };
      
      // Send reassignment request to API
      const response = await apiService.put(`/work-orders/${workOrderId}/reassign`, reassignData);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to reassign work');
      }
      
      return {
        success: true,
        message: 'Công việc đã được phân công lại thành công',
        workOrder: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Lấy báo cáo phân công công việc
  async getAssignmentReport(assignmentId) {
    try {
      const response = await apiService.get(`/work-assignments/${assignmentId}/report`);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch assignment report');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching assignment report:', error);
      return null;
    }
  }

  // Utility methods
  getTechniciansByCenter(centerId) {
    // Mock data - trong thực tế sẽ lấy từ database
    const allTechnicians = [
      { id: 'TECH001', name: 'Nguyễn Văn Tài', centerId: 'SC001', skill: 'advanced', experience: 5 },
      { id: 'TECH002', name: 'Trần Minh Đức', centerId: 'SC001', skill: 'intermediate', experience: 3 },
      { id: 'TECH003', name: 'Lê Hoàng Nam', centerId: 'SC002', skill: 'advanced', experience: 7 },
      { id: 'TECH004', name: 'Phạm Thị Lan', centerId: 'SC002', skill: 'expert', experience: 10 },
      { id: 'TECH005', name: 'Hoàng Minh Quân', centerId: 'SC003', skill: 'intermediate', experience: 4 }
    ];
    
    return allTechnicians.filter(tech => tech.centerId === centerId);
  }

  getTechnicianById(technicianId) {
    const allTechnicians = [
      { id: 'TECH001', name: 'Nguyễn Văn Tài', centerId: 'SC001', skill: 'advanced', experience: 5 },
      { id: 'TECH002', name: 'Trần Minh Đức', centerId: 'SC001', skill: 'intermediate', experience: 3 },
      { id: 'TECH003', name: 'Lê Hoàng Nam', centerId: 'SC002', skill: 'advanced', experience: 7 },
      { id: 'TECH004', name: 'Phạm Thị Lan', centerId: 'SC002', skill: 'expert', experience: 10 },
      { id: 'TECH005', name: 'Hoàng Minh Quân', centerId: 'SC003', skill: 'intermediate', experience: 4 }
    ];
    
    return allTechnicians.find(tech => tech.id === technicianId);
  }

  getWorkTypeForCampaign(campaignType) {
    const workTypes = {
      'recall': 'Safety Recall Service',
      'urgent_recall': 'Urgent Safety Recall',
      'maintenance': 'Preventive Maintenance',
      'software_update': 'Software Update Service'
    };
    return workTypes[campaignType] || 'General Service';
  }

  getEstimatedDuration(campaignType) {
    const durations = {
      'recall': 2.0,           // 2 hours
      'urgent_recall': 1.5,    // 1.5 hours
      'maintenance': 3.0,      // 3 hours
      'software_update': 1.0   // 1 hour
    };
    return durations[campaignType] || 2.0;
  }

  getPriorityLevel(campaignType) {
    const priorities = {
      'urgent_recall': 'critical',
      'recall': 'high',
      'maintenance': 'medium',
      'software_update': 'low'
    };
    return priorities[campaignType] || 'medium';
  }

  getWorkInstructions(campaignType) {
    const instructions = {
      'recall': [
        'Kiểm tra và thay thế các bộ phận theo thông báo recall',
        'Đảm bảo tuân thủ đúng quy trình an toàn',
        'Ghi chép đầy đủ các bước thực hiện',
        'Chụp ảnh trước và sau khi thực hiện'
      ],
      'urgent_recall': [
        'KHẨN CẤP: Thực hiện ngay lập tức',
        'Kiểm tra ngay các bộ phận liên quan đến an toàn',
        'Báo cáo ngay nếu phát hiện vấn đề nghiêm trọng',
        'Hoàn thành trong thời gian tối thiểu'
      ]
    };
    return instructions[campaignType] || ['Thực hiện theo hướng dẫn chung'];
  }

  getChecklistItems(campaignType) {
    const checklists = {
      'recall': [
        { item: 'Kiểm tra VIN số xe', completed: false },
        { item: 'Xác nhận bộ phận cần thay', completed: false },
        { item: 'Thực hiện thay thế', completed: false },
        { item: 'Test chức năng', completed: false },
        { item: 'Cập nhật hệ thống', completed: false }
      ],
      'urgent_recall': [
        { item: 'Kiểm tra khẩn cấp', completed: false },
        { item: 'Thực hiện sửa chữa', completed: false },
        { item: 'Kiểm tra an toàn', completed: false },
        { item: 'Báo cáo hoàn thành', completed: false }
      ]
    };
    return checklists[campaignType] || [];
  }

  getAssignmentSummary(assignment) {
    const totalWorkOrders = assignment.centerAssignments.reduce((sum, ca) => sum + ca.totalWorkOrders, 0);
    const totalTechnicians = assignment.centerAssignments.reduce((sum, ca) => sum + ca.assignedTechnicians, 0);
    
    return {
      totalWorkOrders: totalWorkOrders,
      totalTechnicians: totalTechnicians,
      totalCenters: assignment.totalCenters,
      averageWorkloadPerTechnician: Math.round(totalWorkOrders / totalTechnicians)
    };
  }

  generateId() {
    return 'ASSIGN' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }

  generateWorkOrderId() {
    return 'WO' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }

  async simulateApiCall(delay = 500) {
    return new Promise(resolve => setTimeout(resolve, delay));
  }
}

// Tạo singleton instance
const workAssignmentService = new WorkAssignmentService();
export default workAssignmentService;