/* ==========================================================================
   GIAO HÀNG NHANH (GHN) SERVICE
   Tích hợp API Giao Hàng Nhanh để vận chuyển phụ tùng
   ========================================================================== */

import axios from 'axios';

// GHN API Configuration
// STAGING: https://online-gateway.ghn.vn/shiip/public-api (5sao.ghn.dev)
// PRODUCTION: https://online-gateway.ghn.vn/shiip/public-api (khachhang.ghn.vn)
const GHN_API_BASE_URL = 'https://online-gateway.ghn.vn/shiip/public-api';
const GHN_TOKEN = import.meta.env.VITE_GHN_TOKEN || ''; // Store in .env file
const GHN_SHOP_ID = import.meta.env.VITE_GHN_SHOP_ID || ''; // Store in .env file

// Create axios instance for GHN API
const ghnAxios = axios.create({
  baseURL: GHN_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Token': GHN_TOKEN,
  },
});

// Add shop_id to all requests if available
ghnAxios.interceptors.request.use((config) => {
  if (GHN_SHOP_ID && config.method === 'post') {
    config.data = {
      ...config.data,
      shop_id: parseInt(GHN_SHOP_ID),
    };
  }
  return config;
});

const GHNService = {
  /**
   * Lấy danh sách tỉnh/thành phố
   */
  getProvinces: async () => {
    try {
      const response = await ghnAxios.get('/master-data/province');
      return response.data;
    } catch (error) {
      console.error('Get provinces error:', error);
      throw error;
    }
  },

  /**
   * Lấy danh sách quận/huyện theo tỉnh
   * @param {number} provinceId - ID của tỉnh/thành phố
   */
  getDistricts: async (provinceId) => {
    try {
      const response = await ghnAxios.get('/master-data/district', {
        params: { province_id: provinceId },
      });
      return response.data;
    } catch (error) {
      console.error('Get districts error:', error);
      throw error;
    }
  },

  /**
   * Lấy danh sách phường/xã theo quận
   * @param {number} districtId - ID của quận/huyện
   */
  getWards: async (districtId) => {
    try {
      const response = await ghnAxios.get('/master-data/ward', {
        params: { district_id: districtId },
      });
      return response.data;
    } catch (error) {
      console.error('Get wards error:', error);
      throw error;
    }
  },

  /**
   * Lấy danh sách dịch vụ vận chuyển
   * @param {number} fromDistrict - ID quận/huyện người gửi
   * @param {number} toDistrict - ID quận/huyện người nhận
   */
  getServices: async (fromDistrict, toDistrict) => {
    try {
      const response = await ghnAxios.post('/v2/shipping-order/available-services', {
        shop_id: parseInt(GHN_SHOP_ID),
        from_district: fromDistrict,
        to_district: toDistrict,
      });
      return response.data;
    } catch (error) {
      console.error('Get services error:', error);
      throw error;
    }
  },

  /**
   * Tính phí vận chuyển
   * @param {Object} params - Thông tin tính phí
   */
  calculateFee: async (params) => {
    try {
      const response = await ghnAxios.post('/v2/shipping-order/fee', {
        service_id: params.serviceId,
        insurance_value: params.insuranceValue || 0,
        coupon: params.coupon || null,
        from_district_id: params.fromDistrict,
        to_district_id: params.toDistrict,
        to_ward_code: params.toWardCode,
        height: params.height || 10,
        length: params.length || 20,
        weight: params.weight || 500,
        width: params.width || 20,
      });
      return response.data;
    } catch (error) {
      console.error('Calculate fee error:', error);
      throw error;
    }
  },

  /**
   * Tính thời gian giao hàng dự kiến
   * @param {Object} params - Thông tin tính thời gian
   */
  calculateLeadTime: async (params) => {
    try {
      const response = await ghnAxios.post('/v2/shipping-order/leadtime', {
        from_district_id: params.fromDistrict,
        from_ward_code: params.fromWardCode,
        to_district_id: params.toDistrict,
        to_ward_code: params.toWardCode,
        service_id: params.serviceId,
      });
      return response.data;
    } catch (error) {
      console.error('Calculate lead time error:', error);
      throw error;
    }
  },

  /**
   * Tạo đơn hàng giao hàng
   * @param {Object} orderData - Thông tin đơn hàng
   */
  createOrder: async (orderData) => {
    try {
      const response = await ghnAxios.post('/v2/shipping-order/create', {
        payment_type_id: orderData.paymentTypeId || 1, // 1: Người gửi trả, 2: Người nhận trả
        note: orderData.note || '',
        required_note: orderData.requiredNote || 'KHONGCHOXEMHANG', // CHOTHUHANG, CHOXEMHANGKHONGTHU, KHONGCHOXEMHANG
        return_phone: orderData.returnPhone,
        return_address: orderData.returnAddress,
        return_district_id: orderData.returnDistrictId,
        return_ward_code: orderData.returnWardCode,
        client_order_code: orderData.clientOrderCode || '',
        to_name: orderData.toName,
        to_phone: orderData.toPhone,
        to_address: orderData.toAddress,
        to_ward_code: orderData.toWardCode,
        to_district_id: orderData.toDistrictId,
        cod_amount: orderData.codAmount || 0,
        content: orderData.content || 'Phụ tùng xe điện',
        weight: orderData.weight || 500,
        length: orderData.length || 20,
        width: orderData.width || 20,
        height: orderData.height || 10,
        insurance_value: orderData.insuranceValue || 0,
        service_id: orderData.serviceId,
        service_type_id: orderData.serviceTypeId || 2, // 2: Hàng nhẹ
        items: orderData.items || [],
      });
      return response.data;
    } catch (error) {
      console.error('Create order error:', error);
      throw error;
    }
  },

  /**
   * Lấy thông tin chi tiết đơn hàng
   * @param {string} orderCode - Mã đơn hàng GHN
   */
  getOrderDetail: async (orderCode) => {
    try {
      const response = await ghnAxios.post('/v2/shipping-order/detail', {
        order_code: orderCode,
      });
      return response.data;
    } catch (error) {
      console.error('Get order detail error:', error);
      throw error;
    }
  },

  /**
   * In phiếu giao hàng
   * @param {Array} orderCodes - Danh sách mã đơn hàng
   */
  printOrder: async (orderCodes) => {
    try {
      const response = await ghnAxios.post('/v2/a5/gen-token', {
        order_codes: orderCodes,
      });
      return response.data;
    } catch (error) {
      console.error('Print order error:', error);
      throw error;
    }
  },

  /**
   * Hủy đơn hàng
   * @param {Array} orderCodes - Danh sách mã đơn hàng cần hủy
   */
  cancelOrder: async (orderCodes) => {
    try {
      const response = await ghnAxios.post('/v2/switch-status/cancel', {
        order_codes: orderCodes,
      });
      return response.data;
    } catch (error) {
      console.error('Cancel order error:', error);
      throw error;
    }
  },

  /**
   * Lấy trạng thái đơn hàng
   * @param {string} orderCode - Mã đơn hàng
   */
  getOrderStatus: async (orderCode) => {
    try {
      const response = await ghnAxios.post('/v2/shipping-order/detail', {
        order_code: orderCode,
      });
      return response.data;
    } catch (error) {
      console.error('Get order status error:', error);
      throw error;
    }
  },

  /**
   * Format địa chỉ đầy đủ
   */
  formatFullAddress: (address, wardName, districtName, provinceName) => {
    return `${address}, ${wardName}, ${districtName}, ${provinceName}`;
  },
};

export default GHNService;
