import React from "react";
import { Megaphone, Eye, Edit } from "lucide-react";
import "../../styles/CampaignList.css";

function CampaignList({
  campaigns,
  onEdit,
  onView,
  onUpdateStatus,
  userRole,
  onAssign,
  onStartCampaign, // Callback để bắt đầu chiến dịch (SC_ADMIN)
}) {
  const getStatusBadge = (status) => {
    const statusClasses = {
      PLANNED: "status-preparing",
      ACTIVE: "status-active",
      IN_PROGRESS: "status-active",
      PAUSED: "status-paused",
      COMPLETED: "status-completed",
      CANCELLED: "status-cancelled",
    };

    const statusLabels = {
      PLANNED: "Chuẩn bị",
      ACTIVE: "Đang triển khai",
      IN_PROGRESS: "Đang triển khai",
      PAUSED: "Dừng",
      COMPLETED: "Hoàn thành",
      CANCELLED: "Hủy bỏ",
    };

    const displayStatus = statusLabels[status] || status;

    return (
      <span
        className={`status-badge ${
          statusClasses[status] || "status-preparing"
        }`}
      >
        {displayStatus}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const canUpdateStatus = () => {
    // EVM_ADMIN và SC_ADMIN đều có quyền update status (nhưng flow khác nhau)
    return userRole === "SC_ADMIN" || userRole === "EVM_ADMIN";
  };

  const canEditCampaign = () => {
    // EVM_ADMIN và SC_ADMIN đều có quyền edit thông tin campaign
    return (
      userRole === "EVM_ADMIN" ||
      userRole === "SC_ADMIN" ||
      userRole === "Admin"
    );
  };

  const canAssignTechnician = () => {
    // Chỉ SC_ADMIN mới có quyền phân công kỹ thuật viên
    return userRole === "SC_ADMIN";
  };

  const getAvailableStatuses = (currentStatus, role) => {
    // EVM_ADMIN: Không có quyền thay đổi status
    if (role === "EVM_ADMIN") {
      return [];
    }

    // SC_ADMIN: Chỉ có thể chuyển PLANNED → ACTIVE và các status khác
    if (role === "SC_ADMIN") {
      const scStatusFlow = {
        PLANNED: ["ACTIVE", "CANCELLED"], // Bắt đầu hoặc Hủy
        ACTIVE: ["COMPLETED", "CANCELLED"], // Hoàn thành hoặc Hủy
        PAUSED: [], // Không thể chuyển (chỉ EVM_ADMIN mới dừng)
        COMPLETED: [], // Không thể chuyển nữa
        CANCELLED: [], // Không thể chuyển nữa
      };
      return scStatusFlow[currentStatus] || [];
    }

    // Các role khác không có quyền thay đổi status
    return [];
  };

  if (campaigns.length === 0) {
    return (
      <div className="no-data-container">
        <div className="no-data-icon">
          <Megaphone size={48} />
        </div>
        <h3>Chưa có Service Campaign nào</h3>
        <p>Tạo Service Campaign đầu tiên</p>
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
              <tr key={campaign.campaignsId || campaign.CampaignsID}>
                <td>
                  <div className="campaign-id">
                    <strong>
                      {campaign.campaignsId || campaign.CampaignsID}
                    </strong>
                  </div>
                </td>
                <td>
                  <div className="campaign-info">
                    <strong className="campaign-name">
                      {campaign.campaignsTypeName ||
                        campaign.CampaignsTypeName ||
                        "N/A"}
                    </strong>
                    {(campaign.description || campaign.Description) && (
                      <small className="campaign-desc">
                        {campaign.description || campaign.Description}
                      </small>
                    )}
                  </div>
                </td>
                <td>
                  <div className="date-range">
                    <div className="date-start">
                      <strong>Bắt đầu:</strong>{" "}
                      {formatDate(campaign.startDate || campaign.StartDate)}
                    </div>
                    <div className="date-end">
                      <strong>Kết thúc:</strong>{" "}
                      {formatDate(campaign.endDate || campaign.EndDate)}
                    </div>
                  </div>
                </td>
                <td>
                  <div className="required-parts-cell">
                    {(() => {
                      const parts =
                        campaign.requiredParts || campaign.RequiredParts;

                      return parts ? (
                        <span className="required-parts">{parts}</span>
                      ) : (
                        <span className="required-parts parts-none">
                          Chưa xác định
                        </span>
                      );
                    })()}
                  </div>
                </td>
                <td>
                  <div className="progress-info">
                    <div className="progress-text">
                      <div className="progress-number">
                        <strong>{campaign.completedVehicles || 0}</strong>
                      </div>
                      <div className="progress-label">xe đã sửa chữa</div>
                    </div>
                    {campaign.vehicleTypeCount > 0 && (
                      <small className="text-muted">
                        Áp dụng cho {campaign.vehicleTypeCount} dòng xe
                      </small>
                    )}
                  </div>
                </td>
                <td>
                  <div className="status-container">
                    {getStatusBadge(campaign.status || campaign.Status)}
                    {(() => {
                      const canUpdate = canUpdateStatus();
                      const currentStatus = campaign.status || campaign.Status;
                      const availableStatuses = getAvailableStatuses(
                        currentStatus,
                        userRole
                      );

                      return canUpdate && availableStatuses.length > 0 ? (
                        <div className="status-actions">
                          {availableStatuses.map((nextStatus) => {
                            // Map status to Vietnamese labels
                            const statusLabels = {
                              ACTIVE: "Bắt đầu",
                              PAUSED: "Dừng",
                              COMPLETED: "Hoàn thành",
                              CANCELLED: "Hủy bỏ",
                            };

                            return (
                              <button
                                key={nextStatus}
                                onClick={() => {
                                  onUpdateStatus(
                                    campaign.campaignsId ||
                                      campaign.CampaignsID,
                                    nextStatus
                                  );
                                }}
                                className="btn btn-sm status-btn"
                                title={`Chuyển sang ${
                                  statusLabels[nextStatus] || nextStatus
                                }`}
                              >
                                → {statusLabels[nextStatus] || nextStatus}
                              </button>
                            );
                          })}
                        </div>
                      ) : null;
                    })()}
                  </div>
                </td>

                <td>
                  <div className="action-buttons">
                    <button
                      onClick={() => onView(campaign)}
                      className="btn btn-sm btn-outline"
                      title="Xem chi tiết"
                    >
                      <Eye size={16} />
                    </button>

                    {/* SC_ADMIN: Button bắt đầu chiến dịch (PLANNED → ACTIVE) */}
                    {userRole === "SC_ADMIN" &&
                      campaign.status === "PLANNED" &&
                      onStartCampaign && (
                        <button
                          onClick={() => onStartCampaign(campaign)}
                          className="btn btn-sm btn-success"
                          title="Bắt đầu chiến dịch và gửi thông báo"
                        >
                          🚀 Bắt đầu
                        </button>
                      )}

                    {/* EVM_ADMIN và SC_ADMIN có quyền edit */}
                    {canEditCampaign() && (
                      <button
                        onClick={() => onEdit(campaign)}
                        className="btn btn-sm btn-outline"
                        title="Chỉnh sửa"
                      >
                        <Edit size={16} />
                      </button>
                    )}

                    {/* Chỉ SC_ADMIN mới có quyền phân công kỹ thuật viên */}
                    {canAssignTechnician() && (
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
