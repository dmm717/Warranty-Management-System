import React from "react";
import "../../styles/CampaignList.css";

function CampaignList({
  campaigns,
  onEdit,
  onView,
  onUpdateStatus,
  userRole,
  onAssign,
}) {
  const getStatusBadge = (status) => {
    const statusClasses = {
      ACTIVE: "status-active",
      INACTIVE: "status-inactive",
      COMPLETED: "status-completed",
      CANCELLED: "status-cancelled",
      PENDING: "status-preparing",
      "Chuẩn bị": "status-preparing",
      "Đang triển khai": "status-active",
      "Tạm dừng": "status-paused",
      "Hoàn thành": "status-completed",
      "Hủy bỏ": "status-cancelled",
    };

    const statusLabels = {
      ACTIVE: "Đang triển khai",
      INACTIVE: "Tạm dừng",
      COMPLETED: "Hoàn thành",
      CANCELLED: "Hủy bỏ",
      PENDING: "Chuẩn bị",
    };

    const displayStatus = statusLabels[status] || status;

    return (
      <span
        className={`status-badge ${
          statusClasses[status] ||
          statusClasses[displayStatus] ||
          "status-preparing"
        }`}
      >
        {displayStatus}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  const canUpdateStatus = () => {
    return userRole === "EVM_Staff" || userRole === "Admin";
  };

  const getAvailableStatuses = (currentStatus) => {
    const statusFlow = {
      ACTIVE: ["INACTIVE", "COMPLETED"],
      INACTIVE: ["ACTIVE", "CANCELLED"],
      PENDING: ["ACTIVE", "CANCELLED"],
      COMPLETED: [],
      CANCELLED: [],
      "Chuẩn bị": ["Đang triển khai", "Hủy bỏ"],
      "Đang triển khai": ["Tạm dừng", "Hoàn thành"],
      "Tạm dừng": ["Đang triển khai", "Hủy bỏ"],
      "Hoàn thành": [],
      "Hủy bỏ": [],
    };
    return statusFlow[currentStatus] || [];
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
              <tr key={campaign.campaignId || campaign.CampaignsID}>
                <td>
                  <div className="campaign-id">
                    <strong>
                      {campaign.campaignId || campaign.CampaignsID}
                    </strong>
                  </div>
                </td>
                <td>
                  <div className="campaign-info">
                    <strong>
                      {campaign.campaignName || campaign.CampaignsTypeName}
                    </strong>
                    <small>
                      {campaign.description || campaign.Description}
                    </small>
                  </div>
                </td>
                <td>
                  <div className="date-range">
                    <div>
                      {formatDate(campaign.startDate || campaign.StartDate)}
                    </div>
                    <small>
                      đến {formatDate(campaign.endDate || campaign.EndDate)}
                    </small>
                  </div>
                </td>
                <td>
                  <span className="required-parts">
                    {campaign.requiredParts || campaign.RequiredParts || "N/A"}
                  </span>
                </td>
                <td>
                  <div className="progress-info">
                    {/* tiến độ sẽ được cập nhật dựa vào số xe được hoàn thành */}
                    <div className="progress-text">
                      {campaign.completedVehicles ||
                        campaign.CompletedVehicles ||
                        0}{" "}
                      xe
                    </div>
                  </div>
                </td>
                <td>
                  <div className="status-container">
                    {getStatusBadge(campaign.status || campaign.Status)}
                    {canUpdateStatus() &&
                      getAvailableStatuses(campaign.status || campaign.Status)
                        .length > 0 && (
                        <div className="status-actions">
                          {getAvailableStatuses(
                            campaign.status || campaign.Status
                          ).map((nextStatus) => (
                            <button
                              key={nextStatus}
                              onClick={() =>
                                onUpdateStatus(
                                  campaign.campaignId || campaign.CampaignsID,
                                  nextStatus
                                )
                              }
                              className="btn btn-sm status-btn"
                              title={`Chuyển sang ${nextStatus}`}
                            >
                              →{nextStatus}
                            </button>
                          ))}
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
