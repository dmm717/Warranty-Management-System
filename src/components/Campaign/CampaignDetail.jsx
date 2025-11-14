import React, { useState, useEffect } from "react";
import "../../styles/CampaignDetail.css";
import notificationService from "../../services/NotificationService";
import vehicleDistributionService from "../../services/VehicleDistributionService";
import appointmentSchedulingService from "../../services/AppointmentSchedulingService";
import workAssignmentService from "../../services/WorkAssignmentService";
import campaignResultTrackingService from "../../services/CampaignResultTrackingService";
import rolePermissionService from "../../services/RolePermissionService";
import serviceCampaignsService from "../../services/ServiceCampaignService";
import { useAuth } from "../../contexts/AuthContext";
import {
  Mail,
  Wrench,
  Users,
  Megaphone,
  Calendar,
  Settings,
  AlertTriangle,
  BarChart3,
  X,
  Loader,
  Check,
  FileText,
  Car,
  User,
  Clock,
  Edit,
  RefreshCw
} from "lucide-react";
import { TECHNICIAN_SPECIALTIES } from "../../constants";
import { scTechnicianAPI, emailAPI, vehicleAPI } from "../../services/api";
import { toast } from "react-toastify";

function CampaignDetail({ item, type, onEdit, onUpdateStatus, userRole }) {
  const { user } = useAuth();
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState("");

  const [isProcessing, setIsProcessing] = useState(false);
  const [processLog, setProcessLog] = useState([]);
  const [showAssignTechModal, setShowAssignTechModal] = useState(false);
  const [availableTechnicians, setAvailableTechnicians] = useState([]);
  const [loadingTechnicians, setLoadingTechnicians] = useState(false);

  const [showContactModal, setShowContactModal] = useState(false);
  const [contactData, setContactData] = useState({
    campaignName: "",
    recipients: [],
    subject: "",
    title: "",
    body: "",
    date: "",
    html: true, // Always true for HTML emails
  });
  const [loadingVehicles, setLoadingVehicles] = useState(false);

  const [assignedTechnicians, setAssignedTechnicians] = useState([]);
  const [vehicleCount, setVehicleCount] = useState(0);

  // Get current user role from context or props
  const currentUserRole = user?.role || userRole;

  // Load assigned technicians and vehicle count when component mounts or item changes
  useEffect(() => {
    loadAssignedTechnicians();
    loadVehicleCount();
  }, [item]);

  if (!item) return null;

  const isRecall = type === "recall";


  const getStatusBadge = (status) => {
    const statusClasses = {
      "Chuẩn bị": "status-preparing",
      "Đang triển khai": "status-active",
      "Đang thực hiện": "status-active",
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

  const getApprovalBadge = (approvalStatus) => {
    const approvalClasses = {
      "Chờ phê duyệt": "approval-pending",
      "Đã phê duyệt": "approval-approved",
      "Từ chối": "approval-rejected",
    };

    return (
      <span
        className={`approval-badge ${approvalClasses[approvalStatus] || "approval-pending"
          }`}
      >
        {approvalStatus}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getProgressPercentage = () => {
    const completed = item.CompletedVehicles || 0;
    const total = item.vehicleTypeCount || item.vehicleTypes?.length || 1;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const canUpdateStatus = () => {
    return rolePermissionService.canUpdateRecall(currentUserRole);
  };

  const getAvailableStatuses = () => {
    if (isRecall && item.EVMApprovalStatus !== "Đã phê duyệt") return [];

    const statusFlow = {
      "Chuẩn bị": isRecall
        ? ["Đang thực hiện", "Hủy bỏ"]
        : ["Đang triển khai", "Hủy bỏ"],
      "Đang triển khai": ["Tạm dừng", "Hoàn thành"],
      "Đang thực hiện": ["Tạm dừng", "Hoàn thành"],
      "Tạm dừng": isRecall
        ? ["Đang thực hiện", "Hủy bỏ"]
        : ["Đang triển khai", "Hủy bỏ"],
      "Hoàn thành": [],
      "Hủy bỏ": [],
    };
    return statusFlow[item.Status] || [];
  };

  const handleStatusUpdate = () => {
    if (newStatus && newStatus !== item.Status) {
      onUpdateStatus(
        isRecall ? item.Recall_ID : item.CampaignsID,
        newStatus,
        type
      );
      setShowStatusModal(false);
      setNewStatus("");
    }
  };

  // Mock timeline data
  const getTimeline = () => {
    const baseTimeline = [
      {
        status: "Tạo " + (isRecall ? "recall" : "chiến dịch"),
        date: item.StartDate,
        description: isRecall
          ? "Recall được tạo và chờ phê duyệt"
          : "Chiến dịch được lên kế hoạch",
        user: "EVM Staff",
        active: true,
      },
    ];

    if (isRecall) {
      baseTimeline.push({
        status: "Phê duyệt",
        date: item.EVMApprovalStatus === "Đã phê duyệt" ? item.StartDate : null,
        description: "EVM phê duyệt thực hiện recall",
        user: "EVM Management",
        active: item.EVMApprovalStatus === "Đã phê duyệt",
      });
    }

    baseTimeline.push(
      {
        status: "Triển khai",
        date: [
          "Đang triển khai",
          "Đang thực hiện",
          "Tạm dừng",
          "Hoàn thành",
        ].includes(item.Status)
          ? item.StartDate
          : null,
        description: isRecall
          ? "Bắt đầu thực hiện recall"
          : "Bắt đầu triển khai chiến dịch",
        user: "SC Team",
        active: [
          "Đang triển khai",
          "Đang thực hiện",
          "Tạm dừng",
          "Hoàn thành",
        ].includes(item.Status),
      },
      {
        status: "Hoàn thành",
        date: item.Status === "Hoàn thành" ? item.EndDate : null,
        description: isRecall ? "Recall hoàn tất" : "Chiến dịch kết thúc",
        user: "SC Team",
        active: item.Status === "Hoàn thành",
      }
    );

    return baseTimeline;
  };

  const timeline = getTimeline();

  // 🔧 Handler functions for new services với kiểm tra quyền
  const handleSendNotification = async () => {
    // Kiểm tra quyền trước khi thực hiện
    const validation = rolePermissionService.validateAction(
      currentUserRole,
      "notify_campaign_to_sc",
      "gửi thông báo chiến dịch"
    );

    if (!validation.allowed) {
      setProcessLog((prev) => [...prev, `❌ ${validation.error}`]);
      return;
    }

    setIsProcessing(true);
    try {
      // Log action cho audit trail
      rolePermissionService.logAction(
        currentUserRole,
        user?.id,
        "notify_campaign_to_sc",
        isRecall ? item.Recall_ID : item.CampaignsID,
        { type: isRecall ? "recall" : "campaign" }
      );

      const result = await notificationService.sendCampaignNotification(
        isRecall ? item.Recall_ID : item.CampaignsID,
        {
          type: isRecall ? "recall" : "campaign",
          title: isRecall ? item.RecallName : item.CampaignsTypeName,
          description: isRecall ? item.IssueDescription : item.Description,
          urgency: isRecall ? "high" : "medium",
          requiredAction: isRecall
            ? item.RequiredAction
            : "Thực hiện theo hướng dẫn",
        }
      );

      if (result.success) {
        setProcessLog((prev) => [
          ...prev,
          `✅ Đã gửi thông báo đến ${result.notificationsSent} trung tâm`,
        ]);
      } else {
        setProcessLog((prev) => [
          ...prev,
          `❌ Lỗi gửi thông báo: ${result.error}`,
        ]);
      }
    } catch (error) {
      setProcessLog((prev) => [...prev, `❌ Lỗi: ${error.message}`]);
    }
    setIsProcessing(false);
  };

  const handleUrgentNotification = async () => {
    // Kiểm tra quyền gửi thông báo khẩn cấp
    const validation = rolePermissionService.validateAction(
      currentUserRole,
      "notify_campaign_to_sc",
      "gửi thông báo khẩn cấp"
    );

    if (!validation.allowed) {
      setProcessLog((prev) => [...prev, `❌ ${validation.error}`]);
      return;
    }

    setIsProcessing(true);
    try {
      rolePermissionService.logAction(
        currentUserRole,
        user?.id,
        "send_urgent_notification",
        item.Recall_ID,
        { type: "urgent_recall" }
      );

      const result = await notificationService.sendUrgentRecallNotification(
        item.Recall_ID,
        {
          severity: "critical",
          issueType: "safety",
          immediateAction: item.RequiredAction,
          description: item.IssueDescription,
          deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        }
      );

      if (result.success) {
        setProcessLog((prev) => [
          ...prev,
          `🚨 Đã gửi thông báo khẩn cấp đến ${result.notificationsSent} trung tâm`,
        ]);
      } else {
        setProcessLog((prev) => [
          ...prev,
          `❌ Lỗi gửi thông báo khẩn cấp: ${result.error}`,
        ]);
      }
    } catch (error) {
      setProcessLog((prev) => [...prev, `❌ Lỗi: ${error.message}`]);
    }
    setIsProcessing(false);
  };

  const handleStartWorkflow = async () => {
    // Kiểm tra quyền phân bổ xe (chỉ EVM Staff và Admin)
    const validation = rolePermissionService.validateAction(
      currentUserRole,
      "distribute_vehicles_to_centers",
      "khởi động quy trình workflow"
    );

    if (!validation.allowed) {
      setProcessLog((prev) => [...prev, `❌ ${validation.error}`]);
      return;
    }

    setIsProcessing(true);
    setProcessLog([]);

    try {
      const campaignId = isRecall ? item.Recall_ID : item.CampaignsID;

      rolePermissionService.logAction(
        currentUserRole,
        user?.id,
        "start_campaign_workflow",
        campaignId,
        { type: isRecall ? "recall" : "campaign" }
      );

      // Step 1: Distribute vehicles to service centers (cần quyền distribute_vehicles_to_centers)
      setProcessLog((prev) => [
        ...prev,
        "📍 Đang phân bổ xe đến các trung tâm dịch vụ...",
      ]);
      const distributionResult =
        await vehicleDistributionService.distributeVehiclesToCenters(
          campaignId,
          [], // Empty array since we don't load vehicles anymore
          { method: "geographic" }
        );

      if (!distributionResult.success) {
        throw new Error(distributionResult.error);
      }

      setProcessLog((prev) => [
        ...prev,
        `✅ Đã phân bổ xe đến ${distributionResult.distributions.length} trung tâm`,
      ]);

      // Step 3: Create appointment schedule
      setProcessLog((prev) => [...prev, "📅 Đang tạo lịch hẹn..."]);
      const scheduleResult =
        await appointmentSchedulingService.createCampaignSchedule(
          campaignId,
          distributionResult,
          isRecall ? "recall" : "campaign"
        );

      if (!scheduleResult.success) {
        throw new Error(scheduleResult.error);
      }

      setProcessLog((prev) => [
        ...prev,
        `✅ Đã tạo lịch hẹn cho ${scheduleResult.centerSchedules.length} trung tâm`,
      ]);

      // Step 4: Create work assignments (auto-assign, SC sẽ confirm sau)
      setProcessLog((prev) => [
        ...prev,
        "👥 Đang tạo khung phân công công việc...",
      ]);
      const assignmentResult =
        await workAssignmentService.createCampaignWorkAssignments(
          campaignId,
          scheduleResult,
          isRecall ? "recall" : "campaign"
        );

      if (!assignmentResult.success) {
        throw new Error(assignmentResult.error);
      }

      setProcessLog((prev) => [
        ...prev,
        `✅ Đã tạo ${assignmentResult.summary.totalWorkOrders} work order cho ${assignmentResult.summary.totalTechnicians} kỹ thuật viên`,
      ]);

      // Step 5: Initialize result tracking
      setProcessLog((prev) => [
        ...prev,
        "📊 Đang khởi tạo theo dõi kết quả...",
      ]);
      const trackingResult =
        await campaignResultTrackingService.initializeCampaignTracking(
          campaignId,
          assignmentResult,
          scheduleResult
        );

      if (!trackingResult.success) {
        throw new Error(trackingResult.error);
      }

      setProcessLog((prev) => [
        ...prev,
        `✅ Đã khởi tạo theo dõi cho ${trackingResult.centerResults.length} trung tâm`,
      ]);

      // workflow data updated (internal)

      setProcessLog((prev) => [
        ...prev,
        "🎉 Quy trình chiến dịch đã được khởi động thành công!",
      ]);
      setProcessLog((prev) => [
        ...prev,
        "ℹ️ Service Center sẽ xác nhận lịch hẹn và phân công cụ thể",
      ]);
    } catch (error) {
      setProcessLog((prev) => [
        ...prev,
        `❌ Lỗi trong quy trình: ${error.message}`,
      ]);
    }

    setIsProcessing(false);
  };

  // Technician assignment handlers
  const handleOpenAssignTechModal = async () => {
    setLoadingTechnicians(true);
    try {
      let technicians = [];

      // SC_ADMIN chỉ được gán kỹ thuật viên cùng chi nhánh
      // If user is SC_ADMIN, only show technicians from the same branch office
      if (currentUserRole === "SC_ADMIN" && user?.branchOffice) {
        console.log("🔍 SC_ADMIN detected, filtering technicians by branch:", user.branchOffice);
        const response = await scTechnicianAPI.getTechniciansByBranch(user.branchOffice, { size: 100 });
        technicians = response.data.content || response.data || [];
        console.log(`✅ Found ${technicians.length} technicians in branch ${user.branchOffice}`);
      } else {
        // For other roles (EVM_ADMIN, EVM_STAFF), show all technicians
        console.log("👥 Loading all technicians for non-SC_ADMIN user");
        const response = await scTechnicianAPI.getAllTechnicians({ size: 100 });
        technicians = response.data.content || response.data || [];
        console.log(`✅ Found ${technicians.length} technicians total`);
      }

      // Filter out already assigned technicians
      const alreadyAssignedIds = assignedTechnicians.map(tech => tech.id || tech.scTechId);
      technicians = technicians.filter(tech => !alreadyAssignedIds.includes(tech.id || tech.scTechId));

      setAvailableTechnicians(technicians);
    } catch (error) {
      console.error("Error fetching technicians:", error);
      // Fallback to empty array or show error
      setAvailableTechnicians([]);
    } finally {
      setLoadingTechnicians(false);
    }
    setShowAssignTechModal(true);
  };

  const handleAssignTechnician = async (technicianId) => {
    try {
      setIsProcessing(true);

      // Call API to assign technician
      const campaignId = item.CampaignsID || item.id;
      const result = await serviceCampaignsService.addTechnician(campaignId, technicianId);

      if (result.success) {
        // Update assigned technicians list immediately
        const assignedTech = availableTechnicians.find(tech => (tech.id || tech.scTechId) === technicianId);
        if (assignedTech) {
          setAssignedTechnicians(prev => [...prev, assignedTech]);
        }

        // Close modal and show success message
        setShowAssignTechModal(false);
        setAvailableTechnicians([]);

        // Show success notification
        toast.success("Kỹ thuật viên đã được gán thành công!", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });

        // You might want to refresh the campaign data here
        // onUpdateStatus(campaignId, item.Status, type); // or similar refresh function
      } else {
        toast.error(`Lỗi: ${result.message}`, {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      }
    } catch (error) {
      console.error("Error assigning technician:", error);
      toast.error("Có lỗi xảy ra khi gán kỹ thuật viên. Vui lòng thử lại.", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Bulk assign technicians using assignTechnicians API with console logging
  const handleBulkAssignTechnicians = async (technicianIds) => {
    // Validate permissions before proceeding
    if (!rolePermissionService.canAssignWorkToTechnician(currentUserRole)) {
      console.error("❌ Permission denied: User does not have permission to assign technicians");
      toast.error("Bạn không có quyền gán kỹ thuật viên cho chiến dịch này.", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      return;
    }

    console.log("✅ Permission validated successfully");
    console.log("🚀 Bắt đầu gán nhiều kỹ thuật viên...");
    console.log("📋 Campaign ID:", item.CampaignsID || item.id);
    console.log("👥 Danh sách technician IDs:", technicianIds);
    console.log("🏢 User branch office:", user?.branchOffice || "N/A");
    console.log("👤 User role:", currentUserRole);

    try {
      setIsProcessing(true);

      const campaignId = item.CampaignsID || item.id;
      const result = await serviceCampaignsService.assignTechnicians(campaignId, technicianIds);

      console.log("📡 API Response:", result);

      if (result.success) {
        console.log("✅ Gán kỹ thuật viên thành công!");
        console.log("📊 Response data:", result.data);

        // Update assigned technicians list immediately
        const assignedTechs = availableTechnicians.filter(tech => technicianIds.includes(tech.id || tech.scTechId));
        setAssignedTechnicians(prev => [...prev, ...assignedTechs]);

        // Close modal and show success message
        setShowAssignTechModal(false);
        setAvailableTechnicians([]);

        toast.success(`Đã gán ${technicianIds.length} kỹ thuật viên thành công!`, {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      } else {
        console.error("❌ Lỗi từ API:", result.message);
        toast.error(`Lỗi: ${result.message}`, {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      }
    } catch (error) {
      console.error("💥 Lỗi exception khi gán kỹ thuật viên:", error);
      console.error("🔍 Error details:", error.response?.data || error.message);
      toast.error("Có lỗi xảy ra khi gán kỹ thuật viên. Vui lòng thử lại.", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } finally {
      setIsProcessing(false);
      console.log("🏁 Hoàn thành xử lý bulk assign technicians");
    }
  };

  // Contact customer handlers
  const handleOpenContactModal = async () => {
    // Pre-fill basic data without auto-fetching emails
    setContactData({
      campaignName: isRecall ? item.RecallName : item.CampaignsTypeName,
      recipients: [],
      subject: `VinFast Special Service Offer - ${isRecall ? item.RecallName : item.CampaignsTypeName}`,
      title: `VinFast Special Service Offer`,
      body: `Dear Valued Customer,

We have a special service offer for your ${isRecall ? item.RecallName : item.CampaignsTypeName}.

Please contact us for more details.

Best regards,
VinFast Service Team`,
      date: formatDate(new Date().toISOString()),
      html: true,
    });
    setShowContactModal(true);
  };

  const handleAutoAssignEmails = async () => {
    setLoadingVehicles(true);
    try {
      // Get campaign vehicle types
      const vehicleTypes = item.vehicleTypeInfoDTOS || item.vehicleTypes || [];
      const vehicleTypeIds = vehicleTypes.map(vt => vt.id || vt.vehicleTypeId);

      // Fetch all vehicles and filter by matching types
      const vehiclesResponse = await vehicleAPI.getAllVehicles({ size: 1000 }); // Large size to get all
      const allVehicles = vehiclesResponse.data.content || vehiclesResponse.data || [];

      // Filter vehicles that match campaign's vehicle types
      const matchingVehicles = allVehicles.filter(vehicle =>
        vehicleTypeIds.includes(vehicle.electricVehicleTypeId || vehicle.vehicleTypeId)
      );

      // Extract unique emails
      const emails = [...new Set(matchingVehicles.map(vehicle => vehicle.email).filter(email => email))];

      // Update recipients
      setContactData(prev => ({
        ...prev,
        recipients: emails
      }));
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      toast.error("Có lỗi khi tải danh sách email khách hàng.", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } finally {
      setLoadingVehicles(false);
    }
  };

  const handleSendContactEmail = async () => {
    if (!contactData.subject || !contactData.title || !contactData.body || !contactData.date || contactData.recipients.length === 0) {
      toast.error("Vui lòng điền đầy đủ thông tin email.", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      return;
    }

    setIsProcessing(true);
    try {
      // Generate HTML content from title, body, and date
      const htmlContent = `<h1>${contactData.title}</h1><p>${contactData.body.replace(/\n/g, '<br>')}</p><p>${contactData.date}</p>`;

      // console.log("Sending email data:", contactData);
      const result = await emailAPI.sendCustomerEmail({ ...contactData, content: htmlContent });
      // console.log("Email send result:", result);
      if (result.success) {
        toast.success("Email đã được gửi thành công!", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        setShowContactModal(false);
        setContactData({
          campaignName: "",
          recipients: [],
          subject: "",
          title: "",
          body: "",
          date: "",
          html: true,
        });
      } else {
        toast.error(`Lỗi gửi email: ${result.message}`, {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      }
    } catch (error) {
      console.error("Error sending email:", error);
      toast.error("Có lỗi xảy ra khi gửi email. Vui lòng thử lại.", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddRecipient = (email) => {
    if (email && !contactData.recipients.includes(email)) {
      setContactData(prev => ({
        ...prev,
        recipients: [...prev.recipients, email]
      }));
    }
  };

  const handleRemoveRecipient = (email) => {
    setContactData(prev => ({
      ...prev,
      recipients: prev.recipients.filter(r => r !== email)
    }));
  };

  // Load assigned technicians
  const loadAssignedTechnicians = () => {
    setAssignedTechnicians(item?.technicians || []);
  };

  // Load vehicle count for this campaign
  const loadVehicleCount = async () => {
    try {
      // console.log(`🔍 Đang đếm xe cho campaign ID: ${item.CampaignsID}`);

      // Fetch tất cả vehicles với size lớn để lấy hết
      const response = await vehicleAPI.getAllVehicles({ page: 0, size: 10000 }); // Size lớn để lấy tất cả
      const vehicles = response.data?.content || response.data || [];

      // console.log(`📊 Tổng số xe từ API: ${vehicles.length}`);
      // console.log('🚗 Danh sách xe:', vehicles.slice(0, 5)); // Log 5 xe đầu tiên để check structure

      // Đếm số xe có vision == campaignId
      const matchingVehicles = vehicles.filter(vehicle => vehicle.vision == item.CampaignsID);
      const count = matchingVehicles.length;

      // console.log(`✅ Số xe có vision == ${item.CampaignsID}: ${count}`);
      // console.log('🎯 Xe phù hợp:', matchingVehicles);

      setVehicleCount(count);

      // console.log(`💾 Đã cập nhật vehicleCount: ${count}`);

      return count;
    } catch (error) {
      console.error('❌ Lỗi khi đếm xe:', error);
      setVehicleCount(0);
      return 0;
    }
  };

  return (
    <>
      <div className="campaign-detail">
        <div className="detail-header">
          <div className="item-basic-info">
            <h2>
              {isRecall
                ? `Recall #${item.Recall_ID}`
                : `Chiến dịch #${item.CampaignsTypeName}`}
            </h2>
            <div className="campaign-id-display">
              <span className="campaign-id-label">Mã chiến dịch:</span>
              <span className="campaign-id-value">{item.CampaignsID}</span>
            </div>
            
            <div className="item-meta">
              {getStatusBadge(item.Status)}
              {isRecall && getApprovalBadge(item.EVMApprovalStatus)}
              <span className="item-date start-date">
                Bắt đầu: {formatDate(item.StartDate)}
              </span>
              {!isRecall && item.EndDate && (
                <span className="item-date ">
                  <div className="end-date" >
                  Kết thúc: {formatDate(item.EndDate)}
                  </div>
                </span>
              )}
            </div>
          </div>
          <div className="detail-actions">
            {rolePermissionService.canUpdateRecall(currentUserRole) && (
              <button
                onClick={() => onEdit(item, type)}
                className="btn btn-outline"
              >
                <Edit size={16} />
                Chỉnh sửa
              </button>
            )}
            {canUpdateStatus() && getAvailableStatuses().length > 0 && (
              <button
                onClick={() => setShowStatusModal(true)}
                className="btn btn-primary"
              >
                <RefreshCw size={16} />
                Cập nhật trạng thái
              </button>
            )}
          </div>
        </div>

        <div className="detail-content">
          <div className="detail-row">
            <div className="detail-col-8">
              <div className="info-sections">
                {/* Vehicle Count */}
                <div className="info-section card">
                  <h3 className="section-title">Số lượng xe</h3>
                  <div className="vehicle-count-display">
                    <div className="vehicle-count-number">{vehicleCount}</div>
                    <div className="vehicle-count-label">xe liên quan</div>
                  </div>
                </div>


                {/* Details */}
                <div className="info-section card">
                  <h3 className="section-title">
                    <Wrench size={20} />
                    Chi tiết chiến dịch
                  </h3>

                  {/* Campaign Overview Cards */}
                  <div className="campaign-overview-grid">


                    <div className="overview-card">
                      <div className="card-icon">
                        <Users size={20} />
                      </div>
                      <div className="card-content">
                        <div className="card-label">Kỹ thuật viên</div>
                        <div className="card-value">
                          {assignedTechnicians.length} người
                        </div>
                      </div>
                    </div>

                    <div className="overview-card">
                      <div className="card-icon">
                        <Wrench size={20} />
                      </div>
                      <div className="card-content">
                        <div className="card-label">Chuyên môn</div>
                        <div className="card-value">
                          {TECHNICIAN_SPECIALTIES.find(spec => spec.value === item.specialty)?.label || item.specialty || 'Chưa xác định'}
                        </div>
                      </div>
                    </div>



                    <div className="overview-card">
                      <div className="card-icon">
                        <Megaphone size={20} />
                      </div>
                      <div className="card-content">
                        <div className="card-label">Thông báo</div>
                        <div className="card-value">
                          {item.NotificationSent ? (
                            <span className="notification-sent"><Check size={14} /> Đã gửi</span>
                          ) : (
                            <span className="notification-pending"><Clock size={14} /> Chưa gửi</span>
                          )}
                        </div>
                      </div>
                    </div>

                  </div>



                  {/* Affected Vehicles */}

                  <h3 className="section-title">Xe bị ảnh hưởng</h3>
                  <div className="affected-vehicles">
                    <div className="vehicle-models">
                      {(() => {
                        // Get vehicle types from various possible sources
                        const vehicleTypes = item.vehicleTypeInfoDTOS || item.vehicleTypes || [];

                        if (Array.isArray(vehicleTypes) && vehicleTypes.length > 0) {
                          // Display actual vehicle model data
                          return vehicleTypes.map((vt, index) => (
                            <div key={index} className="model-item">
                              <div className="model-name">
                                {vt.modelName || vt.name || vt.vehicleModel || `Model ${vt.id || index + 1}`}
                              </div>
                            </div>
                          ));
                        } else if (item.vehicleTypeCount && item.vehicleTypeCount > 0) {
                          // Fallback to count if detailed info not available
                          return (
                            <div className="model-item">
                              <div className="model-name">Các loại xe</div>
                              <div className="model-count">{item.vehicleTypeCount} loại</div>
                            </div>
                          );
                        } else if (item.VehicleModels && Array.isArray(item.VehicleModels) && item.VehicleModels.length > 0) {
                          // Alternative source
                          return item.VehicleModels.map((model, index) => (
                            <div key={index} className="model-item">
                              <div className="model-name">{model}</div>
                              <div className="model-count">N/A xe</div>
                            </div>
                          ));
                        } else {
                          // No vehicle data available
                          return (
                            <div className="model-item">
                              <div className="model-name">Chưa xác định</div>
                              <div className="model-count">0 xe</div>
                            </div>
                          );
                        }
                      })()}
                    </div>


                  </div>



                  



                  {/* Description Section */}
                  <div className="description-section">
                    <h4 className="subsection-title">
                      <FileText size={18} />
                      Mô tả chiến dịch
                    </h4>
                    <div className="description-content">
                      {item.Description || 'Không có mô tả chi tiết.'}
                    </div>
                  </div>

                  {/* Technical Details */}
                  <div className="technical-details">
                    <h4 className="subsection-title">
                      <Settings size={18} />
                      Thông tin kỹ thuật
                    </h4>
                    <div className="details-grid">
                      <div className="detail-item">
                        <div className="detail-icon"><Wrench size={16} /></div>
                        <div className="detail-content">
                          <div className="detail-label">Phụ tùng yêu cầu</div>
                          <div className="detail-value">
                            {item.requiredParts || 'Không cần phụ tùng'}
                          </div>
                        </div>
                      </div>

                      {item.YearScope && (
                        <div className="detail-item">
                          <div className="detail-icon"><Calendar size={16} /></div>
                          <div className="detail-content">
                            <div className="detail-label">Phạm vi năm</div>
                            <div className="detail-value">{item.YearScope}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="detail-col-4">
              {/* Quick Actions */}
              <div className="quick-actions-section card">
                <h3 className="section-title">Thao tác nhanh</h3>
                <div className="quick-actions">
                  {rolePermissionService.canNotifyCampaignToSC(
                    currentUserRole
                  ) && (
                      <button
                        className="action-btn notification-btn"
                        onClick={handleSendNotification}
                        disabled={isProcessing}
                      >
                        <span><Mail size={16} /></span>
                        Gửi thông báo
                      </button>
                    )}

                  {rolePermissionService.canDistributeVehicles(
                    currentUserRole
                  ) && (
                      <button
                        className="action-btn workflow-btn"
                        onClick={handleStartWorkflow}
                        disabled={isProcessing}
                      >
                        <span><Settings size={16} /></span>
                        Khởi động quy trình
                      </button>
                    )}

                  {rolePermissionService.canRecordAndReport(currentUserRole) && (
                    <button className="action-btn report-btn">
                      <span><BarChart3 size={16} /></span>
                      Xuất báo cáo
                    </button>
                  )}

                  {/* Contact button - available for all roles */}
                  <button className="action-btn contact-btn" onClick={handleOpenContactModal}>
                    <span><Mail size={16} /></span>
                    Liên hệ khách hàng
                  </button>

                  {/* Urgent notification - chỉ cho EVM Staff và Admin với recall */}
                  {isRecall &&
                    rolePermissionService.canNotifyCampaignToSC(
                      currentUserRole
                    ) && (
                      <button
                        className="action-btn urgent-btn"
                        onClick={handleUrgentNotification}
                        disabled={isProcessing}
                      >
                        <span><AlertTriangle size={16} /></span>
                        Báo cáo khẩn cấp
                      </button>
                    )}

                  {/* SC specific actions */}
                  {rolePermissionService.canConfirmAppointmentDate(
                    currentUserRole
                  ) && (
                      <button className="action-btn appointment-btn">
                        <span><Calendar size={16} /></span>
                        Xác nhận lịch hẹn
                      </button>
                    )}

                  {rolePermissionService.canAssignWorkToTechnician(
                    currentUserRole
                  ) && (
                      <button className="action-btn assign-btn">
                        <span><Users size={16} /></span>
                        Phân công việc
                      </button>
                    )}

                  {(currentUserRole === "EVM_ADMIN" ||
                    currentUserRole === "EVM_STAFF" ||
                    currentUserRole === "SC_ADMIN") && (
                      <button
                        className="action-btn technician-btn"
                        onClick={handleOpenAssignTechModal}
                        disabled={isProcessing}
                        title={
                          !rolePermissionService.canAssignWorkToTechnician(currentUserRole)
                            ? "Bạn không có quyền gán kỹ thuật viên"
                            : ""
                        }
                      >
                        <Wrench size={16} />
                        Gán kỹ thuật viên
                      </button>
                    )}

                  {rolePermissionService.canRejectCampaign(currentUserRole) && (
                    <button className="action-btn reject-btn">
                      <span><X size={16} /></span>
                      Từ chối chiến dịch
                    </button>
                  )}

                  {/* Technician specific actions */}
                  {rolePermissionService.canUpdateWorkResults(
                    currentUserRole
                  ) && (
                      <button className="action-btn results-btn">
                        <Wrench size={18} style={{ marginRight: '6px' }} />
                        Cập nhật kết quả
                      </button>
                    )}
                </div>
              </div>

              {/* Assigned Technicians */}
              <div className="assigned-technicians-section card" style={{ marginTop: '16px' }}>
                <h3 className="section-title">
                  <Users size={20} />
                  Kỹ thuật viên đã gán
                </h3>
                <div className="assigned-technicians">
                  {assignedTechnicians.length > 0 ? (
                    <div className="technicians-grid">
                      {assignedTechnicians.map((tech, index) => (
                        <div key={tech.id || tech.scTechId || index} className="technician-card">
                          <div className="technician-avatar">
                            {tech.name ? tech.name.charAt(0).toUpperCase() : "T"}
                          </div>
                          <div className="technician-info">
                            <div className="technician-name">{tech.name || 'Chưa xác định'}</div>
                            <div className="technician-email">{tech.email || 'N/A'}</div>
                            <div className="technician-specialty">
                              {tech.specialty || 'Chưa xác định'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="no-technicians">
                      <span>Chưa có kỹ thuật viên nào được gán</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Process Log */}
              {processLog.length > 0 && (
                <div className="process-log-section card" style={{ marginTop: '16px' }}>
                  <h3 className="section-title">
                    Nhật ký quy trình
                    {isProcessing && <span className="loading-spinner"><Loader size={16} className="animate-spin" /></span>}
                  </h3>
                  <div className="process-log">
                    {processLog.map((log, index) => (
                      <div key={index} className="log-entry">
                        <span className="log-time">
                          {new Date().toLocaleTimeString("vi-VN")}
                        </span>
                        <span className="log-message">{log}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Status Update Modal */}
        {showStatusModal && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h4>Cập nhật trạng thái</h4>
                <button
                  onClick={() => setShowStatusModal(false)}
                  className="modal-close"
                >
                  ✕
                </button>
              </div>
              <div className="modal-body">
                <p>
                  Trạng thái hiện tại: <strong>{item.Status}</strong>
                </p>
                <div className="form-group">
                  <label className="form-label">Chọn trạng thái mới</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="form-control"
                  >
                    <option value="">-- Chọn trạng thái --</option>
                    {getAvailableStatuses().map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-actions">
                <button
                  onClick={() => setShowStatusModal(false)}
                  className="btn btn-outline"
                >
                  Hủy
                </button>
                <button
                  onClick={handleStatusUpdate}
                  className="btn btn-primary"
                  disabled={!newStatus}
                >
                  Cập nhật
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Assign Technician Modal */}
      {showAssignTechModal && (
        <div className="modal-overlay" onClick={() => setShowAssignTechModal(false)}>
          <div className="modal-content assign-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <Users size={20} style={{ marginRight: '8px' }} />
                Gán kỹ thuật viên vào chiến dịch
              </h2>
              <button
                onClick={() => setShowAssignTechModal(false)}
                className="modal-close"
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="assign-section">
                <div className="assign-header">
                  <h3>
                    Kỹ thuật viên khả dụng
                    {currentUserRole === "SC_ADMIN" && user?.branchOffice && (
                      <span className="branch-info"> (Chi nhánh: {user.branchOffice})</span>
                    )}
                  </h3>
                  {availableTechnicians.length > 0 && (
                    <button
                      onClick={() => {
                        const technicianIds = availableTechnicians.map(tech => tech.id || tech.scTechId);
                        console.log("🔄 Bulk assigning all available technicians:", technicianIds);
                        console.log("🏢 Branch office:", user?.branchOffice || "All branches");
                        handleBulkAssignTechnicians(technicianIds);
                      }}
                      disabled={isProcessing}
                      className="btn btn-secondary btn-sm bulk-assign-btn"
                    >
                      {isProcessing ? "Đang xử lý..." : `Gán tất cả (${availableTechnicians.length})`}
                    </button>
                  )}
                </div>
                {loadingTechnicians ? (
                  <div className="loading-message">Đang tải danh sách kỹ thuật viên...</div>
                ) : (
                  <div className="assign-list">
                    {availableTechnicians.map((tech) => (
                      <div key={tech.id || tech.scTechId} className="assign-item">
                        <div className="assign-info">
                          <div className="assign-avatar">
                            {tech.name ? tech.name.charAt(0).toUpperCase() : "T"}
                          </div>
                          <div className="assign-details">
                            <div className="assign-name">{tech.name}</div>
                            <div className="assign-email">{tech.email}</div>
                            <div className="assign-specialty">{tech.specialty || "Chưa xác định"}</div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleAssignTechnician(tech.id || tech.scTechId)}
                          disabled={isProcessing}
                          className="btn btn-primary btn-sm"
                        >
                          {isProcessing ? "Đang xử lý..." : "Gán"}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contact Customer Modal */}
      {showContactModal && (
        <div className="modal-overlay" onClick={() => setShowContactModal(false)}>
          <div className="modal-content contact-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <Mail size={20} style={{ marginRight: '8px' }} />
                Liên hệ khách hàng
              </h2>
              <button
                onClick={() => setShowContactModal(false)}
                className="modal-close"
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              {loadingVehicles ? (
                <div className="loading-message">Đang tải danh sách khách hàng...</div>
              ) : (
                <div className="contact-form">
                  <div className="form-group">
                    <label className="form-label">Tên chiến dịch</label>
                    <input
                      type="text"
                      className="form-control"
                      value={contactData.campaignName}
                      onChange={(e) => setContactData(prev => ({ ...prev, campaignName: e.target.value }))}
                      placeholder="Nhập tên chiến dịch"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Người nhận ({contactData.recipients.length})</label>
                    <div className="recipients-header">
                      <button
                        type="button"
                        onClick={handleAutoAssignEmails}
                        disabled={loadingVehicles}
                        className="btn btn-outline btn-sm auto-assign-btn"
                      >
                        {loadingVehicles ? "Đang tải..." : "Tự động gán Gmail"}
                      </button>
                    </div>
                    <div className="recipients-list">
                      {contactData.recipients.map((email, index) => (
                        <div key={index} className="recipient-item">
                          <span>{email}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveRecipient(email)}
                            className="remove-recipient"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="add-recipient">
                      <input
                        type="email"
                        placeholder="Thêm email khách hàng"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleAddRecipient(e.target.value);
                            e.target.value = '';
                          }
                        }}
                        className="form-control"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          const input = e.target.previousElementSibling;
                          handleAddRecipient(input.value);
                          input.value = '';
                        }}
                        className="btn btn-sm btn-outline"
                      >
                        Thêm
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Tiêu đề</label>
                    <input
                      type="text"
                      className="form-control"
                      value={contactData.subject}
                      onChange={(e) => setContactData(prev => ({ ...prev, subject: e.target.value }))}
                      placeholder="Nhập tiêu đề email"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Ngày gửi</label>
                    <input
                      type="date"
                      className="form-control"
                      value={contactData.date}
                      onChange={(e) => setContactData(prev => ({ ...prev, date: e.target.value }))}
                      placeholder="Chọn ngày gửi"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Tiêu đề chính </label>
                    <input
                      type="text"
                      className="form-control"
                      value={contactData.title}
                      onChange={(e) => setContactData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Nhập tiêu đề chính"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Nội dung </label>
                    <textarea
                      className="form-control"
                      rows="6"
                      value={contactData.body}
                      onChange={(e) => setContactData(prev => ({ ...prev, body: e.target.value }))}
                      placeholder="Nhập nội dung"
                    />
                  </div>

                  {/* HTML checkbox is hidden - always true for HTML emails */}
                  {/* <div className="form-group">
                    <label className="form-check">
                      <input
                        type="checkbox"
                        checked={contactData.html}
                        onChange={(e) => setContactData(prev => ({ ...prev, html: e.target.checked }))}
                      />
                      Gửi dưới dạng HTML
                    </label>
                  </div> */}
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button
                onClick={() => setShowContactModal(false)}
                className="btn btn-outline"
              >
                Hủy
              </button>
              <button
                onClick={handleSendContactEmail}
                className="btn btn-primary"
                disabled={isProcessing || loadingVehicles}
              >
                {isProcessing ? "Đang gửi..." : "Gửi Email"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default CampaignDetail;
