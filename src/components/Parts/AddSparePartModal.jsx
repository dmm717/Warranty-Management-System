import React, { useState } from "react";
import { X } from "lucide-react";
import { evmInventoryAPI } from "../../services/api";
import { toast } from "react-toastify";
import "../../styles/PartsManagement.css";

function AddSparePartModal({ isOpen, onClose, onSuccess, partTypeInfo }) {
  const [formData, setFormData] = useState({
    quantity: 1,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const quantity = parseInt(formData.quantity);
    if (!quantity || quantity < 1 || quantity > 100) {
      setError("Vui lòng nhập số lượng từ 1 đến 100");
      return;
    }

    setLoading(true);

    try {
      let successCount = 0;
      let failedCount = 0;

      // Tạo nhiều phụ tùng theo số lượng
      for (let i = 1; i <= quantity; i++) {
        // Tạo tên tự động: [Tên Part Type]-[Số thứ tự]
        const autoName = `${partTypeInfo.partName}-${Date.now()}-${i}`;

        const payload = {
          name: autoName,
          vehicleType: partTypeInfo.vehicleType || "VF3",
          condition: "ACTIVE",
          partTypeId: partTypeInfo.id,
        };

        console.log(`📤 Creating spare part ${i}/${quantity}:`, payload);

        try {
          const response = await evmInventoryAPI.createSparePart(payload);
          if (response.success) {
            successCount++;
          } else {
            failedCount++;
          }
        } catch (err) {
          console.error(`❌ Error creating spare part ${i}:`, err);
          failedCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`Thêm thành công ${successCount} phụ tùng!`);
        setFormData({ quantity: 1 });
        if (onSuccess) {
          onSuccess();
        }
        onClose();
      }

      if (failedCount > 0) {
        toast.warning(`Thêm thất bại ${failedCount} phụ tùng`);
      }
    } catch (err) {
      console.error("❌ Error creating spare parts:", err);
      setError(err.message || "Không thể thêm phụ tùng");
      toast.error(err.message || "Không thể thêm phụ tùng");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const value = e.target.value;
    // Chỉ cho phép số và giới hạn 1-100
    if (value === '' || (parseInt(value) >= 1 && parseInt(value) <= 100)) {
      setFormData({
        ...formData,
        [e.target.name]: value,
      });
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Thêm phụ tùng mới</h2>
          <button className="btn-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {/* Hiển thị thông tin Part Type */}
          <div className="info-section">
            <div className="info-row">
              <span className="info-label">Loại phụ tùng:</span>
              <strong>{partTypeInfo.partName}</strong>
            </div>
            <div className="info-row">
              <span className="info-label">Mã loại:</span>
              <code className="serial-code">{partTypeInfo.id}</code>
            </div>
            {partTypeInfo.vehicleType && (
              <div className="info-row">
                <span className="info-label">Loại xe:</span>
                <span>{partTypeInfo.vehicleType}</span>
              </div>
            )}
            {partTypeInfo.manufacturer && (
              <div className="info-row">
                <span className="info-label">Nhà sản xuất:</span>
                <span>{partTypeInfo.manufacturer}</span>
              </div>
            )}
          </div>

          {/* Input số lượng */}
          <div className="form-group">
            <label htmlFor="quantity">
              Số lượng phụ tùng cần thêm <span className="required">*</span>
            </label>
            <input
              type="number"
              id="quantity"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              min="1"
              max="100"
              placeholder="Nhập số lượng (1-100)"
              className="form-control"
              disabled={loading}
              autoFocus
            />
            <small className="form-text text-muted">
              Hệ thống sẽ tự động tạo {formData.quantity || 0} phụ tùng với tên: <strong>{partTypeInfo.partName}-[số]</strong>
            </small>
          </div>

          {/* Thông tin tự động */}
          <div className="auto-info">
            <p className="text-muted">
              <strong>Thông tin tự động:</strong>
            </p>
            <ul>
              <li>Tình trạng: <span className="status-badge status-active">ACTIVE</span></li>
              <li>Loại xe: <strong>{partTypeInfo.vehicleType || "VF3"}</strong></li>
            </ul>
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
              {loading ? "Đang thêm..." : "Thêm phụ tùng"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddSparePartModal;
