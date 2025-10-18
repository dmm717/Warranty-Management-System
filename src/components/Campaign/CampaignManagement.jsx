import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import CampaignList from "./CampaignList";
import CampaignForm from "./CampaignForm";
import CampaignDetail from "./CampaignDetail";
import RecallList from "./RecallList";
import RecallForm from "./RecallForm";
import "./CampaignManagement.css";
import AssignTechnicianModal from "../AssignTechnicianModal/AssignTechnicianModal";
import { mockTechnicians } from "../Technician/TechnicianManagement";

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [assignments, setAssignments] = useState([
    { CampaignsID: "SC001", SC_TechnicianID: "T001" },
    { CampaignsID: "SC001", SC_TechnicianID: "T002" },
  ]);
  const [vehicles, setVehicles] = useState([]);
  const [recallVehicleMap, setRecallVehicleMap] = useState([]); // 🟡 Mảng mapping recall-vehicle

  useEffect(() => {
    // TODO: Replace with real API calls
    const fetchData = async () => {
      setLoading(true);
      try {
        // const campaignsRes = await fetch('/api/campaigns');
        // const campaignsData = await campaignsRes.json();
        // setCampaigns(campaignsData);
        // const recallsRes = await fetch('/api/recalls');
        // const recallsData = await recallsRes.json();
        // setRecalls(recallsData);
        // const vehiclesRes = await fetch('/api/vehicles');
        // const vehiclesData = await vehiclesRes.json();
        // setVehicles(vehiclesData);
        setCampaigns([]);
        setRecalls([]);
        setVehicles([]);
      } catch (error) {
        console.error("Fetch campaign/recall/vehicle error:", error);
        setCampaigns([]);
        setRecalls([]);
        setVehicles([]);
      }
      setLoading(false);
    }, 1000);
  }, []);

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
      { CampaignsID: campaignId, SC_TechnicianID: techId }
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

  const handleSave = (itemData) => {
    if (formType === "campaign") {
      if (selectedItem) {
        const updatedCampaigns = campaigns.map((c) =>
          c.CampaignsID === selectedItem.CampaignsID ? { ...c, ...itemData } : c
        );
        setCampaigns(updatedCampaigns);
      } else {
        const newCampaign = {
          ...itemData,
          CampaignsID: `SC${String(campaigns.length + 1).padStart(3, "0")}`,
          NotificationSent: 0,
          AffectedVehicles: 0,
          CompletedVehicles: 0,
        };
        setCampaigns([...campaigns, newCampaign]);
      }
    } else {
      if (selectedItem) {
        const updatedRecalls = recalls.map((r) =>
          r.Recall_ID === selectedItem.Recall_ID ? { ...r, ...itemData } : r
        );
        setRecalls(updatedRecalls);
      } else {
        const newRecall = {
          ...itemData,
          Recall_ID: `RC${String(recalls.length + 1).padStart(3, "0")}`,
          NotificationSent: 0,
          EVMApprovalStatus: "Chờ phê duyệt",
          AffectedVehicles:  itemData.selectedVehicles?.length || 0,
          CompletedVehicles: 0,
        };
        // 🟡 Tạo mapping recall-vehicle
        const newMappings = (itemData.selectedVehicles || []).map(vId => ({
        Recall_ID: newRecall.Recall_ID,
        Vehicle_ID: vId,
          })
        );
        setRecallVehicleMap(prev => [...prev, ...newMappings]);
        console.log("✅ Recall mới tạo:", newRecall);
        console.log("🔗 Recall-Vehicle Mapping:", recallVehicleMap);

        setRecalls([...recalls, newRecall]);
      }
    }
    setShowForm(false);
    setSelectedItem(null);
  };

  const handleUpdateStatus = (itemId, newStatus, type) => {
    if (type === "campaign") {
      setCampaigns(
        campaigns.map((c) =>
          c.CampaignsID === itemId ? { ...c, Status: newStatus } : c
        )
      );
    } else {
      setRecalls(
        recalls.map((r) =>
          r.Recall_ID === itemId ? { ...r, Status: newStatus } : r
        )
      );
    }
  };

  const handleBack = () => {
    setShowForm(false);
    setShowDetail(false);
    setSelectedItem(null);
  };

  const canCreateEdit = () => {
    return user?.role === "EVM_Staff" || user?.role === "Admin";
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