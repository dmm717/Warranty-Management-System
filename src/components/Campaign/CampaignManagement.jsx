import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import CampaignList from "./CampaignList";
import CampaignForm from "./CampaignForm";
import CampaignDetail from "./CampaignDetail";
import RecallList from "./RecallList";
import RecallForm from "./RecallForm";
<<<<<<< HEAD
import AssignTechnicianModal from "../AssignTechnicianModal/AssignTechnicianModal";
import { mockTechnicians } from "../Technician/TechnicianManagement";
import "../../styles/CampaignManagement.css";
=======
import { serviceCampaignAPI, vehicleAPI } from "../../services/api";
import "./CampaignManagement.css";
import AssignTechnicianModal from "../AssignTechnicianModal/AssignTechnicianModal";
import { mockTechnicians } from "../Technician/TechnicianManagement";
>>>>>>> origin/main


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
<<<<<<< HEAD
  const [recallVehicleMap, setRecallVehicleMap] = useState([]); // 🟡 Mảng mapping recall-vehicle
  // Modal & assignment state (previously missing)
  const [assignments, setAssignments] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);

  
=======
  const [recallVehicleMap, setRecallVehicleMap] = useState([]);
>>>>>>> origin/main

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
            campaignId: campaign.campaignId,
            CampaignsID: campaign.campaignId,
            campaignName: campaign.campaignName,
            CampaignsTypeName: campaign.campaignName,
            description: campaign.description,
            Description: campaign.description,
            startDate: campaign.startDate,
            StartDate: campaign.startDate,
            endDate: campaign.endDate,
            EndDate: campaign.endDate,
            status: campaign.status,
            Status: campaign.status,
            requiredParts: campaign.requiredParts || "N/A",
            RequiredParts: campaign.requiredParts || "N/A",
            completedVehicles: 0, // Will be updated from reports
            CompletedVehicles: 0,
            vehicleTypes: campaign.vehicleTypes || [],
            technicians: campaign.technicians || [],
          })
        );
        setCampaigns(transformedCampaigns);
      } else {
        setCampaigns([]);
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

      // Note: Recalls chưa có API, giữ nguyên empty array
      setRecalls([]);
    } catch (error) {
      console.error("Fetch data error:", error);
      setError("Không thể tải dữ liệu");
      setCampaigns([]);
      setRecalls([]);
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
    console.log("Assigned:", campaignId, techId);
  };

  // ✅ Remove technician - logic mới
  const handleRemove = (campaignId, techId) => {
    setAssignments((prev) =>
      prev.filter(
        (a) => !(a.CampaignsID === campaignId && a.SC_TechnicianID === techId)
      )
    );
    console.log("Removed:", campaignId, techId);
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
        if (selectedItem) {
          // Update campaign
          const response = await serviceCampaignAPI.updateCampaign(
            selectedItem.campaignId || selectedItem.CampaignsID,
            itemData
          );
          if (response.success) {
            await fetchData(); // Reload data
          } else {
            alert(response.message || "Không thể cập nhật chiến dịch");
          }
        } else {
          // Create campaign
          const response = await serviceCampaignAPI.createCampaign(itemData);
          if (response.success) {
            await fetchData(); // Reload data
          } else {
            alert(response.message || "Không thể tạo chiến dịch");
          }
        }
      } else {
        // Recall logic - giữ nguyên vì chưa có API
        if (selectedItem) {
          setRecalls(
            recalls.map((r) =>
              r.Recall_ID === selectedItem.Recall_ID ? { ...r, ...itemData } : r
            )
          );
        } else {
          const newRecall = {
            ...itemData,
            Recall_ID: `RC${String(recalls.length + 1).padStart(3, "0")}`,
            NotificationSent: 0,
            EVMApprovalStatus: "Chờ phê duyệt",
            AffectedVehicles: itemData.selectedVehicles?.length || 0,
            CompletedVehicles: 0,
          };
          const newMappings = (itemData.selectedVehicles || []).map((vId) => ({
            Recall_ID: newRecall.Recall_ID,
            Vehicle_ID: vId,
          }));
          setRecallVehicleMap((prev) => [...prev, ...newMappings]);
          setRecalls([...recalls, newRecall]);
        }
      }
    } catch (error) {
      console.error("Save campaign/recall error:", error);
      alert("Đã xảy ra lỗi khi lưu");
    } finally {
      setLoading(false);
    }
    setShowForm(false);
    setSelectedItem(null);
  };

  const handleUpdateStatus = async (itemId, newStatus, type) => {
    try {
      if (type === "campaign") {
        // await fetch(`/api/campaigns/${itemId}/status`, { method: 'PATCH', body: JSON.stringify({ Status: newStatus }) });
        setCampaigns(
          campaigns.map((c) =>
            c.CampaignsID === itemId ? { ...c, Status: newStatus } : c
          )
        );
      } else {
        // await fetch(`/api/recalls/${itemId}/status`, { method: 'PATCH', body: JSON.stringify({ Status: newStatus }) });
        setRecalls(
          recalls.map((r) =>
            r.Recall_ID === itemId ? { ...r, Status: newStatus } : r
          )
        );
      }
    } catch (error) {
      console.error("Update status error:", error);
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
              <span>📢</span>
              Tạo chiến dịch
            </button>
            <button onClick={handleCreateRecall} className="btn btn-primary">
              <span>🚨</span>
              Tạo recall
            </button>
          </div>
        )}
        {(showForm || showDetail) && (
          <button onClick={handleBack} className="btn btn-outline">
            <span>⬅️</span>
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
              <span>📢</span>
              Chiến dịch dịch vụ
            </button>
            <button
              className={`tab-btn ${activeTab === "recalls" ? "active" : ""}`}
              onClick={() => setActiveTab("recalls")}
            >
              <span>🚨</span>
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
