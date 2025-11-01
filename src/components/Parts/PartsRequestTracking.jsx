import React, { useState, useEffect } from "react";
import { partsRequestAPI } from "../../services/api";
import { toast } from "react-toastify";
import "./PartsRequestTracking.css";

const PartsRequestTracking = ({ userRole, userId }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(null);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const response = await partsRequestAPI.getAllPartsRequests({ size: 50 });
      setRequests(response.data.content || []);
    } catch (error) {
      toast.error(
        "Không thể tải danh sách yêu cầu: " +
          (error.response?.data?.message || error.message)
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEvmApprove = async (request) => {
    try {
      await partsRequestAPI.evmStaffApproveOrReject({
        requestId: request.requestId,
        evmStaffId: userId,
        approved: true,
      });
      toast.success("✅ Đã phê duyệt yêu cầu thành công");
      loadRequests();
    } catch (error) {
      toast.error(
        "❌ Lỗi phê duyệt: " + (error.response?.data?.message || error.message)
      );
    }
  };

  const handleEvmReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error("Vui lòng nhập lý do từ chối");
      return;
    }

    try {
      await partsRequestAPI.evmStaffApproveOrReject({
        requestId: showRejectModal.requestId,
        evmStaffId: userId,
        approved: false,
        rejectionReason: rejectionReason,
      });
      toast.success("✅ Đã từ chối yêu cầu");
      setShowRejectModal(null);
      setRejectionReason("");
      loadRequests();
    } catch (error) {
      toast.error(
        "❌ Lỗi từ chối: " + (error.response?.data?.message || error.message)
      );
    }
  };

  const handleScConfirmReceive = async (request) => {
    try {
      await partsRequestAPI.scAdminConfirmReceive({
        requestId: request.requestId,
        scAdminId: userId,
      });
      toast.success(
        "✅ Đã xác nhận nhận hàng thành công. Kho đã được cập nhật."
      );
      loadRequests();
    } catch (error) {
      toast.error(
        "❌ Lỗi xác nhận: " + (error.response?.data?.message || error.message)
      );
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      PENDING: <span className="badge badge-warning">⏳ Chờ duyệt</span>,
      APPROVED: (
        <span className="badge badge-info">✅ Đã duyệt - Chờ giao</span>
      ),
      DELIVERED: <span className="badge badge-success">📦 Đã giao</span>,
      REJECTED: <span className="badge badge-danger">❌ Từ chối</span>,
    };
    return (
      badges[status] || <span className="badge badge-secondary">{status}</span>
    );
  };

  if (loading) return <div className="loading">Đang tải...</div>;

  return (
    <div className="parts-request-tracking">
      <h2>📋 Theo Dõi Yêu Cầu Phụ Tùng</h2>

      {requests.length === 0 ? (
        <p className="no-data">Không có yêu cầu nào</p>
      ) : (
        <div className="requests-table">
          <table>
            <thead>
              <tr>
                <th>Mã yêu cầu</th>
                <th>Phụ tùng</th>
                <th>Số lượng</th>
                <th>Trạng thái</th>
                <th>Kho EVM</th>
                <th>Kho SC</th>
                <th>Ngày yêu cầu</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <tr key={req.requestId}>
                  <td>
                    <code>{req.requestId}</code>
                  </td>
                  <td>{req.partName}</td>
                  <td>
                    <strong>{req.quantity}</strong>
                  </td>
                  <td>{getStatusBadge(req.deliveryStatus || "PENDING")}</td>
                  <td>
                    {req.evmStockBefore != null ? (
                      <span>
                        {req.evmStockBefore} → {req.evmStockAfter}
                      </span>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td>
                    {req.scStockBefore != null ? (
                      <span>
                        {req.scStockBefore} → {req.scStockAfter}
                      </span>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td>
                    {new Date(req.requestDate).toLocaleDateString("vi-VN")}
                  </td>
                  <td>
                    {/* EVM_STAFF actions */}
                    {userRole === "EVM_STAFF" && !req.deliveryStatus && (
                      <div className="action-buttons">
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => handleEvmApprove(req)}
                        >
                          ✅ Duyệt
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => setShowRejectModal(req)}
                        >
                          ❌ Từ chối
                        </button>
                      </div>
                    )}

                    {/* SC_ADMIN actions */}
                    {userRole === "SC_ADMIN" &&
                      req.deliveryStatus === "APPROVED" && (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleScConfirmReceive(req)}
                        >
                          📦 Xác nhận nhận hàng
                        </button>
                      )}

                    {/* Display rejection reason */}
                    {req.deliveryStatus === "REJECTED" &&
                      req.rejectionReason && (
                        <div className="rejection-reason">
                          <small>Lý do: {req.rejectionReason}</small>
                        </div>
                      )}

                    {/* Completed */}
                    {req.deliveryStatus === "DELIVERED" && (
                      <span className="text-success">✓ Hoàn tất</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="modal-overlay" onClick={() => setShowRejectModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>❌ Từ chối yêu cầu</h3>
            <p>
              Mã yêu cầu: <code>{showRejectModal.requestId}</code>
            </p>
            <p>
              Phụ tùng: <strong>{showRejectModal.partName}</strong>
            </p>

            <label>
              Lý do từ chối: <span className="required">*</span>
            </label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Nhập lý do từ chối (bắt buộc)..."
              rows="4"
            />

            <div className="modal-actions">
              <button
                className="btn btn-danger"
                onClick={handleEvmReject}
                disabled={!rejectionReason.trim()}
              >
                Xác nhận từ chối
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowRejectModal(null);
                  setRejectionReason("");
                }}
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PartsRequestTracking;
