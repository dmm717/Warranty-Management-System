import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { ArrowLeft, Plus, FileText, BarChart3 } from "lucide-react";
import ReportList from "./ReportList";
import ReportForm from "./ReportForm";
import ReportDetail from "./ReportDetail";
import ReportChart from "./ReportChart";
import { warrantyClaimAPI, serviceCampaignAPI, reportAPI } from "../../services/api";
import { toast } from "react-toastify";
import "../../styles/ReportManagement.css";

function ReportManagement() {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [formMode, setFormMode] = useState("create"); // "create", "edit", "assign"
  const [activeTab, setActiveTab] = useState("list");
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState({});

  useEffect(() => {
    fetchReportsAndStats();
    fetchReportsFromAPI();
  }, []);

  const fetchReportsFromAPI = async () => {
    try {
      console.log("Fetching reports from API...");
      const response = await reportAPI.getAllReports({
        page: 0,
        size: 100,
        sortBy: "id",
        sortDir: "desc",
      });

      if (response.success && response.data) {
        const reportsData = response.data.content || response.data || [];
        
        const transformedReports = reportsData.map((report) => {
          return {
            ID_Report: report.id || report.reportId || `RPT-${report.id}`,
            ReportName: report.title || report.reportName || "Untitled Report",
            Description: report.description,
            Image: report.image || "/api/placeholder/400/200",
            Error: report.error || "Không có",
            Status: report.status || "Đang xử lý",
            ReportType: "General Report",
            Priority: "Trung bình",
            CreatedDate: report.createdAt || report.submittedAt || report.created || new Date().toISOString(),
            ScStaffId: report.scStaffId,
            ScAdminId: report.scAdminId,
            EvmAdminId: report.evmAdminId,
            serviceCampaignId: report.serviceCampaignId,
            recallId: report.recallId,
          };
        });

        // Backend already returns in correct order (newest first with sortDir: desc)
        console.log("Final reports (newest first):", transformedReports.slice(0, 3));
        
        // Set reports directly from API
        setReports(transformedReports);
      } else {
        // console.log("No data in response or response not successful");
        setReports([]);
      }
    } catch (error) {
      console.error("Fetch reports from API error:", error);
      setReports([]);
    }
  };

  const fetchReportsAndStats = async () => {
    try {
      setLoading(true);

      // Fetch warranty claims từ backend for statistics only
      const claimsRes = await warrantyClaimAPI.getAllClaims({ 
        page: 0, 
        size: 1000 
      });

      // Don't modify reports here - fetchReportsFromAPI handles that

      // Calculate statistics từ warranty claims
      if (claimsRes.success && claimsRes.data?.content) {
        const claims = claimsRes.data.content;

        // Thống kê tổng quan
        const totalClaims = claims.length;
        const approvedClaims = claims.filter(
          (c) => c.status === "APPROVED"
        ).length;
        const rejectedClaims = claims.filter(
          (c) => c.status === "REJECTED"
        ).length;
        const pendingClaims = claims.filter(
          (c) => c.status === "PENDING"
        ).length;

        // Phân tích lỗi theo phụ tùng (từ requiredPart)
        const partFailureMap = {};
        claims.forEach((claim) => {
          if (claim.requiredPart) {
            const part = claim.requiredPart;
            partFailureMap[part] = (partFailureMap[part] || 0) + 1;
          }
        });

        const partFailureStats = Object.entries(partFailureMap)
          .map(([part, failures]) => ({
            part,
            failures,
            percentage: Math.round((failures / totalClaims) * 100),
          }))
          .sort((a, b) => b.failures - a.failures)
          .slice(0, 5); // Top 5

        // Xu hướng theo tháng (lấy 9 tháng gần nhất)
        const monthlyMap = {};
        claims.forEach((claim) => {
          if (claim.claimDate) {
            const date = new Date(claim.claimDate);
            const monthKey = `${date.getFullYear()}-${String(
              date.getMonth() + 1
            ).padStart(2, "0")}`;
            if (!monthlyMap[monthKey]) {
              monthlyMap[monthKey] = { claims: 0, resolved: 0, pending: 0 };
            }
            monthlyMap[monthKey].claims++;
            if (claim.status === "APPROVED" || claim.status === "COMPLETED") {
              monthlyMap[monthKey].resolved++;
            } else if (claim.status === "PENDING") {
              monthlyMap[monthKey].pending++;
            }
          }
        });

        const monthlyTrends = Object.entries(monthlyMap)
          .sort((a, b) => a[0].localeCompare(b[0]))
          .slice(-9) // Lấy 9 tháng gần nhất
          .map(([key, data]) => {
            const parts = key.split("-");
            const month = parts[1];
            return {
              month: `T${parseInt(month)}`,
              ...data,
            };
          });

        setReportData({
          warrantyStats: {
            totalClaims,
            approvedClaims,
            rejectedClaims,
            pendingClaims,
            avgProcessingTime: 5.2, // TODO: Calculate từ backend nếu có
          },
          partFailureStats,
          monthlyTrends,
        });
      } else {
        // Default empty data
        setReportData({
          warrantyStats: {
            totalClaims: 0,
            approvedClaims: 0,
            rejectedClaims: 0,
            pendingClaims: 0,
            avgProcessingTime: 0,
          },
          partFailureStats: [],
          monthlyTrends: [],
        });
      }
    } catch (error) {
      console.error("Error fetching reports and stats:", error);
      toast.error("Không thể tải dữ liệu báo cáo");
      setReports([]);
      setReportData({
        warrantyStats: {
          totalClaims: 0,
          approvedClaims: 0,
          rejectedClaims: 0,
          pendingClaims: 0,
          avgProcessingTime: 0,
        },
        partFailureStats: [],
        monthlyTrends: [],
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReport = () => {
    setSelectedReport(null);
    setFormMode("create");
    setShowForm(true);
    setShowDetail(false);
  };

  const handleEditReport = (report) => {
    setSelectedReport(report);
    setFormMode("edit");
    setShowForm(true);
    setShowDetail(false);
  };

  const handleViewDetail = (report) => {
    setSelectedReport(report);
    setShowDetail(true);
    setShowForm(false);
  };

  const handleAssignReport = (report) => {
    setSelectedReport(report);
    setFormMode("assign");
    setShowForm(true);
    setShowDetail(false);
  };

  const handleSaveReport = async (reportFormData) => {
    try {
      setLoading(true);
      
      if (formMode === "assign") {
        // Assign mode - only assign campaign/recall/warranty claim
        console.log("Assign mode - Form data:", reportFormData);
        
        if (reportFormData.referenceType === "SERVICE_CAMPAIGN" && reportFormData.serviceCampaignId) {
          console.log("Assigning service campaign:", reportFormData.serviceCampaignId);
          await reportAPI.assignServiceCampaign(selectedReport.ID_Report, reportFormData.serviceCampaignId);
          
          // Update local state immediately
          setReports(reports.map(r => 
            r.ID_Report === selectedReport.ID_Report 
              ? { ...r, serviceCampaignId: reportFormData.serviceCampaignId }
              : r
          ));
          
          toast.success("Đã assign Service Campaign thành công!");
        } else if (reportFormData.referenceType === "RECALL" && reportFormData.recallId) {
          console.log("Assigning recall:", reportFormData.recallId);
          await reportAPI.assignRecall(selectedReport.ID_Report, reportFormData.recallId);
          
          // Update local state immediately
          setReports(reports.map(r => 
            r.ID_Report === selectedReport.ID_Report 
              ? { ...r, recallId: reportFormData.recallId }
              : r
          ));
          
          toast.success("Đã assign Recall thành công!");
        } else if (reportFormData.referenceType === "WARRANTY_CLAIM" && reportFormData.warrantyClaimId) {
          console.log("Assigning warranty claim:", reportFormData.warrantyClaimId);
          await reportAPI.assignWarrantyClaim(selectedReport.ID_Report, reportFormData.warrantyClaimId);
          
          // Update local state immediately
          setReports(reports.map(r => 
            r.ID_Report === selectedReport.ID_Report 
              ? { ...r, warrantyClaimId: reportFormData.warrantyClaimId }
              : r
          ));
          
          toast.success("Đã assign Warranty Claim thành công!");
        } else {
          toast.warning("Vui lòng chọn Campaign, Recall hoặc Warranty Claim");
          setLoading(false);
          return;
        }
        
      } else if (formMode === "edit") {
        // Edit mode - update report info (title, description, status, error, image only)
        console.log("Edit mode - Form data:", reportFormData);
        console.log("Image field:", reportFormData.Image ? `${reportFormData.Image.substring(0, 50)}... (length: ${reportFormData.Image.length})` : "No image");
        
        const updateData = {
          title: reportFormData.ReportName,
          description: reportFormData.Description,
          status: reportFormData.Status || "PENDING",
          error: reportFormData.Error || "",
        };

        // Only include image if it's not empty and not too large
        if (reportFormData.Image && reportFormData.Image.trim() !== "") {
          // Check if base64 is too large (e.g., > 10MB = ~13MB base64)
          if (reportFormData.Image.length > 13 * 1024 * 1024) {
            toast.error("Ảnh quá lớn! Vui lòng chọn ảnh nhỏ hơn 10MB");
            setLoading(false);
            return;
          }
          updateData.image = reportFormData.Image;
        } else {
          updateData.image = "";
        }
        
        console.log("Updating report with data:", {
          ...updateData,
          image: updateData.image ? `${updateData.image.substring(0, 50)}... (${updateData.image.length} chars)` : "empty"
        });
        
        const response = await reportAPI.updateReport(selectedReport.ID_Report, updateData);
        
        if (!response.success) {
          toast.error(response.message || "Không thể cập nhật báo cáo");
          setLoading(false);
          return;
        }
        
        // Update local state immediately
        setReports(reports.map(r => 
          r.ID_Report === selectedReport.ID_Report 
            ? { 
                ...r, 
                ReportName: updateData.title,
                Description: updateData.description,
                Status: updateData.status,
                Error: updateData.error,
                Image: updateData.image,
              }
            : r
        ));
        
        toast.success("Cập nhật báo cáo thành công!");
        
      } else {
        // Create mode
        console.log("Create mode - Form data received:", reportFormData);
        console.log("Image data:", reportFormData.Image ? `${reportFormData.Image.substring(0, 100)}... (length: ${reportFormData.Image.length})` : "No image");
        
        const backendData = {
          title: reportFormData.ReportName || "Untitled",
          description: reportFormData.Description || "No description",
          error: reportFormData.Error || "No error",
        };

        if (reportFormData.Image && reportFormData.Image.trim() !== "") {
          // Check if base64 is too large
          if (reportFormData.Image.length > 13 * 1024 * 1024) {
            toast.error("Ảnh quá lớn! Vui lòng chọn ảnh nhỏ hơn 10MB");
            setLoading(false);
            return;
          }
          backendData.image = reportFormData.Image;
          console.log("Image will be sent to backend. Length:", reportFormData.Image.length);
        }

        console.log("Creating report with backend data:", {
          ...backendData,
          image: backendData.image ? `${backendData.image.substring(0, 50)}... (${backendData.image.length} chars)` : "no image"
        });

        const response = await reportAPI.createReport(backendData);
        
        console.log("Create report response:", response);

        if (response.success) {
          toast.success("Tạo báo cáo thành công!");
          
          // Add new report to the beginning of the list immediately
          const newReport = {
            ID_Report: response.data.id,
            ReportName: response.data.title || backendData.title,
            Description: response.data.description || backendData.description,
            Image: response.data.image || backendData.image || "/api/placeholder/400/200",
            Error: response.data.error || backendData.error,
            Status: response.data.status || "PENDING",
            ReportType: "General Report",
            Priority: "Trung bình",
            CreatedDate: response.data.createdAt || new Date().toISOString(),
            ScStaffId: response.data.scStaffId,
            ScAdminId: response.data.scAdminId,
            EvmAdminId: response.data.evmAdminId,
            serviceCampaignId: response.data.serviceCampaignId,
            recallId: response.data.recallId,
          };
          
          // Add to beginning of array (newest first)
          setReports([newReport, ...reports]);
          
        } else {
          toast.error(response.message || "Không thể tạo báo cáo");
        }
      }
    } catch (error) {
      console.error("Save report error:", error);
      toast.error("Đã xảy ra lỗi khi lưu báo cáo");
    } finally {
      setLoading(false);
      setShowForm(false);
      setSelectedReport(null);
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa báo cáo này?")) {
      try {
        setLoading(true);
        console.log("Deleting report:", reportId);
        
        const response = await reportAPI.deleteReport(reportId);
        
        if (response.success) {
          // Remove from local state immediately
          setReports(reports.filter((r) => r.ID_Report !== reportId));
          toast.success("Xóa báo cáo thành công!");
        } else {
          toast.error(response.message || "Không thể xóa báo cáo");
        }
      } catch (error) {
        console.error("Delete report error:", error);
        toast.error("Đã xảy ra lỗi khi xóa báo cáo");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleBack = () => {
    setShowForm(false);
    setShowDetail(false);
    setSelectedReport(null);
  };

  const canCreateEdit = () => {
    // console.log("Checking canCreateEdit - user.role:", user?.role);
    const canCreate = (
      user?.role === "SC_Staff" ||
      user?.role === "SC_ADMIN" ||
      user?.role === "EVM_Staff" ||
      user?.role === "Admin"
    );
    // console.log("canCreateEdit result:", canCreate);
    return canCreate;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Đang tải dữ liệu báo cáo...</p>
      </div>
    );
  }

  return (
    <div className="report-management">
      <div className="page-header">
        <h1>Quản lý báo cáo</h1>
        {!showForm && !showDetail && (
          <div className="header-actions">
            {canCreateEdit() && (
              <button onClick={handleCreateReport} className="btn btn-primary">
                <Plus size={16} />
                Tạo báo cáo
              </button>
            )}
          </div>
        )}
        {(showForm || showDetail) && (
          <button onClick={handleBack} className="btn btn-outline">
            <ArrowLeft size={16} />
            Quay lại
          </button>
        )}
      </div>

      {!showForm && !showDetail ? (
        <>
          <div className="report-tabs">
            <button
              className={`tab-btn ${activeTab === "list" ? "active" : ""}`}
              onClick={() => setActiveTab("list")}
            >
              <FileText size={18} style={{ display: 'inline', marginRight: '6px' }} />
              Danh sách báo cáo
            </button>
            <button
              className={`tab-btn ${activeTab === "analytics" ? "active" : ""}`}
              onClick={() => setActiveTab("analytics")}
            >
              <BarChart3 size={18} style={{ display: 'inline', marginRight: '6px' }} />
              Phân tích & Thống kê
            </button>
          </div>

          {activeTab === "list" ? (
            <ReportList
              reports={reports}
              onEdit={handleEditReport}
              onView={handleViewDetail}
              onDelete={handleDeleteReport}
              onAssign={handleAssignReport}
              userRole={user?.role}
            />
          ) : (
            <ReportChart reportData={reportData} />
          )}
        </>
      ) : showForm ? (
        <ReportForm
          report={selectedReport}
          mode={formMode}
          onSave={handleSaveReport}
          onCancel={handleBack}
        />
      ) : (
        <ReportDetail
          report={selectedReport}
          onEdit={handleEditReport}
          userRole={user?.role}
        />
      )}
    </div>
  );
}

export default ReportManagement;
