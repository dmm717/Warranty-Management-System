import React, { useState, useEffect } from "react";
import { warrantyClaimAPI } from "../../services/api";
import { WARRANTY_CLAIM_STATUS } from "../../constants";
import "../../styles/WarrantyClaimDetail.css";

function WarrantyClaimDetail({ claim, onEdit, onUpdateStatus, userRole }) {
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [detailData, setDetailData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (claim?.claimId) {
      fetchClaimDetail();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claim]);

  const fetchClaimDetail = async () => {
    try {
      setLoading(true);
      const response = await warrantyClaimAPI.getClaimById(claim.claimId);
      if (response.success) {
        setDetailData(response.data);
      }
    } catch (error) {
      console.error("Error fetching claim detail:", error);
    } finally {
      setLoading(false);
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
    if (userRole === "EVM_ADMIN" || userRole === "EVM_STAFF") {
      return ["PENDING"].includes(displayClaim.status);
    }
    if (userRole === "SC_STAFF" || userRole === "SC_TECHNICAL") {
      return ["APPROVED", "IN_PROGRESS"].includes(displayClaim.status);
    }
    return false;
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
          <button
            onClick={() => onEdit(displayClaim)}
            className="btn btn-outline"
          >
            Edit
          </button>
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
                <label>Name</label>
                <span>{displayClaim.vehicle.vehicleName}</span>
              </div>
              <div className="info-item">
                <label>Owner</label>
                <span>{displayClaim.vehicle.owner}</span>
              </div>
            </div>
          </div>
        )}

        <div className="info-section card">
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
        </div>

        <div className="info-section card">
          <h3>Issue</h3>
          <p>{displayClaim.issueDescription}</p>
          {displayClaim.requiredPart && (
            <p>Parts: {displayClaim.requiredPart}</p>
          )}
        </div>
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
    </div>
  );
}

export default WarrantyClaimDetail;
