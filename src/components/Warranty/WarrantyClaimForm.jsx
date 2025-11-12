import React, { useState, useEffect } from "react";
import { vehicleAPI } from "../../services/api";
import WarrantyPolicyChecker from "./WarrantyPolicyChecker";
import "../../styles/WarrantyClaimForm.css";

function WarrantyClaimForm({ claim, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    email: "",
    vehicleId: "",
    issueDescription: "",
    requiredPart: "",
    claimDate: new Date().toISOString().split("T")[0], // Add claimDate with today's date
  });

  const [errors, setErrors] = useState({});
  const [vehicles, setVehicles] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [loading, setLoading] = useState(false);
  const [showPolicyChecker, setShowPolicyChecker] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState(null); // Changed to store VIN for comprehensive warranty check

  // State for warranty policy validation
  const [policyChecked, setPolicyChecked] = useState(false);
  const [policyEligible, setPolicyEligible] = useState(false);
  const [policyCheckResult, setPolicyCheckResult] = useState(null);

  useEffect(() => {
    fetchVehicles();

    if (claim) {
      setFormData({
        customerName: claim.customerName || "",
        customerPhone: claim.customerPhone || "",
        email: claim.email || "",
        vehicleId: claim.vehicleId || "",
        issueDescription: claim.issueDescription || "",
        requiredPart: claim.requiredPart || "",
        claimDate: claim.claimDate || new Date().toISOString().split("T")[0],
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

      if (response.success && response.data?.content) {
        // Transform data từ BE sang format FE
        const transformedVehicles = response.data.content.map((vehicle) => ({
          id: vehicle.id,
          name: vehicle.name,
          owner: vehicle.owner,
          phoneNumber: vehicle.phoneNumber,
          email: vehicle.email,
          vehicleTypeId: vehicle.vehicleTypeId, // Thêm vehicleTypeId để check warranty policy
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
    const selectedVehicle = vehicles.find((v) => v.id === vehicleId);

    if (selectedVehicle) {
      setFormData((prev) => ({
        ...prev,
        vehicleId: vehicleId,
        customerName: selectedVehicle.owner,
        customerPhone: selectedVehicle.phoneNumber,
        email: selectedVehicle.email,
      }));
      // Lưu vehicleId (VIN) để kiểm tra warranty policy toàn diện
      setSelectedVehicleId(vehicleId);

      // Reset policy check when vehicle changes
      setPolicyChecked(false);
      setPolicyEligible(false);
      setPolicyCheckResult(null);
    } else {
      setFormData((prev) => ({
        ...prev,
        vehicleId: "",
        customerName: "",
        customerPhone: "",
        email: "",
      }));
      setSelectedVehicleId(null);
      setPolicyChecked(false);
      setPolicyEligible(false);
      setPolicyCheckResult(null);
    }
  };

  const handleCheckWarrantyPolicy = () => {
    if (!formData.vehicleId) {
      alert("Vui lòng chọn xe trước khi kiểm tra chính sách bảo hành!");
      return;
    }
    setShowPolicyChecker(true);
  };

  const handlePolicyCheckComplete = (checkResult) => {
    setPolicyChecked(true);
    setPolicyEligible(checkResult.isEligible);
    setPolicyCheckResult(checkResult);
    setShowPolicyChecker(false);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.vehicleId) {
      newErrors.vehicleId = "Vui lòng chọn xe";
    }

    if (!formData.customerName.trim()) {
      newErrors.customerName = "Tên khách hàng là bắt buộc";
    }

    if (!formData.customerPhone.trim()) {
      newErrors.customerPhone = "Số điện thoại là bắt buộc";
    } else if (!/^[0-9]{10}$/.test(formData.customerPhone)) {
      newErrors.customerPhone = "Số điện thoại phải đúng 10 chữ số";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email là bắt buộc";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email không hợp lệ";
    }

    if (!formData.issueDescription.trim()) {
      newErrors.issueDescription = "Mô tả vấn đề là bắt buộc";
    } else if (formData.issueDescription.length < 10) {
      newErrors.issueDescription = "Mô tả vấn đề phải có ít nhất 10 ký tự";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      // Transform data to match Backend DTO
      // Backend expects date format: dd-MM-yyyy
      const formatDateForBackend = (dateString) => {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
      };

      const requestData = {
        customerName: formData.customerName,
        phoneNumber: formData.customerPhone, // Backend expects phoneNumber not customerPhone
        email: formData.email,
        vehicleId: formData.vehicleId,
        issueDescription: formData.issueDescription,
        requiredPart: formData.requiredPart || null,
        claimDate: formatDateForBackend(formData.claimDate), // Convert yyyy-MM-dd to dd-MM-yyyy
      };
      onSave(requestData);
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
                name="vehicleId"
                value={formData.vehicleId}
                onChange={handleVehicleSelect}
                className={`form-control ${errors.vehicleId ? "error" : ""}`}
              >
                <option value="">-- Chọn xe --</option>
                {vehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.id} - {vehicle.name} ({vehicle.owner})
                  </option>
                ))}
              </select>
              {errors.vehicleId && (
                <div className="error-message">{errors.vehicleId}</div>
              )}
            </div>
          </div>
          {formData.vehicleId && (
            <div className="form-row">
              <div className="form-group">
                <div
                  className={`policy-check-section ${
                    policyChecked
                      ? policyEligible
                        ? "checked-eligible"
                        : "checked-ineligible"
                      : ""
                  }`}
                >
                  <label
                    className="form-label"
                    style={{ marginBottom: "12px", display: "block" }}
                  >
                    🛡️ Kiểm tra chính sách bảo hành *
                  </label>

                  <button
                    type="button"
                    onClick={handleCheckWarrantyPolicy}
                    className={`btn btn-outline btn-check-policy ${
                      policyChecked ? "checked" : ""
                    }`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      width: "100%",
                      justifyContent: "center",
                      backgroundColor: policyChecked
                        ? policyEligible
                          ? "#d4edda"
                          : "#f8d7da"
                        : "",
                      borderColor: policyChecked
                        ? policyEligible
                          ? "#28a745"
                          : "#dc3545"
                        : "#6c757d",
                      color: policyChecked
                        ? policyEligible
                          ? "#155724"
                          : "#721c24"
                        : "#495057",
                    }}
                  >
                    <span style={{ fontSize: "20px" }}>
                      {policyChecked ? (policyEligible ? "✅" : "❌") : "🛡️"}
                    </span>
                    <span>
                      {policyChecked
                        ? policyEligible
                          ? "Xe đủ điều kiện bảo hành"
                          : "Xe KHÔNG đủ điều kiện"
                        : "Click để kiểm tra chính sách bảo hành"}
                    </span>
                  </button>

                  {/* Help text */}
                  {!policyChecked && (
                    <div
                      className="policy-warning"
                      style={{ marginTop: "12px" }}
                    >
                      <span>⚠️</span>
                      <span>
                        Bắt buộc: Vui lòng kiểm tra chính sách bảo hành trước
                        khi tạo claim
                      </span>
                    </div>
                  )}

                  {policyChecked && policyEligible && (
                    <div
                      className="policy-success"
                      style={{ marginTop: "12px" }}
                    >
                      <span>✅</span>
                      <span>
                        Tuyệt vời! Xe này đủ điều kiện bảo hành. Bạn có thể tiếp
                        tục tạo claim.
                      </span>
                    </div>
                  )}

                  {policyChecked && !policyEligible && (
                    <div
                      className="policy-warning error"
                      style={{ marginTop: "12px" }}
                    >
                      <span>❌</span>
                      <span>
                        Xe này không đủ điều kiện bảo hành.
                        {policyCheckResult?.reasons &&
                          policyCheckResult.reasons.length > 0 && (
                            <span
                              style={{
                                display: "block",
                                marginTop: "8px",
                                fontSize: "12px",
                              }}
                            >
                              Lý do: {policyCheckResult.reasons.join(", ")}
                            </span>
                          )}
                      </span>
                    </div>
                  )}
                </div>
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
                name="customerName"
                value={formData.customerName}
                onChange={handleChange}
                className={`form-control ${errors.customerName ? "error" : ""}`}
                placeholder="Nguyễn Văn An"
              />
              {errors.customerName && (
                <div className="error-message">{errors.customerName}</div>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">Số điện thoại *</label>
              <input
                type="tel"
                name="customerPhone"
                value={formData.customerPhone}
                onChange={handleChange}
                className={`form-control ${
                  errors.customerPhone ? "error" : ""
                }`}
                placeholder="0912345678"
              />
              {errors.customerPhone && (
                <div className="error-message">{errors.customerPhone}</div>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`form-control ${errors.email ? "error" : ""}`}
                placeholder="example@email.com"
              />
              {errors.email && (
                <div className="error-message">{errors.email}</div>
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
                name="issueDescription"
                value={formData.issueDescription}
                onChange={handleChange}
                className={`form-control ${
                  errors.issueDescription ? "error" : ""
                }`}
                placeholder="Mô tả chi tiết vấn đề gặp phải..."
                rows="4"
              />
              {errors.issueDescription && (
                <div className="error-message">{errors.issueDescription}</div>
              )}
              <small className="form-help">Ít nhất 10 ký tự</small>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Phụ tùng cần thiết</label>
              <input
                type="text"
                name="requiredPart"
                value={formData.requiredPart}
                onChange={handleChange}
                className="form-control"
                placeholder="Ví dụ: Lốp xe, pin, động cơ..."
              />
              <small className="form-help">Để trống nếu chưa xác định</small>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" onClick={onCancel} className="btn btn-outline">
            Hủy
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={formData.vehicleId && (!policyChecked || !policyEligible)}
            title={
              !policyChecked
                ? "Vui lòng kiểm tra chính sách bảo hành trước"
                : !policyEligible
                ? "Xe không đủ điều kiện bảo hành"
                : ""
            }
          >
            {claim ? "Cập nhật" : "Tạo yêu cầu"}
          </button>
        </div>

        {/* Warning message when button is disabled */}
        {formData.vehicleId && (!policyChecked || !policyEligible) && (
          <div
            style={{
              marginTop: "16px",
              padding: "12px",
              backgroundColor: "#fff3cd",
              border: "1px solid #ffc107",
              borderRadius: "4px",
              textAlign: "center",
              color: "#856404",
            }}
          >
            {!policyChecked &&
              "⚠️ Vui lòng kiểm tra chính sách bảo hành trước khi tạo yêu cầu"}
            {policyChecked &&
              !policyEligible &&
              "❌ Xe không đủ điều kiện bảo hành. Không thể tạo claim."}
          </div>
        )}
      </form>

      {/* Warranty Policy Checker Modal */}
      {showPolicyChecker && selectedVehicleId && (
        <WarrantyPolicyChecker
          vehicleId={selectedVehicleId}
          onClose={() => setShowPolicyChecker(false)}
          onCheckComplete={handlePolicyCheckComplete}
        />
      )}
    </div>
  );
}

export default WarrantyClaimForm;
