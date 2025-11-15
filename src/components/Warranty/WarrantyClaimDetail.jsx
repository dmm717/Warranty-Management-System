import React, { useState, useEffect } from "react";
import {
  warrantyClaimAPI,
  workResultAPI,
  serialNumberAPI,
  warrantyPolicyAPI,
  partsRequestAPI,
} from "../../services/api";
import { WARRANTY_CLAIM_STATUS } from "../../constants";
import AssignTechnicianToClaimModal from "./AssignTechnicianToClaimModal";
import TechnicianWorkflowModal from "./TechnicianWorkflowModal";
import { toast } from "react-toastify";
import "../../styles/WarrantyClaimDetail.css";

function WarrantyClaimDetail({ claim, onEdit, onUpdateStatus, userRole }) {
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showAssignTechModal, setShowAssignTechModal] = useState(false);
  const [showTechWorkflowModal, setShowTechWorkflowModal] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [detailData, setDetailData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [workResult, setWorkResult] = useState(null);
  const [serialMappings, setSerialMappings] = useState([]);
  const [warrantyPolicies, setWarrantyPolicies] = useState(null);
  const [loadingPolicies, setLoadingPolicies] = useState(false);
  const [relatedPartsRequests, setRelatedPartsRequests] = useState([]);
  const [loadingPartsRequests, setLoadingPartsRequests] = useState(false);

  useEffect(() => {
    if (claim?.claimId) {
      fetchClaimDetail();
      fetchRelatedPartsRequests();
      // Fetch work result and serial mappings if claim is COMPLETED
      if (claim.status === "COMPLETED") {
        fetchWorkResult();
        fetchSerialMappings();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claim]);

  const fetchClaimDetail = async () => {
    try {
      setLoading(true);
      const response = await warrantyClaimAPI.getClaimById(claim.claimId);
      if (response.success) {
        setDetailData(response.data);
        // Fetch warranty policies for the vehicle
        if (response.data?.vehicle?.vehicleId) {
          fetchWarrantyPolicies(response.data.vehicle.vehicleId);
        }
      }
    } catch (error) {
      console.error("Error fetching claim detail:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWarrantyPolicies = async (vehicleVIN) => {
    try {
      setLoadingPolicies(true);
      const response = await warrantyPolicyAPI.checkWarrantyByVIN(vehicleVIN);
      if (response.success) {
        setWarrantyPolicies(response.data);
      }
    } catch (error) {
      console.error("Error fetching warranty policies:", error);
      toast.error("Không thể tải thông tin bảo hành");
    } finally {
      setLoadingPolicies(false);
    }
  };

  const fetchWorkResult = async () => {
    try {
      const response = await workResultAPI.getWorkResultByClaimId(
        claim.claimId
      );
      if (response.success) {
        setWorkResult(response.data);
      }
    } catch (error) {
      console.error("Error fetching work result:", error);
    }
  };

  const fetchSerialMappings = async () => {
    try {
      const response = await serialNumberAPI.getMappingsByClaim(claim.claimId);
      if (response.success) {
        setSerialMappings(response.data);
      }
    } catch (error) {
      console.error("Error fetching serial mappings:", error);
    }
  };

  const fetchRelatedPartsRequests = async () => {
    if (!claim?.vehicle?.vehicleId) return;

    try {
      setLoadingPartsRequests(true);
      const response = await partsRequestAPI.getAllPartsRequests({
        page: 0,
        size: 100,
      });

      if (response.success && response.data?.content) {
        // Filter by VIN - Parts Request has vehicle field
        const filtered = response.data.content.filter(
          (req) => req.vehicle?.vehicleId === claim.vehicle.vehicleId
        );
        setRelatedPartsRequests(filtered);
      }
    } catch (error) {
      console.error("Error fetching parts requests:", error);
    } finally {
      setLoadingPartsRequests(false);
    }
  };

  if (!claim) return null;

  const displayClaim = detailData || claim;

  const getStatusBadge = (status) => {
    const statusClasses = {
      PENDING: "status-pending",
      IN_PROGRESS: "status-processing",
      APPROVED: "status-approved",
      REJECTED: "status-rejected",
      COMPLETED: "status-completed",
      CANCELLED: "status-cancelled",
    };

    const statusLabel = WARRANTY_CLAIM_STATUS[status] || status;

    return (
      <span
        className={`status-badge ${statusClasses[status] || "status-pending"}`}
      >
        {statusLabel}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const canUpdateStatus = () => {
    // EVM roles: Có thể update PENDING claims
    if (userRole === "EVM_ADMIN" || userRole === "EVM_STAFF") {
      return ["PENDING"].includes(displayClaim.status);
    }
    // SC_TECHNICAL: Có thể update APPROVED và IN_PROGRESS claims
    if (userRole === "SC_TECHNICAL") {
      return ["APPROVED", "IN_PROGRESS"].includes(displayClaim.status);
    }
    // SC_STAFF: KHÔNG có quyền update status - chỉ xem và phân công
    // SC_ADMIN: Update thông qua approve/reject ở list, không ở detail
    return false;
  };

  // Handler để bắt đầu công việc
  const handleStartWork = async () => {
    // Backend tự lấy current user từ JWT token, không cần kiểm tra user ở frontend
    try {
      const response = await warrantyClaimAPI.startWork(claim.claimId);

      if (response.success) {
        toast.success(
          "Đã bắt đầu công việc! Chuyển sang trạng thái IN_PROGRESS"
        );

        // Refresh dữ liệu claim
        await fetchClaimDetail();

        // Mở modal workflow sau 500ms để UI cập nhật
        setTimeout(() => {
          setShowTechWorkflowModal(true);
        }, 500);
      }
    } catch (error) {
      console.error("Error starting work:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Không thể bắt đầu công việc. Vui lòng thử lại.";
      toast.error(errorMessage);
    }
  };

  const getAvailableStatuses = () => {
    const statusFlow = {
      PENDING: ["APPROVED", "REJECTED"],
      APPROVED: ["IN_PROGRESS"],
      IN_PROGRESS: ["COMPLETED"],
    };
    return statusFlow[displayClaim.status] || [];
  };

  const handleStatusUpdate = () => {
    if (newStatus && newStatus !== displayClaim.status) {
      onUpdateStatus(displayClaim.claimId, newStatus);
      setShowStatusModal(false);
      setNewStatus("");
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="warranty-claim-detail">
      <div className="detail-header">
        <div className="claim-basic-info">
          <h2>Claim #{displayClaim.claimId}</h2>
          <div className="claim-meta">
            {getStatusBadge(displayClaim.status)}
            <span className="claim-date">
              {formatDate(displayClaim.claimDate)}
            </span>
          </div>
        </div>
        <div className="detail-actions">
          {displayClaim.status === "REJECTED" && userRole === "SC_STAFF" && (
            <button
              onClick={() => onEdit(displayClaim)}
              className="btn btn-warning"
            >
              📝 Bổ sung và gửi lại
            </button>
          )}

          {/* Nút Phân Công Kỹ Thuật Viên - chỉ hiển thị cho SC_STAFF khi claim APPROVED và CHƯA được assign */}
          {userRole === "SC_STAFF" &&
            displayClaim.status === "APPROVED" &&
            !displayClaim.assignedStaff && (
              <button
                onClick={() => setShowAssignTechModal(true)}
                className="btn btn-success"
                style={{
                  backgroundColor: "#10b981",
                  color: "white",
                }}
              >
                👨‍🔧 Phân Công Kỹ Thuật Viên
              </button>
            )}

          {/* Badge Đã Phân Công - hiển thị cho SC_STAFF khi claim APPROVED và ĐÃ được assign */}
          {userRole === "SC_STAFF" &&
            displayClaim.status === "APPROVED" &&
            displayClaim.assignedStaff && (
              <div
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#10b981",
                  color: "white",
                  borderRadius: "6px",
                  fontWeight: "600",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                ✅ Đã Phân Công:{" "}
                {displayClaim.assignedStaff.name || "Kỹ Thuật Viên"}
              </div>
            )}

          {/* Nút Bắt Đầu Công Việc - hiển thị khi SC_TECHNICAL và claim APPROVED (đã được assign) */}
          {userRole === "SC_TECHNICAL" &&
            displayClaim.status === "APPROVED" &&
            displayClaim.assignedStaff && (
              <button
                onClick={handleStartWork}
                className="btn btn-success"
                style={{
                  backgroundColor: "#667eea",
                  color: "white",
                }}
              >
                🔧 Bắt Đầu Công Việc
              </button>
            )}

          {/* Nút Tiếp Tục Công Việc - hiển thị khi đã IN_PROGRESS */}
          {userRole === "SC_TECHNICAL" &&
            displayClaim.status === "IN_PROGRESS" && (
              <button
                onClick={() => setShowTechWorkflowModal(true)}
                className="btn btn-success"
                style={{
                  backgroundColor: "#48bb78",
                  color: "white",
                }}
              >
                � Tiếp Tục Công Việc
              </button>
            )}

          {/* Nút Edit - ẨN cho: SC_ADMIN, SC_TECHNICAL, và tất cả status (PENDING, REJECTED, APPROVED, IN_PROGRESS, COMPLETED) */}
          {/* Đã BỎ nút Edit hoàn toàn theo yêu cầu */}

          {canUpdateStatus() && (
            <button
              onClick={() => setShowStatusModal(true)}
              className="btn btn-primary"
            >
              Update Status
            </button>
          )}
        </div>
      </div>

      {/* Rejection Alert */}
      {displayClaim.status === "REJECTED" && displayClaim.rejectionReason && (
        <div
          className="rejection-alert"
          style={{
            background: "#fff3cd",
            border: "1px solid #ffc107",
            borderRadius: "8px",
            padding: "16px",
            margin: "16px 0",
            display: "flex",
            gap: "12px",
          }}
        >
          <div style={{ fontSize: "24px" }}>❌</div>
          <div style={{ flex: 1 }}>
            <h4 style={{ margin: "0 0 8px 0", color: "#856404" }}>
              Yêu cầu bảo hành bị từ chối
            </h4>
            <p style={{ margin: "0 0 8px 0" }}>
              <strong>Lý do:</strong> {displayClaim.rejectionReason}
            </p>
            {userRole === "SC_STAFF" && (
              <p style={{ margin: 0, fontSize: "14px", fontStyle: "italic" }}>
                💡 Vui lòng bổ sung thông tin và gửi lại yêu cầu để được xem
                xét.
              </p>
            )}
          </div>
        </div>
      )}

      <div className="detail-content">
        {displayClaim.vehicle && (
          <div className="info-section card">
            <h3>Vehicle Info</h3>
            <div className="info-grid">
              <div className="info-item">
                <label>VIN</label>
                <span>{displayClaim.vehicle.vehicleId}</span>
              </div>
              <div className="info-item">
                <label>Tên Xe</label>
                <span>{displayClaim.vehicle.vehicleName}</span>
              </div>
              <div className="info-item">
                <label>Model</label>
                <span>{displayClaim.vehicle.modelName || "N/A"}</span>
              </div>
              <div className="info-item">
                <label>Loại Sử Dụng</label>
                <span>
                  {displayClaim.vehicle.usageType === "PERSONAL"
                    ? "Cá Nhân"
                    : displayClaim.vehicle.usageType === "COMMERCIAL"
                    ? "Thương Mại"
                    : displayClaim.vehicle.usageType || "N/A"}
                </span>
              </div>
              <div className="info-item">
                <label>Ngày Mua</label>
                <span>
                  {displayClaim.vehicle.purchaseDate
                    ? new Date(
                        displayClaim.vehicle.purchaseDate
                      ).toLocaleDateString("vi-VN")
                    : "N/A"}
                </span>
              </div>
              <div className="info-item">
                <label>Tổng KM</label>
                <span>
                  {displayClaim.vehicle.totalKm
                    ? `${displayClaim.vehicle.totalKm.toLocaleString(
                        "vi-VN"
                      )} km`
                    : "N/A"}
                </span>
              </div>
              <div className="info-item">
                <label>Chủ Xe</label>
                <span>{displayClaim.vehicle.owner}</span>
              </div>
              <div className="info-item">
                <label>SĐT Chủ Xe</label>
                <span>{displayClaim.vehicle.phoneNumber || "N/A"}</span>
              </div>
              <div className="info-item">
                <label>Email</label>
                <span>{displayClaim.vehicle.email || "N/A"}</span>
              </div>
              <div className="info-item">
                <label>Trạng Thái</label>
                <span>
                  {displayClaim.vehicle.status === "ACTIVE"
                    ? "🟢 Hoạt Động"
                    : displayClaim.vehicle.status === "INACTIVE"
                    ? "🔴 Ngừng Hoạt Động"
                    : displayClaim.vehicle.status || "N/A"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Warranty Policies Section */}
        {displayClaim.vehicle && (
          <div className="info-section card warranty-policies-section">
            <h3>📋 Các Chính Sách Bảo Hành Áp Dụng</h3>

            {loadingPolicies ? (
              <div style={{ textAlign: "center", padding: "20px" }}>
                <div className="loading-spinner"></div>
                <p>Đang tải thông tin bảo hành...</p>
              </div>
            ) : warrantyPolicies ? (
              <>
                <div
                  style={{
                    background: warrantyPolicies.isEligible
                      ? "rgba(16, 185, 129, 0.1)"
                      : "rgba(239, 68, 68, 0.1)",
                    padding: "12px 16px",
                    borderRadius: "8px",
                    marginBottom: "16px",
                    border: warrantyPolicies.isEligible
                      ? "1px solid rgba(16, 185, 129, 0.3)"
                      : "1px solid rgba(239, 68, 68, 0.3)",
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      fontWeight: 600,
                      color: warrantyPolicies.isEligible
                        ? "rgb(16, 185, 129)"
                        : "rgb(239, 68, 68)",
                    }}
                  >
                    {warrantyPolicies.isEligible ? "✅" : "❌"}{" "}
                    {warrantyPolicies.message}
                  </p>
                </div>

                {warrantyPolicies.applicablePolicies &&
                  warrantyPolicies.applicablePolicies.length > 0 && (
                    <div className="policies-list">
                      <p style={{ fontWeight: 600, marginBottom: "12px" }}>
                        Áp dụng được:{" "}
                        {warrantyPolicies.applicablePolicies.length} /{" "}
                        {warrantyPolicies.allPolicies?.length || 0} chính sách
                      </p>
                      <div
                        style={{
                          display: "grid",
                          gap: "12px",
                          gridTemplateColumns:
                            "repeat(auto-fill, minmax(300px, 1fr))",
                        }}
                      >
                        {warrantyPolicies.applicablePolicies.map(
                          (policy, index) => {
                            // Calculate expiry date
                            let expiryDateDisplay = "N/A";

                            if (policy.expiryDate) {
                              expiryDateDisplay = new Date(
                                policy.expiryDate
                              ).toLocaleDateString("vi-VN");
                            } else if (
                              displayClaim.vehicle?.purchaseDate &&
                              policy.coverageDurationMonths
                            ) {
                              const purchaseDate = new Date(
                                displayClaim.vehicle.purchaseDate
                              );
                              const expiryDate = new Date(purchaseDate);
                              expiryDate.setMonth(
                                expiryDate.getMonth() +
                                  policy.coverageDurationMonths
                              );
                              expiryDateDisplay =
                                expiryDate.toLocaleDateString("vi-VN");
                            }

                            return (
                              <div
                                key={index}
                                style={{
                                  background: "rgba(255, 255, 255, 0.05)",
                                  padding: "16px",
                                  borderRadius: "8px",
                                  border: "1px solid rgba(255, 255, 255, 0.1)",
                                }}
                              >
                                <h4
                                  style={{
                                    margin: "0 0 12px 0",
                                    fontSize: "16px",
                                    color: "rgba(255, 255, 255, 0.95)",
                                    fontWeight: 600,
                                  }}
                                >
                                  {policy.policyName}
                                </h4>
                                <div
                                  style={{
                                    fontSize: "14px",
                                    color: "rgba(255, 255, 255, 0.8)",
                                    lineHeight: "1.6",
                                  }}
                                >
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      margin: "6px 0",
                                    }}
                                  >
                                    <span
                                      style={{
                                        fontSize: "18px",
                                        marginRight: "8px",
                                      }}
                                    >
                                      ⏱️
                                    </span>
                                    <span>
                                      <strong>Thời hạn:</strong>{" "}
                                      {policy.coverageDurationMonths
                                        ? `${policy.coverageDurationMonths} tháng`
                                        : "Không giới hạn"}
                                    </span>
                                  </div>
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      margin: "6px 0",
                                    }}
                                  >
                                    <span
                                      style={{
                                        fontSize: "18px",
                                        marginRight: "8px",
                                      }}
                                    >
                                      📅
                                    </span>
                                    <span>
                                      <strong>Hết hạn:</strong>{" "}
                                      {expiryDateDisplay}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          }
                        )}
                      </div>
                    </div>
                  )}

                {warrantyPolicies.reasons &&
                  warrantyPolicies.reasons.length > 0 && (
                    <div
                      style={{
                        marginTop: "16px",
                        padding: "12px",
                        background: "rgba(239, 68, 68, 0.1)",
                        borderRadius: "8px",
                      }}
                    >
                      <p style={{ fontWeight: 600, margin: "0 0 8px 0" }}>
                        ⚠️ Lưu ý:
                      </p>
                      <ul style={{ margin: 0, paddingLeft: "20px" }}>
                        {warrantyPolicies.reasons.map((reason, index) => (
                          <li key={index}>{reason}</li>
                        ))}
                      </ul>
                    </div>
                  )}
              </>
            ) : (
              <p
                style={{ textAlign: "center", color: "rgba(255,255,255,0.5)" }}
              >
                Không có thông tin bảo hành
              </p>
            )}
          </div>
        )}

        {/* Customer Info section - HIDDEN */}
        {/* <div className="info-section card">
          <h3>Customer Info</h3>
          <div className="info-grid">
            <div className="info-item">
              <label>Name</label>
              <span>{displayClaim.customerName}</span>
            </div>
            <div className="info-item">
              <label>Phone</label>
              <span>{displayClaim.customerPhone}</span>
            </div>
            <div className="info-item">
              <label>Email</label>
              <span>{displayClaim.email}</span>
            </div>
          </div>
        </div> */}

        <div className="info-section card">
          <h3>Issue</h3>
          <p>{displayClaim.issueDescription}</p>
          {displayClaim.requiredPart && (
            <p>Parts: {displayClaim.requiredPart}</p>
          )}
        </div>

        {/* Related Parts Requests Section */}
        {relatedPartsRequests.length > 0 && (
          <div className="info-section card parts-requests-section">
            <h3>
              📦 Yêu Cầu Phụ Tùng Liên Quan ({relatedPartsRequests.length})
            </h3>
            {loadingPartsRequests ? (
              <p style={{ textAlign: "center", color: "#6b7280" }}>
                Đang tải...
              </p>
            ) : (
              <div className="parts-requests-list">
                {relatedPartsRequests.map((request) => {
                  const statusColors = {
                    PENDING: "#f59e0b",
                    APPROVED: "#10b981",
                    REJECTED: "#ef4444",
                    COMPLETED: "#3b82f6",
                  };
                  const statusLabels = {
                    PENDING: "Chờ duyệt",
                    APPROVED: "Đã duyệt",
                    REJECTED: "Từ chối",
                    COMPLETED: "Hoàn thành",
                  };

                  return (
                    <div
                      key={request.id}
                      className="parts-request-item"
                      style={{
                        padding: "12px",
                        marginBottom: "8px",
                        borderRadius: "6px",
                        border: "1px solid rgba(255,255,255,0.1)",
                        background: "rgba(255,255,255,0.03)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div>
                          <strong style={{ fontSize: "14px" }}>
                            {request.partName}
                          </strong>
                          <div
                            style={{
                              fontSize: "12px",
                              color: "#9ca3af",
                              marginTop: "4px",
                            }}
                          >
                            Mã: {request.id} | Số lượng: {request.quantity}
                          </div>
                        </div>
                        <span
                          style={{
                            padding: "4px 12px",
                            borderRadius: "12px",
                            fontSize: "12px",
                            fontWeight: "600",
                            backgroundColor:
                              statusColors[request.status] || "#6b7280",
                            color: "white",
                          }}
                        >
                          {statusLabels[request.status] || request.status}
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#6b7280",
                          marginTop: "8px",
                        }}
                      >
                        Ngày yêu cầu:{" "}
                        {new Date(request.requestDate).toLocaleDateString(
                          "vi-VN"
                        )}
                      </div>

                      {/* GHN Shipping Info */}
                      {request.shippingOrderCode && (
                        <div
                          style={{
                            marginTop: "12px",
                            padding: "8px 12px",
                            borderRadius: "6px",
                            background: "rgba(59, 130, 246, 0.1)",
                            border: "1px solid rgba(59, 130, 246, 0.3)",
                          }}
                        >
                          <div
                            style={{
                              fontSize: "12px",
                              fontWeight: "600",
                              color: "#60a5fa",
                              marginBottom: "6px",
                            }}
                          >
                            🚚 Thông tin vận chuyển
                          </div>
                          <div style={{ fontSize: "12px", color: "#d1d5db" }}>
                            <div style={{ marginBottom: "4px" }}>
                              <strong>Mã vận đơn:</strong>{" "}
                              <a
                                href={`https://donhang.ghn.vn/?order_code=${request.shippingOrderCode}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  color: "#60a5fa",
                                  textDecoration: "underline",
                                }}
                              >
                                {request.shippingOrderCode}
                              </a>
                            </div>
                            {request.trackingNumber && (
                              <div style={{ marginBottom: "4px" }}>
                                <strong>Tracking:</strong>{" "}
                                {request.trackingNumber}
                              </div>
                            )}
                            {request.shippingStatus && (
                              <div style={{ marginBottom: "4px" }}>
                                <strong>Trạng thái:</strong>{" "}
                                <span
                                  style={{
                                    padding: "2px 8px",
                                    borderRadius: "4px",
                                    background: "rgba(16, 185, 129, 0.2)",
                                    color: "#34d399",
                                  }}
                                >
                                  {request.shippingStatus === "ready_to_pick" &&
                                    "⏳ Chờ lấy hàng"}
                                  {request.shippingStatus === "picking" &&
                                    "🚶 Đang lấy hàng"}
                                  {request.shippingStatus === "delivering" &&
                                    "🚚 Đang giao"}
                                  {request.shippingStatus === "delivered" &&
                                    "✅ Đã giao"}
                                  {![
                                    "ready_to_pick",
                                    "picking",
                                    "delivering",
                                    "delivered",
                                  ].includes(request.shippingStatus) &&
                                    request.shippingStatus}
                                </span>
                              </div>
                            )}
                            {request.expectedDeliveryTime && (
                              <div>
                                <strong>Dự kiến giao:</strong>{" "}
                                {new Date(
                                  request.expectedDeliveryTime
                                ).toLocaleString("vi-VN")}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Work Result Section - Only show for COMPLETED claims */}
        {displayClaim.status === "COMPLETED" && workResult && (
          <div className="info-section card work-result-section">
            <h3>✅ Báo Cáo Hoàn Thành Công Việc</h3>

            <div className="work-result-grid">
              <div className="result-item">
                <label>🔧 Kỹ Thuật Viên</label>
                <span className="tech-name">
                  {workResult.technicianName ||
                    workResult.completedByTechnicianId}
                </span>
              </div>

              <div className="result-item">
                <label>📅 Ngày Hoàn Thành</label>
                <span>
                  {new Date(workResult.completedAt).toLocaleDateString("vi-VN")}
                </span>
              </div>

              <div className="result-item">
                <label>🚗 Ngày Trả Xe</label>
                <span>
                  {new Date(workResult.returnDate).toLocaleDateString("vi-VN")}
                </span>
              </div>

              {workResult.workDurationHours && (
                <div className="result-item">
                  <label>⏱️ Thời Gian Làm Việc</label>
                  <span>{workResult.workDurationHours} giờ</span>
                </div>
              )}
            </div>

            <div className="work-notes">
              <label>📝 Ghi Chú Công Việc</label>
              <p>{workResult.completionNotes}</p>
            </div>

            {serialMappings && serialMappings.length > 0 && (
              <div className="serial-mappings-display">
                <label>
                  🏷️ Serial Numbers Đã Sử Dụng ({serialMappings.length})
                </label>
                <div className="serial-list">
                  {serialMappings.map((mapping, index) => (
                    <div key={index} className="serial-item">
                      <span className="serial-number">
                        {mapping.serialNumber}
                      </span>
                      <span className="serial-part">
                        Part: {mapping.partId}
                      </span>
                      <span className="serial-durability">
                        Độ bền: {mapping.durabilityPercentage}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {workResult.customerSatisfactionRating && (
              <div className="customer-rating">
                <label>⭐ Đánh Giá Khách Hàng</label>
                <div className="rating-stars">
                  {[...Array(5)].map((_, i) => (
                    <span
                      key={i}
                      className={
                        i < workResult.customerSatisfactionRating
                          ? "star filled"
                          : "star"
                      }
                    >
                      ★
                    </span>
                  ))}
                  <span className="rating-text">
                    ({workResult.customerSatisfactionRating}/5)
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {showStatusModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h4>Update Status</h4>
              <button onClick={() => setShowStatusModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
              >
                <option value="">Select</option>
                {getAvailableStatuses().map((s) => (
                  <option key={s} value={s}>
                    {WARRANTY_CLAIM_STATUS[s]}
                  </option>
                ))}
              </select>
            </div>
            <div className="modal-actions">
              <button
                onClick={() => setShowStatusModal(false)}
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button
                onClick={handleStatusUpdate}
                disabled={!newStatus}
                className="btn btn-primary"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Technician Modal */}
      {showAssignTechModal && (
        <AssignTechnicianToClaimModal
          claim={displayClaim}
          onClose={() => setShowAssignTechModal(false)}
          onAssigned={() => {
            // Refresh claim detail after assignment
            fetchClaimDetail();
            setShowAssignTechModal(false);
          }}
        />
      )}

      {/* Technician Workflow Modal */}
      {showTechWorkflowModal && (
        <TechnicianWorkflowModal
          claim={displayClaim}
          onClose={() => setShowTechWorkflowModal(false)}
          onComplete={(workData) => {
            console.log("Work completed:", workData);
            // Refresh claim detail after completion
            fetchClaimDetail();
            setShowTechWorkflowModal(false);
          }}
        />
      )}
    </div>
  );
}

export default WarrantyClaimDetail;
