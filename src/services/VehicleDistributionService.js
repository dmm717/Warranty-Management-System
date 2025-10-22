/* ==========================================================================
   VEHICLE DISTRIBUTION SERVICE - Phân bổ xe đến các trung tâm dịch vụ
   ========================================================================== */

import apiService from './ApiService';

class VehicleDistributionService {
  // Phân bổ danh sách xe đến các trung tâm dịch vụ
  async distributeVehiclesToCenters(campaignId, vehicleList, distributionRules = {}) {
    try {
      // Prepare distribution data for API
      const distributionData = {
        campaignId,
        vehicles: vehicleList,
        distributionMethod: distributionRules.method || 'geographic',
        rules: distributionRules
      };
      
      // Send distribution request to API
      const response = await apiService.post('/vehicle-distributions', distributionData);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to distribute vehicles');
      }
      
      return {
        success: true,
        distributionId: response.data.id,
        distributions: response.data.distributions,
        summary: response.data.summary
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Phân bổ theo địa lý
  distributeByGeography(vehicles, centers) {
    const distributions = [];
    
    // Group vehicles by region
    const vehiclesByRegion = this.groupVehiclesByRegion(vehicles);
    
    Object.keys(vehiclesByRegion).forEach(region => {
      const regionVehicles = vehiclesByRegion[region];
      const regionCenters = centers.filter(c => this.getRegionFromLocation(c.location) === region);
      
      if (regionCenters.length > 0) {
        const vehiclesPerCenter = Math.ceil(regionVehicles.length / regionCenters.length);
        
        regionCenters.forEach((center, index) => {
          const startIndex = index * vehiclesPerCenter;
          const endIndex = Math.min(startIndex + vehiclesPerCenter, regionVehicles.length);
          const assignedVehicles = regionVehicles.slice(startIndex, endIndex);
          
          if (assignedVehicles.length > 0) {
            distributions.push({
              centerId: center.id,
              centerName: center.name,
              location: center.location,
              assignedVehicles: assignedVehicles,
              vehicleCount: assignedVehicles.length,
              estimatedDuration: this.calculateEstimatedDuration(assignedVehicles.length, center.capacity)
            });
          }
        });
      }
    });
    
    return distributions;
  }

  // Phân bổ theo công suất
  distributeByCapacity(vehicles, centers) {
    const distributions = [];
    const sortedCenters = [...centers].sort((a, b) => b.capacity - a.capacity);
    
    let remainingVehicles = [...vehicles];
    
    sortedCenters.forEach(center => {
      if (remainingVehicles.length === 0) return;
      
      const maxVehicles = Math.min(center.capacity, remainingVehicles.length);
      const assignedVehicles = remainingVehicles.splice(0, maxVehicles);
      
      distributions.push({
        centerId: center.id,
        centerName: center.name,
        location: center.location,
        assignedVehicles: assignedVehicles,
        vehicleCount: assignedVehicles.length,
        estimatedDuration: this.calculateEstimatedDuration(assignedVehicles.length, center.capacity)
      });
    });
    
    return distributions;
  }

  // Phân bổ đều
  distributeEvenly(vehicles, centers) {
    const distributions = [];
    const vehiclesPerCenter = Math.ceil(vehicles.length / centers.length);
    
    centers.forEach((center, index) => {
      const startIndex = index * vehiclesPerCenter;
      const endIndex = Math.min(startIndex + vehiclesPerCenter, vehicles.length);
      const assignedVehicles = vehicles.slice(startIndex, endIndex);
      
      if (assignedVehicles.length > 0) {
        distributions.push({
          centerId: center.id,
          centerName: center.name,
          location: center.location,
          assignedVehicles: assignedVehicles,
          vehicleCount: assignedVehicles.length,
          estimatedDuration: this.calculateEstimatedDuration(assignedVehicles.length, center.capacity)
        });
      }
    });
    
    return distributions;
  }

  // Lấy danh sách xe theo chiến dịch
  async getVehiclesByCampaign(campaignId, campaignType = 'recall') {
    try {
      const response = await apiService.get(`/campaigns/${campaignId}/vehicles`, {
        params: { campaignType }
      });
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch campaign vehicles');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching campaign vehicles:', error);
      return [];
    }
  }

  // Xác nhận phân bổ từ Service Center
  async confirmDistribution(distributionId, centerId, confirmation) {
    try {
      const confirmationData = {
        centerId,
        confirmationNote: confirmation.note,
        estimatedStartDate: confirmation.estimatedStartDate
      };
      
      const response = await apiService.post(`/vehicle-distributions/${distributionId}/confirm`, confirmationData);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to confirm distribution');
      }
      
      return {
        success: true,
        message: 'Xác nhận phân bổ thành công'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Lấy báo cáo phân bổ
  async getDistributionReport(distributionId) {
    try {
      const response = await apiService.get(`/vehicle-distributions/${distributionId}/report`);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to get distribution report');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching distribution report:', error);
      return null;
    }
  }

  // Utility methods
  groupVehiclesByRegion(vehicles) {
    const groups = {};
    vehicles.forEach(vehicle => {
      const region = this.getRegionFromLocation(vehicle.location);
      if (!groups[region]) groups[region] = [];
      groups[region].push(vehicle);
    });
    return groups;
  }

  getRegionFromLocation(location) {
    const regionMap = {
      'Hà Nội': 'North',
      'Hải Phòng': 'North',
      'TP.HCM': 'South',
      'Cần Thơ': 'South',
      'Đà Nẵng': 'Central'
    };
    return regionMap[location] || 'Other';
  }

  calculateEstimatedDuration(vehicleCount, centerCapacity) {
    // Giả sử mỗi xe mất 2 giờ xử lý, trung tâm làm việc 8 giờ/ngày
    const hoursPerVehicle = 2;
    const workingHoursPerDay = 8;
    const vehiclesPerDay = workingHoursPerDay / hoursPerVehicle;
    
    return Math.ceil(vehicleCount / vehiclesPerDay);
  }

  getDistributionSummary(distribution) {
    return {
      totalVehicles: distribution.totalVehicles,
      totalCenters: distribution.distributions.length,
      averageVehiclesPerCenter: Math.round(distribution.totalVehicles / distribution.distributions.length),
      maxVehiclesPerCenter: Math.max(...distribution.distributions.map(d => d.vehicleCount)),
      minVehiclesPerCenter: Math.min(...distribution.distributions.map(d => d.vehicleCount))
    };
  }

  generateId() {
    return 'DIST' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }

  async simulateApiCall(delay = 500) {
    return new Promise(resolve => setTimeout(resolve, delay));
  }

  getServiceCenters() {
    return [
      { id: 'SC001', name: 'VinFast Hà Nội', location: 'Hà Nội', capacity: 50, workload: 0.7 },
      { id: 'SC002', name: 'VinFast TP.HCM', location: 'TP.HCM', capacity: 80, workload: 0.8 },
      { id: 'SC003', name: 'VinFast Đà Nẵng', location: 'Đà Nẵng', capacity: 30, workload: 0.6 },
      { id: 'SC004', name: 'VinFast Hải Phòng', location: 'Hải Phòng', capacity: 25, workload: 0.5 },
      { id: 'SC005', name: 'VinFast Cần Thơ', location: 'Cần Thơ', capacity: 35, workload: 0.6 }
    ];
  }
}

// Tạo singleton instance
const vehicleDistributionService = new VehicleDistributionService();
export default vehicleDistributionService;