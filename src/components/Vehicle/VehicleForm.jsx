import React, { useState, useEffect } from "react";
import { transformVehicleToBackend } from "../../services/api";
import { VEHICLE_TYPES, VEHICLE_STATUS_OPTIONS } from "../../constants";
import "../../styles/VehicleForm.css";

function VehicleForm({ vehicle, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    Vehicle_Name: "",
    VIN: "",
    Owner: "",
    Phone_Number: "",
    Email: "",
    Status: "ACTIVE",
    Total_KM: 0,
    Production_Date: "",
    ID_Electric_Vehicle_Type: "",
    Picture: "",
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (vehicle) {
      setFormData({
        Vehicle_Name: vehicle.Vehicle_Name || "",
        VIN: vehicle.VIN || "",
        Owner: vehicle.Owner || "",
        Phone_Number: vehicle.Phone_Number || "",
        Email: vehicle.Email || "",
        Status: vehicle.Status || "ACTIVE",
        Total_KM: vehicle.Total_KM || 0,
        Production_Date: vehicle.Production_Date || "",
        ID_Electric_Vehicle_Type: vehicle.ID_Electric_Vehicle_Type || "",
        Picture: vehicle.Picture || "",
      });
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

    if (!formData.Vehicle_Name.trim()) {
      newErrors.Vehicle_Name = "Tên xe là bắt buộc";
    }

    if (!formData.VIN.trim()) {
      newErrors.VIN = "VIN là bắt buộc";
    } else if (formData.VIN.length !== 17) {
      newErrors.VIN = "VIN phải có đúng 17 ký tự";
    }

    if (!formData.Owner.trim()) {
      newErrors.Owner = "Tên chủ xe là bắt buộc";
    }

    if (!formData.Phone_Number.trim()) {
      newErrors.Phone_Number = "Số điện thoại là bắt buộc";
    } else if (!/^[0-9]{10,11}$/.test(formData.Phone_Number)) {
      newErrors.Phone_Number = "Số điện thoại không hợp lệ";
    }

    if (!formData.Email.trim()) {
      newErrors.Email = "Email là bắt buộc";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.Email)) {
      newErrors.Email = "Email không hợp lệ";
    }

    if (!formData.Production_Date) {
      newErrors.Production_Date = "Ngày sản xuất là bắt buộc";
    }

    if (!formData.ID_Electric_Vehicle_Type) {
      newErrors.ID_Electric_Vehicle_Type = "Loại xe là bắt buộc";
    }

    if (formData.Total_KM < 0) {
      newErrors.Total_KM = "Số km không được âm";
    }

    setErrors(newErrors);
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
      const backendData = transformVehicleToBackend(dataToSave);
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

          <div className="form-group">
            <label className="form-label">Tên xe *</label>
            <input
              type="text"
              name="Vehicle_Name"
              value={formData.Vehicle_Name}
              onChange={handleChange}
              className={`form-control ${errors.Vehicle_Name ? "error" : ""}`}
              placeholder="VinFast VF8"
            />
            {errors.Vehicle_Name && (
              <div className="error-message">{errors.Vehicle_Name}</div>
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
            <label className="form-label">Ngày sản xuất *</label>
            <input
              type="date"
              name="Production_Date"
              value={formData.Production_Date}
              onChange={handleChange}
              className={`form-control ${
                errors.Production_Date ? "error" : ""
              }`}
            />
            {errors.Production_Date && (
              <div className="error-message">{errors.Production_Date}</div>
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
