import React, { useState } from "react";
import { X, ArrowRight } from "lucide-react";
import { evmInventoryAPI } from "../../services/api";
import { toast } from "react-toastify";
import "../../styles/PartsManagement.css";

// Office Branches từ backend - VinFast Service Centers HCMC
const OFFICE_BRANCHES = [
  "D1",
  "DISTRICT3",
  "DISTRICT5",
  "DISTRICT7",
  "THU_DUC",
  "TAN_BINH",
  "BINH_THANH",
  "PHU_NHUAN",
  "GO_VAP",
  "TAN_PHU"
];

function TransferPartModal({ isOpen, onClose, onSuccess, part }) {
  const [selectedBranch, setSelectedBranch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !part) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!selectedBranch) {
      setError("Vui lòng chọn chi nhánh SC");
      return;
    }

    setLoading(true);

    try {
      console.log(`📤 Transferring part ${part.id} to ${selectedBranch}`);
      
      const response = await evmInventoryAPI.transferToSC(part.id, selectedBranch);

      if (response.success || response.status === 200) {
        toast.success(`Chuyển phụ tùng sang ${selectedBranch} thành công!`);
        setSelectedBranch("");
        if (onSuccess) {
          onSuccess();
        }
        onClose();
      } else {
        throw new Error(response.message || "Không thể chuyển phụ tùng");
      }
    } catch (err) {
      console.error("❌ Error transferring part:", err);
      setError(err.message || "Không thể chuyển phụ tùng");
      toast.error(err.message || "Không thể chuyển phụ tùng");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content transfer-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Chuyển phụ tùng sang SC</h2>
          <button className="btn-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {/* Thông tin phụ tùng */}
          <div className="info-section">
            <h3>Thông tin phụ tùng</h3>
            <div className="info-row">
              <span className="info-label">Serial:</span>
              <code className="serial-code">{part.id}</code>
            </div>
            <div className="info-row">
              <span className="info-label">Tên:</span>
              <strong>{part.name}</strong>
            </div>
            <div className="info-row">
              <span className="info-label">Loại xe:</span>
              <span>{part.vehicleType}</span>
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

          {/* Chọn chi nhánh SC */}
          <div className="form-group">
            <label htmlFor="officeBranch">
              Chọn chi nhánh SC <span className="required">*</span>
            </label>
            <select
              id="officeBranch"
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="form-control"
              disabled={loading}
              required
            >
              <option value="">-- Chọn chi nhánh --</option>
              {OFFICE_BRANCHES.map((branch) => (
                <option key={branch} value={branch}>
                  {branch}
                </option>
              ))}
            </select>
            <small className="form-text text-muted">
              Phụ tùng sẽ được chuyển sang kho của chi nhánh đã chọn
            </small>
          </div>

          {/* Transfer preview */}
          <div className="transfer-preview">
            <div className="transfer-flow">
              <div className="transfer-node">
                <strong>Kho EVM</strong>
                <span className="status-badge status-active">ACTIVE</span>
              </div>
              <ArrowRight size={24} className="transfer-arrow" />
              <div className="transfer-node">
                <strong>{selectedBranch || "Chi nhánh SC"}</strong>
                <span className="status-badge status-transferred">TRANSFERRED</span>
              </div>
            </div>
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
              disabled={loading || !selectedBranch}
            >
              {loading ? "Đang chuyển..." : "Xác nhận chuyển"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TransferPartModal;
