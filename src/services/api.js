/* ==========================================================================
   COMPREHENSIVE API ENDPOINTS
   Tích hợp tất cả API endpoints từ Backend
   ========================================================================== */

import apiService from './ApiService';

// =============================================================================
// AUTH APIs - Authentication & Authorization
// =============================================================================

export const authAPI = {
  // POST /api/auth/register - Đăng ký user mới
  register: (data) => apiService.post('/auth/register', data),
  
  // POST /api/auth/login - Đăng nhập
  login: (data) => apiService.post('/auth/login', data),
  
  // DELETE /api/auth/delete/{id} - Xóa user (chỉ admin)
  deleteUser: (id) => apiService.delete(`/auth/delete/${id}`),
};

// =============================================================================
// USER APIs - User Management
// =============================================================================

export const userAPI = {
  // GET /api/users - Lấy danh sách tất cả users (TODO: Backend cần implement)
  getAllUsers: () => apiService.get('/users'),
  
  // GET /api/users/{id} - Lấy chi tiết user (TODO: Backend cần implement)
  getUserById: (id) => apiService.get(`/users/${id}`),
  
  // PUT /api/user/update - Cập nhật thông tin user
  updateUser: (data) => apiService.put('/user/update', data),
  
  // PUT /api/user/change-password - Đổi mật khẩu
  changePassword: (data) => apiService.put('/user/change-password', data),
  
  // DELETE /api/user/delete/{id} - Xóa user với role check
  deleteUserById: (id) => apiService.delete(`/user/delete/${id}`),
};

// =============================================================================
// WARRANTY CLAIM APIs - Quản lý yêu cầu bảo hành
// =============================================================================

export const warrantyClaimAPI = {
  // POST /api/WarrantyClaim - Tạo yêu cầu bảo hành mới
  createClaim: (data) => apiService.post('/WarrantyClaim', data),
  
  // GET /api/WarrantyClaim - Lấy danh sách claims (có phân trang)
  // Params: page=0, size=10, sortBy=claimDate, sortDir=desc
  getAllClaims: (params = {}) => {
    const { page = 0, size = 10, sortBy = 'claimDate', sortDir = 'desc' } = params;
    return apiService.get(`/WarrantyClaim?page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`);
  },
  
  // GET /api/WarrantyClaim/{claimId} - Lấy chi tiết claim
  getClaimById: (claimId) => apiService.get(`/WarrantyClaim/${claimId}`),
  
  // PUT /api/WarrantyClaim/{claimId} - Cập nhật claim
  updateClaim: (claimId, data) => apiService.put(`/WarrantyClaim/${claimId}`, data),
  
  // PATCH /api/WarrantyClaim/{claimId}/status - Cập nhật trạng thái claim
  // Params: status (enum: PENDING, APPROVED, IN_PROGRESS, COMPLETED, REJECTED)
  updateClaimStatus: (claimId, status) => 
    apiService.request(`/WarrantyClaim/${claimId}/status?status=${status}`, { method: 'PATCH' }),
  
  // PATCH /api/WarrantyClaim/{claimId}/required_part - Cập nhật phụ tùng cần thiết
  updateRequiredPart: (claimId, requiredPart) => 
    apiService.request(`/WarrantyClaim/${claimId}/required_part?requiredPart=${encodeURIComponent(requiredPart)}`, { method: 'PATCH' }),
  
  // PATCH /api/WarrantyClaim/{claimId}/assign-tech - Gán kỹ thuật viên
  assignTechnician: (claimId, scTechId) => 
    apiService.request(`/WarrantyClaim/${claimId}/assign-tech?scTechId=${scTechId}`, { method: 'PATCH' }),
};

// =============================================================================
// ELECTRIC VEHICLE APIs - Quản lý xe điện
// =============================================================================

export const vehicleAPI = {
  // POST /api/ElectricVehicle - Thêm xe mới
  createVehicle: (data) => apiService.post('/ElectricVehicle', data),
  
  // GET /api/ElectricVehicle - Lấy danh sách xe (có phân trang)
  // Params: page=0, size=10, sortBy=name, sortDir=asc
  getAllVehicles: (params = {}) => {
    const { page = 0, size = 10, sortBy = 'name', sortDir = 'asc' } = params;
    return apiService.get(`/ElectricVehicle?page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`);
  },
  
  // GET /api/ElectricVehicle/{id} - Lấy chi tiết xe
  getVehicleById: (id) => apiService.get(`/ElectricVehicle/${id}`),
  
  // PUT /api/ElectricVehicle/{id} - Cập nhật thông tin xe
  updateVehicle: (id, data) => apiService.put(`/ElectricVehicle/${id}`, data),
  
  // DELETE /api/ElectricVehicle/{id} - Xóa xe
  deleteVehicle: (id) => apiService.delete(`/ElectricVehicle/${id}`),
};

// =============================================================================
// DASHBOARD APIs - Dashboard Statistics
// =============================================================================

export const dashboardAPI = {
  // GET /api/dashboard/stats - Lấy thống kê dashboard theo role
  getStats: () => apiService.get('/dashboard/stats'),
  
  // GET /api/dashboard/recent-activities - Lấy hoạt động gần đây
  getRecentActivities: (limit = 10) => apiService.get(`/dashboard/recent-activities?limit=${limit}`),
  
  // GET /api/dashboard/chart-data - Lấy dữ liệu biểu đồ
  getChartData: (type = 'warranty') => apiService.get(`/dashboard/chart-data?type=${type}`),
};

// =============================================================================
// SERVICE CAMPAIGNS APIs - Quản lý chiến dịch dịch vụ
// =============================================================================

export const serviceCampaignAPI = {
  // POST /api/ServiceCampaigns - Tạo chiến dịch mới
  createCampaign: (data) => apiService.post('/ServiceCampaigns', data),
  
  // GET /api/ServiceCampaigns - Lấy danh sách campaigns (có phân trang)
  // Params: page=0, size=10, sortBy=startDate, sortDir=desc
  getAllCampaigns: (params = {}) => {
    const { page = 0, size = 10, sortBy = 'startDate', sortDir = 'desc' } = params;
    return apiService.get(`/ServiceCampaigns?page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`);
  },
  
  // GET /api/ServiceCampaigns/{id} - Lấy chi tiết campaign
  getCampaignById: (id) => apiService.get(`/ServiceCampaigns/${id}`),
  
  // GET /api/ServiceCampaigns/{id}/Report - Lấy báo cáo campaign
  getCampaignReport: (id) => apiService.get(`/ServiceCampaigns/${id}/Report`),
  
  // PUT /api/ServiceCampaigns/{id} - Cập nhật campaign
  updateCampaign: (id, data) => apiService.put(`/ServiceCampaigns/${id}`, data),
  
  // PUT /api/ServiceCampaigns/{id}/dates - Cập nhật ngày campaign
  updateCampaignDates: (id, startDate, endDate) => 
    apiService.put(`/ServiceCampaigns/${id}/dates?startDate=${startDate}&endDate=${endDate}`),
  
  // DELETE /api/ServiceCampaigns/{id} - Xóa campaign
  deleteCampaign: (id) => apiService.delete(`/ServiceCampaigns/${id}`),
  
  // POST /api/ServiceCampaigns/{id}/vehicle-types - Gán nhiều loại xe cho campaign
  assignVehicleTypes: (id, data) => 
    apiService.post(`/ServiceCampaigns/${id}/vehicle-types`, data),
  
  // POST /api/ServiceCampaigns/{id}/vehicle-types/{vehicleTypeId} - Thêm 1 loại xe
  addVehicleType: (id, vehicleTypeId) => 
    apiService.post(`/ServiceCampaigns/${id}/vehicle-types/${vehicleTypeId}`),
  
  // DELETE /api/ServiceCampaigns/{id}/vehicle-types/{vehicleTypeId} - Xóa loại xe
  removeVehicleType: (id, vehicleTypeId) => 
    apiService.delete(`/ServiceCampaigns/${id}/vehicle-types/${vehicleTypeId}`),
  
  // POST /api/ServiceCampaigns/{id}/technicians - Gán nhiều kỹ thuật viên cho campaign
  assignTechnicians: (id, data) => 
    apiService.post(`/ServiceCampaigns/${id}/technicians`, data),
  
  // POST /api/ServiceCampaigns/{id}/technicians/{technicianId} - Thêm 1 kỹ thuật viên
  addTechnician: (id, technicianId) => 
    apiService.post(`/ServiceCampaigns/${id}/technicians/${technicianId}`),
  
  // DELETE /api/ServiceCampaigns/{id}/technicians/{technicianId} - Xóa kỹ thuật viên
  removeTechnician: (id, technicianId) => 
    apiService.delete(`/ServiceCampaigns/${id}/technicians/${technicianId}`),
};

// =============================================================================
// PARTS REQUEST APIs - Quản lý yêu cầu phụ tùng
// =============================================================================

export const partsRequestAPI = {
  // POST /api/parts-requests - Tạo yêu cầu phụ tùng mới
  createPartsRequest: (data) => apiService.post('/parts-requests', data),
  
  // GET /api/parts-requests/{id} - Lấy chi tiết yêu cầu
  getPartsRequestById: (id) => apiService.get(`/parts-requests/${id}`),
  
  // GET /api/parts-requests - Lấy danh sách yêu cầu (có phân trang)
  // Params: page=0, size=10, sortBy=requestDate, sortDir=desc
  getAllPartsRequests: (params = {}) => {
    const { page = 0, size = 10, sortBy = 'requestDate', sortDir = 'desc' } = params;
    return apiService.get(`/parts-requests?page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`);
  },
  
  // PUT /api/parts-requests/{id} - Cập nhật yêu cầu
  updatePartsRequest: (id, data) => apiService.put(`/parts-requests/${id}`, data),
  
  // DELETE /api/parts-requests/{id} - Xóa yêu cầu
  deletePartsRequest: (id) => apiService.delete(`/parts-requests/${id}`),
};

// =============================================================================
// PASSWORD RECOVERY APIs - Quên mật khẩu & khôi phục
// =============================================================================

export const passwordRecoveryAPI = {
  // POST /api/auth/forgot-password - Gửi OTP qua email
  // Params: email (query parameter)
  sendOTP: (email) => 
    apiService.post(`/auth/forgot-password?email=${encodeURIComponent(email)}`),
  
  // POST /api/auth/verify-otp - Xác thực OTP
  // Body: { email, otp }
  verifyOTP: (email, otp) => 
    apiService.post('/auth/verify-otp', { email, otp }),
  
  // POST /api/auth/reset-password - Đặt lại mật khẩu mới
  // Body: { email, newPassword }
  resetPassword: (email, newPassword) => 
    apiService.post('/auth/reset-password', { email, newPassword }),
};

// =============================================================================
// HELPER FUNCTIONS - Các hàm tiện ích
// =============================================================================

/**
 * Format date từ JS Date sang format dd-MM-yyyy cho backend
 */
export const formatDateForBackend = (date) => {
  if (!date) return null;
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};

/**
 * Format date từ backend (yyyy-MM-dd hoặc dd-MM-yyyy) sang JS Date
 */
export const parseDateFromBackend = (dateString) => {
  if (!dateString) return null;
  
  // Nếu format yyyy-MM-dd
  if (dateString.includes('-') && dateString.split('-')[0].length === 4) {
    return new Date(dateString);
  }
  
  // Nếu format dd-MM-yyyy
  const parts = dateString.split('-');
  if (parts.length === 3) {
    return new Date(parts[2], parts[1] - 1, parts[0]);
  }
  
  return new Date(dateString);
};

/**
 * Transform warranty claim data from FE format to BE format
 */
export const transformClaimToBackend = (claim) => {
  return {
    issueDescription: claim.IssueDescription || claim.issueDescription,
    claimDate: formatDateForBackend(claim.ClaimDate || claim.claimDate || new Date()),
    phoneNumber: claim.CustomerPhone || claim.phoneNumber,
    customerName: claim.CustomerName || claim.customerName,
    requiredPart: claim.RequiredPart || claim.requiredPart || '',
    email: claim.Email || claim.email,
    vehicleId: claim.Vehicle_ID || claim.vehicleId,
  };
};

/**
 * Transform vehicle data from FE format to BE format
 */
export const transformVehicleToBackend = (vehicle) => {
  return {
    vehicleId: vehicle.VIN || vehicle.vehicleId,
    vehicleName: vehicle.Vehicle_Name || vehicle.vehicleName,
    totalKm: parseFloat(vehicle.Total_KM || vehicle.totalKm || 0),
    owner: vehicle.Owner || vehicle.owner,
    picture: vehicle.Picture || vehicle.picture || 'default-vehicle.jpg',
    email: vehicle.Email || vehicle.email,
    phoneNumber: vehicle.Phone_Number || vehicle.phoneNumber,
    productionDate: vehicle.Production_Date || vehicle.productionDate,
    status: vehicle.Status || vehicle.status || 'ACTIVE',
    electricVehicleTypeId: vehicle.ID_Electric_Vehicle_Type || vehicle.electricVehicleTypeId,
  };
};

/**
 * Transform parts request data from FE format to BE format
 */
export const transformPartsRequestToBackend = (partsRequest) => {
  return {
    partNumber: partsRequest.PartNumber || partsRequest.partNumber,
    partName: partsRequest.PartName || partsRequest.partName,
    quantity: parseInt(partsRequest.Quantity || partsRequest.quantity || 1),
    requestDate: formatDateForBackend(partsRequest.RequestDate || partsRequest.requestDate || new Date()),
    deliveryDate: formatDateForBackend(partsRequest.DeliveryDate || partsRequest.deliveryDate),
    partTypeId: partsRequest.PartTypeID || partsRequest.partTypeId || 'PT001',
    vehicleId: partsRequest.VehicleID || partsRequest.vehicleId,
  };
};

// Export default object với tất cả APIs
export default {
  auth: authAPI,
  user: userAPI,
  warrantyClaim: warrantyClaimAPI,
  vehicle: vehicleAPI,
  dashboard: dashboardAPI,
  serviceCampaign: serviceCampaignAPI,
  partsRequest: partsRequestAPI,
  passwordRecovery: passwordRecoveryAPI,
};
