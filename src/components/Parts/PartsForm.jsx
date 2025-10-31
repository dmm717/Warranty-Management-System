import React, { useState, useEffect } from "react";
import { vehicleAPI } from "../../services/api";
import "../../styles/PartsForm.css";

// Temporary EVM Part Types - TODO: Get from Backend API /api/evm/part-types
const PART_TYPES = [
  { id: "EVM-PT001", name: "Pin (Battery)" },
  { id: "EVM-PT002", name: "Động cơ điện (Electric Motor)" },
  { id: "EVM-PT003", name: "Bộ sạc (Charger)" },
  { id: "EVM-PT004", name: "Hệ thống phanh (Brake System)" },
  { id: "EVM-PT005", name: "Lốp xe (Tires)" },
  { id: "EVM-PT006", name: "Đèn (Lights)" },
  { id: "EVM-PT007", name: "Camera (Camera)" },
  { id: "EVM-PT008", name: "Màn hình điều khiển (Display)" },
];

function PartsForm({ part, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    partNumber: "",
    partName: "",
    quantity: 1,
    requestDate: new Date().toISOString().split("T")[0],
    deliveryDate: "",
    partTypeId: "",
    vehicleId: "",
  });

  const [errors, setErrors] = useState({});
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchVehicles();

    if (part) {
      setFormData({
        partNumber: part.partNumber || "",
        partName: part.partName || "",
        quantity: part.quantity || 1,
        requestDate: part.requestDate || new Date().toISOString().split("T")[0],
        deliveryDate: part.deliveryDate || "",
        partTypeId: part.partTypeId || "",
        vehicleId: part.vehicle?.vehicleId || "",
      });
    }
  }, [part]);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const response = await vehicleAPI.getAllVehicles({
        page: 0,
        size: 100,
        sortBy: "name",
        sortDir: "asc",
      });

      if (response.success && response.data?.content) {
        setVehicles(response.data.content);
      }
    } catch (error) {
      console.error("Error fetching vehicles:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.partNumber.trim()) {
      newErrors.partNumber = "Mã phụ tùng là bắt buộc";
    }

    if (!formData.partName.trim()) {
      newErrors.partName = "Tên phụ tùng là bắt buộc";
    }

    if (!formData.quantity || formData.quantity < 1) {
      newErrors.quantity = "Số lượng phải lớn hơn 0";
    }

    if (!formData.requestDate) {
      newErrors.requestDate = "Ngày yêu cầu là bắt buộc";
    }

    if (!formData.partTypeId) {
      newErrors.partTypeId = "Loại phụ tùng là bắt buộc";
    }

    if (!formData.vehicleId) {
      newErrors.vehicleId = "Xe là bắt buộc";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      // Transform to match Backend PartsRequestCreateDTO
      const requestData = {
        partNumber: formData.partNumber,
        partName: formData.partName,
        quantity: parseInt(formData.quantity),
        requestDate: formData.requestDate,
        deliveryDate: formData.deliveryDate || null,
        partTypeId: formData.partTypeId,
        vehicleId: formData.vehicleId,
      };      onSave(requestData);
    }
  };

  return (
    <div className="parts-form card">
      <div className="card-header">
        <h3 className="card-title">
          {part ? "Chỉnh sửa yêu cầu phụ tùng" : "Tạo yêu cầu phụ tùng mới"}
        </h3>
      </div>

      <form onSubmit={handleSubmit} className="form">
        <div className="form-section">
          <h4 className="section-title">Thông tin phụ tùng</h4>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Mã phụ tùng *</label>
              <input
                type="text"
                name="partNumber"
                value={formData.partNumber}
                onChange={handleChange}
                className={`form-control ${errors.partNumber ? "error" : ""}`}
                placeholder="PT-2025-001"
              />
              {errors.partNumber && (
                <div className="error-message">{errors.partNumber}</div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Tên phụ tùng *</label>
              <input
                type="text"
                name="partName"
                value={formData.partName}
                onChange={handleChange}
                className={`form-control ${errors.partName ? "error" : ""}`}
                placeholder="Pin Lithium 75kWh"
              />
              {errors.partName && (
                <div className="error-message">{errors.partName}</div>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Loại phụ tùng *</label>
              <select
                name="partTypeId"
                value={formData.partTypeId}
                onChange={handleChange}
                className={`form-control ${errors.partTypeId ? "error" : ""}`}
              >
                <option value="">-- Chọn loại phụ tùng --</option>
                {PART_TYPES.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
              {errors.partTypeId && (
                <div className="error-message">{errors.partTypeId}</div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Số lượng *</label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                className={`form-control ${errors.quantity ? "error" : ""}`}
                placeholder="1"
                min="1"
              />
              {errors.quantity && (
                <div className="error-message">{errors.quantity}</div>
              )}
            </div>
          </div>
        </div>

        <div className="form-section">
          <h4 className="section-title">Thông tin xe</h4>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Chọn xe *</label>
              <select
                name="vehicleId"
                value={formData.vehicleId}
                onChange={handleChange}
                className={`form-control ${errors.vehicleId ? "error" : ""}`}
              >
                <option value="">-- Chọn xe --</option>
                {vehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.id} - {vehicle.name} ({vehicle.owner})
                  </option>
                ))}
              </select>
              {errors.vehicleId && (
                <div className="error-message">{errors.vehicleId}</div>
              )}
            </div>
          </div>
        </div>

        <div className="form-section">
          <h4 className="section-title">Thông tin thời gian</h4>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Ngày yêu cầu *</label>
              <input
                type="date"
                name="requestDate"
                value={formData.requestDate}
                onChange={handleChange}
                className={`form-control ${errors.requestDate ? "error" : ""}`}
              />
              {errors.requestDate && (
                <div className="error-message">{errors.requestDate}</div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Ngày giao hàng dự kiến</label>
              <input
                type="date"
                name="deliveryDate"
                value={formData.deliveryDate}
                onChange={handleChange}
                className="form-control"
              />
              <small className="form-help">Để trống nếu chưa xác định</small>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" onClick={onCancel} className="btn btn-outline">
            Hủy
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {part ? "Cập nhật" : "Tạo yêu cầu"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default PartsForm;
