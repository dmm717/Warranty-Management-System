import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { partsRequestAPI } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import "../../styles/PartsRequestManagement.css";

const PartsRequestManagement = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await partsRequestAPI.getAllPartsRequests({
        page: 0,
        size: 100,
      });
      let filteredRequests = response.content || [];
      if (user.role === "SC_ADMIN") {
        filteredRequests = filteredRequests.filter(
          (req) =>
            req.scBranchOffice === user.branchOffice ||
            req.branchOffice === user.branchOffice
        );
      }
      setRequests(filteredRequests);
    } catch {
      Swal.fire({
        icon: "error",
        title: "Lỗi!",
        text: "Không thể tải danh sách yêu cầu",
        confirmButtonColor: "#ef4444",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEvmApprove = async (requestId) => {
    const result = await Swal.fire({
      title: "Xác nhận duyệt?",
      text: "Bạn có chắc muốn duyệt yêu cầu này?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Duyệt",
      cancelButtonText: "Hủy",
      confirmButtonColor: "#10b981",
      cancelButtonColor: "#6b7280",
    });
    if (!result.isConfirmed) return;
    try {
      await partsRequestAPI.evmStaffApproveOrReject({
        requestId,
        action: "APPROVE",
        evmStaffId: user.id,
      });
      Swal.fire({
        icon: "success",
        title: "Thành công!",
        text: "Đã duyệt yêu cầu thành công",
        confirmButtonColor: "#3b82f6",
      });
      fetchRequests();
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Lỗi!",
        text: error.response?.data?.message || "Không thể duyệt yêu cầu",
        confirmButtonColor: "#ef4444",
      });
    }
  };

  const handleEvmReject = async (request) => {
    const { value: rejectionReason } = await Swal.fire({
      title: "Từ chối yêu cầu",
      html: '<p style="margin-bottom: 16px;">Bạn có chắc muốn từ chối yêu cầu này?</p><textarea id="swal-rejection-reason" class="swal2-textarea" placeholder="Nhập lý do từ chối..." rows="4" style="width: 100%;"></textarea>',
      showCancelButton: true,
      confirmButtonText: "Xác nhận từ chối",
      cancelButtonText: "Hủy",
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      preConfirm: () => {
        const reason = document.getElementById("swal-rejection-reason").value;
        if (!reason.trim()) {
          Swal.showValidationMessage("Vui lòng nhập lý do từ chối");
          return false;
        }
        return reason;
      },
    });
    if (rejectionReason) {
      try {
        await partsRequestAPI.evmStaffApproveOrReject({
          requestId: request.id,
          action: "REJECT",
          rejectionReason,
          evmStaffId: user.id,
        });
        Swal.fire({
          icon: "success",
          title: "Đã từ chối",
          text: "Yêu cầu đã được từ chối",
          confirmButtonColor: "#3b82f6",
        });
        fetchRequests();
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Lỗi!",
          text: error.response?.data?.message || "Không thể từ chối yêu cầu",
          confirmButtonColor: "#ef4444",
        });
      }
    }
  };

  const handleScAdminConfirmReceive = async (requestId) => {
    const result = await Swal.fire({
      title: "Xác nhận nhận hàng?",
      text: "Xác nhận đã nhận được hàng từ EVM? Kho SC sẽ được cập nhật.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Đã nhận hàng",
      cancelButtonText: "Hủy",
      confirmButtonColor: "#3b82f6",
      cancelButtonColor: "#6b7280",
    });
    if (!result.isConfirmed) return;
    try {
      await partsRequestAPI.scAdminConfirmReceive({
        requestId,
        scAdminId: user.id,
      });
      Swal.fire({
        icon: "success",
        title: "Thành công!",
        text: "Đã xác nhận nhận hàng. Kho SC đã được cập nhật.",
        confirmButtonColor: "#3b82f6",
      });
      fetchRequests();
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Lỗi!",
        text: error.response?.data?.message || "Không thể xác nhận nhận hàng",
        confirmButtonColor: "#ef4444",
      });
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      PENDING: { text: "Chờ duyệt", className: "status-pending" },
      APPROVED: { text: "Đã duyệt", className: "status-approved" },
      REJECTED: { text: "Từ chối", className: "status-rejected" },
      DELIVERED: { text: "Đã giao", className: "status-delivered" },
    };
    const statusInfo = statusMap[status] || { text: status, className: "" };
    return (
      <span className={`status-badge ${statusInfo.className}`}>
        {statusInfo.text}
      </span>
    );
  };

  const getPriorityBadge = (priority) => {
    const priorityMap = {
      HIGH: { text: "Cao", className: "priority-high" },
      MEDIUM: { text: "Trung bình", className: "priority-medium" },
      LOW: { text: "Thấp", className: "priority-low" },
    };
    const priorityInfo = priorityMap[priority] || {
      text: priority,
      className: "",
    };
    return (
      <span className={`priority-badge ${priorityInfo.className}`}>
        {priorityInfo.text}
      </span>
    );
  };

  const handleCreateShippingOrder = (request) => {
    // Lưu request vào sessionStorage để ShippingManagement có thể sử dụng
    sessionStorage.setItem('pendingShippingRequest', JSON.stringify(request));
    // Navigate đến trang giao hàng
    navigate('/shipping');
  };

  const renderActionButtons = (request) => {
    if (user.role === "EVM_STAFF" && request.deliveryStatus === "PENDING") {
      return (
        <div className="action-buttons">
          <button
            className="btn-approve"
            onClick={() => handleEvmApprove(request.id)}
          >
            Duyệt
          </button>
          <button
            className="btn-reject"
            onClick={() => handleEvmReject(request)}
          >
            Từ chối
          </button>
        </div>
      );
    }
    if (user.role === "EVM_STAFF" && request.deliveryStatus === "APPROVED") {
      return (
        <div className="action-buttons">
          <button
            className="btn-shipping"
            onClick={() => handleCreateShippingOrder(request)}
          >
            📦 Tạo đơn giao hàng
          </button>
        </div>
      );
    }
    if (user.role === "SC_ADMIN" && request.deliveryStatus === "APPROVED") {
      return (
        <div className="action-buttons">
          <button
            className="btn-confirm"
            onClick={() => handleScAdminConfirmReceive(request.id)}
          >
            Đã nhận hàng
          </button>
        </div>
      );
    }
    return null;
  };

  if (loading) return <div className="loading-container">Đang tải...</div>;

  return (
    <div className="parts-request-management">
      <div className="management-header">
        <h2>Quản Lý Yêu Cầu Phụ Tùng</h2>
        <p className="management-subtitle">
          {user.role === "EVM_STAFF"
            ? "Duyệt yêu cầu từ các chi nhánh SC"
            : "Xác nhận nhận hàng"}
        </p>
      </div>
      {requests.length === 0 ? (
        <div className="empty-state">
          <p>Không có yêu cầu nào</p>
        </div>
      ) : (
        <div className="requests-grid">
          {requests.map((request) => (
            <div key={request.id} className="request-card">
              <div className="card-header">
                <div className="card-title">
                  <h3>{request.partTypeName || "Unknown Part"}</h3>
                  {getPriorityBadge(request.priority)}
                </div>
                {getStatusBadge(request.deliveryStatus)}
              </div>
              <div className="card-body">
                <div className="info-row">
                  <span className="label">Số lượng:</span>
                  <span className="value">{request.quantity}</span>
                </div>
                {request.vin && (
                  <div className="info-row">
                    <span className="label">VIN:</span>
                    <span className="value">{request.vin}</span>
                  </div>
                )}
                <div className="info-row">
                  <span className="label">Chi nhánh:</span>
                  <span className="value">
                    {request.scBranchOffice || request.branchOffice}
                  </span>
                </div>
                <div className="info-row">
                  <span className="label">Lý do:</span>
                  <span className="value">{request.reason}</span>
                </div>
                <div className="info-row">
                  <span className="label">Ngày yêu cầu:</span>
                  <span className="value">
                    {new Date(request.requestDate).toLocaleDateString("vi-VN")}
                  </span>
                </div>
                {request.rejectionReason && (
                  <div className="info-row rejection-reason">
                    <span className="label">Lý do từ chối:</span>
                    <span className="value">{request.rejectionReason}</span>
                  </div>
                )}
                {request.deliveryStatus === "APPROVED" &&
                  request.evmStockBefore !== null && (
                    <div className="stock-info">
                      <small>
                        Kho EVM: {request.evmStockBefore} →{" "}
                        {request.evmStockAfter}
                      </small>
                    </div>
                  )}
                {request.deliveryStatus === "DELIVERED" &&
                  request.scStockAfter !== null && (
                    <div className="stock-info">
                      <small>
                        Kho SC: {request.scStockBefore} → {request.scStockAfter}
                      </small>
                    </div>
                  )}
              </div>
              <div className="card-footer">{renderActionButtons(request)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PartsRequestManagement;
