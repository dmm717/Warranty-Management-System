import React, { useState, useEffect } from "react";
import "../../styles/PartsRequest.css";

function PartsRequest({ userRole, onCancel, isModal = false }) {
  const [requests, setRequests] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    PartNumber: "",
    PartName: "",
    Quantity: 1,
    Priority: "Trung bình",
    Notes: "",
    RequestReason: "",
  });

  useEffect(() => {
    const mockRequests = [
      {
        RequestID: "PR001",
        PartNumber: "PS001",
        PartName: "Pin Lithium 75kWh",
        Quantity: 2,
        RequestDate: "2025-10-05",
        Status: "Chờ duyệt",
        DeliveryDate: null,
        Priority: "Cao",
        RequestReason: "Thay thế pin lỗi cho VF8ABC123456",
        SC_StaffID: "SC001",
      },
      {
        RequestID: "PR002",
        PartNumber: "PS002",
        PartName: "Motor điện 150kW",
        Quantity: 1,
        RequestDate: "2025-10-03",
        Status: "Đã duyệt",
        DeliveryDate: "2025-10-10",
        Priority: "Trung bình",
        RequestReason: "Bảo trì định kỳ",
        SC_StaffID: "SC002",
      },
    ];

    setRequests(mockRequests);
  }, []);

  const getStatusBadge = (status) => {
    const statusClasses = {
      "Chờ duyệt": "status-pending",
      "Đã duyệt": "status-approved",
      "Từ chối": "status-rejected",
      "Đã giao": "status-delivered",
    };

    return (
      <span
        className={`status-badge ${statusClasses[status] || "status-pending"}`}
      >
        {status}
      </span>
    );
  };

  const getPriorityBadge = (priority) => {
    const priorityClasses = {
      Cao: "priority-high",
      "Trung bình": "priority-medium",
      Thấp: "priority-low",
    };

    return (
      <span
        className={`priority-badge ${
          priorityClasses[priority] || "priority-medium"
        }`}
      >
        {priority}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return dateString ? new Date(dateString).toLocaleDateString("vi-VN") : "-";
  };

  const handleSubmitRequest = (e) => {
    e.preventDefault();

    const newRequest = {
      ...formData,
      RequestID: `PR${String(requests.length + 1).padStart(3, "0")}`,
      RequestDate: new Date().toISOString().split("T")[0],
      Status: "Chờ duyệt",
      DeliveryDate: null,
      SC_StaffID: "SC001",
    };

    setRequests([...requests, newRequest]);
    setFormData({
      PartNumber: "",
      PartName: "",
      Quantity: 1,
      Priority: "Trung bình",
      Notes: "",
      RequestReason: "",
    });
    setShowForm(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const updateRequestStatus = (requestId, newStatus) => {
    setRequests(
      requests.map((req) =>
        req.RequestID === requestId
          ? {
              ...req,
              Status: newStatus,
              DeliveryDate:
                newStatus === "Đã giao"
                  ? new Date().toISOString().split("T")[0]
                  : req.DeliveryDate,
            }
          : req
      )
    );
  };

  const containerClass = isModal ? "parts-request-modal" : "parts-request";

  return (
    <div className={containerClass}>
      <div className="request-header">
        <h3>Yêu cầu phụ tùng</h3>
        {!showForm &&
          (userRole === "SC_Staff" || userRole === "SC_Technician") && (
            <button
              onClick={() => setShowForm(true)}
              className="btn btn-primary"
            >
              <span>➕</span>
              Tạo yêu cầu mới
            </button>
          )}
        {isModal && (
          <button onClick={onCancel} className="btn btn-outline">
            Đóng
          </button>
        )}
      </div>

      {showForm ? (
        <div className="request-form card">
          <div className="card-header">
            <h4>Tạo yêu cầu phụ tùng mới</h4>
          </div>
          <form onSubmit={handleSubmitRequest}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Mã phụ tùng</label>
                <input
                  type="text"
                  name="PartNumber"
                  value={formData.PartNumber}
                  onChange={handleInputChange}
                  className="form-control"
                  placeholder="PS001"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Tên phụ tùng</label>
                <input
                  type="text"
                  name="PartName"
                  value={formData.PartName}
                  onChange={handleInputChange}
                  className="form-control"
                  placeholder="Pin Lithium 75kWh"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Số lượng</label>
                <input
                  type="number"
                  name="Quantity"
                  value={formData.Quantity}
                  onChange={handleInputChange}
                  className="form-control"
                  min="1"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Độ ưu tiên</label>
                <select
                  name="Priority"
                  value={formData.Priority}
                  onChange={handleInputChange}
                  className="form-control"
                >
                  <option value="Thấp">Thấp</option>
                  <option value="Trung bình">Trung bình</option>
                  <option value="Cao">Cao</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Lý do yêu cầu</label>
              <textarea
                name="RequestReason"
                value={formData.RequestReason}
                onChange={handleInputChange}
                className="form-control"
                placeholder="Mô tả lý do cần phụ tùng..."
                rows="3"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Ghi chú</label>
              <textarea
                name="Notes"
                value={formData.Notes}
                onChange={handleInputChange}
                className="form-control"
                placeholder="Ghi chú thêm (không bắt buộc)..."
                rows="2"
              />
            </div>

            <div className="form-actions">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="btn btn-outline"
              >
                Hủy
              </button>
              <button type="submit" className="btn btn-primary">
                Gửi yêu cầu
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="requests-list">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Mã yêu cầu</th>
                  <th>Phụ tùng</th>
                  <th>Số lượng</th>
                  <th>Ngày yêu cầu</th>
                  <th>Độ ưu tiên</th>
                  <th>Trạng thái</th>
                  <th>Ngày giao dự kiến</th>
                  {(userRole === "EVM_Staff" || userRole === "Admin") && (
                    <th>Thao tác</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => (
                  <tr key={request.RequestID}>
                    <td>
                      <strong>{request.RequestID}</strong>
                    </td>
                    <td>
                      <div className="part-info">
                        <strong>{request.PartName}</strong>
                        <small>{request.PartNumber}</small>
                      </div>
                    </td>
                    <td>
                      <strong>{request.Quantity}</strong>
                    </td>
                    <td>{formatDate(request.RequestDate)}</td>
                    <td>{getPriorityBadge(request.Priority)}</td>
                    <td>{getStatusBadge(request.Status)}</td>
                    <td>{formatDate(request.DeliveryDate)}</td>
                    {(userRole === "EVM_Staff" || userRole === "Admin") && (
                      <td>
                        <div className="status-actions">
                          {request.Status === "Chờ duyệt" && (
                            <>
                              <button
                                onClick={() =>
                                  updateRequestStatus(
                                    request.RequestID,
                                    "Đã duyệt"
                                  )
                                }
                                className="btn btn-sm btn-success"
                                title="Phê duyệt"
                              >
                                ✓
                              </button>
                              <button
                                onClick={() =>
                                  updateRequestStatus(
                                    request.RequestID,
                                    "Từ chối"
                                  )
                                }
                                className="btn btn-sm btn-danger"
                                title="Từ chối"
                              >
                                ✗
                              </button>
                            </>
                          )}
                          {request.Status === "Đã duyệt" && (
                            <button
                              onClick={() =>
                                updateRequestStatus(
                                  request.RequestID,
                                  "Đã giao"
                                )
                              }
                              className="btn btn-sm btn-primary"
                              title="Đánh dấu đã giao"
                            >
                              📦
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default PartsRequest;
