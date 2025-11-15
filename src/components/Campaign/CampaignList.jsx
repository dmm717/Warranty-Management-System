import React, { useState, useEffect, useCallback } from "react";
import { Megaphone, Eye, Edit } from "lucide-react";
import "../../styles/CampaignList.css";
import api from "../../services/api";

function CampaignList({
  campaigns,
  onEdit,
  onView,
  onUpdateStatus,
  userRole,
  onAssign,
  onStartCampaign, // Callback để bắt đầu chiến dịch (SC_ADMIN)
  onDelete, // Callback để xóa chiến dịch
}) {
  const [vehicleCounts, setVehicleCounts] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Filter campaigns based on debounced search term
  const filteredCampaigns = campaigns && campaigns.length > 0 ? campaigns.filter(campaign =>
    (campaign.campaignsTypeName && campaign.campaignsTypeName.toLowerCase().includes(debouncedSearchTerm.toLowerCase())) ||
    (campaign.CampaignsTypeName && campaign.CampaignsTypeName.toLowerCase().includes(debouncedSearchTerm.toLowerCase())) ||
    (campaign.description && campaign.description.toLowerCase().includes(debouncedSearchTerm.toLowerCase())) ||
    (campaign.Description && campaign.Description.toLowerCase().includes(debouncedSearchTerm.toLowerCase())) ||
    (campaign.campaignsId && campaign.campaignsId.toString().includes(debouncedSearchTerm)) ||
    (campaign.CampaignsID && campaign.CampaignsID.toString().includes(debouncedSearchTerm))
  ) : [];

  // Hàm đếm số lượng xe theo campaign ID
  const countVehiclesForCampaign = async (campaignId) => {
    try {
      // console.log(`🔍 Đang đếm xe cho campaign ID: ${campaignId}`);

      // Fetch tất cả vehicles với size lớn để lấy hết
      const response = await api.vehicle.getAllVehicles({ page: 0, size: 10000 }); // Size lớn để lấy tất cả
      const vehicles = response.data?.content || response.data || [];

      // console.log(`📊 Tổng số xe từ API: ${vehicles.length}`);
      // console.log('🚗 Danh sách xe:', vehicles.slice(0, 5)); // Log 5 xe đầu tiên để check structure

      // Đếm số xe có vision == campaignId
      const matchingVehicles = vehicles.filter(vehicle => vehicle.vision == campaignId);
      const count = matchingVehicles.length;

      // console.log(`✅ Số xe có vision == ${campaignId}: ${count}`);
      // console.log('🎯 Xe phù hợp:', matchingVehicles);

      setVehicleCounts(prev => ({
        ...prev,
        [campaignId]: count
      }));

      // console.log(`💾 Đã cập nhật vehicleCounts cho ${campaignId}:`, { ...vehicleCounts, [campaignId]: count });

      return count;
    } catch (error) {
      console.error('❌ Lỗi khi đếm xe:', error);
      return 0;
    }
  };

  // Fetch vehicle counts khi campaigns thay đổi
  useEffect(() => {
    const fetchVehicleCounts = async () => {
      // console.log(`🚀 Bắt đầu đếm xe cho ${campaigns.length} campaigns`);
      for (const campaign of campaigns) {
        const campaignId = campaign.campaignsId || campaign.CampaignsID;
        if (campaignId && !vehicleCounts[campaignId]) {
          // console.log(`📋 Đang xử lý campaign: ${campaignId}`);
          await countVehiclesForCampaign(campaignId);
        } else {
          // console.log(`⏭️ Bỏ qua campaign ${campaignId} (đã có count: ${vehicleCounts[campaignId]})`);
        }
      }
      // console.log('✅ Hoàn thành đếm xe cho tất cả campaigns');
    };

    if (campaigns.length > 0) {
      fetchVehicleCounts();
    }
  }, [campaigns]);
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
    // Chỉ EVM_ADMIN và SC_ADMIN có quyền edit
    // EVM_STAFF không có quyền edit
    return userRole === "EVM_ADMIN" || userRole === "EVM_STAFF";
  };

  const canDeleteCampaign = () => {
    // EVM_STAFF và EVM_ADMIN có quyền xóa
    return userRole === "EVM_STAFF" || userRole === "EVM_ADMIN";
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

  if (!campaigns || campaigns.length === 0) {
    return (
      <div className="no-data-container">
        <div className="no-data-icon">📢</div>
        <h3>Chưa có Service Campaign nào</h3>
        <p>Tạo Service Campaign đầu tiên</p>
      </div>
    );
  }

  return (
    <div className="campaign-list">
      {/* Search Input */}
      <div className="search-container">
        <input
          type="text"
          placeholder="Tìm kiếm chiến dịch theo tên, mô tả hoặc mã..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
          >
            Xóa
          </button>
        )}
      </div>

      {/* Results Count */}
      <div className="results-count">
        Hiển thị {filteredCampaigns.length} / {(campaigns && campaigns.length) || 0} chiến dịch
        {searchTerm && ` (tìm kiếm: "${searchTerm}")`}
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Mã chiến dịch</th>
              <th>Tên chiến dịch</th>
              <th>Thời gian</th>
              <th>Phụ tùng yêu cầu</th>
              <th>số xe có cùng version</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredCampaigns.length > 0 ? (
              filteredCampaigns.map((campaign) => (
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
                        <strong>{vehicleCounts[campaign.campaignsId || campaign.CampaignsID] ?? (campaign.completedVehicles || 0)}</strong>
                      </div>
                      <div className="progress-label">version</div>
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

                    {/* EVM_STAFF và EVM_ADMIN có quyền xóa */}
                    {canDeleteCampaign() && onDelete && (
                      <button
                        onClick={() => {
                          if (
                            window.confirm(
                              `Bạn có chắc chắn muốn xóa chiến dịch "${
                                campaign.campaignsTypeName ||
                                campaign.CampaignsTypeName
                              }"?`
                            )
                          ) {
                            onDelete(
                              campaign.campaignsId || campaign.CampaignsID
                            );
                          }
                        }}
                        className="btn btn-sm btn-danger"
                        title="Xóa"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))
            ) : (
              <tr className="no-results-row">
                <td colSpan="7">
                  {searchTerm ? `Không tìm thấy chiến dịch nào phù hợp với "${searchTerm}"` : 'Không có chiến dịch nào'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default CampaignList;
