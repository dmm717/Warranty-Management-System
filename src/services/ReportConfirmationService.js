/* ==========================================================================
   REPORT CONFIRMATION SERVICE - Xác nhận báo cáo từ nhà sản xuất
   ========================================================================== */

class ReportConfirmationService {
  constructor() {
    this.pendingReports = [];
    this.confirmedReports = [];
    this.manufacturerFeedback = [];
    this.auditTrail = [];
  }

  // Gửi báo cáo đến nhà sản xuất để xác nhận
  async submitReportForConfirmation(campaignResult, reportType = 'final') {
    try {
      const report = {
        id: this.generateId(),
        campaignId: campaignResult.campaignId,
        reportType: reportType,
        submittedAt: new Date().toISOString(),
        status: 'pending_confirmation',
        data: this.prepareReportData(campaignResult, reportType),
        submittedBy: 'system', // In thực tế sẽ lấy từ user context
        manufacturerResponse: null,
        confirmationDeadline: this.calculateDeadline(reportType),
        version: 1,
        revisions: []
      };

      await this.simulateApiCall(1000);
      
      // Gửi notification đến nhà sản xuất
      await this.notifyManufacturer(report);
      
      this.pendingReports.push(report);

      return {
        success: true,
        reportId: report.id,
        submissionDetails: {
          submittedAt: report.submittedAt,
          confirmationDeadline: report.confirmationDeadline,
          reportType: report.reportType,
          dataPoints: Object.keys(report.data).length
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
    const reportIndex = this.pendingReports.findIndex(r => r.id === reportId);
    if (reportIndex === -1) {
      return { success: false, error: 'Report not found' };
    }

    const report = this.pendingReports[reportIndex];
    
    // Cập nhật response
    report.manufacturerResponse = {
      ...response,
      respondedAt: new Date().toISOString(),
      reviewedBy: response.reviewedBy || 'Unknown'
    };

    if (response.status === 'approved') {
      report.status = 'confirmed';
      report.confirmedAt = new Date().toISOString();
      
      // Chuyển sang danh sách confirmed
      this.confirmedReports.push(report);
      this.pendingReports.splice(reportIndex, 1);
      
      // Log audit trail
      this.logAuditTrail(reportId, 'approved', response.approvalNote);
      
    } else if (response.status === 'rejected') {
      report.status = 'rejected';
      report.rejectedAt = new Date().toISOString();
      
      // Log audit trail
      this.logAuditTrail(reportId, 'rejected', response.rejectionReason);
      
    } else if (response.status === 'revision_required') {
      report.status = 'revision_required';
      report.revisionRequestedAt = new Date().toISOString();
      
      // Thêm vào revision history
      report.revisions.push({
        version: report.version,
        requestedAt: new Date().toISOString(),
        reason: response.revisionReason,
        requirements: response.revisionRequirements || []
      });
      
      // Log audit trail
      this.logAuditTrail(reportId, 'revision_requested', response.revisionReason);
    }

    return {
      success: true,
      reportStatus: report.status,
      response: report.manufacturerResponse,
      nextSteps: this.getNextSteps(report)
    };
  }

  // Gửi báo cáo đã chỉnh sửa
  async submitRevisedReport(reportId, revisedData, revisionNotes) {
    const reportIndex = this.pendingReports.findIndex(r => r.id === reportId);
    if (reportIndex === -1) {
      return { success: false, error: 'Report not found' };
    }

    const report = this.pendingReports[reportIndex];
    
    if (report.status !== 'revision_required') {
      return { success: false, error: 'Report is not in revision required status' };
    }

    // Cập nhật report với data mới
    report.data = { ...report.data, ...revisedData };
    report.version += 1;
    report.status = 'pending_confirmation';
    report.lastRevisedAt = new Date().toISOString();
    report.revisionNotes = revisionNotes;
    
    // Reset manufacturer response
    report.manufacturerResponse = null;
    
    // Cập nhật deadline
    report.confirmationDeadline = this.calculateDeadline(report.reportType);

    await this.simulateApiCall(800);
    
    // Gửi notification cho nhà sản xuất
    await this.notifyManufacturerRevision(report);
    
    // Log audit trail
    this.logAuditTrail(reportId, 'revised', revisionNotes);

    return {
      success: true,
      message: 'Báo cáo đã được gửi lại sau chỉnh sửa',
      reportVersion: report.version,
      newDeadline: report.confirmationDeadline
    };
  }

  // Lấy trạng thái xác nhận báo cáo
  getReportConfirmationStatus(reportId) {
    let report = this.pendingReports.find(r => r.id === reportId);
    if (!report) {
      report = this.confirmedReports.find(r => r.id === reportId);
    }
    
    if (!report) {
      return { success: false, error: 'Report not found' };
    }

    const timeRemaining = report.confirmationDeadline 
      ? this.calculateTimeRemaining(report.confirmationDeadline)
      : null;

    return {
      success: true,
      reportId: report.id,
      campaignId: report.campaignId,
      status: report.status,
      submittedAt: report.submittedAt,
      confirmationDeadline: report.confirmationDeadline,
      timeRemaining: timeRemaining,
      currentVersion: report.version,
      manufacturerResponse: report.manufacturerResponse,
      revisionHistory: report.revisions,
      auditTrail: this.getAuditTrailForReport(reportId)
    };
  }

  // Lấy danh sách báo cáo chờ xác nhận
  getPendingReports(filterOptions = {}) {
    let reports = [...this.pendingReports];
    
    // Filter by campaign
    if (filterOptions.campaignId) {
      reports = reports.filter(r => r.campaignId === filterOptions.campaignId);
    }
    
    // Filter by report type
    if (filterOptions.reportType) {
      reports = reports.filter(r => r.reportType === filterOptions.reportType);
    }
    
    // Filter by urgency (near deadline)
    if (filterOptions.urgent) {
      const urgentThreshold = 24 * 60 * 60 * 1000; // 24 hours
      reports = reports.filter(r => {
        const timeRemaining = new Date(r.confirmationDeadline) - new Date();
        return timeRemaining <= urgentThreshold;
      });
    }

    return {
      success: true,
      totalPending: reports.length,
      reports: reports.map(r => ({
        id: r.id,
        campaignId: r.campaignId,
        reportType: r.reportType,
        status: r.status,
        submittedAt: r.submittedAt,
        confirmationDeadline: r.confirmationDeadline,
        timeRemaining: this.calculateTimeRemaining(r.confirmationDeadline),
        version: r.version,
        isUrgent: this.isUrgent(r.confirmationDeadline)
      }))
    };
  }

  // Lấy báo cáo thống kê xác nhận
  getConfirmationStatistics(timeRange = 'month') {
    const now = new Date();
    const rangeStart = this.getTimeRangeStart(now, timeRange);
    
    const allReports = [...this.pendingReports, ...this.confirmedReports];
    const reportsInRange = allReports.filter(r => 
      new Date(r.submittedAt) >= rangeStart
    );

    const stats = {
      totalSubmitted: reportsInRange.length,
      confirmed: reportsInRange.filter(r => r.status === 'confirmed').length,
      pending: reportsInRange.filter(r => r.status === 'pending_confirmation').length,
      rejected: reportsInRange.filter(r => r.status === 'rejected').length,
      revisionRequired: reportsInRange.filter(r => r.status === 'revision_required').length,
      averageConfirmationTime: this.calculateAverageConfirmationTime(reportsInRange),
      confirmationRate: 0,
      onTimeRate: 0
    };

    stats.confirmationRate = stats.totalSubmitted > 0 
      ? Math.round((stats.confirmed / stats.totalSubmitted) * 100)
      : 0;

    // Calculate on-time confirmation rate
    const confirmedReports = reportsInRange.filter(r => r.status === 'confirmed');
    const onTimeConfirmations = confirmedReports.filter(r => 
      new Date(r.confirmedAt) <= new Date(r.confirmationDeadline)
    );
    
    stats.onTimeRate = confirmedReports.length > 0
      ? Math.round((onTimeConfirmations.length / confirmedReports.length) * 100)
      : 0;

    return {
      success: true,
      timeRange: timeRange,
      statistics: stats,
      reportBreakdown: this.getReportTypeBreakdown(reportsInRange),
      monthlyTrend: this.getMonthlyTrend(reportsInRange)
    };
  }

  // Tạo reminder cho báo cáo sắp hết hạn
  async sendConfirmationReminders() {
    const urgentReports = this.pendingReports.filter(r => 
      this.isUrgent(r.confirmationDeadline)
    );

    const reminders = [];
    
    for (const report of urgentReports) {
      const reminder = {
        reportId: report.id,
        campaignId: report.campaignId,
        reportType: report.reportType,
        timeRemaining: this.calculateTimeRemaining(report.confirmationDeadline),
        sentAt: new Date().toISOString()
      };

      // Simulate sending reminder
      await this.simulateApiCall(200);
      reminders.push(reminder);
      
      // Log reminder
      this.logAuditTrail(report.id, 'reminder_sent', 'Automatic reminder sent');
    }

    return {
      success: true,
      remindersSent: reminders.length,
      reminders: reminders
    };
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

  calculateDeadline(reportType) {
    const now = new Date();
    const deadlineHours = {
      'final': 72,      // 3 days
      'progress': 24,   // 1 day
      'urgent': 12,     // 12 hours
      'summary': 48     // 2 days
    };

    const hours = deadlineHours[reportType] || 48;
    const deadline = new Date(now.getTime() + hours * 60 * 60 * 1000);
    return deadline.toISOString();
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

  calculateAverageConfirmationTime(reports) {
    const confirmedReports = reports.filter(r => r.confirmedAt);
    if (confirmedReports.length === 0) return 0;

    const totalTime = confirmedReports.reduce((sum, r) => {
      const submitted = new Date(r.submittedAt);
      const confirmed = new Date(r.confirmedAt);
      return sum + (confirmed - submitted);
    }, 0);

    const avgMilliseconds = totalTime / confirmedReports.length;
    return Math.round(avgMilliseconds / (1000 * 60 * 60)); // Convert to hours
  }

  getTimeRangeStart(now, range) {
    const rangeStart = new Date(now);
    switch (range) {
      case 'week':
        rangeStart.setDate(now.getDate() - 7);
        break;
      case 'month':
        rangeStart.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        rangeStart.setMonth(now.getMonth() - 3);
        break;
      default:
        rangeStart.setMonth(now.getMonth() - 1);
    }
    return rangeStart;
  }

  getReportTypeBreakdown(reports) {
    const breakdown = {};
    reports.forEach(r => {
      breakdown[r.reportType] = (breakdown[r.reportType] || 0) + 1;
    });
    return breakdown;
  }

  getMonthlyTrend(reports) {
    const monthlyData = {};
    reports.forEach(r => {
      const month = r.submittedAt.substring(0, 7); // YYYY-MM
      if (!monthlyData[month]) {
        monthlyData[month] = { submitted: 0, confirmed: 0 };
      }
      monthlyData[month].submitted++;
      if (r.status === 'confirmed') {
        monthlyData[month].confirmed++;
      }
    });
    
    return Object.entries(monthlyData).map(([month, data]) => ({
      month,
      ...data,
      confirmationRate: Math.round((data.confirmed / data.submitted) * 100)
    }));
  }

  logAuditTrail(reportId, action, details) {
    this.auditTrail.push({
      id: this.generateId(),
      reportId,
      action,
      details,
      timestamp: new Date().toISOString(),
      user: 'system' // In thực tế sẽ lấy từ user context
    });
  }

  getAuditTrailForReport(reportId) {
    return this.auditTrail
      .filter(entry => entry.reportId === reportId)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  async notifyManufacturer(report) {
    // Mock notification to manufacturer
    await this.simulateApiCall(500);
    console.log(`Notification sent to manufacturer for report ${report.id}`);
  }

  async notifyManufacturerRevision(report) {
    // Mock notification for revised report
    await this.simulateApiCall(500);
    console.log(`Revision notification sent to manufacturer for report ${report.id}`);
  }

  generateId() {
    return 'RPT' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }

  async simulateApiCall(delay = 500) {
    return new Promise(resolve => setTimeout(resolve, delay));
  }
}

// Tạo singleton instance
const reportConfirmationService = new ReportConfirmationService();
export default reportConfirmationService;