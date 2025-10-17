/* ==========================================================================
   WORK ASSIGNMENT SERVICE - Phân công công việc cho kỹ thuật viên
   ========================================================================== */

class WorkAssignmentService {
  constructor() {
    this.assignments = [];
    this.workOrders = [];
    this.technicians = [];
    this.workResults = [];
  }

  // Tạo phân công công việc cho chiến dịch
  async createCampaignWorkAssignments(campaignId, scheduleData, campaignType = 'recall') {
    try {
      const assignment = {
        id: this.generateId(),
        campaignId,
        campaignType,
        totalCenters: scheduleData.centerSchedules.length,
        centerAssignments: [],
        createdAt: new Date().toISOString(),
        status: 'draft'
      };

      // Tạo phân công cho từng trung tâm
      for (const centerSchedule of scheduleData.centerSchedules) {
        const centerAssignment = await this.createCenterAssignment(
          centerSchedule,
          campaignType
        );
        assignment.centerAssignments.push(centerAssignment);
      }

      await this.simulateApiCall(1200);
      
      assignment.status = 'active';
      this.assignments.push(assignment);

      return {
        success: true,
        assignmentId: assignment.id,
        centerAssignments: assignment.centerAssignments,
        summary: this.getAssignmentSummary(assignment)
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
    const assignment = this.assignments.find(a => 
      a.centerAssignments.some(ca => 
        ca.workOrders.some(wo => wo.id === workOrderId)
      )
    );

    if (!assignment) {
      return { success: false, error: 'Work order not found' };
    }

    let workOrder = null;
    let centerAssignment = null;

    // Tìm work order
    for (const ca of assignment.centerAssignments) {
      const wo = ca.workOrders.find(w => w.id === workOrderId);
      if (wo) {
        workOrder = wo;
        centerAssignment = ca;
        break;
      }
    }

    if (!workOrder || workOrder.technicianId !== technicianId) {
      return { success: false, error: 'Unauthorized or work order not found' };
    }

    // Cập nhật tiến độ
    workOrder.progress = progress;
    workOrder.lastUpdated = new Date().toISOString();
    workOrder.progressNote = note;

    // Cập nhật trạng thái
    if (progress.status === 'completed') {
      workOrder.status = 'completed';
      workOrder.completedAt = new Date().toISOString();
      workOrder.actualDuration = progress.actualDuration;
      workOrder.workResults = progress.results;
    } else if (progress.status === 'in_progress') {
      workOrder.status = 'in_progress';
      workOrder.startedAt = new Date().toISOString();
    }

    return {
      success: true,
      message: 'Tiến độ công việc đã được cập nhật',
      workOrder: workOrder
    };
  }

  // Lấy danh sách công việc của kỹ thuật viên
  getTechnicianWorkload(technicianId, startDate = null, endDate = null) {
    const workOrders = [];
    
    this.assignments.forEach(assignment => {
      assignment.centerAssignments.forEach(centerAssignment => {
        centerAssignment.workOrders.forEach(workOrder => {
          if (workOrder.technicianId === technicianId) {
            // Filter by date range if provided
            if (startDate && endDate) {
              const appointmentDate = new Date(workOrder.appointmentDate);
              if (appointmentDate >= new Date(startDate) && appointmentDate <= new Date(endDate)) {
                workOrders.push(workOrder);
              }
            } else {
              workOrders.push(workOrder);
            }
          }
        });
      });
    });

    return {
      technicianId: technicianId,
      totalWorkOrders: workOrders.length,
      completedOrders: workOrders.filter(wo => wo.status === 'completed').length,
      inProgressOrders: workOrders.filter(wo => wo.status === 'in_progress').length,
      pendingOrders: workOrders.filter(wo => wo.status === 'assigned').length,
      workOrders: workOrders.sort((a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate))
    };
  }

  // Reassign công việc
  async reassignWork(workOrderId, newTechnicianId, reason = '') {
    const assignment = this.assignments.find(a => 
      a.centerAssignments.some(ca => 
        ca.workOrders.some(wo => wo.id === workOrderId)
      )
    );

    if (!assignment) {
      return { success: false, error: 'Work order not found' };
    }

    let workOrder = null;
    for (const ca of assignment.centerAssignments) {
      const wo = ca.workOrders.find(w => w.id === workOrderId);
      if (wo) {
        workOrder = wo;
        break;
      }
    }

    if (!workOrder) {
      return { success: false, error: 'Work order not found' };
    }

    // Kiểm tra kỹ thuật viên mới
    const newTechnician = this.getTechnicianById(newTechnicianId);
    if (!newTechnician) {
      return { success: false, error: 'New technician not found' };
    }

    const oldTechnicianId = workOrder.technicianId;
    
    // Cập nhật phân công
    workOrder.technicianId = newTechnicianId;
    workOrder.technicianName = newTechnician.name;
    workOrder.reassignedAt = new Date().toISOString();
    workOrder.reassignReason = reason;
    workOrder.previousTechnicianId = oldTechnicianId;

    return {
      success: true,
      message: 'Công việc đã được phân công lại thành công',
      workOrder: workOrder
    };
  }

  // Lấy báo cáo phân công công việc
  getAssignmentReport(assignmentId) {
    const assignment = this.assignments.find(a => a.id === assignmentId);
    if (!assignment) return null;

    let totalWorkOrders = 0;
    let completedOrders = 0;
    let inProgressOrders = 0;
    let pendingOrders = 0;
    const technicianStats = new Map();

    assignment.centerAssignments.forEach(ca => {
      totalWorkOrders += ca.totalWorkOrders;
      
      ca.workOrders.forEach(wo => {
        if (wo.status === 'completed') completedOrders++;
        else if (wo.status === 'in_progress') inProgressOrders++;
        else if (wo.status === 'assigned') pendingOrders++;

        // Track technician stats
        if (!technicianStats.has(wo.technicianId)) {
          technicianStats.set(wo.technicianId, {
            name: wo.technicianName,
            total: 0,
            completed: 0,
            inProgress: 0,
            pending: 0
          });
        }
        
        const stats = technicianStats.get(wo.technicianId);
        stats.total++;
        if (wo.status === 'completed') stats.completed++;
        else if (wo.status === 'in_progress') stats.inProgress++;
        else if (wo.status === 'assigned') stats.pending++;
      });
    });

    return {
      assignmentId: assignment.id,
      campaignId: assignment.campaignId,
      totalCenters: assignment.totalCenters,
      totalWorkOrders: totalWorkOrders,
      completedOrders: completedOrders,
      inProgressOrders: inProgressOrders,
      pendingOrders: pendingOrders,
      completionRate: Math.round((completedOrders / totalWorkOrders) * 100),
      technicianStats: Array.from(technicianStats.entries()).map(([id, stats]) => ({
        technicianId: id,
        ...stats,
        completionRate: Math.round((stats.completed / stats.total) * 100)
      })),
      centerAssignments: assignment.centerAssignments,
      createdAt: assignment.createdAt
    };
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