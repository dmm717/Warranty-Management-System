import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import ReportList from "./ReportList";
import ReportForm from "./ReportForm";
import ReportDetail from "./ReportDetail";
import ReportChart from "./ReportChart";
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
    const mockReports = [
      {
        ID_Report: "RPT001",
        ReportName: "Báo cáo lỗi pin tháng 9/2024",
        Description: "Thống kê và phân tích các lỗi liên quan đến pin xe điện",
        Image: "/api/placeholder/400/200",
        Error: "Pin quá nhiệt",
        Status: "Hoàn thành",
        CampaignsID: "SC001",
        Recall_ID: null,
        SC_StaffID: "SC001",
        EVM_Staff_ID: "EVM001",
        CreatedDate: "2024-10-01",
        ReportType: "Warranty Analysis",
        Priority: "Cao",
      },
      {
        ID_Report: "RPT002",
        ReportName: "Hiệu suất chiến dịch cập nhật BMS",
        Description:
          "Đánh giá tiến độ và hiệu quả chiến dịch cập nhật phần mềm BMS",
        Image: "/api/placeholder/400/200",
        Error: "Không có",
        Status: "Đang xử lý",
        CampaignsID: "SC001",
        Recall_ID: null,
        SC_StaffID: "SC002",
        EVM_Staff_ID: "EVM001",
        CreatedDate: "2024-09-28",
        ReportType: "Campaign Performance",
        Priority: "Trung bình",
      },
      {
        ID_Report: "RPT003",
        ReportName: "Báo cáo recall pin VF8",
        Description: "Tình hình thực hiện recall pin VF8 2023",
        Image: "/api/placeholder/400/200",
        Error: "Cell pin lỗi",
        Status: "Hoàn thành",
        CampaignsID: null,
        Recall_ID: "RC001",
        SC_StaffID: "SC001",
        EVM_Staff_ID: "EVM001",
        CreatedDate: "2024-09-15",
        ReportType: "Recall Progress",
        Priority: "Cao",
      },
    ];

    const mockReportData = {
      warrantyStats: {
        totalClaims: 234,
        approvedClaims: 189,
        rejectedClaims: 23,
        pendingClaims: 22,
        avgProcessingTime: 5.2,
      },
      partFailureStats: [
        { part: "Pin", failures: 45, percentage: 35 },
        { part: "Motor", failures: 28, percentage: 22 },
        { part: "BMS", failures: 18, percentage: 14 },
        { part: "Inverter", failures: 15, percentage: 12 },
        { part: "Khác", failures: 22, percentage: 17 },
      ],
      monthlyTrends: [
        { month: "T1", claims: 18, resolved: 15, pending: 3 },
        { month: "T2", claims: 22, resolved: 20, pending: 2 },
        { month: "T3", claims: 28, resolved: 25, pending: 3 },
        { month: "T4", claims: 25, resolved: 23, pending: 2 },
        { month: "T5", claims: 30, resolved: 27, pending: 3 },
        { month: "T6", claims: 26, resolved: 24, pending: 2 },
        { month: "T7", claims: 32, resolved: 29, pending: 3 },
        { month: "T8", claims: 28, resolved: 26, pending: 2 },
        { month: "T9", claims: 25, resolved: 20, pending: 5 },
      ],
    };

    setTimeout(() => {
      setReports(mockReports);
      setReportData(mockReportData);
      setLoading(false);
    }, 1000);
  }, []);

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
