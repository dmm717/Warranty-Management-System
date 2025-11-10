import React, { useState, useEffect } from "react";
import "../../styles/RecallForm.css";
import { VEHICLE_TYPES } from "../../constants";
import { useAuth } from "../../contexts/AuthContext";
import { recallAPI } from "../../services/api";
import { toast } from "react-toastify";

function RecallForm({ recall, onSave, onCancel }) {
  const { user } = useAuth();
  const isEVMAdmin = user?.role === "EVM_ADMIN";
  const isEVMStaff = user?.role === "EVM_STAFF";

  const [formData, setFormData] = useState({
    name: "",
    issueDescription: "",
    startDate: "",
    requiredAction: "",
    partsRequired: "",
    status: "INACTIVE",
    notificationSent: false,
    evmApprovalStatus: "WAITING",
    vehicleTypeIds: [],
    technicianIds: [],
    vehicleId: []
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (recall) {
      setFormData({
        name: recall.name || recall.RecallName || "",
        issueDescription: recall.issueDescription || recall.IssueDescription || "",
        startDate: recall.startDate || recall.StartDate || "",
        requiredAction: recall.requiredAction || recall.RequiredAction || "",
        partsRequired: recall.partsRequired || recall.PartsRequired || "",
        status: recall.status || recall.Status || "INACTIVE",
        notificationSent: recall.notificationSent ?? false,
        evmApprovalStatus: recall.evmApprovalStatus || "WAITING",
        vehicleTypeIds: recall.vehicleTypeIds || recall.VehicleModels || [],
        technicianIds: recall.technicianIds || [],
        vehicleId: recall.vehicleId || []
      });
    }
  }, [recall]);

  const handleArrayToggle = (fieldName, value) => {
    setFormData((prev) => {
      const currentArray = prev[fieldName];
      const isSelected = currentArray.includes(value);

      return {
        ...prev,
        [fieldName]: isSelected
          ? currentArray.filter((item) => item !== value)
          : [...currentArray, value],
      };
    });

    if (errors[fieldName]) {
      setErrors((prev) => ({ ...prev, [fieldName]: "" }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = "Tên recall là bắt buộc";
    }
    
    if (formData.vehicleTypeIds.length === 0) {
      newErrors.vehicleTypeIds = "Phải chọn ít nhất một model xe";
    }
    
    if (!formData.startDate) {
      newErrors.startDate = "Ngày bắt đầu là bắt buộc";
    }
    
    if (!formData.issueDescription.trim()) {
      newErrors.issueDescription = "Mô tả vấn đề là bắt buộc";
    } else if (formData.issueDescription.length < 20) {
      newErrors.issueDescription = "Mô tả vấn đề phải có ít nhất 20 ký tự";
    }

    if (!formData.requiredAction.trim()) {
      newErrors.requiredAction = "Hành động yêu cầu là bắt buộc";
    }
    
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const requestData = {
        name: formData.name,
        issueDescription: formData.issueDescription,
        startDate: formData.startDate,
        requiredAction: formData.requiredAction,
        partsRequired: formData.partsRequired,
        status: formData.status,
        notificationSent: formData.notificationSent,
        evmApprovalStatus: formData.evmApprovalStatus,
        vehicleTypeIds: formData.vehicleTypeIds,
        technicianIds: formData.technicianIds,
        vehicleId: formData.vehicleId
      };

      if (recall) {
        const recallId = recall.id || recall.Recall_ID;
        const response = await recallAPI.updateRecall(recallId, requestData);
        
        if (response.success) {
          toast.success("Cập nhật Recall thành công!");
          onSave(response.data);
        } else {
          toast.error(response.message || "Không thể cập nhật Recall");
        }
      } else {
        const response = await recallAPI.createRecall(requestData);
        
        if (response.success) {
          toast.success("Tạo Recall thành công!");
          onSave(response.data);
        } else {
          toast.error(response.message || "Không thể tạo Recall");
        }
      }
    } catch (error) {
      console.error("Error submitting recall:", error);
      toast.error(error.message || "Có lỗi xảy ra khi lưu Recall");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="recall-form card">
      <div className="card-header">
        <h3 className="card-title">
          {recall ? "Chỉnh sửa Recall" : "Tạo Recall mới"}
        </h3>
        <p className="card-subtitle">
          Thông tin recall và danh sách xe bị ảnh hưởng
        </p>
      </div>
      <form onSubmit={handleSubmit} className="form">
        {/* Tên Recall */}
        <div className="form-section">
          <div className="form-group">
            <label className="form-label">Tên Recall *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`form-control ${errors.name ? "error" : ""}`}
              placeholder="VD: Thu hồi pin VF8 2023"
              disabled={loading}
            />
            {errors.name && (
              <div className="error-message">{errors.name}</div>
            )}
          </div>
        </div>

        {/* List Vehicle Models */}
        <div className="form-section">
          <div className="form-group">
            <label className="form-label">Loại xe bị ảnh hưởng *</label>
            <textarea
              name="vehicleTypeIds"
              value={formData.vehicleTypeIds.join("\n")}
              onChange={(e) => {
                const ids = e.target.value.split("\n").filter(id => id.trim());
                setFormData(prev => ({ ...prev, vehicleTypeIds: ids }));
                if (errors.vehicleTypeIds) {
                  setErrors(prev => ({ ...prev, vehicleTypeIds: "" }));
                }
              }}
              className={`form-control ${errors.vehicleTypeIds ? "error" : ""}`}
              rows="4"
              placeholder="Nhập mỗi ID loại xe trên một dòng&#10;VD:&#10;VF8&#10;VF9"
              disabled={loading}
            />
            {errors.vehicleTypeIds && (
              <div className="error-message">{errors.vehicleTypeIds}</div>
            )}
            <small className="form-help">
              Nhập mỗi ID loại xe trên một dòng. VD: VF5, VF6, VF7, VF8, VF9, VF e34
            </small>
          </div>
        </div>

        {/* VINs cụ thể */}
        <div className="form-section">
          <div className="form-group">
            <label className="form-label">VIN cụ thể (tùy chọn)</label>
            <textarea
              name="vehicleId"
              value={formData.vehicleId.join("\n")}
              onChange={(e) => {
                const vins = e.target.value.split("\n").filter(v => v.trim());
                setFormData(prev => ({ ...prev, vehicleId: vins }));
              }}
              className="form-control"
              rows="4"
              placeholder="Nhập mỗi VIN trên một dòng&#10;VD:&#10;VF8ABCDE12345678&#10;VF9FGHIJ87654321"
              disabled={loading}
            />
            <small className="form-help">
              Để trống nếu áp dụng cho tất cả xe thuộc loại đã chọn. Nhập mỗi VIN trên một dòng.
            </small>
          </div>
        </div>

        {/* Technician IDs */}
        <div className="form-section">
          <div className="form-group">
            <label className="form-label">ID Kỹ thuật viên (tùy chọn)</label>
            <textarea
              name="technicianIds"
              value={formData.technicianIds.join("\n")}
              onChange={(e) => {
                const ids = e.target.value.split("\n").filter(id => id.trim());
                setFormData(prev => ({ ...prev, technicianIds: ids }));
              }}
              className="form-control"
              rows="3"
              placeholder="Nhập mỗi ID kỹ thuật viên trên một dòng&#10;VD:&#10;TECH001&#10;TECH002"
              disabled={loading}
            />
            <small className="form-help">
              Để trống nếu chưa phân công. Nhập mỗi ID trên một dòng.
            </small>
          </div>
        </div>

        {/* Ngày bắt đầu */}
        <div className="form-section">
          <div className="form-group">
            <label className="form-label">Ngày bắt đầu *</label>
            <input
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              className={`form-control ${errors.startDate ? "error" : ""}`}
              disabled={loading}
            />
            {errors.startDate && (
              <div className="error-message">{errors.startDate}</div>
            )}
          </div>
        </div>

        {/* Mô tả vấn đề */}
        <div className="form-section">
          <div className="form-group">
            <label className="form-label">Mô tả vấn đề *</label>
            <textarea
              name="issueDescription"
              value={formData.issueDescription}
              onChange={handleChange}
              className={`form-control ${errors.issueDescription ? "error" : ""}`}
              rows="4"
              placeholder="Phát hiện lỗi trong hệ thống quản lý pin..."
              disabled={loading}
            />
            {errors.issueDescription && (
              <div className="error-message">{errors.issueDescription}</div>
            )}
            <small className="form-help">Tối thiểu 20 ký tự</small>
          </div>
        </div>

        {/* Hành động yêu cầu */}
        <div className="form-section">
          <div className="form-group">
            <label className="form-label">Hành động yêu cầu *</label>
            <textarea
              name="requiredAction"
              value={formData.requiredAction}
              onChange={handleChange}
              className={`form-control ${errors.requiredAction ? "error" : ""}`}
              rows="3"
              placeholder="VD: Thay thế module pin và cập nhật firmware BMS"
              disabled={loading}
            />
            {errors.requiredAction && (
              <div className="error-message">{errors.requiredAction}</div>
            )}
          </div>
        </div>

        {/* Phụ tùng cần thiết */}
        <div className="form-section">
          <div className="form-group">
            <label className="form-label">Phụ tùng cần thiết</label>
            <textarea
              name="partsRequired"
              value={formData.partsRequired}
              onChange={handleChange}
              className="form-control"
              rows="3"
              placeholder="VD: Pin Lithium-ion 100kWh, Bộ điều khiển BMS v2.1"
              disabled={loading}
            />
            <small className="form-help">
              Liệt kê các phụ tùng cần thiết cho việc sửa chữa
            </small>
          </div>
        </div>

        {/* Status và EVM Approval */}
        <div className="form-section">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Trạng thái</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="form-control"
                disabled={loading}
              >
                <option value="INACTIVE">Chưa kích hoạt</option>
                <option value="ACTIVE">Đang hoạt động</option>
                <option value="COMPLETED">Hoàn thành</option>
                <option value="CANCELLED">Đã hủy</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Phê duyệt EVM</label>
              <select
                name="evmApprovalStatus"
                value={formData.evmApprovalStatus}
                onChange={handleChange}
                className="form-control"
                disabled={loading || !isEVMAdmin}
              >
                <option value="WAITING">Chờ phê duyệt</option>
                <option value="Approved">Đã phê duyệt</option>
                <option value="Disapproved">Không phê duyệt</option>
              </select>
              {!isEVMAdmin && (
                <small className="form-help">
                  Chỉ EVM Admin có thể thay đổi trạng thái phê duyệt
                </small>
              )}
            </div>
          </div>
        </div>

        {/* Notification Sent */}
        <div className="form-section">
          <div className="form-group">
            <label className="checkbox-item">
              <input
                type="checkbox"
                name="notificationSent"
                checked={formData.notificationSent}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  notificationSent: e.target.checked
                }))}
                disabled={loading}
              />
              <span>Đã gửi thông báo đến khách hàng</span>
            </label>
          </div>
        </div>

        {/* Warning */}
        <div className="recall-warning">
          <div className="warning-icon">⚠️</div>
          <div className="warning-content">
            <h5>Lưu ý quan trọng</h5>
            <ul>
              <li>Thông tin recall sẽ được gửi đến tất cả Service Centers</li>
              <li>Danh sách xe bị ảnh hưởng sẽ được tự động cập nhật</li>
              <li>Đảm bảo mô tả vấn đề rõ ràng và chi tiết</li>
            </ul>
          </div>
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <button 
            type="button" 
            onClick={onCancel} 
            className="btn btn-outline"
            disabled={loading}
          >
            Hủy
          </button>
          <button 
            type="submit" 
            className="btn btn-danger"
            disabled={loading}
          >
            {loading && <span className="spinner-small"></span>}
            {loading 
              ? (recall ? "Đang cập nhật..." : "Đang tạo...")
              : (recall ? "Cập nhật Recall" : "Tạo Recall")
            }
          </button>
        </div>
      </form>
    </div>
  );
}

export default RecallForm;
