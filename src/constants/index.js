/* ==========================================================================
   CONSTANTS - Các hằng số cố định trong hệ thống
   ========================================================================== */

// =============================================================================
// USER ROLES - Vai trò người dùng
// =============================================================================

export const USER_ROLES = [
  { value: "SC_STAFF", label: "Nhân viên SC", department: "Service Center" },
  {
    value: "SC_TECHNICAL",
    label: "Kỹ thuật viên SC",
    department: "Service Center",
  },
  { value: "SC_ADMIN", label: "Quản lý SC", department: "Service Center" },
  { value: "EVM_STAFF", label: "Nhân viên EVM", department: "Manufacturing" },
  { value: "EVM_ADMIN", label: "Quản lý EVM", department: "Manufacturing" },
];

export const ROLE_DESCRIPTIONS = {
  SC_STAFF: "Quản lý hồ sơ xe, tạo yêu cầu bảo hành, thực hiện chiến dịch",
  SC_TECHNICAL: "Thực hiện sửa chữa, bảo dưỡng, cập nhật tiến độ công việc",
  SC_ADMIN: "Quản lý Service Center, phê duyệt yêu cầu, quản lý nhân viên SC",
  EVM_STAFF: "Quản lý sản phẩm, phê duyệt bảo hành, tạo chiến dịch recall",
  EVM_ADMIN: "Quản lý toàn bộ hệ thống EVM, người dùng, báo cáo và phân quyền",
};

// =============================================================================
// WARRANTY CLAIM STATUS - Trạng thái yêu cầu bảo hành
// =============================================================================

export const WARRANTY_CLAIM_STATUS = {
  PENDING: "Chờ duyệt",
  IN_PROGRESS: "Đang xử lý",
  APPROVED: "Đã duyệt",
  REJECTED: "Từ chối",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
};

export const WARRANTY_CLAIM_STATUS_OPTIONS = [
  { value: "PENDING", label: "Chờ duyệt" },
  { value: "IN_PROGRESS", label: "Đang xử lý" },
  { value: "APPROVED", label: "Đã duyệt" },
  { value: "REJECTED", label: "Từ chối" },
  { value: "COMPLETED", label: "Hoàn thành" },
  { value: "CANCELLED", label: "Đã hủy" },
];

// =============================================================================
// VEHICLE STATUS - Trạng thái xe
// =============================================================================

export const VEHICLE_STATUS = {
  ACTIVE: "Đang sử dụng",
  IN_WARRANTY: "Trong bảo hành",
  INACTIVE: "Ngừng hoạt động",
  RECALLED: "Đã triệu hồi",
  RETIRED: "Đã thanh lý",
};

export const VEHICLE_STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Đang sử dụng" },
  { value: "IN_WARRANTY", label: "Trong bảo hành" },
  { value: "INACTIVE", label: "Ngừng hoạt động" },
  { value: "RECALLED", label: "Đã triệu hồi" },
  { value: "RETIRED", label: "Đã thanh lý" },
];

// =============================================================================
// VEHICLE TYPES - Loại xe điện VinFast
// =============================================================================

export const VEHICLE_TYPES = [
  { id: "EVT001", name: "VinFast VF5 Plus" },
  { id: "EVT002", name: "VinFast VF6" },
  { id: "EVT003", name: "VinFast VF7" },
  { id: "EVT004", name: "VinFast VF8" },
  { id: "EVT005", name: "VinFast VF9" },
  { id: "EVT006", name: "VinFast VF e34" },
];

// =============================================================================
// REGIONS - Khu vực áp dụng (Quận ở TP.HCM)
// =============================================================================

export const REGIONS = [
  { value: "Q1", label: "Quận 1" },
  { value: "Q3", label: "Quận 3" },
  { value: "Q4", label: "Quận 4" },
  { value: "Q5", label: "Quận 5" },
  { value: "Q6", label: "Quận 6" },
  { value: "Q7", label: "Quận 7" },
  { value: "Q8", label: "Quận 8" },
  { value: "Q10", label: "Quận 10" },
  { value: "Q11", label: "Quận 11" },
  { value: "Q12", label: "Quận 12" },
  { value: "BinhTan", label: "Bình Tân" },
  { value: "BinhThanh", label: "Bình Thạnh" },
  { value: "GoVap", label: "Gò Vấp" },
  { value: "PhuNhuan", label: "Phú Nhuận" },
  { value: "TanBinh", label: "Tân Bình" },
  { value: "TanPhu", label: "Tân Phú" },
  { value: "ThuDuc", label: "Thủ Đức" },
  { value: "NhaBe", label: "Nhà Bè" },
  { value: "CanGio", label: "Cần Giờ" },
  { value: "CuChi", label: "Củ Chi" },
  { value: "HocMon", label: "Hóc Môn" },
  { value: "ALL", label: "Toàn TP.HCM" },
];

// =============================================================================
// PRODUCTION YEARS - Năm sản xuất
// =============================================================================

export const PRODUCTION_YEARS = [
  { value: "2020", label: "2020" },
  { value: "2021", label: "2021" },
  { value: "2022", label: "2022" },
  { value: "2023", label: "2023" },
  { value: "2024", label: "2024" },
  { value: "2025", label: "2025" },
];

// =============================================================================
// PARTS CATEGORIES - Danh mục phụ tùng
// =============================================================================

export const PARTS_CATEGORIES = [
  { value: "Battery Pack", label: "Battery Pack - Pin" },
  { value: "Electric Motor", label: "Electric Motor - Motor điện" },
  { value: "BMS", label: "BMS - Hệ thống quản lý pin" },
  { value: "Inverter", label: "Inverter - Biến tần" },
  { value: "Charger", label: "Charger - Bộ sạc" },
  { value: "Brake System", label: "Brake System - Hệ thống phanh" },
  { value: "Suspension", label: "Suspension - Hệ thống treo" },
  { value: "Body Parts", label: "Body Parts - Phụ tùng thân xe" },
  { value: "Electronics", label: "Electronics - Điện tử" },
  { value: "Interior", label: "Interior - Nội thất" },
];

// =============================================================================
// PARTS CONDITION - Tình trạng phụ tùng
// =============================================================================

export const PARTS_CONDITIONS = [
  { value: "NEW", label: "Mới" },
  { value: "USED", label: "Đã qua sử dụng" },
  { value: "REFURBISHED", label: "Tân trang" },
];

// =============================================================================
// PARTS STATUS - Trạng thái kho phụ tùng
// =============================================================================

// Parts Request Status (SC → EVM flow)
export const PARTS_REQUEST_STATUS = {
  PENDING: "Chờ duyệt", // SC created request
  APPROVED: "Đã duyệt", // EVM approved (has stock)
  REJECTED: "Từ chối", // EVM rejected (no stock)
  ORDERED: "Đang chuẩn bị", // EVM preparing shipment
  IN_TRANSIT: "Đang vận chuyển", // Shipped from EVM to SC
  DELIVERED: "Đã giao hàng", // SC received parts
  COMPLETED: "Hoàn thành", // Parts added to SC inventory
  CANCELLED: "Đã hủy", // Request cancelled
};

export const PARTS_REQUEST_STATUS_OPTIONS = [
  { value: "PENDING", label: "Chờ duyệt" },
  { value: "APPROVED", label: "Đã duyệt" },
  { value: "REJECTED", label: "Từ chối" },
  { value: "ORDERED", label: "Đang chuẩn bị" },
  { value: "IN_TRANSIT", label: "Đang vận chuyển" },
  { value: "DELIVERED", label: "Đã giao hàng" },
  { value: "COMPLETED", label: "Hoàn thành" },
  { value: "CANCELLED", label: "Đã hủy" },
];

// Parts Inventory Status (in SC warehouse)
export const PARTS_INVENTORY_STATUS = [
  { value: "IN_STOCK", label: "Còn hàng" },
  { value: "LOW_STOCK", label: "Thiếu hàng" },
  { value: "OUT_OF_STOCK", label: "Hết hàng" },
];

// Keep old PARTS_STATUS for backward compatibility
export const PARTS_STATUS = [
  { value: "IN_STOCK", label: "Còn hàng" },
  { value: "LOW_STOCK", label: "Thiếu hàng" },
  { value: "OUT_OF_STOCK", label: "Hết hàng" },
];

// =============================================================================
// MANUFACTURERS - Nhà sản xuất phụ tùng
// =============================================================================

export const MANUFACTURERS = [
  { value: "VinFast", label: "VinFast" },
  { value: "Bosch", label: "Bosch" },
  { value: "Continental", label: "Continental" },
  { value: "Denso", label: "Denso" },
  { value: "Magna", label: "Magna" },
  { value: "LG Energy", label: "LG Energy Solution" },
  { value: "Samsung SDI", label: "Samsung SDI" },
];

// =============================================================================
// PRIORITY LEVELS - Mức độ ưu tiên
// =============================================================================

export const PRIORITY_LEVELS = [
  { value: "LOW", label: "Thấp" },
  { value: "MEDIUM", label: "Trung bình" },
  { value: "HIGH", label: "Cao" },
  { value: "URGENT", label: "Khẩn cấp" },
];

// =============================================================================
// SEVERITY LEVELS - Mức độ nghiêm trọng (cho Recall)
// =============================================================================

export const SEVERITY_LEVELS = [
  { value: "LOW", label: "Thấp - Vấn đề nhỏ, không ảnh hưởng an toàn" },
  { value: "MEDIUM", label: "Trung bình - Ảnh hưởng hiệu suất hoặc tính năng" },
  { value: "HIGH", label: "Cao - Ảnh hưởng an toàn hoặc nguy cơ hư hại" },
  {
    value: "CRITICAL",
    label: "Cực cao - Nguy hiểm nghiêm trọng, cần xử lý ngay",
  },
];

// =============================================================================
// REPORT TYPES - Loại báo cáo
// =============================================================================

export const REPORT_TYPES = [
  {
    value: "WARRANTY_ANALYSIS",
    label: "Warranty Analysis - Phân tích bảo hành",
  },
  {
    value: "CAMPAIGN_PERFORMANCE",
    label: "Campaign Performance - Hiệu suất chiến dịch",
  },
  { value: "RECALL_PROGRESS", label: "Recall Progress - Tiến độ recall" },
  { value: "PARTS_ANALYSIS", label: "Parts Analysis - Phân tích phụ tùng" },
  { value: "SERVICE_QUALITY", label: "Service Quality - Chất lượng dịch vụ" },
  {
    value: "CUSTOMER_SATISFACTION",
    label: "Customer Satisfaction - Hài lòng khách hàng",
  },
  { value: "MONTHLY_SUMMARY", label: "Monthly Summary - Tổng hợp tháng" },
  { value: "ANNUAL_REVIEW", label: "Annual Review - Đánh giá năm" },
];

// =============================================================================
// CAMPAIGN STATUS - Trạng thái chiến dịch
// =============================================================================

export const CAMPAIGN_STATUS = [
  { value: "DRAFT", label: "Nháp" },
  { value: "PLANNED", label: "Đã lên kế hoạch" },
  { value: "ACTIVE", label: "Đang triển khai" },
  { value: "IN_PROGRESS", label: "Đang thực hiện" },
  { value: "COMPLETED", label: "Hoàn thành" },
  { value: "CANCELLED", label: "Đã hủy" },
];

// =============================================================================
// TECHNICIAN SPECIALTIES - Chuyên môn kỹ thuật viên
// =============================================================================

export const TECHNICIAN_SPECIALTIES = [
  { value: "SOFTWARE", label: "Phần mềm" },
  { value: "ELECTRICAL", label: "Điện" },
  { value: "MECHANICAL", label: "Cơ khí" },
  { value: "BATTERY", label: "Pin & Năng lượng" },
  { value: "GENERAL", label: "Tổng hợp" },
];

// =============================================================================
// PASSWORD REQUIREMENTS - Yêu cầu mật khẩu
// =============================================================================

export const PASSWORD_REQUIREMENTS = [
  { text: "Ít nhất 6 ký tự", regex: /.{6,}/ },
  { text: "Chứa chữ hoa", regex: /[A-Z]/ },
  { text: "Chứa chữ thường", regex: /[a-z]/ },
  { text: "Chứa số", regex: /\d/ },
];

// =============================================================================
// PAGINATION - Cấu hình phân trang
// =============================================================================

export const PAGINATION_CONFIG = {
  DEFAULT_PAGE: 0,
  DEFAULT_SIZE: 10,
  PAGE_SIZE_OPTIONS: [5, 10, 20, 50, 100],
};

// =============================================================================
// DATE FORMATS - Định dạng ngày tháng
// =============================================================================

export const DATE_FORMATS = {
  BACKEND: "dd-MM-yyyy",
  DISPLAY: "DD/MM/YYYY",
  INPUT: "yyyy-MM-dd",
};

// =============================================================================
// VALIDATION PATTERNS - Các pattern validation
// =============================================================================

export const VALIDATION_PATTERNS = {
  PHONE: /^[0-9]{10,11}$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  VIN: /^[A-HJ-NPR-Z0-9]{17}$/,
  POSTAL_CODE: /^[0-9]{5,6}$/,
};

// =============================================================================
// ERROR MESSAGES - Thông báo lỗi
// =============================================================================

export const ERROR_MESSAGES = {
  REQUIRED: "Trường này là bắt buộc",
  INVALID_EMAIL: "Email không hợp lệ",
  INVALID_PHONE: "Số điện thoại không hợp lệ (10-11 số)",
  INVALID_VIN: "VIN không hợp lệ (phải có 17 ký tự)",
  PASSWORD_TOO_SHORT: "Mật khẩu phải có ít nhất 6 ký tự",
  PASSWORD_MISMATCH: "Xác nhận mật khẩu không khớp",
  MIN_VALUE: (min) => `Giá trị phải lớn hơn hoặc bằng ${min}`,
  MAX_LENGTH: (max) => `Không được vượt quá ${max} ký tự`,
};

// Export default object
// =============================================================================
// RECALL VEHICLE STATUS - Trạng thái xe trong recall
// =============================================================================

export const RECALL_VEHICLE_STATUS = {
  PENDING: "Chờ xử lý",
  NOTIFIED: "Đã thông báo",
  SCHEDULED: "Đã lên lịch",
  IN_PROGRESS: "Đang xử lý",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
};

export const RECALL_VEHICLE_STATUS_OPTIONS = [
  { value: "PENDING", label: "Chờ xử lý" },
  { value: "NOTIFIED", label: "Đã thông báo" },
  { value: "SCHEDULED", label: "Đã lên lịch" },
  { value: "IN_PROGRESS", label: "Đang xử lý" },
  { value: "COMPLETED", label: "Hoàn thành" },
  { value: "CANCELLED", label: "Đã hủy" },
];

export default {
  USER_ROLES,
  ROLE_DESCRIPTIONS,
  WARRANTY_CLAIM_STATUS,
  WARRANTY_CLAIM_STATUS_OPTIONS,
  VEHICLE_STATUS,
  VEHICLE_STATUS_OPTIONS,
  VEHICLE_TYPES,
  REGIONS,
  PRODUCTION_YEARS,
  PARTS_CATEGORIES,
  PARTS_CONDITIONS,
  PARTS_INVENTORY_STATUS,
  PARTS_STATUS,
  PARTS_REQUEST_STATUS,
  PARTS_REQUEST_STATUS_OPTIONS,
  MANUFACTURERS,
  PRIORITY_LEVELS,
  SEVERITY_LEVELS,
  REPORT_TYPES,
  CAMPAIGN_STATUS,
  RECALL_VEHICLE_STATUS,
  RECALL_VEHICLE_STATUS_OPTIONS,
  TECHNICIAN_SPECIALTIES,
  PASSWORD_REQUIREMENTS,
  PAGINATION_CONFIG,
  DATE_FORMATS,
  VALIDATION_PATTERNS,
  ERROR_MESSAGES,
};
