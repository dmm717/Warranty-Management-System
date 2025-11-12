import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  partsInventoryAPI,
  serialNumberAPI,
  workResultAPI,
} from "../../services/api";
import "./TechnicianWorkflowModal.css";

function TechnicianWorkflowModal({ claim, onClose, onComplete }) {
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(1);

  // Step 1: Parts availability check
  const [partsAvailability, setPartsAvailability] = useState(null);
  const [checkingParts, setCheckingParts] = useState(false);

  // Step 2: Serial number mappings
  const [serialMappings, setSerialMappings] = useState([]);
  const [currentSerial, setCurrentSerial] = useState({
    serialNumber: "",
    partId: "",
    durabilityPercentage: 100,
    notes: "",
  });

  // Step 3: Work completion
  const [workNotes, setWorkNotes] = useState("");
  const [returnDate, setReturnDate] = useState("");

  useEffect(() => {
    if (claim?.claimId) {
      checkPartsAvailability();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claim]);

  const checkPartsAvailability = async () => {
    try {
      setCheckingParts(true);
      const response = await partsInventoryAPI.checkPartsAvailability(
        claim.claimId
      );

      if (response.success) {
        setPartsAvailability(response.data);

        if (!response.data.allPartsAvailable) {
          toast.warning(
            "Một số phụ tùng không đủ. Vui lòng kiểm tra và yêu cầu bổ sung!"
          );
        } else {
          toast.success("Tất cả phụ tùng đều sẵn có!");
        }
      }
    } catch (error) {
      console.error("Error checking parts:", error);
      toast.error("Lỗi khi kiểm tra phụ tùng: " + error.message);
    } finally {
      setCheckingParts(false);
    }
  };

  const handleAddSerialMapping = async () => {
    // Validation
    if (!currentSerial.serialNumber.trim()) {
      toast.error("Vui lòng nhập Serial Number!");
      return;
    }

    if (!currentSerial.partId.trim()) {
      toast.error("Vui lòng chọn loại phụ tùng!");
      return;
    }

    if (
      currentSerial.durabilityPercentage < 0 ||
      currentSerial.durabilityPercentage > 100
    ) {
      toast.error("Độ bền phải từ 0-100%!");
      return;
    }

    try {
      setLoading(true);

      // Check if serial number is already used
      const checkResponse = await serialNumberAPI.checkSerialUsed(
        currentSerial.serialNumber
      );

      if (checkResponse.success && checkResponse.data === true) {
        toast.error("Serial number này đã được sử dụng!");
        return;
      }

      // Create mapping
      const mappingData = {
        serialNumber: currentSerial.serialNumber,
        partId: currentSerial.partId,
        vehicleVIN: claim.vehicleVIN,
        claimId: claim.claimId,
        notes: currentSerial.notes || "",
        durabilityPercentage: currentSerial.durabilityPercentage,
      };

      const response = await serialNumberAPI.createMapping(mappingData);

      if (response.success) {
        toast.success("Đã thêm serial number mapping!");
        setSerialMappings([...serialMappings, response.data]);

        // Reset form
        setCurrentSerial({
          serialNumber: "",
          partId: "",
          durabilityPercentage: 100,
          notes: "",
        });
      }
    } catch (error) {
      console.error("Error adding serial mapping:", error);
      toast.error("Lỗi khi thêm serial mapping: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveSerialMapping = async (serialNumber) => {
    try {
      setLoading(true);
      const response = await serialNumberAPI.deleteMapping(serialNumber);

      if (response.success) {
        toast.success("Đã xóa serial mapping!");
        setSerialMappings(
          serialMappings.filter((m) => m.serialNumber !== serialNumber)
        );
      }
    } catch (error) {
      console.error("Error removing serial mapping:", error);
      toast.error("Lỗi khi xóa serial mapping: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteWork = async () => {
    // Validation
    if (serialMappings.length === 0) {
      toast.error("Vui lòng thêm ít nhất một serial number mapping!");
      return;
    }

    if (!workNotes.trim()) {
      toast.error("Vui lòng nhập ghi chú công việc!");
      return;
    }

    if (!returnDate) {
      toast.error("Vui lòng chọn ngày trả xe!");
      return;
    }

    try {
      setLoading(true);

      // Prepare work completion data
      const workCompletionData = {
        claimId: claim.claimId,
        partsUsed: [...new Set(serialMappings.map((m) => m.partId))], // Unique part IDs
        serialNumbers: serialMappings.map((m) => m.serialNumber),
        completionNotes: workNotes,
        returnDate: new Date(returnDate).toISOString(),
        completedByTechnicianId: claim.assignedTechnicianId || "TECH001", // Get from claim or user context
        workDurationHours: null, // Optional
      };

      // Call work completion API
      const response = await workResultAPI.completeWork(workCompletionData);

      if (response.success) {
        toast.success("Đã hoàn thành công việc bảo hành!");
      } else {
        throw new Error(response.message || "Failed to complete work");
      }

      if (onComplete) {
        onComplete({
          claimId: claim.claimId,
          serialMappings,
          workNotes,
          returnDate,
        });
      }

      onClose();
    } catch (error) {
      console.error("Error completing work:", error);
      toast.error("Lỗi khi hoàn thành công việc: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getStepClass = (step) => {
    if (activeStep === step) return "step active";
    if (activeStep > step) return "step completed";
    return "step";
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="technician-workflow-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>🔧 Quy Trình Làm Việc - Kỹ Thuật Viên</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        {/* Stepper */}
        <div className="workflow-stepper">
          <div className={getStepClass(1)}>
            <div className="step-number">1</div>
            <div className="step-label">Kiểm Tra Phụ Tùng</div>
          </div>
          <div className="step-line"></div>
          <div className={getStepClass(2)}>
            <div className="step-number">2</div>
            <div className="step-label">Mapping Serial</div>
          </div>
          <div className="step-line"></div>
          <div className={getStepClass(3)}>
            <div className="step-number">3</div>
            <div className="step-label">Hoàn Thành</div>
          </div>
        </div>

        <div className="modal-body">
          {/* Claim Info */}
          <div className="claim-info-section">
            <h3>📋 Thông Tin Claim</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="label">Mã Claim:</span>
                <span className="value">{claim?.claimId}</span>
              </div>
              <div className="info-item">
                <span className="label">Xe:</span>
                <span className="value">{claim?.vehicleName}</span>
              </div>
              <div className="info-item">
                <span className="label">VIN:</span>
                <span className="value">{claim?.vehicleVIN}</span>
              </div>
              <div className="info-item">
                <span className="label">Mô Tả Sự Cố:</span>
                <span className="value">{claim?.issueDescription}</span>
              </div>
            </div>
          </div>

          {/* Step 1: Parts Availability Check */}
          {activeStep === 1 && (
            <div className="workflow-step-content">
              <h3>🔍 Kiểm Tra Tình Trạng Phụ Tùng</h3>

              {checkingParts ? (
                <div className="loading-state">Đang kiểm tra...</div>
              ) : partsAvailability ? (
                <div className="parts-availability-result">
                  <div
                    className={`overall-status ${
                      partsAvailability.allPartsAvailable
                        ? "available"
                        : "unavailable"
                    }`}
                  >
                    <span className="icon">
                      {partsAvailability.allPartsAvailable ? "✅" : "⚠️"}
                    </span>
                    <span className="message">
                      {partsAvailability.overallMessage}
                    </span>
                  </div>

                  <div className="parts-list">
                    {partsAvailability.parts &&
                    partsAvailability.parts.length > 0 ? (
                      partsAvailability.parts.map((part, index) => (
                        <div
                          key={index}
                          className={`part-item ${
                            part.isAvailable ? "available" : "unavailable"
                          }`}
                        >
                          <div className="part-info">
                            <span className="part-name">{part.partName}</span>
                            <span className="part-id">
                              (ID: {part.partTypeId})
                            </span>
                          </div>
                          <div className="part-status">
                            <span className="quantity">
                              Số lượng: {part.availableQuantity}
                            </span>
                            <span
                              className={`status-badge ${
                                part.isAvailable ? "success" : "error"
                              }`}
                            >
                              {part.message}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="no-parts">
                        Không có thông tin phụ tùng
                      </div>
                    )}
                  </div>

                  <div className="step-actions">
                    <button
                      className="btn-secondary"
                      onClick={checkPartsAvailability}
                      disabled={checkingParts}
                    >
                      🔄 Kiểm Tra Lại
                    </button>
                    <button
                      className="btn-primary"
                      onClick={() => setActiveStep(2)}
                      disabled={!partsAvailability.allPartsAvailable}
                    >
                      Tiếp Theo →
                    </button>
                  </div>
                </div>
              ) : (
                <div className="error-state">
                  Không thể kiểm tra phụ tùng. Vui lòng thử lại.
                </div>
              )}
            </div>
          )}

          {/* Step 2: Serial Number Mapping */}
          {activeStep === 2 && (
            <div className="workflow-step-content">
              <h3>🏷️ Mapping Serial Numbers</h3>

              <div className="serial-mapping-form">
                <div className="form-group">
                  <label>Serial Number *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Nhập serial number của phụ tùng"
                    value={currentSerial.serialNumber}
                    onChange={(e) =>
                      setCurrentSerial({
                        ...currentSerial,
                        serialNumber: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Part Type ID *</label>
                  <select
                    className="form-control"
                    value={currentSerial.partId}
                    onChange={(e) =>
                      setCurrentSerial({
                        ...currentSerial,
                        partId: e.target.value,
                      })
                    }
                  >
                    <option value="">-- Chọn loại phụ tùng --</option>
                    {partsAvailability?.parts?.map((part) => (
                      <option key={part.partTypeId} value={part.partTypeId}>
                        {part.partName} (ID: {part.partTypeId})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Độ Bền: {currentSerial.durabilityPercentage}%</label>
                  <div className="durability-slider-container">
                    <input
                      type="range"
                      className="durability-slider"
                      min="0"
                      max="100"
                      step="5"
                      value={currentSerial.durabilityPercentage}
                      onChange={(e) =>
                        setCurrentSerial({
                          ...currentSerial,
                          durabilityPercentage: parseInt(e.target.value),
                        })
                      }
                    />
                    <div className="durability-labels">
                      <span>0%</span>
                      <span>50%</span>
                      <span>100%</span>
                    </div>
                  </div>
                  <div
                    className="durability-indicator"
                    style={{
                      backgroundColor:
                        currentSerial.durabilityPercentage >= 80
                          ? "#4caf50"
                          : currentSerial.durabilityPercentage >= 50
                          ? "#ff9800"
                          : "#f44336",
                      width: `${currentSerial.durabilityPercentage}%`,
                    }}
                  ></div>
                </div>

                <div className="form-group">
                  <label>Ghi Chú</label>
                  <textarea
                    className="form-control"
                    rows="2"
                    placeholder="Ghi chú về phụ tùng (tùy chọn)"
                    value={currentSerial.notes}
                    onChange={(e) =>
                      setCurrentSerial({
                        ...currentSerial,
                        notes: e.target.value,
                      })
                    }
                  ></textarea>
                </div>

                <button
                  className="btn-add-serial"
                  onClick={handleAddSerialMapping}
                  disabled={loading}
                >
                  ➕ Thêm Serial Mapping
                </button>
              </div>

              {/* Added Serial Mappings */}
              {serialMappings.length > 0 && (
                <div className="serial-mappings-list">
                  <h4>✅ Serial Numbers Đã Thêm ({serialMappings.length})</h4>
                  {serialMappings.map((mapping, index) => (
                    <div key={index} className="serial-mapping-item">
                      <div className="mapping-info">
                        <span className="serial-number">
                          🏷️ {mapping.serialNumber}
                        </span>
                        <span className="part-id">
                          Part: {mapping.partId || "N/A"}
                        </span>
                        <span className="durability">
                          Độ bền: {mapping.durabilityPercentage}%
                        </span>
                      </div>
                      <button
                        className="btn-remove"
                        onClick={() =>
                          handleRemoveSerialMapping(mapping.serialNumber)
                        }
                        disabled={loading}
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="step-actions">
                <button
                  className="btn-secondary"
                  onClick={() => setActiveStep(1)}
                >
                  ← Quay Lại
                </button>
                <button
                  className="btn-primary"
                  onClick={() => setActiveStep(3)}
                  disabled={serialMappings.length === 0}
                >
                  Tiếp Theo →
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Work Completion */}
          {activeStep === 3 && (
            <div className="workflow-step-content">
              <h3>✅ Hoàn Thành Công Việc</h3>

              <div className="completion-form">
                <div className="form-group">
                  <label>Ghi Chú Công Việc *</label>
                  <textarea
                    className="form-control"
                    rows="4"
                    placeholder="Mô tả chi tiết công việc đã thực hiện, tình trạng xe sau sửa chữa..."
                    value={workNotes}
                    onChange={(e) => setWorkNotes(e.target.value)}
                  ></textarea>
                </div>

                <div className="form-group">
                  <label>Ngày Trả Xe *</label>
                  <input
                    type="date"
                    className="form-control"
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>

                {/* Summary */}
                <div className="work-summary">
                  <h4>📊 Tóm Tắt Công Việc</h4>
                  <div className="summary-item">
                    <span className="summary-label">Tổng Serial Numbers:</span>
                    <span className="summary-value">
                      {serialMappings.length}
                    </span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Phụ tùng đã dùng:</span>
                    <div className="parts-used">
                      {[...new Set(serialMappings.map((m) => m.partId))].join(
                        ", "
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="step-actions">
                <button
                  className="btn-secondary"
                  onClick={() => setActiveStep(2)}
                >
                  ← Quay Lại
                </button>
                <button
                  className="btn-success"
                  onClick={handleCompleteWork}
                  disabled={loading || !workNotes || !returnDate}
                >
                  {loading ? "Đang xử lý..." : "✅ Hoàn Thành Công Việc"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TechnicianWorkflowModal;
