import React, { useState } from "react";
import { X, Link } from "lucide-react";
import { toast } from "react-toastify";
import { scInventoryAPI } from "../../services/api";
import "../../styles/PartsManagement.css";

function MapPartToVehicleModal({ part, onClose, onSuccess }) {
  const [vehicleId, setVehicleId] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!vehicleId.trim()) {
      toast.error("Vui lòng nhập VIN xe");
      return;
    }

    try {
      setLoading(true);
      const response = await scInventoryAPI.mapPartToVehicle(part.id, vehicleId.trim());

      if (response.success || response.data) {
        toast.success(`Đã gán phụ tùng ${part.name} cho xe ${vehicleId}`, {
          position: "top-right",
          autoClose: 3000,
        });
        onSuccess();
        onClose();
      } else {
        toast.error(response.message || "Không thể gán phụ tùng cho xe");
      }
    } catch (error) {
      console.error("Error mapping part to vehicle:", error);
      toast.error("Đã xảy ra lỗi khi gán phụ tùng");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-sm" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>
            <Link size={20} />
            Gán phụ tùng cho xe
          </h3>
          <button className="btn-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            {/* Part Info */}
            <div className="info-section">
              <h4>Thông tin phụ tùng</h4>
              <div className="info-row">
                <span className="info-label">Serial Number:</span>
                <code className="serial-code">{part.id}</code>
              </div>
              <div className="info-row">
                <span className="info-label">Tên:</span>
                <span>{part.name}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Loại xe:</span>
                <span>{part.vehicleType}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Chi nhánh:</span>
                <span>{part.officeBranch}</span>
              </div>
            </div>

            {/* Vehicle Input */}
            <div className="form-group">
              <label htmlFor="vehicleId" className="required">
                VIN xe
              </label>
              <input
                type="text"
                id="vehicleId"
                className="form-control"
                placeholder="Nhập VIN số xe..."
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
                disabled={loading}
                required
              />
              <small className="form-text">
                Nhập VIN (Vehicle Identification Number) của xe cần gán phụ tùng
              </small>
            </div>

            {/* Actions */}
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                disabled={loading}
              >
                Hủy
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? "Đang xử lý..." : "Xác nhận gán"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default MapPartToVehicleModal;
