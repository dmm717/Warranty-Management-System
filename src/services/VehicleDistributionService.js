/* ==========================================================================
   VEHICLE DISTRIBUTION SERVICE - Phân bổ xe đến các trung tâm dịch vụ
   ========================================================================== */

class VehicleDistributionService {
  constructor() {
    this.distributions = [];
    this.assignments = [];
  }

  // Phân bổ danh sách xe đến các trung tâm dịch vụ
  async distributeVehiclesToCenters(campaignId, vehicleList, distributionRules = {}) {
    try {
      const serviceCenters = this.getServiceCenters();
      const distribution = {
        id: this.generateId(),
        campaignId,
        totalVehicles: vehicleList.length,
        distributions: [],
        createdAt: new Date().toISOString(),
        status: 'pending'
      };

      // Phân bổ theo quy tắc địa lý hoặc công suất
      const distributionMethod = distributionRules.method || 'geographic';
      
      if (distributionMethod === 'geographic') {
        distribution.distributions = this.distributeByGeography(vehicleList, serviceCenters);
      } else if (distributionMethod === 'capacity') {
        distribution.distributions = this.distributeByCapacity(vehicleList, serviceCenters);
      } else {
        distribution.distributions = this.distributeEvenly(vehicleList, serviceCenters);
      }

      // Simulate API processing
      await this.simulateApiCall(1500);
      
      distribution.status = 'completed';
      this.distributions.push(distribution);

      return {
        success: true,
        distributionId: distribution.id,
        distributions: distribution.distributions,
        summary: this.getDistributionSummary(distribution)
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
    // Mock data - trong thực tế sẽ call API
    const mockVehicles = [
      { id: 'VH001', vin: 'VF8ABC12345678901', model: 'VF8', owner: 'Nguyễn Văn An', location: 'Hà Nội', phone: '0912345678' },
      { id: 'VH002', vin: 'VF8DEF12345678902', model: 'VF8', owner: 'Trần Thị Bình', location: 'TP.HCM', phone: '0987654321' },
      { id: 'VH003', vin: 'VF9GHI12345678903', model: 'VF9', owner: 'Lê Minh Cường', location: 'Đà Nẵng', phone: '0901234567' },
      { id: 'VH004', vin: 'VF8JKL12345678904', model: 'VF8', owner: 'Phạm Thị Dung', location: 'Hải Phòng', phone: '0976543210' },
      { id: 'VH005', vin: 'VF9MNO12345678905', model: 'VF9', owner: 'Hoàng Văn Em', location: 'Cần Thơ', phone: '0965432109' }
    ];
    
    await this.simulateApiCall(800);
    return mockVehicles;
  }

  // Xác nhận phân bổ từ Service Center
  async confirmDistribution(distributionId, centerId, confirmation) {
    const distribution = this.distributions.find(d => d.id === distributionId);
    if (!distribution) {
      return { success: false, error: 'Distribution not found' };
    }
    
    const centerDistribution = distribution.distributions.find(d => d.centerId === centerId);
    if (!centerDistribution) {
      return { success: false, error: 'Center distribution not found' };
    }
    
    centerDistribution.confirmed = true;
    centerDistribution.confirmedAt = new Date().toISOString();
    centerDistribution.confirmationNote = confirmation.note;
    centerDistribution.estimatedStartDate = confirmation.estimatedStartDate;
    
    return {
      success: true,
      message: 'Xác nhận phân bổ thành công'
    };
  }

  // Lấy báo cáo phân bổ
  getDistributionReport(distributionId) {
    const distribution = this.distributions.find(d => d.id === distributionId);
    if (!distribution) return null;
    
    const totalConfirmed = distribution.distributions.filter(d => d.confirmed).length;
    const totalPending = distribution.distributions.length - totalConfirmed;
    
    return {
      distributionId: distribution.id,
      campaignId: distribution.campaignId,
      totalVehicles: distribution.totalVehicles,
      totalCenters: distribution.distributions.length,
      confirmedCenters: totalConfirmed,
      pendingCenters: totalPending,
      completionRate: Math.round((totalConfirmed / distribution.distributions.length) * 100),
      distributions: distribution.distributions,
      createdAt: distribution.createdAt
    };
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