/* ==========================================================================
   REPORT CONFIRMATION SERVICE - Xác nhận báo cáo từ nhà sản xuất
   ========================================================================== */

import apiService from './ApiService';

class ReportConfirmationService {
  constructor() {
    // No need to store data locally - will use API endpoints
  }

  // Gửi báo cáo đến nhà sản xuất để xác nhận
  async submitReportForConfirmation(campaignResult, reportType = 'final') {
    try {
      const reportData = {
        campaignId: campaignResult.campaignId,
        reportType: reportType,
        data: this.prepareReportData(campaignResult, reportType),
        submittedBy: apiService.getToken() ? 'authenticated_user' : 'system'
      };

      const response = await apiService.post('/reports/confirmation', reportData);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to submit report for confirmation');
      }

      return {
        success: true,
        reportId: response.data.id,
        submissionDetails: {
          submittedAt: response.data.submittedAt,
          confirmationDeadline: response.data.confirmationDeadline,
          reportType: response.data.reportType,
          dataPoints: Object.keys(reportData.data).length
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Xử lý phản hồi từ nhà sản xuất
  async processManufacturerResponse(reportId, response) {
    try {
      const responseData = {
        reportId,
        status: response.status,
        reviewedBy: response.reviewedBy || 'Unknown',
        approvalNote: response.approvalNote,
        rejectionReason: response.rejectionReason,
        revisionReason: response.revisionReason,
        revisionRequirements: response.revisionRequirements
      };

      const result = await apiService.put(`/reports/confirmation/${reportId}/response`, responseData);

      if (!result.success) {
        throw new Error(result.message || 'Failed to process manufacturer response');
      }

      // Get the updated next steps based on response status
      const nextSteps = this.getNextSteps(result.data);
      
      return {
        success: true,
        reportStatus: result.data.status,
        response: result.data.manufacturerResponse,
        nextSteps: nextSteps
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Gửi báo cáo đã chỉnh sửa
  async submitRevisedReport(reportId, revisedData, revisionNotes) {
    try {
      const revisionData = {
        reportId,
        revisedData,
        revisionNotes
      };

      const response = await apiService.put(`/reports/confirmation/${reportId}/revise`, revisionData);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to submit revised report');
      }

      return {
        success: true,
        message: 'Báo cáo đã được gửi lại sau chỉnh sửa',
        reportVersion: response.data.version,
        newDeadline: response.data.confirmationDeadline
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Lấy trạng thái xác nhận báo cáo
  async getReportConfirmationStatus(reportId) {
    try {
      const response = await apiService.get(`/reports/confirmation/${reportId}`);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to get report confirmation status');
      }
      
      // Calculate time remaining if we have a deadline
      const timeRemaining = response.data.confirmationDeadline 
        ? this.calculateTimeRemaining(response.data.confirmationDeadline)
        : null;
      
      return {
        success: true,
        ...response.data,
        timeRemaining
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Report not found'
      };
    }
  }

  // Lấy danh sách báo cáo chờ xác nhận
  async getPendingReports(filterOptions = {}) {
    try {
      const response = await apiService.get('/reports/confirmation/pending', {
        params: filterOptions
      });

      if (!response.success) {
        throw new Error(response.message || 'Failed to get pending reports');
      }
      
      // Calculate time remaining and urgency for each report
      const reports = response.data.reports.map(report => ({
        ...report,
        timeRemaining: this.calculateTimeRemaining(report.confirmationDeadline),
        isUrgent: this.isUrgent(report.confirmationDeadline)
      }));
      
      return {
        success: true,
        totalPending: response.data.totalPending,
        reports
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        reports: []
      };
    }
  }

  // Lấy báo cáo thống kê xác nhận
  async getConfirmationStatistics(timeRange = 'month') {
    try {
      const response = await apiService.get('/reports/confirmation/statistics', {
        params: { timeRange }
      });

      if (!response.success) {
        throw new Error(response.message || 'Failed to get confirmation statistics');
      }
      
      return {
        success: true,
        timeRange,
        statistics: response.data.statistics,
        reportBreakdown: response.data.reportBreakdown,
        monthlyTrend: response.data.monthlyTrend
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        statistics: {
          totalSubmitted: 0,
          confirmed: 0,
          pending: 0,
          rejected: 0,
          revisionRequired: 0,
          averageConfirmationTime: 0,
          confirmationRate: 0,
          onTimeRate: 0
        }
      };
    }
  }

  // Tạo reminder cho báo cáo sắp hết hạn
  async sendConfirmationReminders() {
    try {
      const response = await apiService.post('/reports/confirmation/reminders');
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to send confirmation reminders');
      }
      
      return {
        success: true,
        remindersSent: response.data.remindersSent,
        reminders: response.data.reminders
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        remindersSent: 0,
        reminders: []
      };
    }
  }

  // Utility methods
  prepareReportData(campaignResult, reportType) {
    const baseData = {
      campaignId: campaignResult.campaignId,
      executionSummary: campaignResult.executionSummary,
      qualityMetrics: campaignResult.qualityMetrics,
      reportGeneratedAt: campaignResult.reportGeneratedAt
    };

    if (reportType === 'final') {
      return {
        ...baseData,
        issuesSummary: campaignResult.issuesSummary,
        customerSatisfaction: campaignResult.customerSatisfaction,
        centerPerformance: campaignResult.centerPerformance,
        recommendations: campaignResult.recommendations
      };
    } else if (reportType === 'progress') {
      return {
        ...baseData,
        progressSummary: {
          completionRate: campaignResult.executionSummary.successRate,
          estimatedCompletion: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        }
      };
    }

    return baseData;
  }

  calculateTimeRemaining(deadline) {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diff = deadlineDate - now;
    
    if (diff <= 0) return 'Overdue';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days} ngày ${hours % 24} giờ`;
    } else {
      return `${hours} giờ`;
    }
  }

  isUrgent(deadline) {
    const urgentThreshold = 24 * 60 * 60 * 1000; // 24 hours
    const timeRemaining = new Date(deadline) - new Date();
    return timeRemaining <= urgentThreshold && timeRemaining > 0;
  }

  getNextSteps(report) {
    switch (report.status) {
      case 'confirmed':
        return ['Báo cáo đã được xác nhận', 'Có thể đóng chiến dịch'];
      case 'rejected':
        return ['Xem lý do từ chối', 'Chuẩn bị báo cáo mới'];
      case 'revision_required':
        return ['Xem yêu cầu chỉnh sửa', 'Cập nhật báo cáo', 'Gửi lại báo cáo'];
      default:
        return ['Chờ phản hồi từ nhà sản xuất'];
    }
  }
  
  // Get audit trail for a specific report
  async getAuditTrailForReport(reportId) {
    try {
      const response = await apiService.get(`/reports/confirmation/${reportId}/audit`);
      return response.success ? response.data : [];
    } catch (error) {
      console.error(`Error fetching audit trail for report ${reportId}:`, error);
      return [];
    }
  }
}

// Tạo singleton instance
const reportConfirmationService = new ReportConfirmationService();
export default reportConfirmationService;