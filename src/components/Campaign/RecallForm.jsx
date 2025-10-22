import React, { useState, useEffect } from "react";
import "../../styles/RecallForm.css";

function RecallForm({ vehicleList = [], recall, onSave, onCancel }) {
  //console.log("📦 vehicleList nhận từ cha:", vehicleList);

  const [selectedVehicles, setSelectedVehicles] = useState([]);
  const [formData, setFormData] = useState({
    RecallName: "",
    IssueDescription: "",
    StartDate: "",
    RequiredAction: "",
    PartsRequired: "",
    Status: "Chuẩn bị",
    EVMApprovalStatus: "Chờ phê duyệt",
    AffectedVehicles: recall?.AffectedVehicles || 0,
  });

  const [errors, setErrors] = useState({});
  // ✅ Khi tick chọn xe
  const handleSelectVehicle = (vehicleId) => {
    const isSelected = selectedVehicles.includes(vehicleId);

    const updatedVehicles = isSelected
      ? selectedVehicles.filter((id) => id !== vehicleId)
      : [...selectedVehicles, vehicleId];

    setSelectedVehicles(updatedVehicles);

    // ✅ Cập nhật ngay số xe bị ảnh hưởng trong formData

    setFormData((prev) => ({
      ...prev,
      AffectedVehicles: updatedVehicles.length,
    }));
  };
  // ✅ Chọn tất cả hoặc bỏ chọn tất cả
  const handleSelectAll = () => {
    if (!Array.isArray(vehicleList) || vehicleList.length === 0) {
      return;
    }
    if (selectedVehicles.length === vehicleList.length) {
      setSelectedVehicles([]);
    } else {
      const allIds = vehicleList.map((v) => v.Vehicle_ID);
      setSelectedVehicles(allIds);
    }
  };

  // ✅ Khi nhận prop recall (chỉnh sửa), điền dữ liệu vào form
  useEffect(() => {
    if (recall) {
      const idsFromRecall =
        recall.selectedVehicles ||
        recall.selected_vehicle_ids ||
        recall.Vehicle_IDs ||
        recall.VehicleIDs ||
        [];

      setFormData((prev) => ({
        ...prev,
        ...recall,
        AffectedVehicles:
          typeof recall.AffectedVehicles === "number"
            ? recall.AffectedVehicles
            : idsFromRecall.length,
      }));

      setSelectedVehicles(Array.isArray(idsFromRecall) ? idsFromRecall : []);
    } else {
      setFormData({
        RecallName: "",
        IssueDescription: "",
        StartDate: "",
        RequiredAction: "",
        PartsRequired: "",
        Status: "Chuẩn bị",
        EVMApprovalStatus: "Chờ phê duyệt",
        AffectedVehicles: 0,
      });
      setSelectedVehicles([]);
    }
  }, [recall]);
  // ✅ Khi danh sách xe thay đổi (thêm/xóa), cập nhật lại số xe bị ảnh hưởng
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      AffectedVehicles: selectedVehicles.length,
    }));
  }, [selectedVehicles]);

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
  //debug danh sách xe
  useEffect(() => {
    console.log("vehicleList (RecallForm):", vehicleList);
  }, [vehicleList]);
  useEffect(() => {
    console.log("selectedVehicles:", selectedVehicles);
    console.log("formData.AffectedVehicles:", formData.AffectedVehicles);
  }, [selectedVehicles, formData.AffectedVehicles]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.RecallName.trim()) {
      newErrors.RecallName = "Tên recall là bắt buộc";
    }

    if (!formData.IssueDescription.trim()) {
      newErrors.IssueDescription = "Mô tả vấn đề là bắt buộc";
    } else if (formData.IssueDescription.length < 20) {
      newErrors.IssueDescription = "Mô tả vấn đề phải có ít nhất 20 ký tự";
    }

    if (!formData.StartDate) {
      newErrors.StartDate = "Ngày bắt đầu là bắt buộc";
    }

    if (!formData.RequiredAction.trim()) {
      newErrors.RequiredAction = "Hành động yêu cầu là bắt buộc";
    }

    if (!formData.PartsRequired.trim()) {
      newErrors.PartsRequired = "Phụ tùng yêu cầu là bắt buộc";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const dataToSave = {
      ...formData,
      selectedVehicles,
      AffectedVehicles: selectedVehicles.length,
    };

    console.log("RecallForm -> onSave dataToSave:", dataToSave);
    onSave(dataToSave);
  };

  // Sử dụng constants thay vì hardcoded
  const severityLevels = [
    { value: "LOW", label: "Thấp - Vấn đề nhỏ, không ảnh hưởng an toàn" },
    {
      value: "MEDIUM",
      label: "Trung bình - Ảnh hưởng hiệu suất hoặc tính năng",
    },
    { value: "HIGH", label: "Cao - Ảnh hưởng an toàn hoặc nguy cơ hư hại" },
    {
      value: "CRITICAL",
      label: "Cực cao - Nguy hiểm nghiêm trọng, cần xử lý ngay",
    },
  ];

  return (
    <div className="recall-form card">
      <div className="card-header">
        <h3 className="card-title">
          {recall ? "Chỉnh sửa recall" : "Tạo recall mới"}
        </h3>
      </div>

      <form onSubmit={handleSubmit} className="form">
        <div className="form-section">
          <h4 className="section-title">Thông tin cơ bản</h4>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Tên recall *</label>
              <input
                type="text"
                name="RecallName"
                value={formData.RecallName}
                onChange={handleChange}
                className={`form-control ${errors.RecallName ? "error" : ""}`}
                placeholder="Thu hồi pin VF8 2023"
              />
              {errors.RecallName && (
                <div className="error-message">{errors.RecallName}</div>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">Ngày bắt đầu *</label>
              <input
                type="date"
                name="StartDate"
                value={formData.StartDate}
                onChange={handleChange}
                className={`form-control ${errors.StartDate ? "error" : ""}`}
              />
              {errors.StartDate && (
                <div className="error-message">{errors.StartDate}</div>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Trạng thái</label>
              <select
                name="Status"
                value={formData.Status}
                onChange={handleChange}
                className="form-control"
              >
                <option value="Chuẩn bị">Chuẩn bị</option>
                <option value="Đang thực hiện">Đang thực hiện</option>
                <option value="Tạm dừng">Tạm dừng</option>
                <option value="Hoàn thành">Hoàn thành</option>
                <option value="Hủy bỏ">Hủy bỏ</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Trạng thái phê duyệt</label>
              <select
                name="EVMApprovalStatus"
                value={formData.EVMApprovalStatus}
                onChange={handleChange}
                className="form-control"
              >
                <option value="Chờ phê duyệt">Chờ phê duyệt</option>
                <option value="Đã phê duyệt">Đã phê duyệt</option>
                <option value="Từ chối">Từ chối</option>
              </select>
            </div>
          </div>
        </div>
        <h3>Thông tin đợt Recall</h3>

        {/* số xe thực hiện recall */}
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Số xe bị ảnh hưởng</label>
            <input
              type="number"
              name="AffectedVehicles"
              value={selectedVehicles.length}
              className="form-control"
              placeholder="Số xe bị ảnh hưởng"
              readOnly
            />
          </div>
        </div>

        <div className="vehicle-select-section">
          <div className="header-row">
            <label>Danh sách xe bị ảnh hưởng</label>
            <button
              type="button"
              className="btn btn-outline"
              onClick={handleSelectAll}
            >
              {selectedVehicles.length === vehicleList.length
                ? "Bỏ chọn tất cả"
                : "Chọn tất cả"}
            </button>
          </div>

          {/* ✅ Danh sách checkbox xe */}
          {vehicleList && vehicleList.length > 0 ? (
            vehicleList.map((vehicle) => (
              <div key={vehicle.Vehicle_ID} className="vehicle-item">
                <label>
                  <input
                    type="checkbox"
                    checked={selectedVehicles.includes(vehicle.Vehicle_ID)}
                    onChange={() => handleSelectVehicle(vehicle.Vehicle_ID)}
                  />
                  {vehicle.Vehicle_Name} ({vehicle.Vehicle_Type})
                </label>
              </div>
            ))
          ) : (
            <p>Không có xe nào trong danh sách.</p>
          )}
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
                placeholder="Mô tả chi tiết vấn đề đã phát hiện, nguyên nhân và tác động..."
                rows="4"
              />
              {errors.IssueDescription && (
                <div className="error-message">{errors.IssueDescription}</div>
              )}
              <small className="form-help">Ít nhất 20 ký tự</small>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Hành động yêu cầu *</label>
              <textarea
                name="RequiredAction"
                value={formData.RequiredAction}
                onChange={handleChange}
                className={`form-control ${
                  errors.RequiredAction ? "error" : ""
                }`}
                placeholder="Mô tả các bước cần thực hiện để xử lý vấn đề..."
                rows="3"
              />
              {errors.RequiredAction && (
                <div className="error-message">{errors.RequiredAction}</div>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Phụ tùng yêu cầu *</label>
              <input
                type="text"
                name="PartsRequired"
                value={formData.PartsRequired}
                onChange={handleChange}
                className={`form-control ${
                  errors.PartsRequired ? "error" : ""
                }`}
                placeholder="Pin Lithium 75kWh, Cáp sạc..."
              />
              {errors.PartsRequired && (
                <div className="error-message">{errors.PartsRequired}</div>
              )}
              <small className="form-help">
                Liệt kê các phụ tùng cần thiết, cách nhau bằng dấu phẩy
              </small>
            </div>
          </div>
        </div>

        <div className="recall-warning">
          <div className="warning-icon">⚠️</div>
          <div className="warning-content">
            <h5>Lưu ý quan trọng</h5>
            <ul>
              <li>
                Recall là quy trình nghiêm trọng ảnh hưởng đến an toàn người
                dùng
              </li>
              <li>Cần có sự phê duyệt từ EVM trước khi triển khai</li>
              <li>Phải thông báo đến tất cả khách hàng có xe bị ảnh hưởng</li>
              <li>Cần báo cáo định kỳ về tiến độ thực hiện</li>
            </ul>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" onClick={onCancel} className="btn btn-outline">
            Hủy
          </button>
          <button type="submit" className="btn btn-danger">
            {recall ? "Cập nhật Recall" : "Tạo Recall"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default RecallForm;
