import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { evmInventoryAPI } from "../../services/api";
import { toast } from "react-toastify";
import "../../styles/PartsManagement.css";

const VEHICLE_TYPES = ["VF3", "VF5", "VF6", "VF7", "VF8", "VF9", "VFe34"];
const CONDITIONS = ["ACTIVE", "TRANSFERRED"];

function EditSparePartModal({ isOpen, onClose, onSuccess, part }) {
  const [formData, setFormData] = useState({
    name: "",
    vehicleType: "",
    condition: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (part) {
      setFormData({
        name: part.name || "",
        vehicleType: part.vehicleType || "",
        condition: part.condition || "ACTIVE",
      });
    }
  }, [part]);

  if (!isOpen || !part) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError("Vui lòng nhập tên phụ tùng");
      return;
    }

    if (!formData.vehicleType) {
      setError("Vui lòng chọn loại xe");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: formData.name.trim(),
        vehicleType: formData.vehicleType,
        condition: formData.condition,
      };

      console.log(`📝 Updating spare part ${part.id}:`, payload);

      const response = await evmInventoryAPI.updateSparePart(part.id, payload);

      if (response.success) {
        toast.success("Cập nhật phụ tùng thành công!");
        if (onSuccess) {
          onSuccess();
        }
        onClose();
      } else {
        throw new Error(response.message || "Không thể cập nhật phụ tùng");
      }
    } catch (err) {
      console.error("❌ Error updating spare part:", err);
      setError(err.message || "Không thể cập nhật phụ tùng");
      toast.error(err.message || "Không thể cập nhật phụ tùng");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Sửa thông tin phụ tùng</h2>
          <button className="btn-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {/* Thông tin không đổi */}
          <div className="info-section">
            <div className="info-row">
              <span className="info-label">Serial:</span>
              <code className="serial-code">{part.id}</code>
            </div>
            {part.partTypeInfoDTO && (
              <>
                <div className="info-row">
                  <span className="info-label">Loại phụ tùng:</span>
                  <span>{part.partTypeInfoDTO.partName}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Nhà sản xuất:</span>
                  <span>{part.partTypeInfoDTO.manufacturer || "N/A"}</span>
                </div>
              </>
            )}
          </div>

          {/* Tên phụ tùng */}
          <div className="form-group">
            <label htmlFor="name">
              Tên phụ tùng <span className="required">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Nhập tên phụ tùng"
              className="form-control"
              disabled={loading}
              autoFocus
            />
          </div>

          {/* Loại xe */}
          <div className="form-group">
            <label htmlFor="vehicleType">
              Loại xe <span className="required">*</span>
            </label>
            <select
              id="vehicleType"
              name="vehicleType"
              value={formData.vehicleType}
              onChange={handleChange}
              className="form-control"
              disabled={loading}
              required
            >
              <option value="">-- Chọn loại xe --</option>
              {VEHICLE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Tình trạng */}
          <div className="form-group">
            <label htmlFor="condition">
              Tình trạng <span className="required">*</span>
            </label>
            <select
              id="condition"
              name="condition"
              value={formData.condition}
              onChange={handleChange}
              className="form-control"
              disabled={loading}
              required
            >
              {CONDITIONS.map((cond) => (
                <option key={cond} value={cond}>
                  {cond === "ACTIVE" ? "Hoạt động" : "Đã chuyển"}
                </option>
              ))}
            </select>
          </div>

          {/* Error message */}
          {error && (
            <div className="error-message">
              <p>{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="modal-actions">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={loading}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? "Đang cập nhật..." : "Cập nhật"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditSparePartModal;
