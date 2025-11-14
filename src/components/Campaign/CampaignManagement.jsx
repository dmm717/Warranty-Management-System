import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { Megaphone, AlertTriangle, ArrowLeft } from "lucide-react";
import CampaignList from "./CampaignList";
import CampaignForm from "./CampaignForm";
import CampaignDetail from "./CampaignDetail";
import RecallList from "./RecallList";
import RecallForm from "./RecallForm";
import RecallDetail from "./RecallDetail";
import { serviceCampaignAPI, vehicleAPI, recallAPI, scTechnicianAPI } from "../../services/api";
import "./CampaignManagement.css";
import AssignTechnicianModal from "../AssignTechnicianModal/AssignTechnicianModal";
import { mockTechnicians } from "../Technician/TechnicianManagement";
import { toast } from "react-toastify";

function CampaignManagement() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
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
    // { CampaignsID: "SC001", SC_TechnicianID: "T001" },
    // { CampaignsID: "SC001", SC_TechnicianID: "T002" },
   ]);
  const [vehicles, setVehicles] = useState([]);
  

  useEffect(() => {
    fetchData();
  }, []);

  // Check URL params for auto-opening detail view
  useEffect(() => {
    if (!loading && (campaigns.length > 0 || recalls.length > 0)) {
      const campaignId = searchParams.get('campaignId');
      const recallId = searchParams.get('recallId');
      const view = searchParams.get('view');
      const tab = searchParams.get('tab');

      if (view === 'detail') {
        if (campaignId && campaigns.length > 0) {
          const campaign = campaigns.find(c => c.campaignsId === campaignId || c.CampaignsID === campaignId);
          if (campaign) {
            setSelectedItem(campaign);
            setFormType('campaign');
            setShowDetail(true);
            setActiveTab('campaigns');
          }
        } else if (recallId && recalls.length > 0) {
          const recall = recalls.find(r => r.id === recallId || r.recallId === recallId || r.Recall_ID === recallId);
          if (recall) {
            setSelectedItem(recall);
            setFormType('recall');
            setShowDetail(true);
            setActiveTab('recalls');
          }
        }
      } else if (tab === 'recalls') {
        setActiveTab('recalls');
      }
    }
  }, [loading, campaigns, recalls, searchParams]);

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
        // Fetch detail cho mỗi campaign để có data đầy đủ
        const campaignsWithDetails = await Promise.all(
          campaignsRes.data.content.map(async (campaign) => {
            try {
              const detailRes = await serviceCampaignAPI.getCampaignById(campaign.campaignsId);
              if (detailRes.success && detailRes.data) {
                // Merge list data với detail data
                return {
                  ...campaign,
                  ...detailRes.data,
                  // Override với list data nếu cần
                  campaignsId: campaign.campaignsId,
                  campaignsTypeName: campaign.campaignsTypeName,
                };
              }
            } catch (error) {
              console.warn(`Could not fetch detail for campaign ${campaign.campaignsId}:`, error);
            }
            return campaign; // Fallback to list data
          })
        );

        const transformedCampaigns = campaignsWithDetails.map(
          (campaign) => {
            //console.log("Full campaign object from API:", campaign); // Log toàn bộ object
            return {
            // Backend trả về: campaignsId, campaignsTypeName (from ServiceCampaignsListDTO)
            campaignId: campaign.campaignsId,
            CampaignsID: campaign.campaignsId,
            campaignName: campaign.campaignsTypeName,
            CampaignsTypeName: campaign.campaignsTypeName,
            description: campaign.description,
            Description: campaign.description,
            startDate: campaign.startDate,
            StartDate: campaign.startDate,
            endDate: campaign.endDate,
            EndDate: campaign.endDate,
            status: campaign.status,
            Status: campaign.status,
            requiredParts: campaign.requiredParts,
            
            completedVehicles: campaign.completedVehicles || 0,
            CompletedVehicles: campaign.completedVehicles || 0,
            vehicleTypes: campaign.vehicleTypes || [],
            technicians: campaign.technicians || [],
            vehicleTypeCount: campaign.vehicleTypeCount || 0,
            technicianCount: campaign.technicianCount || 0,
            specialty: campaign.specialty || "",
            };
          }
        );
        setCampaigns(transformedCampaigns);
      } else {
        setCampaigns([]);
      }

      // Fetch recalls from API
      let recallsData = [];

      // Nếu là SC_TECHNICAL, chỉ lấy recalls được assign cho technician này
      if (user?.role === "SC_TECHNICAL" && user?.id) {
        try {
          // Bước 1: Lấy technician info từ userId bằng API mới
          const techResponse = await scTechnicianAPI.getTechnicianByUserId(user.id);
          
          if (techResponse.success && techResponse.data?.id) {
            const technicianId = techResponse.data.id;
            
            // Bước 2: Thử lấy recalls của technician từ API mới
            try {
              const recallsRes = await recallAPI.getRecallsByTechnicianId(technicianId);
              
              if (recallsRes.success && recallsRes.data) {
                recallsData = Array.isArray(recallsRes.data) ? recallsRes.data : [];
              } else {
                // API không success hoặc data rỗng -> fallback
                throw new Error("API returned no data");
              }
            } catch (apiError) {
                console.warn("⚠️ API /technicians/{id}/recalls lỗi, fallback về filter...", apiError);
              
              // Fallback: Lấy tất cả recalls rồi filter
              const allRecallsRes = await recallAPI.getAllRecalls({
                page: 0,
                size: 100,
                sortBy: "startDate",
                sortDir: "desc",
              });
              
              if (allRecallsRes.success && allRecallsRes.data?.content) {
                // Fetch detail cho từng recall để lấy technicianBasicDTOS
                const recallsWithDetails = await Promise.all(
                  allRecallsRes.data.content.map(async (recall) => {
                    try {
                      const detailRes = await recallAPI.getRecallById(recall.id);
                      return detailRes.data;
                    } catch (err) {
                      console.error(`Error fetching recall ${recall.id}:`, err);
                      return recall;
                    }
                  })
                );
                // Filter recalls có technicianId
                recallsData = recallsWithDetails.filter(recall => 
                  recall.technicianBasicDTOS?.some(tech => tech.id === technicianId)
                );
              }
            }
          } else {
            console.warn("⚠️ No technician found for userId:", user.id);
          }
        } catch (err) {
          console.error("❌ Error fetching recalls for SC_TECHNICAL:", err);
        }
      } else {
        // Các role khác: lấy tất cả recalls
        const recallsRes = await recallAPI.getAllRecalls({
          page: 0,
          size: 100,
          sortBy: "startDate",
          sortDir: "desc",
        });
        
        if (recallsRes.success && recallsRes.data) {
          recallsData = recallsRes.data.content || [];
        }
      }

      // Transform data
      if (recallsData.length > 0) {
        const transformedRecalls = recallsData.map((recall) => {
          // Prefer detailed DTOs if backend returns them (matches swagger example)
          const vehicleTypeInfo = recall.vehicleTypeInfoDTOS || recall.vehicleTypes || [];
          const vehicleBasicInfo = recall.vehicleBasicInfoDTOS || recall.vehicles || [];
          const technicianBasic = recall.technicianBasicDTOS || recall.technicians || [];

          // Prepare display-friendly arrays (names instead of raw foreign keys)
          let VehicleModels = [];
          let VehicleModelIds = [];

          if (Array.isArray(vehicleTypeInfo) && vehicleTypeInfo.length) {
            VehicleModels = vehicleTypeInfo.map((vt) => vt.modelName || vt.name || vt.id);
            VehicleModelIds = vehicleTypeInfo.map((vt) => vt.id).filter(Boolean);
          } else if (typeof recall.vehicleTypeCount === "number" && recall.vehicleTypeCount > 0) {
            // Backend list may only return a count of vehicle types — show a friendly label
            VehicleModels = [`${recall.vehicleTypeCount} loại`];
          } else if (Array.isArray(recall.VehicleModels) && recall.VehicleModels.length) {
            VehicleModels = recall.VehicleModels;
          }

          const VehicleNames = Array.isArray(vehicleBasicInfo)
            ? vehicleBasicInfo.map((v) => v.vehicleName || v.vehicleId || v.model)
            : [];

          const TechnicianNames = Array.isArray(technicianBasic)
            ? technicianBasic.map((t) => t.name || t.id)
            : [];

          // Additional fields for scope display (may be absent in list response)
          const ProductionYears = recall.productionYears || recall.ProductionYears || [];
          const Regions = recall.regions || recall.Regions || [];
          const VehicleCount = recall.vehicleCount || recall.VehicleCount || recall.vehicleCount || 0;
          const TechnicianCount = recall.technicianCount || recall.TechnicianCount || 0;

          return {
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
            // keep raw DTOs available for detail views
            vehicleTypeInfoDTOS: vehicleTypeInfo,
            vehicleBasicInfoDTOS: vehicleBasicInfo,
            technicianBasicDTOS: technicianBasic,
            // UI-friendly fields
            VehicleModels,
            VehicleModelIds,
            VehicleNames,
            TechnicianNames,
            ProductionYears,
            Regions,
            VehicleCount,
            TechnicianCount,
            reports: recall.reports || [],
          };
        });

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

  const handleEdit = async (item, type) => {
    // Normalize recall object shape before opening edit form so fields populate
    if (type === "recall" && item) {
      // Always fetch full recall detail to ensure Edit form is fully prefilling
      // (this guarantees fields like `specialty` are available).
      let full = item;
      try {
        setLoading(true);
        const recallId = item.id || item.Recall_ID;
        if (recallId) {
          const detailRes = await recallAPI.getRecallById(recallId);
          if (detailRes && detailRes.success && detailRes.data) {
            full = detailRes.data;
          } else {
            console.warn("handleEdit: recall detail API returned no data or error", detailRes);
          }
        }
      } catch (err) {
        console.warn("Could not fetch recall detail, using summary item", err);
      } finally {
        setLoading(false);
      }

      const normalized = {
        ...full,
        id: item.id || item.Recall_ID || item.id || null,
        Recall_ID: item.Recall_ID || item.id || item.Recall_ID || null,
        name: full.name || full.RecallName || full.name || "",
        RecallName: full.RecallName || full.name || full.RecallName || "",
        issueDescription: full.issueDescription || full.IssueDescription || full.description || "",
        IssueDescription: full.IssueDescription || full.issueDescription || full.description || "",
        startDate: full.startDate || full.StartDate || full.startDate || "",
        StartDate: full.StartDate || full.startDate || full.StartDate || "",
        requiredAction: full.requiredAction || full.RequiredAction || "",
        partsRequired: full.partsRequired || full.PartsRequired || "",
        status: full.status || full.Status || "",
        notificationSent: full.notificationSent ?? full.NotificationSent ?? false,
        evmApprovalStatus: full.evmApprovalStatus || full.EvmApprovalStatus || "WAITING",
        // vehicleTypeIds should be an array of ids (for form selection). Backend may supply:
        // - vehicleTypeIds (ids)
        // - VehicleModelIds (we created during transform)
        // - vehicleTypes (array of objects)
        // - VehicleModels (might be names) -> not usable for ids
        vehicleTypeIds:
          full.vehicleTypeIds ||
          full.VehicleModelIds ||
          (full.vehicleTypeInfoDTOS ? full.vehicleTypeInfoDTOS.map((v) => v.id) : null) ||
          (full.vehicleTypes ? full.vehicleTypes.map((v) => v.id) : []) ||
          [],
        // Keep VehicleModels as display names if available (used by lists)
        VehicleModels: full.VehicleModels || (full.vehicleTypeInfoDTOS ? full.vehicleTypeInfoDTOS.map(v => v.modelName || v.name || v.id) : []),
        // technicianIds prefer ids from technicianBasicDTOS or technicians
        technicianIds: full.technicianIds || (full.technicianBasicDTOS ? full.technicianBasicDTOS.map(t => t.id) : full.technicians || []),
        // vehicleId: prefer vehicleBasicInfoDTOS vehicleId values if present
        vehicleId: full.vehicleId || (full.vehicleBasicInfoDTOS ? full.vehicleBasicInfoDTOS.map(v => v.vehicleId || v.VIN) : full.VIN ? [full.VIN] : []),
      };

      // normalized object prepared for edit form

      setSelectedItem(normalized);
    } else if (type === "campaign" && item) {
      // Always fetch full campaign detail to ensure Edit form is fully prefilling
      let full = item;
      try {
        setLoading(true);
        const campaignId = item.campaignId || item.CampaignsID;
        if (campaignId) {
          const detailRes = await serviceCampaignAPI.getCampaignById(campaignId);
          if (detailRes && detailRes.success && detailRes.data) {
            full = detailRes.data;
          } else {
            console.warn("handleEdit: campaign detail API returned no data or error", detailRes);
          }
        }
      } catch (err) {
        console.warn("Could not fetch campaign detail, using summary item", err);
      } finally {
        setLoading(false);
      }

      const normalized = {
        ...full,
        campaignId: item.campaignId || item.CampaignsID,
        CampaignsID: item.campaignId || item.CampaignsID,
        CampaignsTypeName: full.campaignsTypeName || full.typeName || full.CampaignsTypeName || "",
        StartDate: full.startDate || full.StartDate || "",
        EndDate: full.endDate || full.EndDate || "",
        RequiredParts: full.requiredParts || full.RequiredParts || "",
        Description: full.description || full.Description || "",
        Status: full.status || full.Status || "PLANNED",
        CompletedVehicles: full.completedVehicles || full.CompletedVehicles || 0,
        YearScope: full.yearScope || full.YearScope || "",
        // vehicleTypeIds should be an array of ids (for form selection)
        vehicleTypeIds: full.vehicleTypeIds || full.vehicleTypes || [],
        technicianIds: full.technicianIds || full.technicians || [],
        specialty: full.specialty || "",
      };

      setSelectedItem(normalized);
    } else {
      setSelectedItem(item);
    }
    setFormType(type);
    setShowForm(true);
    setShowDetail(false);
  };

  const handleViewDetail = (item, type) => {
    setSelectedItem(item);
    setFormType(type);
    setShowDetail(true);
    setShowForm(false);
    console.log("Viewing detail for item:", item);
    console.log("Item type:", campaigns);
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
          specialty: itemData.specialty || "",
          

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
        // Recall logic - now uses backend API
        if (selectedItem) {
          // Edit existing recall - backend API call is handled by RecallForm
          // Reload data from backend to ensure consistency
          await fetchData();
          toast.success("Cập nhật Recall thành công!");
        } else {
          // Create new recall
          const newRecall = {
            // keep raw item data
            ...itemData,
            // ensure a stable id/code
            Recall_ID: `RC${String((recalls || []).length + 1).padStart(3, "0")}`,
            id: itemData.id || null,
            // normalized fields used by RecallList
            RecallName: itemData.name || itemData.RecallName || "",
            name: itemData.name || itemData.RecallName || "",
            IssueDescription: itemData.issueDescription || itemData.IssueDescription || "",
            StartDate: itemData.startDate || itemData.StartDate || new Date().toISOString(),
            startDate: itemData.startDate || itemData.StartDate || new Date().toISOString(),
            Status: "Pending", // EVM_ADMIN creates with Pending status
            NotificationSent: itemData.notificationSent ?? 0,
            CompletedVehicles: 0,
            AffectedVehicles: 0,
            CreatedDate: new Date().toISOString(),
            CreatedBy: user?.role || "EVM_ADMIN",
            // VehicleModels is what RecallList expects (array of ids)
            VehicleModels: itemData.vehicleTypeIds || itemData.VehicleModels || [],
            vehicleTypes: itemData.vehicleTypes || [],
          };

          // Prepend the new recall but ensure it's in the same shape as fetched recalls
          setRecalls((prev) => [newRecall, ...(prev || [])]);
          toast.success(
            "Tạo Recall thành công! EVM_STAFF sẽ nhận được thông báo."
          );

          // Reload data to ensure consistency
          await fetchData();
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
      {error && (
        <div className="alert alert-danger" style={{ margin: '12px 0' }}>
          {error}
        </div>
      )}
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
              userId={user?.id} // Sửa từ userId thành id
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
