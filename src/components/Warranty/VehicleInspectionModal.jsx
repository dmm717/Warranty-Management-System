import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { inspectionAPI } from "../../services/api";
import "../../styles/VehicleInspectionModal.css";

const VehicleInspectionModal = ({ claim, onClose, onSubmitSuccess }) => {
  const [warrantyParts, setWarrantyParts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [overallNotes, setOverallNotes] = useState("");
  const [selectedParts, setSelectedParts] = useState({}); // { partId: { selected, quantity, notes } }

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const response = await inspectionAPI.getWarrantyPartsForClaim(claim.id);
        setWarrantyParts(response.data || []);

        if (!response.data || response.data.length === 0) {
          toast.warning("Không có phụ tùng nào được bảo hành cho loại xe này");
        }
      } catch (error) {
        console.error("Error loading warranty parts:", error);
        toast.error("Không thể tải danh sách phụ tùng bảo hành");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [claim.id]);

  const handlePartSelect = (partId, selected) => {
    setSelectedParts((prev) => ({
      ...prev,
      [partId]: {
        ...prev[partId],
        selected,
        quantity: selected ? prev[partId]?.quantity || 1 : 0,
        notes: prev[partId]?.notes || "",
      },
    }));
  };

  const handleQuantityChange = (partId, quantity) => {
    const numQuantity = parseInt(quantity) || 0;
    setSelectedParts((prev) => ({
      ...prev,
      [partId]: {
        ...prev[partId],
        quantity: numQuantity,
      },
    }));
  };

  const handleNotesChange = (partId, notes) => {
    setSelectedParts((prev) => ({
      ...prev,
      [partId]: {
        ...prev[partId],
        notes,
      },
    }));
  };

  const validateSubmission = () => {
    const selectedPartsArray = Object.entries(selectedParts).filter(
      ([, data]) => data.selected
    );

    if (selectedPartsArray.length === 0 && !overallNotes.trim()) {
      toast.error(
        "Vui lòng chọn ít nhất một phụ tùng hoặc nhập kết luận chung"
      );
      return false;
    }

    // Validate selected parts have quantity
    for (const [partId, data] of selectedPartsArray) {
      if (!data.quantity || data.quantity <= 0) {
        const part = warrantyParts.find((p) => p.partTypeId === partId);
        toast.error(
          `Vui lòng nhập số lượng cho phụ tùng: ${part?.partName || "Unknown"}`
        );
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateSubmission()) {
      return;
    }

    try {
      setSubmitting(true);

      const partsUsed = Object.entries(selectedParts)
        .filter(([, data]) => data.selected)
        .map(([partId, data]) => ({
          partTypeId: partId,
          quantity: data.quantity,
          notes: data.notes || "",
        }));

      const technicianId = localStorage.getItem("userId"); // Get from auth context

      const submitData = {
        claimId: claim.id,
        technicianId,
        overallNotes,
        partsUsed,
      };

      const response = await inspectionAPI.submitInspectionResult(submitData);

      if (response.data) {
        if (response.data.partsPending > 0) {
          toast.warning(response.data.message, { autoClose: 5000 });
        } else {
          toast.success(response.data.message);
        }

        if (onSubmitSuccess) {
          onSubmitSuccess(response.data);
        }
        onClose();
      }
    } catch (error) {
      console.error("Error submitting inspection:", error);
      toast.error(
        error.response?.data?.message || "Không thể gửi kết quả kiểm tra"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const getStockWarningClass = (stock) => {
    if (stock === 0) return "stock-out";
    if (stock < 5) return "stock-low";
    return "stock-ok";
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content inspection-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>
            🔧 Kiểm Tra Xe: {claim.vehicle?.vehicleName || claim.vehicleVinId}
          </h2>
          <button className="close-btn" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="modal-body">
          {/* Claim Info */}
          <div className="claim-info-section">
            <h3>📋 Thông Tin Yêu Cầu</h3>
            <div className="info-grid">
              <div className="info-item">
                <label>Mã yêu cầu:</label>
                <span>{claim.id}</span>
              </div>
              <div className="info-item">
                <label>Khách hàng:</label>
                <span>{claim.customerName}</span>
              </div>
              <div className="info-item">
                <label>Vấn đề:</label>
                <span>{claim.issueDescription}</span>
              </div>
            </div>
          </div>

          {/* Warranty Parts List */}
          <div className="warranty-parts-section">
            <h3>📦 Danh Sách Phụ Tùng Được Bảo Hành</h3>

            {loading ? (
              <div className="loading-state">
                Đang tải danh sách phụ tùng...
              </div>
            ) : warrantyParts.length === 0 ? (
              <div className="empty-state">
                Không có phụ tùng bảo hành cho loại xe này
              </div>
            ) : (
              <div className="parts-list">
                {warrantyParts.map((part) => (
                  <div key={part.partTypeId} className="part-item">
                    <div className="part-header">
                      <input
                        type="checkbox"
                        id={`part-${part.partTypeId}`}
                        checked={
                          selectedParts[part.partTypeId]?.selected || false
                        }
                        onChange={(e) =>
                          handlePartSelect(part.partTypeId, e.target.checked)
                        }
                      />
                      <label
                        htmlFor={`part-${part.partTypeId}`}
                        className="part-name"
                      >
                        {part.partName}
                      </label>
                      <span
                        className={`stock-badge ${getStockWarningClass(
                          part.stock
                        )}`}
                      >
                        {part.stock === 0
                          ? "⚠️ HẾT HÀNG"
                          : `Kho: ${part.stock} cái`}
                      </span>
                    </div>

                    <div className="part-details">
                      <div className="detail-row">
                        <span className="label">Giá:</span>
                        <span className="value">
                          {part.price?.toLocaleString("vi-VN")}đ
                        </span>
                      </div>
                      <div className="detail-row">
                        <span className="label">Chính sách:</span>
                        <span className="value">{part.warrantyPolicyName}</span>
                      </div>
                      {part.manufacturer && (
                        <div className="detail-row">
                          <span className="label">Nhà sản xuất:</span>
                          <span className="value">{part.manufacturer}</span>
                        </div>
                      )}
                    </div>

                    {selectedParts[part.partTypeId]?.selected && (
                      <div className="part-input-section">
                        <div className="quantity-input">
                          <label>Số lượng cần thay:</label>
                          <input
                            type="number"
                            min="1"
                            value={
                              selectedParts[part.partTypeId]?.quantity || 1
                            }
                            onChange={(e) =>
                              handleQuantityChange(
                                part.partTypeId,
                                e.target.value
                              )
                            }
                          />
                          {selectedParts[part.partTypeId]?.quantity >
                            part.stock && (
                            <span className="warning-text">
                              ⚠️ Vượt quá tồn kho (cần đặt hàng)
                            </span>
                          )}
                        </div>
                        <div className="notes-input">
                          <label>Ghi chú tình trạng:</label>
                          <input
                            type="text"
                            placeholder="VD: Pin bị phồng, cần thay ngay"
                            value={selectedParts[part.partTypeId]?.notes || ""}
                            onChange={(e) =>
                              handleNotesChange(part.partTypeId, e.target.value)
                            }
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Overall Notes */}
          <div className="overall-notes-section">
            <label>📝 Kết Luận Chung:</label>
            <textarea
              rows="4"
              placeholder="Nhập kết luận chung về tình trạng xe..."
              value={overallNotes}
              onChange={(e) => setOverallNotes(e.target.value)}
            />
          </div>
        </div>

        <div className="modal-footer">
          <button
            className="btn-cancel"
            onClick={onClose}
            disabled={submitting}
          >
            Hủy
          </button>
          <button
            className="btn-submit"
            onClick={handleSubmit}
            disabled={submitting || loading}
          >
            {submitting ? "Đang lưu..." : "✅ Lưu Kết Quả Kiểm Tra"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VehicleInspectionModal;
