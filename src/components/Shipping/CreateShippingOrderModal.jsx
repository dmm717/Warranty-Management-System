import React, { useState, useEffect } from 'react';
import GHNService from '../../services/GHNService';
import Swal from 'sweetalert2';
import '../../styles/CreateShippingOrderModal.css';

const CreateShippingOrderModal = ({ request, onClose, onSuccess }) => {
  const [step, setStep] = useState(1); // 1: Thông tin người nhận, 2: Xác nhận
  const [loading, setLoading] = useState(false);

  // Address data
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  
  // Form data
  const [formData, setFormData] = useState({
    // Người nhận
    toName: '',
    toPhone: '',
    toAddress: '',
    toProvinceId: '',
    toDistrictId: '',
    toWardCode: '',
    
    // Người gửi (EVM)
    returnPhone: '0123456789', // Default EVM phone
    returnAddress: '123 Đường ABC, Khu công nghệ cao', // Default EVM address
    returnProvinceId: 202, // Default: TP.HCM
    returnDistrictId: 1442, // Default: Quận 9
    returnWardCode: '21211', // Default: Phường Long Thạnh Mỹ
    
    // Thông tin đơn hàng
    note: request?.reason || '',
    weight: 500, // gram
    length: 20, // cm
    width: 20, // cm
    height: 10, // cm
    insuranceValue: 0,
    codAmount: 0,
    paymentTypeId: 1, // 1: Người gửi trả phí
    requiredNote: 'KHONGCHOXEMHANG',
  });

  // Service & Fee
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [shippingFee, setShippingFee] = useState(null);
  const [leadTime, setLeadTime] = useState(null);

  useEffect(() => {
    loadProvinces();
  }, []);

  useEffect(() => {
    if (formData.toProvinceId) {
      loadDistricts(formData.toProvinceId);
    }
  }, [formData.toProvinceId]);

  useEffect(() => {
    if (formData.toDistrictId) {
      loadWards(formData.toDistrictId);
    }
  }, [formData.toDistrictId]);

  useEffect(() => {
    if (formData.toDistrictId && formData.returnDistrictId) {
      loadServices();
    }
  }, [formData.toDistrictId, formData.returnDistrictId]);

  const loadProvinces = async () => {
    try {
      const response = await GHNService.getProvinces();
      setProvinces(response.data || []);
    } catch (error) {
      console.error('Error loading provinces:', error);
    }
  };

  const loadDistricts = async (provinceId) => {
    try {
      const response = await GHNService.getDistricts(provinceId);
      setDistricts(response.data || []);
      setWards([]);
      setFormData(prev => ({ ...prev, toDistrictId: '', toWardCode: '' }));
    } catch (error) {
      console.error('Error loading districts:', error);
    }
  };

  const loadWards = async (districtId) => {
    try {
      const response = await GHNService.getWards(districtId);
      setWards(response.data || []);
      setFormData(prev => ({ ...prev, toWardCode: '' }));
    } catch (error) {
      console.error('Error loading wards:', error);
    }
  };

  const loadServices = async () => {
    try {
      const response = await GHNService.getServices(
        formData.returnDistrictId,
        parseInt(formData.toDistrictId)
      );
      setServices(response.data || []);
      
      // Tự động chọn service đầu tiên
      if (response.data && response.data.length > 0) {
        setSelectedService(response.data[0].service_id);
      }
    } catch (error) {
      console.error('Error loading services:', error);
    }
  };

  const calculateFee = async () => {
    if (!selectedService || !formData.toWardCode) return;

    try {
      setLoading(true);
      const response = await GHNService.calculateFee({
        serviceId: selectedService,
        insuranceValue: formData.insuranceValue,
        fromDistrict: formData.returnDistrictId,
        toDistrict: parseInt(formData.toDistrictId),
        toWardCode: formData.toWardCode,
        height: formData.height,
        length: formData.length,
        weight: formData.weight,
        width: formData.width,
      });
      
      setShippingFee(response.data);
    } catch (error) {
      console.error('Error calculating fee:', error);
      Swal.fire({
        icon: 'error',
        title: 'Lỗi!',
        text: 'Không thể tính phí vận chuyển',
        confirmButtonColor: '#ef4444',
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateLeadTime = async () => {
    if (!selectedService || !formData.toWardCode) return;

    try {
      const response = await GHNService.calculateLeadTime({
        fromDistrict: formData.returnDistrictId,
        fromWardCode: formData.returnWardCode,
        toDistrict: parseInt(formData.toDistrictId),
        toWardCode: formData.toWardCode,
        serviceId: selectedService,
      });
      
      setLeadTime(response.data);
    } catch (error) {
      console.error('Error calculating lead time:', error);
    }
  };

  useEffect(() => {
    if (selectedService && formData.toWardCode) {
      calculateFee();
      calculateLeadTime();
    }
  }, [selectedService, formData.toWardCode]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateStep1 = () => {
    if (!formData.toName.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Thiếu thông tin!',
        text: 'Vui lòng nhập tên người nhận',
        confirmButtonColor: '#f59e0b',
      });
      return false;
    }

    if (!formData.toPhone.trim() || !/^0\d{9}$/.test(formData.toPhone)) {
      Swal.fire({
        icon: 'warning',
        title: 'Thiếu thông tin!',
        text: 'Vui lòng nhập số điện thoại hợp lệ (10 số, bắt đầu bằng 0)',
        confirmButtonColor: '#f59e0b',
      });
      return false;
    }

    if (!formData.toAddress.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Thiếu thông tin!',
        text: 'Vui lòng nhập địa chỉ người nhận',
        confirmButtonColor: '#f59e0b',
      });
      return false;
    }

    if (!formData.toProvinceId || !formData.toDistrictId || !formData.toWardCode) {
      Swal.fire({
        icon: 'warning',
        title: 'Thiếu thông tin!',
        text: 'Vui lòng chọn đầy đủ Tỉnh/Thành, Quận/Huyện, Phường/Xã',
        confirmButtonColor: '#f59e0b',
      });
      return false;
    }

    return true;
  };

  const handleNextStep = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleCreateOrder = async () => {
    if (!selectedService) {
      Swal.fire({
        icon: 'warning',
        title: 'Thiếu thông tin!',
        text: 'Vui lòng chọn dịch vụ vận chuyển',
        confirmButtonColor: '#f59e0b',
      });
      return;
    }

    try {
      setLoading(true);

      const orderData = {
        payment_type_id: formData.paymentTypeId,
        note: formData.note,
        required_note: formData.requiredNote,
        return_phone: formData.returnPhone,
        return_address: formData.returnAddress,
        return_district_id: formData.returnDistrictId,
        return_ward_code: formData.returnWardCode,
        client_order_code: `PR-${request.id}-${Date.now()}`,
        to_name: formData.toName,
        to_phone: formData.toPhone,
        to_address: formData.toAddress,
        to_ward_code: formData.toWardCode,
        to_district_id: parseInt(formData.toDistrictId),
        cod_amount: formData.codAmount,
        content: `Phụ tùng: ${request.partTypeName}`,
        weight: formData.weight,
        length: formData.length,
        width: formData.width,
        height: formData.height,
        insurance_value: formData.insuranceValue,
        service_id: selectedService,
        service_type_id: 2,
        items: [
          {
            name: request.partTypeName,
            code: request.partNumber || 'PART-001',
            quantity: request.quantity,
            price: 0,
            weight: formData.weight,
          },
        ],
      };

      const response = await GHNService.createOrder(orderData);
      
      if (response.code === 200 && response.data) {
        onSuccess({
          ...response.data,
          ...formData,
          total_fee: shippingFee?.total,
          expected_delivery_time: leadTime?.leadtime,
        });
      } else {
        throw new Error(response.message || 'Tạo đơn hàng thất bại');
      }
    } catch (error) {
      console.error('Error creating order:', error);
      Swal.fire({
        icon: 'error',
        title: 'Lỗi!',
        text: error.response?.data?.message || error.message || 'Không thể tạo đơn giao hàng',
        confirmButtonColor: '#ef4444',
      });
    } finally {
      setLoading(false);
    }
  };

  const getProvinceName = (id) => {
    const province = provinces.find(p => p.ProvinceID === parseInt(id));
    return province ? province.ProvinceName : '';
  };

  const getDistrictName = (id) => {
    const district = districts.find(d => d.DistrictID === parseInt(id));
    return district ? district.DistrictName : '';
  };

  const getWardName = (code) => {
    const ward = wards.find(w => w.WardCode === code);
    return ward ? ward.WardName : '';
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Tạo đơn giao hàng GHN</h2>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>

        {/* Progress Steps */}
        <div className="steps-indicator">
          <div className={`step ${step >= 1 ? 'active' : ''}`}>
            <div className="step-number">1</div>
            <div className="step-label">Thông tin nhận hàng</div>
          </div>
          <div className={`step ${step >= 2 ? 'active' : ''}`}>
            <div className="step-number">2</div>
            <div className="step-label">Xác nhận</div>
          </div>
        </div>

        <div className="modal-body">
          {/* Thông tin phụ tùng */}
          <div className="info-box">
            <h3>📦 Thông tin phụ tùng</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="label">Tên phụ tùng:</span>
                <span className="value">{request?.partTypeName}</span>
              </div>
              <div className="info-item">
                <span className="label">Số lượng:</span>
                <span className="value">{request?.quantity}</span>
              </div>
              <div className="info-item">
                <span className="label">Chi nhánh SC:</span>
                <span className="value">{request?.scBranchOffice}</span>
              </div>
            </div>
          </div>

          {step === 1 && (
            <div className="form-step">
              <h3>📍 Thông tin người nhận</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Tên người nhận <span className="required">*</span></label>
                  <input
                    type="text"
                    name="toName"
                    value={formData.toName}
                    onChange={handleInputChange}
                    placeholder="Nhập tên người nhận"
                  />
                </div>

                <div className="form-group">
                  <label>Số điện thoại <span className="required">*</span></label>
                  <input
                    type="tel"
                    name="toPhone"
                    value={formData.toPhone}
                    onChange={handleInputChange}
                    placeholder="0123456789"
                  />
                </div>

                <div className="form-group full-width">
                  <label>Địa chỉ chi tiết <span className="required">*</span></label>
                  <input
                    type="text"
                    name="toAddress"
                    value={formData.toAddress}
                    onChange={handleInputChange}
                    placeholder="Số nhà, tên đường"
                  />
                </div>

                <div className="form-group">
                  <label>Tỉnh/Thành phố <span className="required">*</span></label>
                  <select
                    name="toProvinceId"
                    value={formData.toProvinceId}
                    onChange={handleInputChange}
                  >
                    <option value="">Chọn tỉnh/thành phố</option>
                    {provinces.map((province) => (
                      <option key={province.ProvinceID} value={province.ProvinceID}>
                        {province.ProvinceName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Quận/Huyện <span className="required">*</span></label>
                  <select
                    name="toDistrictId"
                    value={formData.toDistrictId}
                    onChange={handleInputChange}
                    disabled={!formData.toProvinceId}
                  >
                    <option value="">Chọn quận/huyện</option>
                    {districts.map((district) => (
                      <option key={district.DistrictID} value={district.DistrictID}>
                        {district.DistrictName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Phường/Xã <span className="required">*</span></label>
                  <select
                    name="toWardCode"
                    value={formData.toWardCode}
                    onChange={handleInputChange}
                    disabled={!formData.toDistrictId}
                  >
                    <option value="">Chọn phường/xã</option>
                    {wards.map((ward) => (
                      <option key={ward.WardCode} value={ward.WardCode}>
                        {ward.WardName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group full-width">
                  <label>Ghi chú</label>
                  <textarea
                    name="note"
                    value={formData.note}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Ghi chú cho đơn hàng"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="form-step">
              <h3>✅ Xác nhận thông tin</h3>
              
              <div className="confirm-section">
                <h4>Người nhận</h4>
                <div className="confirm-info">
                  <p><strong>Tên:</strong> {formData.toName}</p>
                  <p><strong>SĐT:</strong> {formData.toPhone}</p>
                  <p><strong>Địa chỉ:</strong> {formData.toAddress}, {getWardName(formData.toWardCode)}, {getDistrictName(formData.toDistrictId)}, {getProvinceName(formData.toProvinceId)}</p>
                </div>
              </div>

              {services.length > 0 && (
                <div className="confirm-section">
                  <h4>Dịch vụ vận chuyển</h4>
                  <div className="services-list">
                    {services.map((service) => (
                      <label key={service.service_id} className="service-option">
                        <input
                          type="radio"
                          name="service"
                          value={service.service_id}
                          checked={selectedService === service.service_id}
                          onChange={(e) => setSelectedService(parseInt(e.target.value))}
                        />
                        <div className="service-info">
                          <span className="service-name">{service.short_name}</span>
                          <span className="service-desc">{service.service_type_id === 2 ? 'Hàng nhẹ' : 'Hàng nặng'}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {shippingFee && (
                <div className="confirm-section fee-section">
                  <h4>Chi phí vận chuyển</h4>
                  <div className="fee-details">
                    <div className="fee-row">
                      <span>Phí vận chuyển:</span>
                      <span>{shippingFee.total?.toLocaleString('vi-VN')} đ</span>
                    </div>
                    {leadTime && (
                      <div className="fee-row">
                        <span>Thời gian dự kiến:</span>
                        <span>{new Date(leadTime.leadtime * 1000).toLocaleString('vi-VN')}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          {step === 1 ? (
            <>
              <button className="btn-secondary" onClick={onClose}>
                Hủy
              </button>
              <button className="btn-primary" onClick={handleNextStep}>
                Tiếp tục →
              </button>
            </>
          ) : (
            <>
              <button className="btn-secondary" onClick={() => setStep(1)}>
                ← Quay lại
              </button>
              <button
                className="btn-primary"
                onClick={handleCreateOrder}
                disabled={loading}
              >
                {loading ? 'Đang tạo...' : '✓ Tạo đơn hàng'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateShippingOrderModal;
