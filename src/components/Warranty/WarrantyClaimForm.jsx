import React, { useState, useEffect } from "react";
import { vehicleAPI } from "../../services/api";
import { transformClaimToBackend } from "../../services/api";
import "../../styles/WarrantyClaimForm.css";

function WarrantyClaimForm({ claim, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    CustomerName: "",
    CustomerPhone: "",
    Email: "",
    Vehicle_ID: "",
    VIN: "",
    VehicleName: "",
    IssueDescription: "",
    RequiredPart: "",
  });

  const [errors, setErrors] = useState({});
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchVehicles();

    if (claim) {
      setFormData({
        CustomerName: claim.CustomerName || "",
        CustomerPhone: claim.CustomerPhone || "",
        Email: claim.Email || "",
        Vehicle_ID: claim.Vehicle_ID || "",
        VIN: claim.VIN || "",
        VehicleName: claim.VehicleName || "",
        IssueDescription: claim.IssueDescription || "",
        RequiredPart: claim.RequiredPart || "",
      });
    }
  }, [claim]);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const response = await vehicleAPI.getAllVehicles({
        page: 0,
        size: 100,
        sortBy: "name",
        sortDir: "asc",
      });

      if (response.success && response.data) {
        // Transform data từ BE sang format FE
        const transformedVehicles = response.data.content.map((vehicle) => ({
          Vehicle_ID: vehicle.vehicleId,
          VIN: vehicle.vehicleId,
          Vehicle_Name: vehicle.vehicleName,
          Owner: vehicle.owner,
          Phone_Number: vehicle.phoneNumber,
          Email: vehicle.email,
        }));

        setVehicles(transformedVehicles);
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

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleVehicleSelect = (e) => {
    const vehicleId = e.target.value;
    const selectedVehicle = vehicles.find((v) => v.Vehicle_ID === vehicleId);

    if (selectedVehicle) {
      setFormData((prev) => ({
        ...prev,
        Vehicle_ID: vehicleId,
        VIN: selectedVehicle.VIN,
        VehicleName: selectedVehicle.Vehicle_Name,
        CustomerName: selectedVehicle.Owner,
        CustomerPhone: selectedVehicle.Phone_Number,
        Email: selectedVehicle.Email,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        Vehicle_ID: "",
        VIN: "",
        VehicleName: "",
        CustomerName: "",
        CustomerPhone: "",
        Email: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.Vehicle_ID) {
      newErrors.Vehicle_ID = "Vui lòng chọn xe";
    }

    if (!formData.CustomerName.trim()) {
      newErrors.CustomerName = "Tên khách hàng là bắt buộc";
    }

    if (!formData.CustomerPhone.trim()) {
      newErrors.CustomerPhone = "Số điện thoại là bắt buộc";
    } else if (!/^[0-9]{10,11}$/.test(formData.CustomerPhone)) {
      newErrors.CustomerPhone = "Số điện thoại không hợp lệ";
    }

    if (!formData.Email.trim()) {
      newErrors.Email = "Email là bắt buộc";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.Email)) {
      newErrors.Email = "Email không hợp lệ";
    }

    if (!formData.IssueDescription.trim()) {
      newErrors.IssueDescription = "Mô tả vấn đề là bắt buộc";
    } else if (formData.IssueDescription.length < 10) {
      newErrors.IssueDescription = "Mô tả vấn đề phải có ít nhất 10 ký tự";
    }

    if (formData.EstimatedCost < 0) {
      newErrors.EstimatedCost = "Chi phí ước tính không được âm";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      // Transform data sang format backend
      const backendData = transformClaimToBackend(formData);
      onSave(backendData);
    }
  };

  return (
    <div className="warranty-claim-form card">
      <div className="card-header">
        <h3 className="card-title">
          {claim ? "Chỉnh sửa yêu cầu bảo hành" : "Tạo yêu cầu bảo hành mới"}
        </h3>
      </div>

      <form onSubmit={handleSubmit} className="form">
        <div className="form-section">
          <h4 className="section-title">Thông tin xe</h4>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Chọn xe *</label>
              <select
                name="Vehicle_ID"
                value={formData.Vehicle_ID}
                onChange={handleVehicleSelect}
                className={`form-control ${errors.Vehicle_ID ? "error" : ""}`}
              >
                <option value="">-- Chọn xe --</option>
                {vehicles.map((vehicle) => (
                  <option key={vehicle.Vehicle_ID} value={vehicle.Vehicle_ID}>
                    {vehicle.VIN} - {vehicle.Vehicle_Name} ({vehicle.Owner})
                  </option>
                ))}
              </select>
              {errors.Vehicle_ID && (
                <div className="error-message">{errors.Vehicle_ID}</div>
              )}
            </div>
          </div>

          {formData.Vehicle_ID && (
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">VIN</label>
                <input
                  type="text"
                  value={formData.VIN}
                  className="form-control"
                  readOnly
                />
              </div>
              <div className="form-group">
                <label className="form-label">Tên xe</label>
                <input
                  type="text"
                  value={formData.VehicleName}
                  className="form-control"
                  readOnly
                />
              </div>
            </div>
          )}
        </div>

        <div className="form-section">
          <h4 className="section-title">Thông tin khách hàng</h4>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Tên khách hàng *</label>
              <input
                type="text"
                name="CustomerName"
                value={formData.CustomerName}
                onChange={handleChange}
                className={`form-control ${errors.CustomerName ? "error" : ""}`}
                placeholder="Nguyễn Văn An"
              />
              {errors.CustomerName && (
                <div className="error-message">{errors.CustomerName}</div>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">Số điện thoại *</label>
              <input
                type="tel"
                name="CustomerPhone"
                value={formData.CustomerPhone}
                onChange={handleChange}
                className={`form-control ${
                  errors.CustomerPhone ? "error" : ""
                }`}
                placeholder="0912345678"
              />
              {errors.CustomerPhone && (
                <div className="error-message">{errors.CustomerPhone}</div>
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
          </div>
        </div>

        <div className="form-section">
          <h4 className="section-title">Chi tiết vấn đề</h4>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Mô tả vấn đề *</label>
              <textarea
                name="IssueDescription"
                value={formData.IssueDescription}
                onChange={handleChange}
                className={`form-control ${
                  errors.IssueDescription ? "error" : ""
                }`}
                placeholder="Mô tả chi tiết vấn đề gặp phải..."
                rows="4"
              />
              {errors.IssueDescription && (
                <div className="error-message">{errors.IssueDescription}</div>
              )}
              <small className="form-help">Ít nhất 10 ký tự</small>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Độ ưu tiên</label>
              <select
                name="Priority"
                value={formData.Priority}
                onChange={handleChange}
                className="form-control"
              >
                <option value="Thấp">Thấp</option>
                <option value="Trung bình">Trung bình</option>
                <option value="Cao">Cao</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Chi phí ước tính (VNĐ)</label>
              <input
                type="number"
                name="EstimatedCost"
                value={formData.EstimatedCost}
                onChange={handleChange}
                className={`form-control ${
                  errors.EstimatedCost ? "error" : ""
                }`}
                placeholder="0"
                min="0"
              />
              {errors.EstimatedCost && (
                <div className="error-message">{errors.EstimatedCost}</div>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Kết quả chẩn đoán</label>
              <textarea
                name="DiagnosisResult"
                value={formData.DiagnosisResult}
                onChange={handleChange}
                className="form-control"
                placeholder="Nhập kết quả chẩn đoán (nếu có)..."
                rows="3"
              />
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" onClick={onCancel} className="btn btn-outline">
            Hủy
          </button>
          <button type="submit" className="btn btn-primary">
            {claim ? "Cập nhật" : "Tạo yêu cầu"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default WarrantyClaimForm;
