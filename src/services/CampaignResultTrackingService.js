/* ==========================================================================
   CAMPAIGN RESULT TRACKING SERVICE - Theo dõi kết quả thực hiện chiến dịch
   ========================================================================== */

class CampaignResultTrackingService {
  constructor() {
    this.campaignResults = [];
    this.executionLogs = [];
    this.reportTemplates = [];
  }

  // Bắt đầu theo dõi chiến dịch
  async initializeCampaignTracking(campaignId, assignmentData, scheduleData) {
    try {
      const tracking = {
        id: this.generateId(),
        campaignId,
        totalCenters: assignmentData.centerAssignments.length,
        totalVehicles: this.calculateTotalVehicles(assignmentData),
        startDate: new Date().toISOString(),
        status: 'active',
        centerResults: [],
        overallProgress: {
          completed: 0,
          inProgress: 0,
          pending: 0,
          failed: 0
        },
        qualityMetrics: {
          successRate: 0,
          averageCompletionTime: 0,
          customerSatisfaction: 0,
          reworkRate: 0
        },
        createdAt: new Date().toISOString()
      };

      // Khởi tạo tracking cho từng trung tâm
      for (const centerAssignment of assignmentData.centerAssignments) {
        const centerResult = this.initializeCenterTracking(centerAssignment);
        tracking.centerResults.push(centerResult);
      }

      await this.simulateApiCall(800);
      
      this.campaignResults.push(tracking);

      return {
        success: true,
        trackingId: tracking.id,
        initialStatus: tracking.overallProgress,
        centerResults: tracking.centerResults
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Khởi tạo tracking cho trung tâm
  initializeCenterTracking(centerAssignment) {
    return {
      centerId: centerAssignment.centerId,
      centerName: centerAssignment.centerName,
      totalWorkOrders: centerAssignment.totalWorkOrders,
      vehicleResults: centerAssignment.workOrders.map(wo => ({
        workOrderId: wo.id,
        vehicleId: wo.vehicleId,
        vin: wo.vin,
        owner: wo.owner,
        status: 'pending',
        startTime: null,
        endTime: null,
        duration: null,
        technicianId: wo.technicianId,
        technicianName: wo.technicianName,
        results: {
          partsReplaced: [],
          issuesFound: [],
          workCompleted: [],
          qualityCheck: null,
          customerSignature: null,
          photos: []
        },
        customerFeedback: null,
        qualityScore: null
      })),
      centerProgress: {
        completed: 0,
        inProgress: 0,
        pending: centerAssignment.totalWorkOrders,
        failed: 0
      },
      metrics: {
        averageCompletionTime: 0,
        successRate: 0,
        customerSatisfactionScore: 0
      }
    };
  }

  // Cập nhật kết quả công việc
  async updateWorkOrderResult(trackingId, workOrderId, resultData) {
    const tracking = this.campaignResults.find(t => t.id === trackingId);
    if (!tracking) {
      return { success: false, error: 'Tracking not found' };
    }

    let vehicleResult = null;
    let centerResult = null;

    // Tìm vehicle result
    for (const cr of tracking.centerResults) {
      const vr = cr.vehicleResults.find(v => v.workOrderId === workOrderId);
      if (vr) {
        vehicleResult = vr;
        centerResult = cr;
        break;
      }
    }

    if (!vehicleResult) {
      return { success: false, error: 'Work order not found' };
    }

    // Cập nhật kết quả
    const previousStatus = vehicleResult.status;
    vehicleResult.status = resultData.status;
    vehicleResult.endTime = new Date().toISOString();
    
    if (vehicleResult.startTime) {
      vehicleResult.duration = this.calculateDuration(
        vehicleResult.startTime, 
        vehicleResult.endTime
      );
    }

    // Cập nhật chi tiết kết quả
    if (resultData.results) {
      vehicleResult.results = { ...vehicleResult.results, ...resultData.results };
    }

    if (resultData.customerFeedback) {
      vehicleResult.customerFeedback = resultData.customerFeedback;
      vehicleResult.qualityScore = resultData.customerFeedback.rating;
    }

    // Cập nhật progress của center
    this.updateCenterProgress(centerResult, previousStatus, resultData.status);

    // Cập nhật overall progress
    this.updateOverallProgress(tracking);

    // Cập nhật metrics
    this.updateQualityMetrics(tracking);

    // Log execution
    this.logExecution(trackingId, workOrderId, resultData);

    return {
      success: true,
      message: 'Kết quả công việc đã được cập nhật',
      vehicleResult: vehicleResult,
      centerProgress: centerResult.centerProgress,
      overallProgress: tracking.overallProgress
    };
  }

  // Bắt đầu công việc
  async startWorkOrder(trackingId, workOrderId, technicianId) {
    const tracking = this.campaignResults.find(t => t.id === trackingId);
    if (!tracking) {
      return { success: false, error: 'Tracking not found' };
    }

    let vehicleResult = null;
    let centerResult = null;

    for (const cr of tracking.centerResults) {
      const vr = cr.vehicleResults.find(v => v.workOrderId === workOrderId);
      if (vr) {
        vehicleResult = vr;
        centerResult = cr;
        break;
      }
    }

    if (!vehicleResult || vehicleResult.technicianId !== technicianId) {
      return { success: false, error: 'Unauthorized or work order not found' };
    }

    const previousStatus = vehicleResult.status;
    vehicleResult.status = 'in_progress';
    vehicleResult.startTime = new Date().toISOString();

    this.updateCenterProgress(centerResult, previousStatus, 'in_progress');
    this.updateOverallProgress(tracking);

    return {
      success: true,
      message: 'Công việc đã được bắt đầu',
      vehicleResult: vehicleResult
    };
  }

  // Lấy báo cáo tiến độ chiến dịch
  getCampaignProgressReport(trackingId) {
    const tracking = this.campaignResults.find(t => t.id === trackingId);
    if (!tracking) return null;

    const totalVehicles = tracking.totalVehicles;
    const completionRate = Math.round((tracking.overallProgress.completed / totalVehicles) * 100);
    
    const centerSummary = tracking.centerResults.map(cr => ({
      centerId: cr.centerId,
      centerName: cr.centerName,
      totalVehicles: cr.totalWorkOrders,
      completed: cr.centerProgress.completed,
      inProgress: cr.centerProgress.inProgress,
      pending: cr.centerProgress.pending,
      failed: cr.centerProgress.failed,
      completionRate: Math.round((cr.centerProgress.completed / cr.totalWorkOrders) * 100),
      averageCompletionTime: cr.metrics.averageCompletionTime,
      successRate: cr.metrics.successRate
    }));

    return {
      trackingId: tracking.id,
      campaignId: tracking.campaignId,
      totalCenters: tracking.totalCenters,
      totalVehicles: totalVehicles,
      overallProgress: tracking.overallProgress,
      completionRate: completionRate,
      qualityMetrics: tracking.qualityMetrics,
      centerSummary: centerSummary,
      startDate: tracking.startDate,
      estimatedCompletion: this.calculateEstimatedCompletion(tracking)
    };
  }

  // Lấy báo cáo chi tiết theo trung tâm
  getCenterDetailReport(trackingId, centerId) {
    const tracking = this.campaignResults.find(t => t.id === trackingId);
    if (!tracking) return null;

    const centerResult = tracking.centerResults.find(cr => cr.centerId === centerId);
    if (!centerResult) return null;

    // Phân tích chi tiết
    const completedVehicles = centerResult.vehicleResults.filter(vr => vr.status === 'completed');
    const avgCompletionTime = completedVehicles.length > 0 
      ? completedVehicles.reduce((sum, vr) => sum + (vr.duration || 0), 0) / completedVehicles.length
      : 0;

    const qualityScores = completedVehicles
      .filter(vr => vr.qualityScore)
      .map(vr => vr.qualityScore);
    
    const avgQualityScore = qualityScores.length > 0
      ? qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length
      : 0;

    return {
      centerId: centerResult.centerId,
      centerName: centerResult.centerName,
      totalWorkOrders: centerResult.totalWorkOrders,
      progress: centerResult.centerProgress,
      completionRate: Math.round((centerResult.centerProgress.completed / centerResult.totalWorkOrders) * 100),
      averageCompletionTime: Math.round(avgCompletionTime * 10) / 10,
      averageQualityScore: Math.round(avgQualityScore * 10) / 10,
      vehicleResults: centerResult.vehicleResults,
      dailyProgress: this.getDailyProgress(centerResult.vehicleResults),
      technicianPerformance: this.getTechnicianPerformance(centerResult.vehicleResults)
    };
  }

  // Tạo báo cáo cuối chiến dịch
  generateFinalCampaignReport(trackingId) {
    const tracking = this.campaignResults.find(t => t.id === trackingId);
    if (!tracking) return null;

    const completedVehicles = [];
    const issues = [];
    const customerFeedbacks = [];

    tracking.centerResults.forEach(cr => {
      cr.vehicleResults.forEach(vr => {
        if (vr.status === 'completed') {
          completedVehicles.push(vr);
          
          if (vr.results.issuesFound && vr.results.issuesFound.length > 0) {
            issues.push(...vr.results.issuesFound.map(issue => ({
              ...issue,
              vehicleId: vr.vehicleId,
              centerId: cr.centerId
            })));
          }

          if (vr.customerFeedback) {
            customerFeedbacks.push({
              ...vr.customerFeedback,
              vehicleId: vr.vehicleId,
              centerId: cr.centerId
            });
          }
        }
      });
    });

    return {
      campaignId: tracking.campaignId,
      reportGeneratedAt: new Date().toISOString(),
      executionSummary: {
        totalVehicles: tracking.totalVehicles,
        completedVehicles: completedVehicles.length,
        successRate: Math.round((completedVehicles.length / tracking.totalVehicles) * 100),
        totalCenters: tracking.totalCenters,
        executionDuration: this.calculateCampaignDuration(tracking)
      },
      qualityMetrics: tracking.qualityMetrics,
      issuesSummary: {
        totalIssues: issues.length,
        uniqueIssueTypes: [...new Set(issues.map(i => i.type))].length,
        criticalIssues: issues.filter(i => i.severity === 'critical').length,
        commonIssues: this.getCommonIssues(issues)
      },
      customerSatisfaction: {
        totalResponses: customerFeedbacks.length,
        averageRating: customerFeedbacks.length > 0 
          ? customerFeedbacks.reduce((sum, f) => sum + f.rating, 0) / customerFeedbacks.length
          : 0,
        satisfactionDistribution: this.getSatisfactionDistribution(customerFeedbacks)
      },
      centerPerformance: tracking.centerResults.map(cr => ({
        centerId: cr.centerId,
        centerName: cr.centerName,
        completionRate: Math.round((cr.centerProgress.completed / cr.totalWorkOrders) * 100),
        averageTime: cr.metrics.averageCompletionTime,
        qualityScore: cr.metrics.customerSatisfactionScore
      })),
      recommendations: this.generateRecommendations(tracking, issues, customerFeedbacks)
    };
  }

  // Utility methods
  calculateTotalVehicles(assignmentData) {
    return assignmentData.centerAssignments.reduce(
      (sum, ca) => sum + ca.totalWorkOrders, 0
    );
  }

  updateCenterProgress(centerResult, previousStatus, newStatus) {
    // Giảm count của status cũ
    if (previousStatus && centerResult.centerProgress[previousStatus] > 0) {
      centerResult.centerProgress[previousStatus]--;
    }
    
    // Tăng count của status mới
    if (newStatus && centerResult.centerProgress[newStatus] !== undefined) {
      centerResult.centerProgress[newStatus]++;
    }
  }

  updateOverallProgress(tracking) {
    const overall = { completed: 0, inProgress: 0, pending: 0, failed: 0 };
    
    tracking.centerResults.forEach(cr => {
      overall.completed += cr.centerProgress.completed;
      overall.inProgress += cr.centerProgress.inProgress;
      overall.pending += cr.centerProgress.pending;
      overall.failed += cr.centerProgress.failed;
    });
    
    tracking.overallProgress = overall;
  }

  updateQualityMetrics(tracking) {
    let totalCompleted = 0;
    let totalDuration = 0;
    let totalQualityScores = 0;
    let qualityScoreCount = 0;
    let reworkCount = 0;

    tracking.centerResults.forEach(cr => {
      cr.vehicleResults.forEach(vr => {
        if (vr.status === 'completed') {
          totalCompleted++;
          if (vr.duration) totalDuration += vr.duration;
          if (vr.qualityScore) {
            totalQualityScores += vr.qualityScore;
            qualityScoreCount++;
          }
          if (vr.results.workCompleted && vr.results.workCompleted.some(w => w.rework)) {
            reworkCount++;
          }
        }
      });
    });

    tracking.qualityMetrics = {
      successRate: Math.round((totalCompleted / tracking.totalVehicles) * 100),
      averageCompletionTime: totalCompleted > 0 ? Math.round((totalDuration / totalCompleted) * 10) / 10 : 0,
      customerSatisfaction: qualityScoreCount > 0 ? Math.round((totalQualityScores / qualityScoreCount) * 10) / 10 : 0,
      reworkRate: totalCompleted > 0 ? Math.round((reworkCount / totalCompleted) * 100) : 0
    };
  }

  calculateDuration(startTime, endTime) {
    const start = new Date(startTime);
    const end = new Date(endTime);
    return Math.round((end - start) / (1000 * 60 * 60) * 10) / 10; // hours with 1 decimal
  }

  calculateEstimatedCompletion(tracking) {
    const inProgress = tracking.overallProgress.inProgress;
    const pending = tracking.overallProgress.pending;
    const avgTime = tracking.qualityMetrics.averageCompletionTime || 2;
    
    const remainingHours = (inProgress + pending) * avgTime;
    const completionDate = new Date();
    completionDate.setHours(completionDate.getHours() + remainingHours);
    
    return completionDate.toISOString();
  }

  getDailyProgress(vehicleResults) {
    const dailyData = {};
    
    vehicleResults.forEach(vr => {
      if (vr.endTime) {
        const date = vr.endTime.split('T')[0];
        if (!dailyData[date]) dailyData[date] = 0;
        dailyData[date]++;
      }
    });
    
    return Object.entries(dailyData).map(([date, count]) => ({ date, completed: count }));
  }

  getTechnicianPerformance(vehicleResults) {
    const techStats = {};
    
    vehicleResults.forEach(vr => {
      if (!techStats[vr.technicianId]) {
        techStats[vr.technicianId] = {
          name: vr.technicianName,
          total: 0,
          completed: 0,
          totalDuration: 0,
          qualityScores: []
        };
      }
      
      const stats = techStats[vr.technicianId];
      stats.total++;
      
      if (vr.status === 'completed') {
        stats.completed++;
        if (vr.duration) stats.totalDuration += vr.duration;
        if (vr.qualityScore) stats.qualityScores.push(vr.qualityScore);
      }
    });
    
    return Object.entries(techStats).map(([id, stats]) => ({
      technicianId: id,
      name: stats.name,
      completionRate: Math.round((stats.completed / stats.total) * 100),
      averageTime: stats.completed > 0 ? Math.round((stats.totalDuration / stats.completed) * 10) / 10 : 0,
      averageQuality: stats.qualityScores.length > 0 
        ? Math.round((stats.qualityScores.reduce((a, b) => a + b, 0) / stats.qualityScores.length) * 10) / 10
        : 0
    }));
  }

  calculateCampaignDuration(tracking) {
    const start = new Date(tracking.startDate);
    const now = new Date();
    return Math.round((now - start) / (1000 * 60 * 60 * 24)); // days
  }

  getCommonIssues(issues) {
    const issueCount = {};
    issues.forEach(issue => {
      const key = issue.type;
      issueCount[key] = (issueCount[key] || 0) + 1;
    });
    
    return Object.entries(issueCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([type, count]) => ({ type, count }));
  }

  getSatisfactionDistribution(feedbacks) {
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    feedbacks.forEach(f => {
      if (distribution[f.rating] !== undefined) {
        distribution[f.rating]++;
      }
    });
    return distribution;
  }

  generateRecommendations(tracking, issues, customerFeedbacks) {
    const recommendations = [];
    
    // Performance recommendations
    if (tracking.qualityMetrics.successRate < 95) {
      recommendations.push({
        type: 'performance',
        priority: 'high',
        message: 'Tỷ lệ thành công thấp, cần cải thiện quy trình và đào tạo thêm'
      });
    }
    
    // Quality recommendations
    if (tracking.qualityMetrics.reworkRate > 10) {
      recommendations.push({
        type: 'quality',
        priority: 'medium',
        message: 'Tỷ lệ làm lại cao, cần tăng cường kiểm tra chất lượng'
      });
    }
    
    // Customer satisfaction recommendations
    const avgSatisfaction = customerFeedbacks.length > 0 
      ? customerFeedbacks.reduce((sum, f) => sum + f.rating, 0) / customerFeedbacks.length
      : 0;
    
    if (avgSatisfaction < 4.0) {
      recommendations.push({
        type: 'customer_satisfaction',
        priority: 'high',
        message: 'Độ hài lòng khách hàng thấp, cần cải thiện dịch vụ khách hàng'
      });
    }
    
    return recommendations;
  }

  logExecution(trackingId, workOrderId, resultData) {
    this.executionLogs.push({
      id: this.generateId(),
      trackingId,
      workOrderId,
      action: 'result_update',
      data: resultData,
      timestamp: new Date().toISOString()
    });
  }

  generateId() {
    return 'TRACK' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }

  async simulateApiCall(delay = 500) {
    return new Promise(resolve => setTimeout(resolve, delay));
  }
}

// Tạo singleton instance
const campaignResultTrackingService = new CampaignResultTrackingService();
export default campaignResultTrackingService;