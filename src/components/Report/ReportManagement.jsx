import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import ReportList from "./ReportList";
import ReportForm from "./ReportForm";
import ReportDetail from "./ReportDetail";
import ReportChart from "./ReportChart";
import { warrantyClaimAPI, serviceCampaignAPI } from "../../services/api";
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
  }, []);

  const fetchReportsAndStats = async () => {
    try {
      setLoading(true);

      // Fetch campaign reports và warranty claims từ backend
      const [campaignsRes, claimsRes] = await Promise.all([
        serviceCampaignAPI.getAllCampaigns({ page: 0, size: 100 }),
        warrantyClaimAPI.getAllClaims({ page: 0, size: 1000 }),
      ]);

      // Transform campaigns thành reports
      const campaignReports = [];
      if (campaignsRes.success && campaignsRes.data?.content) {
        for (const campaign of campaignsRes.data.content) {
          // Fetch report cho từng campaign
          try {
            const reportRes = await serviceCampaignAPI.getCampaignReport(
              campaign.id
            );
            if (reportRes.success && reportRes.data) {
              campaignReports.push({
                ID_Report: `RPT-${campaign.id}`,
                ReportName: `Báo cáo chiến dịch: ${campaign.campaignName}`,
                Description:
                  campaign.description ||
                  `Báo cáo cho chiến dịch ${campaign.campaignName}`,
                Image: "/api/placeholder/400/200",
                Error: "Không có",
                Status:
                  campaign.status === "COMPLETED"
                    ? "Hoàn thành"
                    : campaign.status === "ACTIVE"
                    ? "Đang xử lý"
                    : "Chờ duyệt",
                CampaignsID: campaign.id,
                Recall_ID: null,
                SC_StaffID: "SC001",
                EVM_Staff_ID: "EVM001",
                CreatedDate: campaign.startDate,
                ReportType: "Campaign Performance",
                Priority: "Trung bình",
              });
            }
          } catch (err) {          }
        }
      }

      setReports(campaignReports);

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

  const handleSaveReport = (reportFormData) => {
    if (selectedReport) {
      const updatedReports = reports.map((r) =>
        r.ID_Report === selectedReport.ID_Report
          ? { ...r, ...reportFormData }
          : r
      );
      setReports(updatedReports);
    } else {
      const newReport = {
        ...reportFormData,
        ID_Report: `RPT${String(reports.length + 1).padStart(3, "0")}`,
        CreatedDate: new Date().toISOString().split("T")[0],
        SC_StaffID: user.id,
        Status: "Đang xử lý",
      };
      setReports([...reports, newReport]);
    }
    setShowForm(false);
    setSelectedReport(null);
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
    return (
      user?.role === "SC_Staff" ||
      user?.role === "EVM_Staff" ||
      user?.role === "Admin"
    );
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
                <span>➕</span>
                Tạo báo cáo
              </button>
            )}
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
          <div className="report-tabs">
            <button
              className={`tab-btn ${activeTab === "list" ? "active" : ""}`}
              onClick={() => setActiveTab("list")}
            >
              <span>📋</span>
              Danh sách báo cáo
            </button>
            <button
              className={`tab-btn ${activeTab === "analytics" ? "active" : ""}`}
              onClick={() => setActiveTab("analytics")}
            >
              <span>📊</span>
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
