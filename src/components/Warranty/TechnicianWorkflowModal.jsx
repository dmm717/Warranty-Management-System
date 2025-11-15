import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { useAuth } from "../../contexts/AuthContext";
import { normalizeBranchToEnum } from "../../utils/branchUtils";
import {
  partsInventoryAPI,
  serialNumberAPI,
  workResultAPI,
  partsRequestAPI,
  evmInventoryAPI,
} from "../../services/api";
import "./TechnicianWorkflowModal.css";

function TechnicianWorkflowModal({ claim, onClose, onComplete }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(1);

  // Step 1: Parts availability check
  const [partsAvailability, setPartsAvailability] = useState(null);
  const [checkingParts, setCheckingParts] = useState(false);
  const [branchInventory, setBranchInventory] = useState([]); // Toàn bộ kho chi nhánh
  const [selectedParts, setSelectedParts] = useState([]); // Phụ tùng SC_TECHNICAL chọn

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
    if (user?.branchOffice) {
      loadBranchInventory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadBranchInventory = async () => {
    try {
      setCheckingParts(true);

      if (!user?.branchOffice) {
        throw new Error(
          "Không tìm thấy thông tin chi nhánh. Vui lòng đăng nhập lại."
        );
      }

      // Validate và normalize branch name: "Bình Thạnh" → "BINH_THANH"
      let normalizedBranch;
      try {
        normalizedBranch = normalizeBranchToEnum(user.branchOffice);
      } catch (error) {
        console.error(
          "[TechnicianWorkflow] Invalid branch:",
          user.branchOffice
        );
        throw new Error(
          `Chi nhánh "${user.branchOffice}" không hợp lệ. Vui lòng liên hệ quản trị viên.`
        );
      }

      console.log(
        `[TechnicianWorkflow] Loading inventory for branch: ${user.branchOffice} → ${normalizedBranch}`
      );

      const response = await partsInventoryAPI.getBranchInventory(
        normalizedBranch
      );

      if (response.success && Array.isArray(response.data)) {
        setBranchInventory(response.data);
        console.log(
          `✅ Loaded ${response.data.length} part types for ${user.branchOffice}`
        );
        toast.success(
          `Đã tải ${response.data.length} loại phụ tùng từ kho ${user.branchOffice}`
        );
      } else {
        throw new Error("Dữ liệu kho không hợp lệ");
      }
    } catch (error) {
      console.error("❌ Error loading branch inventory:", error);
      toast.error(
        "Lỗi khi tải kho chi nhánh: " + (error.message || "Lỗi không xác định")
      );
      setBranchInventory([]); // Reset về rỗng nếu lỗi
    } finally {
      setCheckingParts(false);
    }
  };

  const handleSelectPart = (part, quantity) => {
    if (quantity > part.availableQuantity) {
      toast.error("Số lượng vượt quá hàng tồn kho!");
      return;
    }

    if (quantity <= 0) {
      // Xóa khỏi danh sách đã chọn
      setSelectedParts(
        selectedParts.filter((p) => p.partTypeId !== part.partTypeId)
      );
      return;
    }

    // Thêm/cập nhật danh sách đã chọn
    const existing = selectedParts.find(
      (p) => p.partTypeId === part.partTypeId
    );
    if (existing) {
      setSelectedParts(
        selectedParts.map((p) =>
          p.partTypeId === part.partTypeId
            ? { ...p, selectedQuantity: quantity }
            : p
        )
      );
    } else {
      setSelectedParts([
        ...selectedParts,
        { ...part, selectedQuantity: quantity },
      ]);
    }
  };

  const handleConfirmPartsSelection = async () => {
    if (selectedParts.length === 0) {
      toast.error("Vui lòng chọn ít nhất một phụ tùng!");
      return;
    }

    if (!user?.branchOffice) {
      toast.error(
        "Không tìm thấy thông tin chi nhánh. Vui lòng đăng nhập lại."
      );
      return;
    }

    try {
      setLoading(true);

      // Validate branch
      let normalizedBranch;
      try {
        normalizedBranch = normalizeBranchToEnum(user.branchOffice);
      } catch (error) {
        throw new Error(`Chi nhánh "${user.branchOffice}" không hợp lệ`);
      }

      console.log(
        `🔽 Consuming ${selectedParts.length} part types from ${normalizedBranch}`
      );

      // Trừ từng phụ tùng từ kho với validation
      const failedParts = [];
      for (const part of selectedParts) {
        try {
          if (!part.partTypeId || !part.selectedQuantity) {
            throw new Error(`Dữ liệu phụ tùng không hợp lệ: ${part.partName}`);
          }

          console.log(
            `  - Consuming ${part.selectedQuantity}x ${part.partName} (${part.partTypeId})`
          );

          const response = await partsInventoryAPI.consumeParts({
            partTypeId: part.partTypeId,
            branch: normalizedBranch,
            quantity: part.selectedQuantity,
          });

          if (!response.success || !response.data) {
            throw new Error(`API trả về lỗi cho ${part.partName}`);
          }

          console.log(`  ✅ Success: ${part.partName}`);
        } catch (error) {
          console.error(`  ❌ Failed: ${part.partName}`, error);
          failedParts.push({ part: part.partName, error: error.message });
        }
      }

      if (failedParts.length > 0) {
        const failedList = failedParts
          .map((f) => `${f.part}: ${f.error}`)
          .join("\\n");
        throw new Error(`Một số phụ tùng không thể trừ:\\n${failedList}`);
      }

      toast.success(
        `✅ Đã trừ ${selectedParts.length} loại phụ tùng từ kho ${user.branchOffice}!`
      );
      setActiveStep(2); // Chuyển sang bước mapping serial
    } catch (error) {
      console.error("❌ Error consuming parts:", error);
      toast.error("Lỗi: " + (error.message || "Không thể trừ phụ tùng từ kho"));
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePartsRequest = async () => {
    if (!user?.branchOffice) {
      toast.error(
        "Không tìm thấy thông tin chi nhánh. Vui lòng đăng nhập lại."
      );
      return;
    }

    if (!claim?.vehicle?.vehicleId) {
      toast.error("Không tìm thấy VIN xe trong claim này.");
      return;
    }

    try {
      // Fetch available part types for dropdown
      const partTypesResponse =
        await evmInventoryAPI.getAllPartTypesNoPagination();
      const partTypes = partTypesResponse.success ? partTypesResponse.data : [];

      if (!partTypes || partTypes.length === 0) {
        toast.error("Không thể tải danh sách phụ tùng");
        return;
      }

      // Show SweetAlert2 form
      const { value: formValues } = await Swal.fire({
        title: "Yêu Cầu Phụ Tùng",
        html: `
          <div style="text-align: left;">
            <p style="margin-bottom: 12px; color: #6b7280;">
              <strong>Claim:</strong> ${claim.claimId}<br/>
              <strong>Xe:</strong> ${claim.vehicle?.vehicleName || "N/A"}<br/>
              <strong>VIN:</strong> ${claim.vehicle?.vehicleId}
            </p>
            <div style="margin-bottom: 16px;">
              <label style="display: block; margin-bottom: 4px; font-weight: 600;">Loại phụ tùng <span style="color: red;">*</span></label>
              <select id="swal-partType" class="swal2-select" style="width: 100%;">
                <option value="">-- Chọn phụ tùng --</option>
                ${partTypes
                  .map(
                    (pt) =>
                      `<option value="${pt.id}">${pt.partName} - ${
                        pt.manufacturer || "N/A"
                      }</option>`
                  )
                  .join("")}
              </select>
            </div>
            <div style="margin-bottom: 16px;">
              <label style="display: block; margin-bottom: 4px; font-weight: 600;">Số lượng <span style="color: red;">*</span></label>
              <input id="swal-quantity" type="number" min="1" value="1" class="swal2-input" style="width: 100%; margin: 0;" />
            </div>
          </div>
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: "Tạo Yêu Cầu",
        cancelButtonText: "Hủy",
        confirmButtonColor: "#3b82f6",
        cancelButtonColor: "#6b7280",
        preConfirm: () => {
          const partTypeId = document.getElementById("swal-partType").value;
          const quantity = document.getElementById("swal-quantity").value;

          if (!partTypeId) {
            Swal.showValidationMessage("Vui lòng chọn loại phụ tùng");
            return false;
          }

          if (!quantity || parseInt(quantity) < 1) {
            Swal.showValidationMessage("Số lượng phải lớn hơn 0");
            return false;
          }

          return { partTypeId, quantity: parseInt(quantity) };
        },
      });

      if (formValues) {
        const selectedPart = partTypes.find(
          (pt) => pt.id === formValues.partTypeId
        );

        if (!selectedPart) {
          toast.error("Không tìm thấy thông tin phụ tùng");
          return;
        }

        const formatDate = (date) => {
          const d = new Date(date);
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, "0");
          const day = String(d.getDate()).padStart(2, "0");
          return `${year}-${month}-${day}`;
        };

        const today = formatDate(new Date());

        // Match PartsRequestCreateDTO exactly - MUST include vehicleVin for filtering
        const requestData = {
          partName: selectedPart.partName,
          quantity: formValues.quantity,
          requestDate: today,
          deliveryDate: today,
          partTypeId: selectedPart.id,
          requestedByStaffId: String(user.id),
          branchOffice: user.branchOffice,
          vehicleVin: claim.vehicle?.vehicleId || claim.vehicleVIN, // CRITICAL: For filtering Parts Requests by VIN
        };

        console.log(
          "[TechnicianWorkflowModal] Creating Parts Request:",
          requestData
        );

        const response = await partsRequestAPI.createPartsRequest(requestData);

        if (response.success) {
          await Swal.fire({
            icon: "success",
            title: "Thành công!",
            text: `Đã tạo yêu cầu phụ tùng. Mã yêu cầu: ${
              response.data?.id || "N/A"
            }`,
            confirmButtonColor: "#3b82f6",
          });

          // Refresh parts availability
          await checkPartsAvailability();
        } else {
          throw new Error(response.message || "Không thể tạo yêu cầu");
        }
      }
    } catch (error) {
      console.error("Error creating parts request:", error);
      toast.error(error.message || "Không thể tạo yêu cầu phụ tùng");
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
        vehicleVIN: claim.vehicle?.vehicleId || claim.vehicleVIN,
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
    // Validation 1: Phải có serial mappings
    if (serialMappings.length === 0) {
      toast.error("Vui lòng thêm ít nhất một serial number mapping!");
      return;
    }

    // ✅ Validation 2: Kiểm tra số lượng serial = số lượng đã lấy
    const partQuantityMap = {};
    selectedParts.forEach((part) => {
      partQuantityMap[part.partTypeId] = part.selectedQuantity;
    });

    const serialCountMap = {};
    serialMappings.forEach((mapping) => {
      serialCountMap[mapping.partId] =
        (serialCountMap[mapping.partId] || 0) + 1;
    });

    for (const [partId, requiredQty] of Object.entries(partQuantityMap)) {
      const mappedQty = serialCountMap[partId] || 0;
      if (mappedQty !== requiredQty) {
        const partName =
          selectedParts.find((p) => p.partTypeId === partId)?.partName ||
          partId;
        toast.error(
          `❌ ${partName}: Cần map ${requiredQty} serial nhưng chỉ có ${mappedQty}!`
        );
        return;
      }
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
        completedByTechnicianId: claim.assignedTechnicianId, // From claim context - assigned by SC_ADMIN/SC_STAFF
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
                <span className="value">
                  {claim?.vehicle?.vehicleName || "N/A"}
                </span>
              </div>
              <div className="info-item">
                <span className="label">VIN:</span>
                <span className="value">
                  {claim?.vehicle?.vehicleId || "N/A"}
                </span>
              </div>
              <div className="info-item">
                <span className="label">Mô Tả Sự Cố:</span>
                <span className="value">{claim?.issueDescription}</span>
              </div>
            </div>
          </div>

          {/* Step 1: Parts Selection from Branch Inventory */}
          {activeStep === 1 && (
            <div className="workflow-step-content">
              <h3>📦 Chọn Phụ Tùng Từ Kho Chi Nhánh</h3>
              <p style={{ color: "#666", marginBottom: "20px" }}>
                Chi nhánh: <strong>{user?.branchOffice}</strong>
              </p>

              {checkingParts ? (
                <div className="loading-state">Đang tải kho...</div>
              ) : (
                <>
                  <div className="parts-list">
                    {branchInventory.length > 0 ? (
                      branchInventory.map((part, index) => (
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
                            {part.manufacturer && (
                              <span
                                className="part-manufacturer"
                                style={{ color: "#000", fontWeight: 700 }}
                              >
                                | {part.manufacturer}
                              </span>
                            )}
                          </div>
                          <div className="part-status">
                            <span className="quantity">
                              Kho: {part.availableQuantity}
                            </span>
                            {part.price && (
                              <span className="part-price">
                                Giá: {part.price.toLocaleString()} VNĐ
                              </span>
                            )}
                            {part.isAvailable ? (
                              <div className="quantity-selector">
                                <label>Chọn số lượng:</label>
                                <input
                                  type="number"
                                  min="0"
                                  max={part.availableQuantity}
                                  defaultValue="0"
                                  onChange={(e) =>
                                    handleSelectPart(
                                      part,
                                      parseInt(e.target.value) || 0
                                    )
                                  }
                                  style={{
                                    width: "80px",
                                    padding: "6px",
                                    marginLeft: "10px",
                                    border: "2px solid #667eea",
                                    borderRadius: "4px",
                                    color: "#000",
                                    fontWeight: 600,
                                  }}
                                />
                              </div>
                            ) : (
                              <span
                                className="status-badge error"
                                style={{ color: "#000" }}
                              >
                                {part.message}
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="no-parts">
                        ⚠️ Kho chi nhánh trống hoặc chưa tải được dữ liệu.
                      </div>
                    )}
                  </div>

                  {selectedParts.length > 0 && (
                    <div className="selected-parts-summary">
                      <h4>✅ Phụ Tùng Đã Chọn ({selectedParts.length})</h4>
                      {selectedParts.map((part, idx) => (
                        <div key={idx} className="selected-part-item">
                          <span>{part.partName}</span>
                          <span>x {part.selectedQuantity}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="step-actions">
                    <button
                      className="btn-secondary"
                      onClick={loadBranchInventory}
                      disabled={checkingParts}
                    >
                      🔄 Tải Lại Kho
                    </button>
                    <button
                      className="btn-warning"
                      onClick={handleCreatePartsRequest}
                      disabled={loading}
                      style={{
                        backgroundColor: "#f59e0b",
                        color: "white",
                      }}
                    >
                      📦 Yêu Cầu Phụ Tùng
                    </button>
                    <button
                      className="btn-primary"
                      onClick={handleConfirmPartsSelection}
                      disabled={selectedParts.length === 0 || loading}
                    >
                      {loading ? "Đang xử lý..." : "Xác Nhận & Tiếp Theo →"}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step 2: Serial Number Mapping */}
          {activeStep === 2 && (
            <div className="workflow-step-content">
              <h3>🏷️ Mapping Serial Numbers</h3>

              {/* ✅ Progress Indicator */}
              <div
                className="mapping-progress"
                style={{
                  marginBottom: "20px",
                  padding: "15px",
                  backgroundColor: "#f0f9ff",
                  borderRadius: "8px",
                  border: "1px solid #0ea5e9",
                }}
              >
                <h4 style={{ marginBottom: "10px", color: "#0369a1" }}>
                  📊 Tiến độ map serial numbers
                </h4>
                {selectedParts.map((part) => {
                  const mappedCount = serialMappings.filter(
                    (m) => m.partId === part.partTypeId
                  ).length;
                  const requiredCount = part.selectedQuantity;
                  const percentage = (mappedCount / requiredCount) * 100;
                  const isComplete = mappedCount === requiredCount;

                  return (
                    <div key={part.partTypeId} style={{ marginBottom: "10px" }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: "5px",
                        }}
                      >
                        <span>
                          <strong>{part.partName}</strong>
                        </span>
                        <span
                          style={{ color: isComplete ? "#16a34a" : "#dc2626" }}
                        >
                          {mappedCount}/{requiredCount}{" "}
                          {isComplete ? "✅" : "⏳"}
                        </span>
                      </div>
                      <div
                        style={{
                          width: "100%",
                          height: "8px",
                          backgroundColor: "#e5e7eb",
                          borderRadius: "4px",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${percentage}%`,
                            height: "100%",
                            backgroundColor: isComplete ? "#16a34a" : "#3b82f6",
                            transition: "width 0.3s ease",
                          }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>

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
                    <option value="">-- Chọn loại phụ tùng đã lấy --</option>
                    {selectedParts.map((part) => (
                      <option key={part.partTypeId} value={part.partTypeId}>
                        {part.partName} - Đã lấy: {part.selectedQuantity} cái
                        (ID: {part.partTypeId})
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
