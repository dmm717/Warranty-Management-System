
import React from "react";
import "../../styles/CampaignList.css";



function CampaignList({ campaigns, onEdit, onView, onUpdateStatus, userRole, onAssign }) {
  const getStatusBadge = (status) => {
    const statusClasses = {
      "Chuẩn bị": "status-preparing",
      "Đang triển khai": "status-active",
      "Tạm dừng": "status-paused",
      "Hoàn thành": "status-completed",
      "Hủy bỏ": "status-cancelled",
    };

    return (
      <span
        className={`status-badge ${statusClasses[status] || "status-preparing"
          }`}
      >
        {status}
      </span>
    );
  };


  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  const getProgressPercentage = (completed, total) => {
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const canUpdateStatus = () => {
    return userRole === "EVM_Staff" || userRole === "Admin";
  };

  const getAvailableStatuses = (currentStatus) => {
    const statusFlow = {
      "Chuẩn bị": ["Đang triển khai", "Hủy bỏ"],
      "Đang triển khai": ["Tạm dừng", "Hoàn thành"],
      "Tạm dừng": ["Đang triển khai", "Hủy bỏ"],
      "Hoàn thành": [],
      "Hủy bỏ": [],
    };
    return statusFlow[currentStatus] || [];
  };
  const handleAssignTechnician = (campaignID, assignedList) => {
  setCampaigns((prev) =>
    prev.map((c) =>
      c.CampaignID === campaignID ? { ...c, assignedTechnicians: assignedList } : c
    )
  );
};


  if (campaigns.length === 0) {
    return (
      <div className="no-data-container">
        <div className="no-data-icon">📢</div>
        <h3>Chưa có chiến dịch nào</h3>
        <p>Tạo chiến dịch dịch vụ đầu tiên</p>
      </div>
    );
  }


  return (
    <div className="campaign-list">
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Mã chiến dịch</th>
              <th>Tên chiến dịch</th>
              <th>Thời gian</th>
              <th>Phụ tùng yêu cầu</th>
              <th>Tiến độ xe đã sữa</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((campaign) => (
              <tr key={campaign.CampaignsID}>
                <td>
                  <div className="campaign-id">
                    <strong>{campaign.CampaignsID}</strong>
                  </div>
                </td>
                <td>
                  <div className="campaign-info">
                    <strong>{campaign.CampaignsTypeName}</strong>
                    <small>{campaign.Description}</small>
                  </div>
                </td>
                <td>
                  <div className="date-range">
                    <div>{formatDate(campaign.StartDate)}</div>
                    <small>đến {formatDate(campaign.EndDate)}</small>
                  </div>
                </td>
                <td>
                  <span className="required-parts">
                    {campaign.RequiredParts}
                  </span>
                </td>
                <td>
                  <div className="progress-info">

                    {/* tiến độ sẽ được cập nhật dựa vào số xe được hoàng thành  nó được lưu trong report*/}
                    <div className="progress-text">
                      {campaign.CompletedVehicles}{" "}
                      xe
                    </div>
                  </div>
                </td>
                <td>
                  <div className="status-container">
                    {getStatusBadge(campaign.Status)}
                    {canUpdateStatus() &&
                      getAvailableStatuses(campaign.Status).length > 0 && (
                        <div className="status-actions">
                          {getAvailableStatuses(campaign.Status).map(
                            (nextStatus) => (
                              <button
                                key={nextStatus}
                                onClick={() =>
                                  onUpdateStatus(
                                    campaign.CampaignsID,
                                    nextStatus
                                  )
                                }
                                className="btn btn-sm status-btn"
                                title={`Chuyển sang ${nextStatus}`}
                              >
                                →{nextStatus}
                              </button>
                            )
                          )}
                        </div>
                      )}
                  </div>
                </td>

                <td>
                  <div className="action-buttons">
                    <button
                      onClick={() => onView(campaign)}
                      className="btn btn-sm btn-outline"
                      title="Xem chi tiết"
                    >
                      👁️
                    </button>
                    {canUpdateStatus() && (
                      <button
                        onClick={() => onEdit(campaign)}
                        className="btn btn-sm btn-outline"
                        title="Chỉnh sửa"
                      >
                        ✏️
                      </button>
                    )}
                    {canUpdateStatus() && (
                      <button
                        onClick={() => onAssign(campaign)}
                        className="btn btn-sm btn-warning"
                        title="Phân công kỹ thuật viên"
                      >
                        👷
                      </button>
                    )}
                  </div>
                </td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}

export default CampaignList;
