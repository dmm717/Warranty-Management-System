import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { Megaphone, AlertTriangle, ArrowLeft } from "lucide-react";
import CampaignList from "./CampaignList";
import CampaignForm from "./CampaignForm";
import CampaignDetail from "./CampaignDetail";
import RecallList from "./RecallList";
import RecallForm from "./RecallForm";
import RecallDetail from "./RecallDetail";
import { serviceCampaignAPI, vehicleAPI, recallAPI } from "../../services/api";
import "./CampaignManagement.css";
import AssignTechnicianModal from "../AssignTechnicianModal/AssignTechnicianModal";
import { mockTechnicians } from "../Technician/TechnicianManagement";
import { toast } from "react-toastify";

function CampaignManagement() {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState([]);
  const [recalls, setRecalls] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [formType, setFormType] = useState("campaign");
  const [activeTab, setActiveTab] = useState("campaigns");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [assignments, setAssignments] = useState([
    { CampaignsID: "SC001", SC_TechnicianID: "T001" },
    { CampaignsID: "SC001", SC_TechnicianID: "T002" },
  ]);
  const [vehicles, setVehicles] = useState([]);
  const [recallVehicleMap, setRecallVehicleMap] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch campaigns from API
      const campaignsRes = await serviceCampaignAPI.getAllCampaigns({
        page: 0,
        size: 100,
        sortBy: "startDate",
        sortDir: "desc",
      });

      if (campaignsRes.success && campaignsRes.data) {
        const transformedCampaigns = campaignsRes.data.content.map(
          (campaign) => ({
            // Backend trả về: campaignsId, campaignsTypeName (from ServiceCampaignsListDTO)
            campaignId: campaign.campaignsId,
            CampaignsID: campaign.campaignsId,
            campaignName: campaign.campaignsTypeName,
            CampaignsTypeName: campaign.campaignsTypeName,
            description: campaign.description || "N/A",
            Description: campaign.description || "N/A",
            startDate: campaign.startDate,
            StartDate: campaign.startDate,
            endDate: campaign.endDate,
            EndDate: campaign.endDate,
            status: campaign.status,
            Status: campaign.status,
            requiredParts: campaign.requiredParts || "N/A",
            RequiredParts: campaign.requiredParts || "N/A",
            completedVehicles: campaign.completedVehicles || 0,
            CompletedVehicles: campaign.completedVehicles || 0,
            vehicleTypes: campaign.vehicleTypes || [],
            technicians: campaign.technicians || [],
            vehicleTypeCount: campaign.vehicleTypeCount || 0,
            technicianCount: campaign.technicianCount || 0,
          })
        );
        setCampaigns(transformedCampaigns);
      } else {
        setCampaigns([]);
      }

      // Fetch recalls from API
      const recallsRes = await recallAPI.getAllRecalls({
        page: 0,
        size: 100,
        sortBy: "startDate",
        sortDir: "desc",
      });

      if (recallsRes.success && recallsRes.data) {
        const transformedRecalls = recallsRes.data.content.map((recall) => ({
          // Map backend fields to frontend format
          Recall_ID: recall.id,
          id: recall.id,
          RecallName: recall.name,
          name: recall.name,
          Description: recall.description,
          description: recall.description,
          IssueDescription: recall.description,
          StartDate: recall.startDate,
          startDate: recall.startDate,
          EndDate: recall.endDate,
          endDate: recall.endDate,
          Status: recall.status,
          status: recall.status,
          NotificationSent: recall.notificationSent,
          notificationSent: recall.notificationSent,
          VehicleModels: recall.vehicleTypes?.map(vt => vt.id) || [],
          vehicleTypes: recall.vehicleTypes || [],
          vehicles: recall.vehicles || [],
          technicians: recall.technicians || [],
          reports: recall.reports || [],
        }));
        setRecalls(transformedRecalls);
      } else {
        setRecalls([]);
      }

      // Fetch vehicles
      const vehiclesRes = await vehicleAPI.getAllVehicles({
        page: 0,
        size: 100,
        sortBy: "name",
        sortDir: "asc",
      });

      if (vehiclesRes.success && vehiclesRes.data) {
        const transformedVehicles = vehiclesRes.data.content.map((vehicle) => ({
          Vehicle_ID: vehicle.vehicleId,
          Vehicle_Name: vehicle.vehicleName,
          VIN: vehicle.vehicleId,
          Owner: vehicle.owner,
          Status: vehicle.status,
        }));
        setVehicles(transformedVehicles);
      }
    } catch (error) {
      console.error("Fetch data error:", error);
      setError("Không thể tải dữ liệu");
      setCampaigns([]);
      // Không reset recalls ở đây
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Modal handlers - đã fix đúng logic
  const openAssignModal = (campaign) => {
    setSelectedCampaign(campaign);
    setIsModalOpen(true);
  };

  const closeAssignModal = () => {
    setIsModalOpen(false);
    setSelectedCampaign(null);
  };

  // ✅ Assign technician - logic mới
  const handleAssign = (campaignId, techId) => {
    setAssignments((prev) => [
      ...prev,
      { CampaignsID: campaignId, SC_TechnicianID: techId },
    ]);
  };

  // ✅ Remove technician - logic mới
  const handleRemove = (campaignId, techId) => {
    setAssignments((prev) =>
      prev.filter(
        (a) => !(a.CampaignsID === campaignId && a.SC_TechnicianID === techId)
      )
    );
  };

  const handleCreateCampaign = () => {
    setSelectedItem(null);
    setFormType("campaign");
    setShowForm(true);
    setShowDetail(false);
  };

  const handleCreateRecall = () => {
    setSelectedItem(null);
    setFormType("recall");
    setShowForm(true);
    setShowDetail(false);
  };

  const handleEdit = (item, type) => {
    setSelectedItem(item);
    setFormType(type);
    setShowForm(true);
    setShowDetail(false);
  };

  const handleViewDetail = (item, type) => {
    setSelectedItem(item);
    setFormType(type);
    setShowDetail(true);
    setShowForm(false);
  };

  const handleSave = async (itemData) => {
    try {
      setLoading(true);
      if (formType === "campaign") {
        // Transform frontend field names to backend format
        const backendData = {
          typeName: itemData.CampaignsTypeName || itemData.typeName,
          startDate: itemData.StartDate || itemData.startDate,
          endDate: itemData.EndDate || itemData.endDate,
          requiredParts: itemData.RequiredParts || itemData.requiredParts,
          description: itemData.Description || itemData.description,
          status: itemData.Status || itemData.status || "PLANNED",
          notificationSent: itemData.NotificationSent || false,
          vehicleTypeIds: itemData.vehicleTypeIds || [],
          technicianIds: itemData.technicianIds || [],
        };

        if (selectedItem) {
          // Update campaign
          const campaignId =
            selectedItem.campaignId || selectedItem.CampaignsID;

          const response = await serviceCampaignAPI.updateCampaign(
            campaignId,
            backendData
          );

          if (response.success) {
            await fetchData(); // Reload data
            toast.success("Cập nhật Service Campaign thành công!");
          } else {
            console.error("Update failed:", response);
            toast.error(
              response.message || "Không thể cập nhật Service Campaign"
            );
          }
        } else {
          // Create campaign
          const response = await serviceCampaignAPI.createCampaign(backendData);

          if (response.success) {
            await fetchData(); // Reload data
            toast.success("Tạo Service Campaign thành công!");
          } else {
            console.error("Create failed:", response);
            toast.error(response.message || "Không thể tạo Service Campaign");
          }
        }
      } else {
        // Recall logic - chỉ update local state vì chưa có API
        if (selectedItem) {
          // Edit existing recall
          const updatedRecall = { ...selectedItem, ...itemData };

          // If EVM_STAFF is completing the recall details, change status
          if (
            user?.role === "EVM_STAFF" &&
            itemData.IssueDescription &&
            itemData.RequiredAction
          ) {
            updatedRecall.Status = "In Progress";
          }

          setRecalls(
            recalls.map((r) =>
              r.Recall_ID === selectedItem.Recall_ID ? updatedRecall : r
            )
          );
          toast.success("Cập nhật Recall thành công!");
        } else {
          // Create new recall
          const newRecall = {
            ...itemData,
            Recall_ID: `RC${String(recalls.length + 1).padStart(3, "0")}`,
            Status: "Pending", // EVM_ADMIN creates with Pending status
            NotificationSent: 0,
            CompletedVehicles: 0,
            AffectedVehicles: 0,
            CreatedDate: new Date().toISOString(),
            CreatedBy: user?.role || "EVM_ADMIN",
          };

          setRecalls([...recalls, newRecall]);
          toast.success(
            "Tạo Recall thành công! EVM_STAFF sẽ nhận được thông báo."
          );

          // TODO: When backend is ready, send notification to EVM_STAFF users
          // await NotificationService.sendNotification({
          //   RecipientRole: "EVM_STAFF",
          //   Title: "Recall mới cần xử lý",
          //   Message: `Recall ${newRecall.RecallName} (${newRecall.Recall_ID}) đã được tạo`,
          //   RelatedID: newRecall.Recall_ID,
          //   Type: "Recall"
          // });
        }
      }
    } catch (error) {
      console.error("Save campaign/recall error:", error);
      toast.error("Đã xảy ra lỗi khi lưu");
    } finally {
      setLoading(false);
      // Không gọi fetchData() cho recall vì chưa có API backend
    }
    setShowForm(false);
    setSelectedItem(null);
  };

  const handleUpdateStatus = async (itemId, newStatus, type) => {
    try {
      setLoading(true);
      if (type === "campaign") {
        // Call backend API to update campaign status
        const response = await serviceCampaignAPI.updateCampaignStatus(
          itemId,
          newStatus
        );

        if (response.success) {
          // Xử lý notification khi cần
          if (newStatus === "PAUSED") {
            await serviceCampaignAPI.updateNotificationSent(itemId, true);
            toast.success("Chiến dịch đã dừng! Thông báo đã được gửi.");
          } else {
            const statusLabels = {
              ACTIVE: "Đang triển khai",
              COMPLETED: "Hoàn thành",
              CANCELLED: "Hủy bỏ",
            };
            toast.success(
              `Đã cập nhật trạng thái thành "${
                statusLabels[newStatus] || newStatus
              }"`
            );
          }

          // Reload data to get updated campaigns
          await fetchData();
        } else {
          // ApiService đã xử lý 401, chỉ cần hiển thị lỗi khác
          toast.error(response.message || "Không thể cập nhật trạng thái");
        }
      } else {
        // Recall status update
        setRecalls(
          recalls.map((r) =>
            r.Recall_ID === itemId ? { ...r, Status: newStatus } : r
          )
        );
      }
    } catch (error) {
      console.error("Update status error:", error);
      toast.error("Đã xảy ra lỗi khi cập nhật trạng thái");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setShowForm(false);
    setShowDetail(false);
    setSelectedItem(null);
  };

  const canCreateEdit = () => {
    return user?.role === "EVM_STAFF" || user?.role === "EVM_ADMIN";
  };

  const handleStartCampaign = async (campaign) => {
    if (
      !window.confirm(
        `Bắt đầu chiến dịch "${campaign.campaignsTypeName}"?\n\nThao tác này sẽ:\n- Chuyển trạng thái sang "Đang triển khai"\n- Gửi thông báo đến tất cả SC_STAFF`
      )
    ) {
      return;
    }

    try {
      setLoading(true);

      // 1. Update status to ACTIVE
      const statusResponse = await serviceCampaignAPI.updateCampaignStatus(
        campaign.campaignsId || campaign.CampaignsID,
        "ACTIVE"
      );

      if (!statusResponse.success) {
        toast.error(statusResponse.message || "Không thể bắt đầu chiến dịch");
        return;
      }

      // 2. Mark notification as sent
      await serviceCampaignAPI.updateNotificationSent(
        campaign.campaignsId || campaign.CampaignsID,
        true
      );

      // 3. Create notifications for SC_STAFF users
      // Note: Backend should handle this automatically when status changes to ACTIVE
      // or when notificationSent is set to true
      // For now, we just rely on backend to create notifications

      // 4. Reload data
      await fetchData();

      toast.success(
        `Đã bắt đầu chiến dịch "${campaign.campaignsTypeName}"! Thông báo đã được gửi đến SC_STAFF.`
      );
    } catch (error) {
      console.error("Start campaign error:", error);
      toast.error("Đã xảy ra lỗi khi bắt đầu chiến dịch");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Đang tải dữ liệu chiến dịch...</p>
      </div>
    );
  }

  return (
    <div className="campaign-management">
      <div className="page-header">
        <h1>Quản lý chiến dịch & Recall</h1>
        {!showForm && !showDetail && canCreateEdit() && (
          <div className="header-actions">
            <button
              onClick={handleCreateCampaign}
              className="btn btn-secondary"
            >
              <Megaphone size={18} style={{ marginRight: '6px' }} />
              Tạo Service Campaign
            </button>
            <button onClick={handleCreateRecall} className="btn btn-primary">
              <AlertTriangle size={18} style={{ marginRight: '6px' }} />
              Tạo recall
            </button>
          </div>
        )}
        {(showForm || showDetail) && (
          <button onClick={handleBack} className="btn btn-outline">
            <ArrowLeft size={18} style={{ marginRight: '6px' }} />
            Quay lại
          </button>
        )}
      </div>

      {!showForm && !showDetail ? (
        <>
          <div className="campaign-tabs">
            <button
              className={`tab-btn ${activeTab === "campaigns" ? "active" : ""}`}
              onClick={() => setActiveTab("campaigns")}
            >
              <Megaphone size={18} style={{ marginRight: '6px' }} />
              Service Campaign
            </button>
            <button
              className={`tab-btn ${activeTab === "recalls" ? "active" : ""}`}
              onClick={() => setActiveTab("recalls")}
            >
              <AlertTriangle size={18} style={{ marginRight: '6px' }} />
              Recall
            </button>
          </div>

          {activeTab === "campaigns" ? (
            <CampaignList
              campaigns={campaigns}
              onEdit={(item) => handleEdit(item, "campaign")}
              onView={(item) => handleViewDetail(item, "campaign")}
              onUpdateStatus={(id, status) =>
                handleUpdateStatus(id, status, "campaign")
              }
              onStartCampaign={handleStartCampaign}
              userRole={user?.role}
              onAssign={openAssignModal}
              assignments={assignments} // ✅ Pass assignments để hiển thị số lượng
            />
          ) : (
            <RecallList
              recalls={recalls}
              onEdit={(item) => handleEdit(item, "recall")}
              onView={(item) => handleViewDetail(item, "recall")}
              onUpdateStatus={(id, status) =>
                handleUpdateStatus(id, status, "recall")
              }
              userRole={user?.role}
            />
          )}
        </>
      ) : showForm ? (
        formType === "campaign" ? (
          <CampaignForm
            campaign={selectedItem}
            onSave={handleSave}
            onCancel={handleBack}
          />
        ) : (
          <RecallForm
            recall={selectedItem}
            onSave={handleSave}
            onCancel={handleBack}
            vehicleList={vehicles} // ✅ Truyền fake vehicle data
          />
        )
      ) : formType === "recall" ? (
        <RecallDetail
          recallId={selectedItem?.Recall_ID || selectedItem?.id}
          onBack={handleBack}
        />
      ) : (
        <CampaignDetail
          item={selectedItem}
          type={formType}
          onEdit={handleEdit}
          onUpdateStatus={handleUpdateStatus}
          userRole={user?.role}
        />
      )}

      {/* ✅ Modal - đã fix props đúng */}
      <AssignTechnicianModal
        isOpen={isModalOpen}
        onClose={closeAssignModal}
        campaign={selectedCampaign}
        technicians={mockTechnicians}
        assignments={assignments}
        onAssign={handleAssign}
        onRemove={handleRemove}
      />
    </div>
  );
}

export default CampaignManagement;
