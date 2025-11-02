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
  const [activeTab, setActiveTab] = useState("list");
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState({});

  useEffect(() => {
    fetchReportsAndStats();
    fetchReportsFromAPI();
  }, []);

  const fetchReportsFromAPI = async () => {
    try {
      // console.log("Fetching reports from API...");
      const response = await reportAPI.getAllReports({
        page: 0,
        size: 100,
        sortBy: "submittedAt",
        sortDir: "desc",
      });

      // console.log("Report API response:", response);

      if (response.success && response.data) {
        const reportsData = response.data.content || response.data || [];
        // console.log("Reports data:", reportsData);
        
        const transformedReports = reportsData.map((report) => ({
          ID_Report: report.id || report.reportId || `RPT-${report.id}`,
          ReportName: report.title || report.reportName || "Untitled Report",
          Description: report.description,
          Image: report.image || "/api/placeholder/400/200",
          Error: report.error || "Không có",
          Status: report.status || "Đang xử lý",
          ReportType: "General Report",
          Priority: "Trung bình",
          CreatedDate: report.submittedAt || report.createdAt || new Date().toISOString(),
          ScStaffId: report.scStaffId,
          ScAdminId: report.scAdminId,
          EvmAdminId: report.evmAdminId,
        }));

        // console.log("Transformed reports:", transformedReports);
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
    setShowForm(true);
    setShowDetail(false);
  };

  const handleEditReport = (report) => {
    setSelectedReport(report);
    setShowForm(true);
    setShowDetail(false);
  };

  const handleViewDetail = (report) => {
    setSelectedReport(report);
    setShowDetail(true);
    setShowForm(false);
  };

  const handleSaveReport = async (reportFormData) => {
    try {
      setLoading(true);
      
      if (selectedReport) {
        // Update existing report (keep old logic for now)
        const updatedReports = reports.map((r) =>
          r.ID_Report === selectedReport.ID_Report
            ? { ...r, ...reportFormData }
            : r
        );
        setReports(updatedReports);
        toast.success("Cập nhật báo cáo thành công!");
      } else {
        // Create new report via API
        const backendData = {
          title: reportFormData.ReportName,
          description: reportFormData.Description,
          image: reportFormData.Image || "",
          error: reportFormData.Error || "",
          recallId: reportFormData.referenceType === "RECALL" ? reportFormData.recallId : null,
          serviceCampaignId: reportFormData.referenceType === "SERVICE_CAMPAIGN" ? reportFormData.serviceCampaignId : null,
        };

        // console.log("Creating report with data:", backendData);

        const response = await reportAPI.createReport(backendData);

        if (response.success) {
          toast.success("Tạo báo cáo thành công!");
          await fetchReportsFromAPI(); // Reload reports from API
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

  const handleDeleteReport = (reportId) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa báo cáo này?")) {
      setReports(reports.filter((r) => r.ID_Report !== reportId));
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
              userRole={user?.role}
            />
          ) : (
            <ReportChart reportData={reportData} />
          )}
        </>
      ) : showForm ? (
        <ReportForm
          report={selectedReport}
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
