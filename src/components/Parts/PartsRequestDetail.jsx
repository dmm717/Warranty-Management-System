import React, { useState } from "react";
import { partsRequestAPI } from "../../services/api";
import { toast } from "react-toastify";
import "../../styles/PartsRequestDetail.css";

function PartsRequestDetail({ request, onClose, onApprove, onReject, userRole }) {
  const [loading, setLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);

  if (!request) return null;

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      PENDING: { label: "Chờ duyệt", class: "status-pending" },
      APPROVED: { label: "Đã duyệt", class: "status-approved" },
      REJECTED: { label: "Từ chối", class: "status-rejected" },
      COMPLETED: { label: "Hoàn thành", class: "status-completed" },
    };

    const statusInfo = statusClasses[status] || { label: status, class: "status-pending" };

    return (
      <span className={`status-badge ${statusInfo.class}`}>
        {statusInfo.label}
      </span>
    );
  };

  const handleApprove = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn duyệt yêu cầu này? Số lượng phụ tùng trong kho sẽ tự động giảm.")) {
      return;
    }

    try {
      setLoading(true);
      console.log("Approving request:", request.id, { status: "APPROVED" });
      
      const response = await partsRequestAPI.updatePartsRequest(request.id, {
        status: "APPROVED",
      });

      console.log("Approve response:", response);

      if (response.success) {
        toast.success("Đã duyệt yêu cầu thành công! Số lượng kho đã được cập nhật.", {
          position: "top-right",
          autoClose: 3000,
        });
        if (onApprove) {
          onApprove(request.id);
        }
        onClose();
      } else {
        console.error("Approve failed:", response);
        toast.error(response.message || "Không thể duyệt yêu cầu", {
          position: "top-right",
          autoClose: 5000,
        });
      }
    } catch (error) {
      console.error("Error approving request:", error);
      toast.error("Đã xảy ra lỗi khi duyệt yêu cầu. Vui lòng kiểm tra console để biết chi tiết.", {
        position: "top-right",
        autoClose: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.warning("Vui lòng nhập lý do từ chối", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    try {
      setLoading(true);
      const response = await partsRequestAPI.updatePartsRequest(request.id, {
        status: "REJECTED",
        rejectionReason: rejectReason,
      });

      if (response.success) {
        toast.success("Đã từ chối yêu cầu", {
          position: "top-right",
          autoClose: 3000,
        });
        if (onReject) {
          onReject(request.id);
        }
        onClose();
      } else {
        toast.error(response.message || "Không thể từ chối yêu cầu", {
          position: "top-right",
          autoClose: 5000,
        });
      }
    } catch (error) {
      console.error("Error rejecting request:", error);
      toast.error(error.response?.data?.message || "Đã xảy ra lỗi khi từ chối yêu cầu", {
        position: "top-right",
        autoClose: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const canApproveReject = () => {
    return (userRole === "EVM_STAFF" || userRole === "EVM_ADMIN") && 
           request.status === "PENDING";
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content parts-request-detail" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Chi tiết yêu cầu phụ tùng</h2>
          <button className="btn-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          <div className="detail-section">
            <div className="detail-row">
              <label>Mã yêu cầu:</label>
              <strong>{request.id}</strong>
            </div>
            <div className="detail-row">
              <label>Trạng thái:</label>
              {getStatusBadge(request.status)}
            </div>
          </div>

          <div className="detail-section">
            <h3>Thông tin phụ tùng</h3>
            <div className="detail-row">
              <label>Mã phụ tùng:</label>
              <span>{request.partNumber}</span>
            </div>
            <div className="detail-row">
              <label>Tên phụ tùng:</label>
              <strong>{request.partName}</strong>
            </div>
            <div className="detail-row">
              <label>Loại phụ tùng:</label>
              <span>{request.partTypeName}</span>
            </div>
            <div className="detail-row">
              <label>Số lượng yêu cầu:</label>
              <strong className="quantity-highlight">{request.quantity}</strong>
            </div>
          </div>

          {request.vehicle && (
            <div className="detail-section">
              <h3>Thông tin xe</h3>
              <div className="detail-row">
                <label>Tên xe:</label>
                <span>{request.vehicle.vehicleName}</span>
              </div>
              <div className="detail-row">
                <label>Chủ xe:</label>
                <span>{request.vehicle.owner}</span>
              </div>
            </div>
          )}

          <div className="detail-section">
            <h3>Thông tin yêu cầu</h3>
            <div className="detail-row">
              <label>Ngày yêu cầu:</label>
              <span>{formatDate(request.requestDate)}</span>
            </div>
            {request.requestedByStaffId && (
              <div className="detail-row">
                <label>Người yêu cầu:</label>
                <span>{request.requestedByStaffId}</span>
              </div>
            )}
            {request.branchOffice && (
              <div className="detail-row">
                <label>Chi nhánh:</label>
                <span>{request.branchOffice}</span>
              </div>
            )}
          </div>

          {!showRejectForm ? (
            <div className="modal-footer">
              <button
                className="btn btn-outline"
                onClick={onClose}
                disabled={loading}
              >
                Đóng
              </button>
              {canApproveReject() && (
                <>
                  <button
                    className="btn btn-danger"
                    onClick={() => setShowRejectForm(true)}
                    disabled={loading}
                  >
                    ❌ Từ chối
                  </button>
                  <button
                    className="btn btn-success"
                    onClick={handleApprove}
                    disabled={loading}
                  >
                    {loading ? "⏳ Đang xử lý..." : "✅ Duyệt yêu cầu"}
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="reject-form">
              <h3>Lý do từ chối</h3>
              <textarea
                className="form-control"
                rows="4"
                placeholder="Nhập lý do từ chối yêu cầu..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                disabled={loading}
              />
              <div className="modal-footer">
                <button
                  className="btn btn-outline"
                  onClick={() => {
                    setShowRejectForm(false);
                    setRejectReason("");
                  }}
                  disabled={loading}
                >
                  Hủy
                </button>
                <button
                  className="btn btn-danger"
                  onClick={handleReject}
                  disabled={loading}
                >
                  {loading ? "⏳ Đang xử lý..." : "Xác nhận từ chối"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PartsRequestDetail;
