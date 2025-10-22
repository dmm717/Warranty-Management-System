import React, { useState, useEffect } from "react";
import {
  partsRequestAPI,
  transformPartsRequestToBackend,
} from "../../services/api";
import "../../styles/PartsRequest.css";

function PartsRequest({ userRole, onCancel, isModal = false }) {
  const [requests, setRequests] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    PartNumber: "",
    PartName: "",
    Quantity: 1,
    PartTypeID: "PT001", // Default part type
    VehicleID: "",
    RequestReason: "",
  });

  useEffect(() => {
    fetchPartsRequests();
  }, []);

  const fetchPartsRequests = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await partsRequestAPI.getAllPartsRequests({
        page: 0,
        size: 100,
        sortBy: "requestDate",
        sortDir: "desc",
      });

      if (response.success && response.data) {
        // Transform data từ BE sang format FE
        const transformedRequests = response.data.content.map((request) => ({
          RequestID: request.id,
          PartNumber: request.partNumber,
          PartName: request.partName,
          Quantity: request.quantity,
          RequestDate: request.requestDate,
          Status: request.status || "Chờ duyệt",
          DeliveryDate: request.deliveryDate,
          PartTypeID: request.partTypeId,
          VehicleID: request.vehicleId,
        }));

        setRequests(transformedRequests);
      } else {
        setError(response.message || "Không thể tải danh sách yêu cầu");
      }
    } catch (error) {
      console.error("Error fetching parts requests:", error);
      setError("Đã xảy ra lỗi khi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

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

  const handleSubmitRequest = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      // Transform data sang format backend
      const backendData = transformPartsRequestToBackend(formData);
      const response = await partsRequestAPI.createPartsRequest(backendData);

      if (response.success) {
        // Reload danh sách
        await fetchPartsRequests();

        // Reset form
        setFormData({
          PartNumber: "",
          PartName: "",
          Quantity: 1,
          PartTypeID: "PT001",
          VehicleID: "",
          RequestReason: "",
        });
        setShowForm(false);
      } else {
        alert(response.message || "Không thể tạo yêu cầu phụ tùng");
      }
    } catch (error) {
      console.error("Error creating parts request:", error);
      alert("Đã xảy ra lỗi khi tạo yêu cầu");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const updateRequestStatus = async (requestId, newStatus) => {
    try {
      setLoading(true);

      const updateData = {
        status: newStatus,
        deliveryDate:
          newStatus === "Đã giao"
            ? new Date().toISOString().split("T")[0]
            : null,
      };

      const response = await partsRequestAPI.updatePartsRequest(
        requestId,
        updateData
      );

      if (response.success) {
        // Reload danh sách
        await fetchPartsRequests();
      } else {
        alert(response.message || "Không thể cập nhật trạng thái");
      }
    } catch (error) {
      console.error("Error updating request status:", error);
      alert("Đã xảy ra lỗi khi cập nhật trạng thái");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRequest = async (requestId) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa yêu cầu này?")) {
      try {
        setLoading(true);
        const response = await partsRequestAPI.deletePartsRequest(requestId);

        if (response.success) {
          await fetchPartsRequests();
        } else {
          alert(response.message || "Không thể xóa yêu cầu");
        }
      } catch (error) {
        console.error("Error deleting request:", error);
        alert("Đã xảy ra lỗi khi xóa yêu cầu");
      } finally {
        setLoading(false);
      }
    }
  };

  const containerClass = isModal ? "parts-request-modal" : "parts-request";

  return (
    <div className={containerClass}>
      <div className="request-header">
        <h3>Yêu cầu phụ tùng</h3>
        {!showForm &&
          (userRole === "SC_STAFF" || userRole === "SC_TECHNICAL") && (
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
                  {(userRole === "EVM_STAFF" || userRole === "EVM_ADMIN") && (
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
                    {(userRole === "EVM_STAFF" || userRole === "EVM_ADMIN") && (
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
