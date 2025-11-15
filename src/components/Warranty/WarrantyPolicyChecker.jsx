import React, { useState } from "react";
import { warrantyPolicyAPI } from "../../services/api";
import "./WarrantyPolicyChecker.css";

function WarrantyPolicyChecker({ vehicleId, onClose, onCheckComplete }) {
  const [loading, setLoading] = useState(false);
  const [checkResult, setCheckResult] = useState(null);
  const [error, setError] = useState(null);

  const handleCheckPolicy = async () => {
    console.log("🚀 handleCheckPolicy called with vehicleId:", vehicleId);

    if (!vehicleId) {
      setError("Vui lòng chọn xe trước!");
      console.error("❌ No vehicleId provided");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log(
        "📡 Calling warrantyPolicyAPI.checkWarrantyByVIN:",
        vehicleId
      );

      // Changed to use VIN-based comprehensive warranty check
      const response = await warrantyPolicyAPI.checkWarrantyByVIN(vehicleId);

      console.log("📥 Response received:", response);

      if (response.success) {
        console.log("✅ Warranty Check Response:", response.data);
        console.log("  - isEligible:", response.data.isEligible);
        console.log("  - reasons:", response.data.reasons);
        console.log(
          "  - applicablePolicies:",
          response.data.applicablePolicies
        );
        setCheckResult(response.data);
      } else {
        setError(response.message || "Lỗi khi kiểm tra chính sách bảo hành");
      }
    } catch (err) {
      console.error("Error checking warranty policy:", err);
      setError("Lỗi kết nối đến server. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  // Auto-check on mount if vehicleId is provided
  React.useEffect(() => {
    console.log("🔄 WarrantyPolicyChecker mounted with vehicleId:", vehicleId);
    if (vehicleId) {
      console.log("✅ Auto-calling handleCheckPolicy");
      handleCheckPolicy();
    } else {
      console.warn("⚠️ No vehicleId, skipping auto-check");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicleId]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="warranty-checker-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="checker-header">
          <h2>🛡️ Kiểm Tra Chính Sách Bảo Hành</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="checker-body">
          {loading && (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Đang kiểm tra chính sách bảo hành...</p>
            </div>
          )}

          {error && (
            <div className="error-message">
              <span className="error-icon">❌</span>
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && checkResult && (
            <div className="check-result">
              <div
                className={`eligibility-status ${
                  checkResult.isEligible ? "eligible" : "not-eligible"
                }`}
              >
                <span className="status-icon">
                  {checkResult.isEligible ? "✅" : "⚠️"}
                </span>
                <div className="status-content">
                  <h3>
                    {checkResult.isEligible
                      ? "Đủ Điều Kiện Bảo Hành"
                      : "Không Đủ Điều Kiện"}
                  </h3>
                  <p>{checkResult.message}</p>
                </div>
              </div>

              {checkResult.vehicleType && (
                <div className="vehicle-info">
                  <label>🚗 Loại Xe:</label>
                  <span>{checkResult.vehicleType}</span>
                </div>
              )}

              {/* Display additional vehicle information */}
              {checkResult.additionalInfo &&
                checkResult.additionalInfo.length > 0 && (
                  <div className="additional-info-section">
                    <h4>📊 Thông Tin Xe</h4>
                    <ul className="info-list">
                      {checkResult.additionalInfo.map((info, index) => (
                        <li key={index}>{info}</li>
                      ))}
                    </ul>
                  </div>
                )}

              {checkResult.allPolicies &&
                checkResult.allPolicies.length > 0 && (
                  <div className="policies-section">
                    <h4>
                      📋 Các Chính Sách Bảo Hành (
                      {
                        checkResult.allPolicies.filter(
                          (p) => p.coverageType !== "NONE"
                        ).length
                      }
                      )
                    </h4>
                    <div className="policies-list">
                      {checkResult.allPolicies
                        .filter((policy) => policy.coverageType !== "NONE")
                        .map((policy, index) => {
                          // Format coverage type để hiển thị đẹp hơn
                          const formatCoverageType = (type) => {
                            const typeMap = {
                              FULL: "🛡️ Toàn Diện",
                              LIMITED: "⚠️ Giới Hạn",
                              BATTERY: "🔋 Pin",
                              BATTERY_ONLY: "🔋 Chỉ Pin", // Legacy support
                              PARTS_ONLY: "🔧 Phụ Tùng",
                              POWERTRAIN: "⚙️ Truyền Động",
                              EXTENDED: "📅 Mở Rộng",
                              BODY: "🚗 Thân Xe",
                              PAINT: "🎨 Sơn",
                              SUSPENSION: "🔩 Hệ Thống Treo",
                              ACCESSORY: "📦 Phụ Kiện",
                              REGULATION: "📋 Điều Kiện",
                              EXCLUSION: "❌ Loại Trừ",
                              NONE: "⭕ Không Bảo Hành",
                              UNKNOWN: "❓ Chưa Xác Định",
                            };
                            return typeMap[type] || type;
                          };

                          // Detect usage type from policy name
                          const detectUsageType = (policyName) => {
                            if (!policyName) return null;
                            const nameLower = policyName.toLowerCase();
                            if (
                              nameLower.includes("thương mại") ||
                              nameLower.includes("commercial")
                            ) {
                              return "🏢 Thương mại";
                            } else if (
                              nameLower.includes("cá nhân") ||
                              nameLower.includes("personal")
                            ) {
                              return "👤 Cá nhân";
                            }
                            return null;
                          };

                          const usageTypeLabel = detectUsageType(
                            policy.policyName
                          );

                          // Format thời hạn
                          const formatDuration = (months) => {
                            if (!months) return "Chưa xác định";
                            const years = Math.floor(months / 12);
                            const remainMonths = months % 12;

                            if (years > 0 && remainMonths > 0) {
                              return `${years} năm ${remainMonths} tháng`;
                            } else if (years > 0) {
                              return `${years} năm`;
                            } else {
                              return `${months} tháng`;
                            }
                          };

                          return (
                            <div
                              key={index}
                              className={`policy-card ${
                                !policy.isApplicable ? "not-applicable" : ""
                              }`}
                            >
                              <div className="policy-header">
                                <h5>
                                  {policy.policyName || "Chính sách bảo hành"}
                                </h5>
                                <div className="policy-badges">
                                  <span
                                    className={`coverage-badge ${policy.coverageType?.toLowerCase()}`}
                                  >
                                    {formatCoverageType(policy.coverageType)}
                                  </span>
                                  {usageTypeLabel && (
                                    <span className="usage-type-badge">
                                      {usageTypeLabel}
                                    </span>
                                  )}
                                  {policy.isApplicable === false && (
                                    <span className="not-applicable-badge">
                                      ❌ Không áp dụng
                                    </span>
                                  )}
                                  {policy.isApplicable === true && (
                                    <span className="applicable-badge">
                                      ✅ Áp dụng
                                    </span>
                                  )}
                                </div>
                              </div>
                              <p className="policy-description">
                                {policy.description ||
                                  "Không có mô tả chi tiết"}
                              </p>
                              <div className="policy-details">
                                <div className="detail-item">
                                  <span className="label">⏱️ Thời hạn:</span>
                                  <span className="value">
                                    {formatDuration(
                                      policy.coverageDurationMonths
                                    )}
                                  </span>
                                </div>
                                <div className="detail-item">
                                  <span className="label">🏷️ Mã Policy:</span>
                                  <span className="value">
                                    {policy.policyId || "N/A"}
                                  </span>
                                </div>
                                {policy.coverageDurationMonths && (
                                  <div className="detail-item">
                                    <span className="label">📊 Chi tiết:</span>
                                    <span className="value">
                                      {policy.coverageDurationMonths} tháng
                                    </span>
                                  </div>
                                )}
                              </div>
                              {/* Display per-policy reasons */}
                              {policy.reasons && policy.reasons.length > 0 && (
                                <div className="policy-reasons">
                                  <strong>💡 Chi tiết:</strong>
                                  <ul>
                                    {policy.reasons.map((reason, idx) => (
                                      <li key={idx}>{reason}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}

              {/* Debug: Always show this section during development */}
              {console.log(
                "🔍 Checking reasons:",
                checkResult.reasons,
                "Length:",
                checkResult.reasons?.length
              )}

              {checkResult.reasons && checkResult.reasons.length > 0 && (
                <div className="reasons-section">
                  <h4>⚠️ Lý Do Không Đủ Điều Kiện</h4>
                  <ul>
                    {checkResult.reasons.map((reason, index) => (
                      <li key={index}>{reason}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Temporary: Show when reasons is empty but not eligible */}
              {!checkResult.isEligible &&
                (!checkResult.reasons || checkResult.reasons.length === 0) && (
                  <div className="reasons-section">
                    <h4>⚠️ Lý Do Không Đủ Điều Kiện</h4>
                    <p
                      style={{
                        color: "#666",
                        fontSize: "14px",
                        fontStyle: "italic",
                      }}
                    >
                      Backend không trả về lý do cụ thể. Có thể backend chưa
                      được restart sau khi update code.
                    </p>
                  </div>
                )}
            </div>
          )}

          {!loading && !error && !checkResult && (
            <div className="no-data">
              <p>Không có thông tin kiểm tra. Vui lòng thử lại.</p>
            </div>
          )}
        </div>

        <div className="checker-footer">
          <button className="btn-secondary" onClick={onClose}>
            Đóng
          </button>
          {checkResult && checkResult.isEligible && (
            <button
              className="btn-primary"
              onClick={() => {
                if (onCheckComplete) {
                  onCheckComplete(checkResult);
                } else {
                  onClose();
                }
              }}
            >
              Tiếp Tục Tạo Claim
            </button>
          )}
          {checkResult && !checkResult.isEligible && (
            <button
              className="btn-secondary"
              onClick={() => {
                if (onCheckComplete) {
                  onCheckComplete(checkResult);
                } else {
                  onClose();
                }
              }}
            >
              Đã Hiểu
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default WarrantyPolicyChecker;
