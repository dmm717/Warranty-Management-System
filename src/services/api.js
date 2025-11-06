/* ==========================================================================
   COMPREHENSIVE API ENDPOINTS
   Tích hợp tất cả API endpoints từ Backend
   ========================================================================== */

import apiService from "./ApiService";
import { VEHICLE_TYPES } from "../constants";

// =============================================================================
// AUTH APIs - Authentication & Authorization
// =============================================================================

export const authAPI = {
  // POST /api/auth/register - Đăng ký user mới
  register: (data) => apiService.post("/auth/register", data),

  // POST /api/auth/login - Đăng nhập
  login: (data) => apiService.post("/auth/login", data),

  // DELETE /api/auth/delete/{id} - Xóa user (chỉ admin)
  deleteUser: (id) => apiService.delete(`/auth/delete/${id}`),
};

// =============================================================================
// USER APIs - User Management
// =============================================================================

export const userAPI = {
  // GET /api/user/all - Lấy danh sách tất cả users (chỉ EVM_ADMIN)
  getAllUsers: () => apiService.get("/user/all"),

  // GET /api/user/evm-staff/{id} - Lấy chi tiết EVM staff
  getUserById: (id) => apiService.get(`/user/evm-staff/${id}`),

  // GET /api/user/sc-users - Lấy danh sách SC users theo branch
  getSCUsers: () => apiService.get("/user/sc-users"),

  // PUT /api/user/update - Cập nhật thông tin user (chính mình)
  updateUser: (data) => apiService.put("/user/update", data),

  // PUT /api/user/admin/update/{userId} - EVM_ADMIN cập nhật user khác
  adminUpdateUser: (userId, data) =>
    apiService.put(`/user/admin/update/${userId}`, data),

  // PATCH /api/user/{userId}/status - EVM_ADMIN thay đổi trạng thái user
  updateUserStatus: (userId, status, reason) =>
    apiService.patch(`/user/${userId}/status`, { status, reason }),

  // PUT /api/user/change-password - Đổi mật khẩu
  changePassword: (data) => apiService.put("/user/change-password", data),

  // DELETE /api/user/delete/{id} - Xóa user với role check
  deleteUserById: (id) => apiService.delete(`/user/delete/${id}`),
};

// =============================================================================
// SC TECHNICIAN APIs - Quản lý kỹ thuật viên Service Center
// =============================================================================

export const scTechnicianAPI = {
  // POST /api/sc-technicians - Tạo kỹ thuật viên mới
  createTechnician: (data) => apiService.post("/sc-technicians", data),

  // GET /api/sc-technicians/{id} - Lấy chi tiết kỹ thuật viên
  getTechnicianById: (id) => apiService.get(`/sc-technicians/${id}`),

  // PUT /api/sc-technicians/{id} - Cập nhật kỹ thuật viên
  updateTechnician: (id, data) => apiService.put(`/sc-technicians/${id}`, data),

  // DELETE /api/sc-technicians/{id} - Xóa kỹ thuật viên
  deleteTechnician: (id) => apiService.delete(`/sc-technicians/${id}`),

  // GET /api/sc-technicians - Lấy danh sách tất cả kỹ thuật viên (có phân trang)
  getAllTechnicians: (params = {}) => {
    const {
      page = 0,
      size = 100,
      sortBy = "name",
      sortDir = "asc",
    } = params;
    return apiService.get(
      `/sc-technicians?page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`
    );
  },

  // GET /api/sc-technicians/search - Tìm kiếm kỹ thuật viên
  searchTechnicians: (keyword, params = {}) => {
    const {
      page = 0,
      size = 10,
      sortBy = "name",
      sortDir = "asc",
    } = params;
    return apiService.get(
      `/sc-technicians/search?keyword=${encodeURIComponent(keyword)}&page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`
    );
  },

  // GET /api/sc-technicians/branch/{branchOffice} - Lấy kỹ thuật viên theo chi nhánh
  getTechniciansByBranch: (branchOffice, params = {}) => {
    const { page = 0, size = 10 } = params;
    return apiService.get(
      `/sc-technicians/branch/${encodeURIComponent(branchOffice)}?page=${page}&size=${size}`
    );
  },

  // GET /api/sc-technicians/specialty/{specialty} - Lấy kỹ thuật viên theo chuyên môn
  getTechniciansBySpecialty: (specialty, params = {}) => {
    const { page = 0, size = 10 } = params;
    return apiService.get(
      `/sc-technicians/specialty/${encodeURIComponent(specialty)}?page=${page}&size=${size}`
    );
  },

  // GET /api/sc-technicians/user/{userId} - Lấy technician theo userId
  getTechnicianByUserId: (userId) => apiService.get(`/sc-technicians/user/${userId}`),

  // PATCH /api/sc-technicians/{id}/password - Cập nhật mật khẩu kỹ thuật viên
  updatePassword: (id, newPassword) =>
    apiService.request(`/sc-technicians/${id}/password?newPassword=${encodeURIComponent(newPassword)}`, {
      method: "PATCH",
    }),
};

// =============================================================================
// WARRANTY CLAIM APIs - Quản lý yêu cầu bảo hành
// =============================================================================

export const warrantyClaimAPI = {
  // POST /api/WarrantyClaim - Tạo yêu cầu bảo hành mới
  createClaim: (data) => apiService.post("/WarrantyClaim", data),

  // GET /api/WarrantyClaim - Lấy danh sách claims (có phân trang)
  // Params: page=0, size=10, sortBy=claimDate, sortDir=desc
  getAllClaims: (params = {}) => {
    const {
      page = 0,
      size = 10,
      sortBy = "claimDate",
      sortDir = "desc",
    } = params;
    return apiService.get(
      `/WarrantyClaim?page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`
    );
  },

  // GET /api/WarrantyClaim/{claimId} - Lấy chi tiết claim
  getClaimById: (claimId) => apiService.get(`/WarrantyClaim/${claimId}`),

  // PUT /api/WarrantyClaim/{claimId} - Cập nhật claim
  updateClaim: (claimId, data) =>
    apiService.put(`/WarrantyClaim/${claimId}`, data),

  // PATCH /api/WarrantyClaim/{claimId}/status - Cập nhật trạng thái claim
  // Params: status (enum: PENDING, APPROVED, IN_PROGRESS, COMPLETED, REJECTED)
  updateClaimStatus: (claimId, status) =>
    apiService.request(`/WarrantyClaim/${claimId}/status?status=${status}`, {
      method: "PATCH",
    }),

  // POST /api/WarrantyClaim/approve-reject - SC_ADMIN duyệt/từ chối claim
  // Body: { claimId, action: "APPROVE" | "REJECT", rejectionReason?, approvedByUserId }
  approveOrRejectClaim: (data) =>
    apiService.post("/WarrantyClaim/approve-reject", data),

  // PATCH /api/WarrantyClaim/{claimId}/required_part - Cập nhật phụ tùng cần thiết
  updateRequiredPart: (claimId, requiredPart) =>
    apiService.request(
      `/WarrantyClaim/${claimId}/required_part?requiredPart=${encodeURIComponent(
        requiredPart
      )}`,
      { method: "PATCH" }
    ),

  // PATCH /api/WarrantyClaim/{claimId}/assign-tech - Gán kỹ thuật viên
  assignTechnician: (claimId, scTechId) =>
    apiService.request(
      `/WarrantyClaim/${claimId}/assign-tech?scTechId=${scTechId}`,
      { method: "PATCH" }
    ),
};

// =============================================================================
// ELECTRIC VEHICLE APIs - Quản lý xe điện
// =============================================================================

export const vehicleAPI = {
  // POST /api/ElectricVehicle - Thêm xe mới
  createVehicle: (data) => apiService.post("/ElectricVehicle", data),

  // GET /api/ElectricVehicle - Lấy danh sách xe (có phân trang)
  // Params: page=0, size=10, sortBy=name, sortDir=asc
  getAllVehicles: (params = {}) => {
    const { page = 0, size = 10, sortBy = "name", sortDir = "asc" } = params;
    return apiService.get(
      `/ElectricVehicle?page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`
    );
  },

  // GET /api/ElectricVehicle/{id} - Lấy chi tiết xe
  getVehicleById: (id) => apiService.get(`/ElectricVehicle/${id}`),

  // PUT /api/ElectricVehicle/{id} - Cập nhật thông tin xe
  updateVehicle: (id, data) => apiService.put(`/ElectricVehicle/${id}`, data),

  // DELETE /api/ElectricVehicle/{id} - Xóa xe
  deleteVehicle: (id) => apiService.delete(`/ElectricVehicle/${id}`),
};

// =============================================================================
// SERVICE CAMPAIGNS APIs - Quản lý chiến dịch dịch vụ
// =============================================================================

export const serviceCampaignAPI = {
  // POST /api/ServiceCampaigns - Tạo chiến dịch mới
  createCampaign: (data) => apiService.post("/ServiceCampaigns", data),

  // GET /api/ServiceCampaigns - Lấy danh sách campaigns (có phân trang)
  // Params: page=0, size=10, sortBy=startDate, sortDir=desc
  getAllCampaigns: (params = {}) => {
    const {
      page = 0,
      size = 10,
      sortBy = "startDate",
      sortDir = "desc",
    } = params;
    return apiService.get(
      `/ServiceCampaigns?page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`
    );
  },

  // GET /api/ServiceCampaigns/{id} - Lấy chi tiết campaign
  getCampaignById: (id) => apiService.get(`/ServiceCampaigns/${id}`),

  // GET /api/ServiceCampaigns/{id}/Report - Lấy báo cáo campaign
  getCampaignReport: (id) => apiService.get(`/ServiceCampaigns/${id}/Report`),

  // PUT /api/ServiceCampaigns/{id} - Cập nhật campaign
  updateCampaign: (id, data) => apiService.put(`/ServiceCampaigns/${id}`, data),

  // PUT /api/ServiceCampaigns/{id}/dates - Cập nhật ngày campaign
  updateCampaignDates: (id, startDate, endDate) =>
    apiService.put(
      `/ServiceCampaigns/${id}/dates?startDate=${startDate}&endDate=${endDate}`
    ),

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

  // PATCH /api/ServiceCampaigns/{id}/status - Cập nhật trạng thái campaign
  updateCampaignStatus: (id, status) =>
    apiService.patch(`/ServiceCampaigns/${id}/status?status=${status}`),

  // PATCH /api/ServiceCampaigns/{id}/notification - Cập nhật notification sent
  updateNotificationSent: (id, notificationSent) =>
    apiService.patch(
      `/ServiceCampaigns/${id}/notification?notificationSent=${notificationSent}`
    ),
};

// =============================================================================
// PARTS REQUEST APIs - Quản lý yêu cầu phụ tùng
// =============================================================================

export const partsRequestAPI = {
  // POST /api/parts-requests - Tạo yêu cầu phụ tùng mới
  createPartsRequest: (data) => apiService.post("/parts-requests", data),

  // GET /api/parts-requests/{id} - Lấy chi tiết yêu cầu
  getPartsRequestById: (id) => apiService.get(`/parts-requests/${id}`),

  // GET /api/parts-requests - Lấy danh sách yêu cầu (có phân trang)
  // Params: page=0, size=10, sortBy=requestDate, sortDir=desc
  getAllPartsRequests: (params = {}) => {
    const {
      page = 0,
      size = 10,
      sortBy = "requestDate",
      sortDir = "desc",
    } = params;
    return apiService.get(
      `/parts-requests?page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`
    );
  },

  // PUT /api/parts-requests/{id} - Cập nhật yêu cầu
  updatePartsRequest: (id, data) =>
    apiService.put(`/parts-requests/${id}`, data),

  // DELETE /api/parts-requests/{id} - Xóa yêu cầu
  deletePartsRequest: (id) => apiService.delete(`/parts-requests/${id}`),

  // ===== OLD METHODS (DEPRECATED) =====
  // PATCH /api/parts-requests/{id}/approve - Approve request (auto-decrease stock)
  approvePartsRequest: (id) =>
    apiService.request(`/parts-requests/${id}/approve`, { method: "PATCH" }),

  // PATCH /api/parts-requests/{id}/reject - Reject request
  rejectPartsRequest: (id, reason = "") =>
    apiService.request(
      `/parts-requests/${id}/reject?reason=${encodeURIComponent(reason)}`,
      {
        method: "PATCH",
      }
    ),

  // ===== NEW 3-STEP WORKFLOW =====
  // POST /api/parts-requests/evm-approval - EVM_STAFF approve/reject
  evmStaffApproveOrReject: (data) =>
    apiService.post("/parts-requests/evm-approval", data),

  // POST /api/parts-requests/confirm-receive - SC_ADMIN confirm delivery
  scAdminConfirmReceive: (data) =>
    apiService.post("/parts-requests/confirm-receive", data),
};

// =============================================================================
// EVM PART TYPE / INVENTORY APIs - Kho phụ tùng EVM
// =============================================================================

export const evmInventoryAPI = {
  // GET /api/parts/inventory - Lấy danh sách inventory EVM (có phân trang)
  // Params: page=0, size=10, sortBy=partName, sortDir=asc
  getAllPartTypes: (params = {}) => {
    const {
      page = 0,
      size = 10,
      sortBy = "partName",
      sortDir = "asc",
    } = params;
    return apiService.get(
      `/parts/inventory?page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`
    );
  },

  // GET /api/parts/inventory/all - Lấy tất cả part types (không phân trang) - cho dropdown
  getAllPartTypesNoPagination: () => apiService.get("/parts/inventory/all"),

  // GET /api/parts/inventory/{id} - Lấy chi tiết part type
  getPartTypeById: (id) => apiService.get(`/parts/inventory/${id}`),

  // PATCH /api/parts/inventory/{id}/status - Update stock status
  updatePartTypeStatus: (id, stockStatus) =>
    apiService.request(
      `/parts/inventory/${id}/status?stockStatus=${stockStatus}`,
      {
        method: "PATCH",
      }
    ),

  // GET /api/parts/inventory/categories - Get unique part categories
  getPartCategories: () => apiService.get("/parts/inventory/categories"),

  // GET /api/spare-parts/evm/count?partId={partId} - Get count by part type
  getPartCountByType: (partId) => apiService.get(`/spare-parts/evm/count?partId=${partId}`),

  // GET /api/spare-parts/evm/search-by-part-type/{partTypeId} - Search products by part type
  searchByPartTypeId: (partTypeId) => apiService.get(`/spare-parts/evm/search-by-part-type/${partTypeId}`),

  // POST /api/spare-parts/evm - Thêm phụ tùng mới
  // Body: { name, vehicleType, condition, partTypeId }
  createSparePart: (data) => apiService.post("/spare-parts/evm", data),

  // POST /api/spare-parts/evm/transfer/{partEvmId}?officeBranch={branch} - Chuyển phụ tùng từ EVM sang SC
  transferToSC: (partEvmId, officeBranch) => 
    apiService.post(`/spare-parts/evm/transfer/${partEvmId}?officeBranch=${officeBranch}`),

  // PUT /api/spare-parts/evm/{id} - Cập nhật thông tin phụ tùng
  // Body: { name, vehicleType, condition }
  updateSparePart: (id, data) => apiService.put(`/spare-parts/evm/${id}`, data),
};

// =============================================================================
// SC INVENTORY APIs - Quản lý kho phụ tùng SC
// =============================================================================

export const scInventoryAPI = {
  // GET /api/sc-parts/inventory - Lấy danh sách inventory SC (có phân trang)
  // Params: page=0, size=10, sortBy=partName, sortDir=asc
  getAllPartTypes: (params = {}) => {
    const {
      page = 0,
      size = 10,
      sortBy = "partName",
      sortDir = "asc",
    } = params;
    return apiService.get(
      `/sc-parts/inventory?page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`
    );
  },

  // GET /api/sc-parts/inventory/all - Lấy tất cả part types (không phân trang) - cho dropdown
  getAllPartTypesNoPagination: () => apiService.get("/sc-parts/inventory/all"),

  // GET /api/sc-parts/inventory/{id} - Lấy chi tiết part type
  getPartTypeById: (id) => apiService.get(`/sc-parts/inventory/${id}`),

  // GET /api/sc-parts/inventory/categories - Get unique part categories
  getPartCategories: () => apiService.get("/sc-parts/inventory/categories"),

  // GET /api/spare-parts/sc/count/office_branch?branch={branch}&partTypeId={partTypeId} - Get count by part type and office branch
  getPartCountByType: (partTypeId, officeBranch) => {
    return apiService.get(`/spare-parts/sc/count/office_branch?branch=${officeBranch}&partTypeId=${partTypeId}`);
  },

  // GET /api/spare-parts/sc/search?branch={branch}&partTypeId={partTypeId} - Search SC parts by office branch and part type
  searchByBranchAndPartType: (officeBranch, partTypeId) => {
    const params = new URLSearchParams();
    if (officeBranch) params.append('branch', officeBranch);
    if (partTypeId) params.append('partTypeId', partTypeId);
    return apiService.get(`/spare-parts/sc/search?${params.toString()}`);
  },

  // PATCH /api/spare-parts/sc/{id}/vehicles/{vehicleId} - Map spare part to vehicle
  mapPartToVehicle: (partId, vehicleId) => {
    return apiService.patch(`/spare-parts/sc/${partId}/vehicles/${vehicleId}`);
  },
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
    apiService.post("/auth/verify-otp", { email, otp }),

  // POST /api/auth/reset-password - Đặt lại mật khẩu mới
  // Body: { email, newPassword }
  resetPassword: (email, newPassword) =>
    apiService.post("/auth/reset-password", { email, newPassword }),
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
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};

/**
 * Format date từ backend (yyyy-MM-dd hoặc dd-MM-yyyy) sang JS Date
 */
export const parseDateFromBackend = (dateString) => {
  if (!dateString) return null;

  // Nếu format yyyy-MM-dd
  if (dateString.includes("-") && dateString.split("-")[0].length === 4) {
    return new Date(dateString);
  }

  // Nếu format dd-MM-yyyy
  const parts = dateString.split("-");
  if (parts.length === 3) {
    return new Date(parts[2], parts[1] - 1, parts[0]);
  }

  return new Date(dateString);
};

/**
 * Transform warranty claim data from FE format to BE format
 */
/**
 * Transform vehicle data from FE format to BE format
 */
export const transformVehicleToBackend = (vehicle, isUpdate = false) => {
  // Tự động lấy tên xe từ vehicleType nếu không có Vehicle_Name
  const vehicleTypeName = VEHICLE_TYPES.find(
    (vt) =>
      vt.id === (vehicle.ID_Electric_Vehicle_Type || vehicle.Vehicle_Type_ID)
  )?.name;

  if (isUpdate) {
    // Transform for UPDATE - matches ElectricVehicleUpdateRequestDTO
    return {
      name: vehicle.Vehicle_Name || vehicleTypeName || vehicle.name,
      totalKm: parseFloat(vehicle.Total_KM || vehicle.totalKm || 0),
      owner: vehicle.Owner || vehicle.owner,
      picture: vehicle.Picture || vehicle.picture || "default-vehicle.jpg",
      email: vehicle.Email || vehicle.email,
      phoneNumber: vehicle.Phone_Number || vehicle.phoneNumber,
      productionDate: vehicle.Purchase_Date || vehicle.purchaseDate, // Backend uses productionDate for update
      status: vehicle.Status || vehicle.status || "ACTIVE",
      vehicleTypeId:
        vehicle.ID_Electric_Vehicle_Type ||
        vehicle.Vehicle_Type_ID ||
        vehicle.vehicleType?.id,
    };
  }

  // Transform for CREATE - matches VehicleCreateDTO
  return {
    vehicleId: vehicle.VIN || vehicle.vehicleId,
    vehicleName: vehicle.Vehicle_Name || vehicleTypeName || vehicle.name,
    totalKm: parseFloat(vehicle.Total_KM || vehicle.totalKm || 0),
    owner: vehicle.Owner || vehicle.owner,
    picture: vehicle.Picture || vehicle.picture || "default-vehicle.jpg",
    email: vehicle.Email || vehicle.email,
    phoneNumber: vehicle.Phone_Number || vehicle.phoneNumber,
    purchaseDate: vehicle.Purchase_Date || vehicle.purchaseDate,
    status: vehicle.Status || vehicle.status || "ACTIVE",
    electricVehicleTypeId:
      vehicle.ID_Electric_Vehicle_Type ||
      vehicle.Vehicle_Type_ID ||
      vehicle.vehicleType?.id,
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
    requestDate: formatDateForBackend(
      partsRequest.RequestDate || partsRequest.requestDate || new Date()
    ),
    deliveryDate: formatDateForBackend(
      partsRequest.DeliveryDate || partsRequest.deliveryDate
    ),
    partTypeId: partsRequest.PartTypeID || partsRequest.partTypeId || "PT001",
    vehicleId: partsRequest.VehicleID || partsRequest.vehicleId,
  };
};

// =============================================================================
// NOTIFICATION APIs - Hệ thống thông báo
// =============================================================================

export const notificationAPI = {
  // GET /api/notifications/user/{userId} - Lấy tất cả notifications (có phân trang)
  getNotificationsByUserId: (userId, params = {}) => {
    const { page = 0, size = 20 } = params;
    return apiService.get(
      `/notifications/user/${userId}?page=${page}&size=${size}`
    );
  },

  // GET /api/notifications/user/{userId}/unread - Lấy notifications chưa đọc
  getUnreadNotifications: (userId) =>
    apiService.get(`/notifications/user/${userId}/unread`),

  // GET /api/notifications/user/{userId}/unread/count - Đếm số notifications chưa đọc
  countUnreadNotifications: (userId) =>
    apiService.get(`/notifications/user/${userId}/unread/count`),

  // PATCH /api/notifications/{id}/read - Đánh dấu notification đã đọc
  markAsRead: (notificationId) =>
    apiService.request(`/notifications/${notificationId}/read`, {
      method: "PATCH",
    }),

  // PATCH /api/notifications/user/{userId}/read-all - Đánh dấu tất cả đã đọc
  markAllAsRead: (userId) =>
    apiService.request(`/notifications/user/${userId}/read-all`, {
      method: "PATCH",
    }),

  // DELETE /api/notifications/{id} - Xóa notification
  deleteNotification: (notificationId) =>
    apiService.delete(`/notifications/${notificationId}`),

  // POST /api/notifications/warranty-claim - Gửi notification yêu cầu bảo hành
  sendWarrantyClaimNotification: (data) =>
    apiService.post("/notifications/warranty-claim", data),
};

// =============================================================================
// INSPECTION APIs - SC_TECHNICAL Inspection Workflow
// =============================================================================

export const inspectionAPI = {
  // GET /api/inspections/claims/{claimId}/warranty-parts - Lấy danh sách phụ tùng warranty cho claim
  getWarrantyPartsForClaim: (claimId) =>
    apiService.get(`/inspections/claims/${claimId}/warranty-parts`),

  // POST /api/inspections/submit - Submit kết quả kiểm tra
  submitInspectionResult: (data) =>
    apiService.post("/inspections/submit", data),

  // GET /api/inspections/claims/{claimId}/result - Lấy kết quả kiểm tra của claim
  getInspectionResult: (claimId) =>
    apiService.get(`/inspections/claims/${claimId}/result`),
};

// =============================================================================
// REPORT APIs - Report Management System
// =============================================================================

export const reportAPI = {
  // POST /api/reports - SC_STAFF tạo báo cáo mới
  createReport: (data) => apiService.post("/reports", data),

  // POST /api/reports/review - SC_ADMIN duyệt báo cáo
  reviewReport: (data) => apiService.post("/reports/review", data),

  // POST /api/reports/forward - SC_ADMIN chuyển tiếp cho EVM_ADMIN
  forwardToEvmAdmin: (data) => apiService.post("/reports/forward", data),

  // GET /api/reports/{id} - Lấy chi tiết báo cáo
  getReportById: (id) => apiService.get(`/reports/${id}`),

  // GET /api/reports - Lấy danh sách tất cả báo cáo
  getAllReports: (params = {}) => {
    const {
      page = 0,
      size = 10,
      sortBy = "submittedAt",
      sortDir = "desc",
    } = params;
    return apiService.get(
      `/reports?page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`
    );
  },

  // GET /api/reports/status/{status} - Lấy báo cáo theo trạng thái
  getReportsByStatus: (status, params = {}) => {
    const { page = 0, size = 10 } = params;
    return apiService.get(
      `/reports/status/${status}?page=${page}&size=${size}`
    );
  },

  // GET /api/reports/staff/{scStaffId} - Lấy báo cáo của SC_STAFF
  getReportsByStaff: (scStaffId, params = {}) => {
    const { page = 0, size = 10 } = params;
    return apiService.get(
      `/reports/staff/${scStaffId}?page=${page}&size=${size}`
    );
  },

  // GET /api/reports/pending-review - Lấy báo cáo chờ duyệt
  getPendingReviewReports: (params = {}) => {
    const { page = 0, size = 10 } = params;
    return apiService.get(`/reports/pending-review?page=${page}&size=${size}`);
  },

  // PUT /api/reports/{id} - Update report (title, description, status, error, image)
  updateReport: (reportId, data) =>
    apiService.put(`/reports/${reportId}`, data),

  // DELETE /api/reports/{id} - Delete report
  deleteReport: (reportId) =>
    apiService.delete(`/reports/${reportId}`),

  // POST /api/reports/{reportId}/service-campaigns/{serviceCampaignId} - Assign Service Campaign
  assignServiceCampaign: (reportId, serviceCampaignId) =>
    apiService.post(`/reports/${reportId}/service-campaigns/${serviceCampaignId}`),

  // POST /api/reports/{reportId}/recalls/{recallId} - Assign Recall
  assignRecall: (reportId, recallId) =>
    apiService.post(`/reports/${reportId}/recalls/${recallId}`),

  // POST /api/reports/{reportId}/warranty-claims/{warrantyClaimId} - Assign Warranty Claim
  assignWarrantyClaim: (reportId, warrantyClaimId) =>
    apiService.post(`/reports/${reportId}/warranty-claims/${warrantyClaimId}`),
};

// =============================================================================
// CAMPAIGN & RECALL APIs - District-based Assignment
// =============================================================================

export const campaignDistrictAPI = {
  // GET /api/ServiceCampaigns/district/{district} - Lấy campaigns theo quận
  getCampaignsByDistrict: (district, params = {}) => {
    const { page = 0, size = 10 } = params;
    return apiService.get(
      `/ServiceCampaigns/district/${district}?page=${page}&size=${size}`
    );
  },

  // POST /api/ServiceCampaigns/{id}/assign-technicians-by-district - Phân công kỹ thuật viên
  assignTechniciansByDistrict: (campaignId, data) =>
    apiService.post(
      `/ServiceCampaigns/${campaignId}/assign-technicians-by-district`,
      data
    ),

  // GET /api/ServiceCampaigns/{id}/progress - Lấy tiến độ campaign
  getCampaignProgress: (campaignId) =>
    apiService.get(`/ServiceCampaigns/${campaignId}/progress`),
};

export const recallAPI = {
  // GET /api/recalls - Lấy danh sách tất cả recalls
  getAllRecalls: (params = {}) => {
    const {
      page = 0,
      size = 10,
      sortBy = "startDate",
      sortDir = "desc",
    } = params;
    return apiService.get(
      `/recalls?page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`
    );
  },

  // GET /api/recalls/{id} - Lấy chi tiết recall
  getRecallById: (id) => apiService.get(`/recalls/${id}`),

  // POST /api/recalls - Tạo recall mới
  createRecall: (data) => apiService.post('/recalls', data),

  // PUT /api/recalls/{id} - Cập nhật recall
  updateRecall: (id, data) => apiService.put(`/recalls/${id}`, data),

  // DELETE /api/recalls/{id} - Xóa recall
  deleteRecall: (id) => apiService.delete(`/recalls/${id}`),

  // PATCH /api/recalls/{id}/status - Cập nhật trạng thái
  updateRecallStatus: (id, status) => 
    apiService.patch(`/recalls/${id}/status?statusDTO=${status}`),

  // PATCH /api/recalls/{id}/notification - Cập nhật notification sent
  updateNotificationSent: (id, notificationSent) =>
    apiService.patch(`/recalls/${id}/notification?notificationDTO=${notificationSent}`),

  // POST /api/recalls/{id}/vehicles/{vehicleId} - Thêm 1 xe vào recall
  addVehicleToRecall: (recallId, vehicleId) =>
    apiService.post(`/recalls/${recallId}/vehicles/${vehicleId}`),

  // GET /api/recalls/{id}/vehicles - Lấy danh sách xe đã được gán
  getAssignedVehicles: (id) =>
    apiService.get(`/recalls/${id}/vehicles`),

  // GET /api/recalls/{recallId}/vehicles/{vehicleId} - Lấy chi tiết xe trong recall
  getRecallVehicleDetail: (recallId, vehicleId) =>
    apiService.get(`/recalls/${recallId}/vehicles/${vehicleId}`),

  // PATCH /api/recalls/{recallId}/vehicles/{vehicleId}/status - Cập nhật trạng thái xe trong recall
  updateRecallVehicleStatus: (recallId, vehicleId, statusDTO) =>
    apiService.patch(`/recalls/${recallId}/vehicles/${vehicleId}/status`, statusDTO),

  // POST /api/recalls/{id}/technicians/{technicianId} - Thêm kỹ thuật viên vào recall
  addTechnicianToRecall: (recallId, technicianId) =>
    apiService.post(`/recalls/${recallId}/technicians/${technicianId}`),

  // GET /api/technicians/{technicianId}/recalls - Lấy recalls theo technicianId
  getRecallsByTechnicianId: (technicianId) =>
    apiService.get(`/technicians/${technicianId}/recalls`)
};

export const recallDistrictAPI = {
  // GET /api/recalls/district/{district} - Lấy recalls theo quận
  getRecallsByDistrict: (district, params = {}) => {
    const { page = 0, size = 10 } = params;
    return apiService.get(
      `/recalls/district/${district}?page=${page}&size=${size}`
    );
  },

  // POST /api/recalls/{id}/assign-technicians-by-district - Phân công kỹ thuật viên
  assignTechniciansByDistrict: (recallId, data) =>
    apiService.post(
      `/recalls/${recallId}/assign-technicians-by-district`,
      data
    ),

  // GET /api/recalls/{id}/progress - Lấy tiến độ recall
  getRecallProgress: (recallId) =>
    apiService.get(`/recalls/${recallId}/progress`),
};

// Export default object với tất cả APIs
export default {
  auth: authAPI,
  user: userAPI,
  scTechnician: scTechnicianAPI,
  warrantyClaim: warrantyClaimAPI,
  vehicle: vehicleAPI,
  serviceCampaign: serviceCampaignAPI,
  partsRequest: partsRequestAPI,
  evmInventory: evmInventoryAPI,
  scInventory: scInventoryAPI,
  passwordRecovery: passwordRecoveryAPI,
  notification: notificationAPI,
  inspection: inspectionAPI,
  report: reportAPI,
  campaignDistrict: campaignDistrictAPI,
  recallDistrict: recallDistrictAPI,
};
