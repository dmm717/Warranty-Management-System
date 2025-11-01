import React, { useState, useEffect } from "react";
import { transformVehicleToBackend } from "../../services/api";
import { VEHICLE_TYPES, VEHICLE_STATUS_OPTIONS } from "../../constants";
import { toast } from "react-toastify";
import "../../styles/VehicleForm.css";

function VehicleForm({ vehicle, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    VIN: "",
    Owner: "",
    Phone_Number: "",
    Email: "",
    Status: "ACTIVE",
    Total_KM: 0,
    Purchase_Date: "",
    ID_Electric_Vehicle_Type: "",
    Picture: "",
  });

  const [errors, setErrors] = useState({});

  // Reverse mapping: Vietnamese label -> enum key
  const getStatusKey = (statusValue) => {
    if (!statusValue) return "ACTIVE";

    // If already enum key, return as is
    const validKeys = [
      "ACTIVE",
      "IN_WARRANTY",
      "INACTIVE",
      "RECALLED",
      "RETIRED",
    ];
    if (validKeys.includes(statusValue)) return statusValue;

    // Map Vietnamese to enum key
    const statusMap = {
      "Đang sử dụng": "ACTIVE",
      "Trong bảo hành": "IN_WARRANTY",
      "Ngừng hoạt động": "INACTIVE",
      "Đã triệu hồi": "RECALLED",
      "Đã thanh lý": "RETIRED",
    };

    return statusMap[statusValue] || "ACTIVE";
  };

  useEffect(() => {
    if (vehicle) {
      const vehicleTypeId =
        vehicle.Vehicle_Type_ID || vehicle.ID_Electric_Vehicle_Type || "";
      const newFormData = {
        VIN: vehicle.VIN || "",
        Owner: vehicle.Owner || "",
        Phone_Number: vehicle.Phone_Number || "",
        Email: vehicle.Email || "",
        Status: getStatusKey(vehicle.Status),
        Total_KM: vehicle.Total_KM || 0,
        Purchase_Date: vehicle.Purchase_Date || "",
        ID_Electric_Vehicle_Type: vehicleTypeId,
        Picture: vehicle.Picture || "",
      };      setFormData(newFormData);
    }
  }, [vehicle]);

  const vehicleTypes = VEHICLE_TYPES;
  const statusOptions = VEHICLE_STATUS_OPTIONS;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // VIN validation
    if (!formData.VIN.trim()) {
      newErrors.VIN = "VIN là bắt buộc";
    } else if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(formData.VIN)) {
      newErrors.VIN = "VIN phải có đúng 17 ký tự (không chứa I, O, Q)";
    }

    // Owner validation
    if (!formData.Owner.trim()) {
      newErrors.Owner = "Tên chủ xe là bắt buộc";
    } else if (formData.Owner.trim().length < 2) {
      newErrors.Owner = "Tên chủ xe phải có ít nhất 2 ký tự";
    }

    // Phone validation - Vietnam phone numbers
    if (!formData.Phone_Number.trim()) {
      newErrors.Phone_Number = "Số điện thoại là bắt buộc";
    } else if (!/^(03|05|07|08|09)[0-9]{8}$/.test(formData.Phone_Number)) {
      newErrors.Phone_Number =
        "Số điện thoại phải có 10 số và đúng mã vùng VN (03, 05, 07, 08, 09)";
    }

    // Email validation
    if (!formData.Email.trim()) {
      newErrors.Email = "Email là bắt buộc";
    } else if (
      !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(formData.Email)
    ) {
      newErrors.Email = "Email không đúng định dạng";
    }

    // Purchase Date validation - from 2021 onwards
    if (!formData.Purchase_Date) {
      newErrors.Purchase_Date = "Ngày mua là bắt buộc";
    } else {
      const purchaseYear = new Date(formData.Purchase_Date).getFullYear();
      const currentYear = new Date().getFullYear();
      if (purchaseYear < 2021) {
        newErrors.Purchase_Date = "Ngày mua phải từ năm 2021 trở đi";
      } else if (purchaseYear > currentYear) {
        newErrors.Purchase_Date = "Ngày mua không được lớn hơn năm hiện tại";
      }
    }

    // Vehicle Type validation
    if (!formData.ID_Electric_Vehicle_Type) {
      newErrors.ID_Electric_Vehicle_Type = "Loại xe là bắt buộc";
    }

    // Total KM validation
    if (formData.Total_KM < 0) {
      newErrors.Total_KM = "Số km không được âm";
    } else if (formData.Total_KM > 1000000) {
      newErrors.Total_KM = "Số km không hợp lệ (quá lớn)";
    }

    // Status validation
    if (!formData.Status) {
      newErrors.Status = "Trạng thái là bắt buộc";
    }

    setErrors(newErrors);

    // Show toast for first error
    if (Object.keys(newErrors).length > 0) {
      const firstError = Object.values(newErrors)[0];
      toast.error(firstError);
    }

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      // Add default picture if not provided
      const dataToSave = {
        ...formData,
        Picture: formData.Picture || "default-vehicle.jpg",
      };

      // Transform data sang format backend
      const isUpdate = !!vehicle; // true if editing existing vehicle
      const backendData = transformVehicleToBackend(dataToSave, isUpdate);
      onSave(backendData);
    }
  };

  return (
    <div className="vehicle-form card">
      <div className="card-header">
        <h3 className="card-title">
          {vehicle ? "Chỉnh sửa thông tin xe" : "Đăng ký xe mới"}
        </h3>
      </div>

      <form onSubmit={handleSubmit} className="form">
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Loại xe *</label>
            <select
              name="ID_Electric_Vehicle_Type"
              value={formData.ID_Electric_Vehicle_Type}
              onChange={handleChange}
              className={`form-control ${
                errors.ID_Electric_Vehicle_Type ? "error" : ""
              }`}
            >
              <option value="">Chọn loại xe</option>
              {vehicleTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
            {errors.ID_Electric_Vehicle_Type && (
              <div className="error-message">
                {errors.ID_Electric_Vehicle_Type}
              </div>
            )}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">VIN (Số khung) *</label>
            <input
              type="text"
              name="VIN"
              value={formData.VIN}
              onChange={handleChange}
              className={`form-control ${errors.VIN ? "error" : ""}`}
              placeholder="VF8ABC12345678901"
              maxLength="17"
            />
            {errors.VIN && <div className="error-message">{errors.VIN}</div>}
            <small className="form-help">VIN phải có đúng 17 ký tự</small>
          </div>

          <div className="form-group">
            <label className="form-label">Ngày mua *</label>
            <input
              type="date"
              name="Purchase_Date"
              value={formData.Purchase_Date}
              onChange={handleChange}
              className={`form-control ${errors.Purchase_Date ? "error" : ""}`}
            />
            {errors.Purchase_Date && (
              <div className="error-message">{errors.Purchase_Date}</div>
            )}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Tên chủ xe *</label>
            <input
              type="text"
              name="Owner"
              value={formData.Owner}
              onChange={handleChange}
              className={`form-control ${errors.Owner ? "error" : ""}`}
              placeholder="Nguyễn Văn An"
            />
            {errors.Owner && (
              <div className="error-message">{errors.Owner}</div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Số điện thoại *</label>
            <input
              type="tel"
              name="Phone_Number"
              value={formData.Phone_Number}
              onChange={handleChange}
              className={`form-control ${errors.Phone_Number ? "error" : ""}`}
              placeholder="0912345678"
            />
            {errors.Phone_Number && (
              <div className="error-message">{errors.Phone_Number}</div>
            )}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Email *</label>
            <input
              type="email"
              name="Email"
              value={formData.Email}
              onChange={handleChange}
              className={`form-control ${errors.Email ? "error" : ""}`}
              placeholder="example@email.com"
            />
            {errors.Email && (
              <div className="error-message">{errors.Email}</div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Trạng thái</label>
            <select
              name="Status"
              value={formData.Status}
              onChange={handleChange}
              className="form-control"
            >
              {statusOptions.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Số KM đã đi</label>
            <input
              type="number"
              name="Total_KM"
              value={formData.Total_KM}
              onChange={handleChange}
              className={`form-control ${errors.Total_KM ? "error" : ""}`}
              placeholder="0"
              min="0"
              step="0.1"
            />
            {errors.Total_KM && (
              <div className="error-message">{errors.Total_KM}</div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Hình ảnh (URL)</label>
            <input
              type="text"
              name="Picture"
              value={formData.Picture}
              onChange={handleChange}
              className="form-control"
              placeholder="https://example.com/vehicle.jpg hoặc để trống"
            />
            <small className="form-help">
              Để trống sẽ sử dụng ảnh mặc định
            </small>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" onClick={onCancel} className="btn btn-outline">
            Hủy
          </button>
          <button type="submit" className="btn btn-primary">
            {vehicle ? "Cập nhật" : "Đăng ký"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default VehicleForm;
