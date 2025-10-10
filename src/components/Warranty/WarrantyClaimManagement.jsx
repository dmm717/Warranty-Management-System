import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import WarrantyClaimList from "./WarrantyClaimList";
import WarrantyClaimForm from "./WarrantyClaimForm";
import WarrantyClaimDetail from "./WarrantyClaimDetail";
import ClaimSearch from "./ClaimSearch";
import "./WarrantyClaimManagement.css";

function WarrantyClaimManagement() {
  const { user } = useAuth();
  const [claims, setClaims] = useState([]);
  const [filteredClaims, setFilteredClaims] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [loading, setLoading] = useState(true);

  // Mock data - replace với API calls
  useEffect(() => {
    const mockClaims = [
      {
        ClaimID: "WC001",
        CustomerName: "Nguyễn Văn An",
        CustomerPhone: "0912345678",
        ClaimDate: "2024-10-01",
        IssueDescription: "Pin không sạc được, hiển thị lỗi trên màn hình",
        Status: "Chờ duyệt",
        Email: "nguyenvanan@email.com",
        Vehicle_ID: "VH001",
        SC_StaffID: "SC001",
        VIN: "VF8ABC12345678901",
        VehicleName: "VinFast VF8",
        Priority: "Cao",
        EstimatedCost: 15000000,
        DiagnosisResult: "Pin bị lỗi cell, cần thay thế",
      },
      {
        ClaimID: "WC002",
        CustomerName: "Trần Thị Bình",
        CustomerPhone: "0987654321",
        ClaimDate: "2024-09-28",
        IssueDescription: "Motor phát ra tiếng ồn bất thường khi tăng tốc",
        Status: "Đã duyệt",
        Email: "tranthibinh@email.com",
        Vehicle_ID: "VH002",
        SC_StaffID: "SC001",
        VIN: "VF9DEF12345678902",
        VehicleName: "VinFast VF9",
        Priority: "Trung bình",
        EstimatedCost: 8500000,
        DiagnosisResult: "Bạc đạn motor bị mòn",
      },
      {
        ClaimID: "WC003",
        CustomerName: "Lê Minh Cường",
        CustomerPhone: "0901234567",
        ClaimDate: "2024-09-25",
        IssueDescription: "Hệ thống sạc nhanh không hoạt động",
        Status: "Hoàn thành",
        Email: "leminhcuong@email.com",
        Vehicle_ID: "VH003",
        SC_StaffID: "SC002",
        VIN: "VF8GHI12345678903",
        VehicleName: "VinFast VF8",
        Priority: "Thấp",
        EstimatedCost: 3200000,
        DiagnosisResult: "Cáp sạc bị đứt, đã thay thế",
      },
    ];

    setTimeout(() => {
      setClaims(mockClaims);
      setFilteredClaims(mockClaims);
      setLoading(false);
    }, 1000);
  }, []);

  const handleSearch = (searchTerm, statusFilter, priorityFilter) => {
    let filtered = claims;

    if (searchTerm) {
      filtered = filtered.filter(
        (claim) =>
          claim.ClaimID.toLowerCase().includes(searchTerm.toLowerCase()) ||
          claim.CustomerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          claim.VIN.toLowerCase().includes(searchTerm.toLowerCase()) ||
          claim.CustomerPhone.includes(searchTerm)
      );
    }

    if (statusFilter && statusFilter !== "all") {
      filtered = filtered.filter((claim) => claim.Status === statusFilter);
    }

    if (priorityFilter && priorityFilter !== "all") {
      filtered = filtered.filter((claim) => claim.Priority === priorityFilter);
    }

    setFilteredClaims(filtered);
  };

  const handleCreateClaim = () => {
    setSelectedClaim(null);
    setShowForm(true);
    setShowDetail(false);
  };

  const handleEditClaim = (claim) => {
    setSelectedClaim(claim);
    setShowForm(true);
    setShowDetail(false);
  };

  const handleViewDetail = (claim) => {
    setSelectedClaim(claim);
    setShowDetail(true);
    setShowForm(false);
  };

  const handleSaveClaim = (claimData) => {
    if (selectedClaim) {
      // Update existing claim
      const updatedClaims = claims.map((c) =>
        c.ClaimID === selectedClaim.ClaimID ? { ...c, ...claimData } : c
      );
      setClaims(updatedClaims);
      setFilteredClaims(updatedClaims);
    } else {
      // Add new claim
      const newClaim = {
        ...claimData,
        ClaimID: `WC${String(claims.length + 1).padStart(3, "0")}`,
        ClaimDate: new Date().toISOString().split("T")[0],
        SC_StaffID: user.id,
      };
      const updatedClaims = [...claims, newClaim];
      setClaims(updatedClaims);
      setFilteredClaims(updatedClaims);
    }
    setShowForm(false);
    setSelectedClaim(null);
  };

  const handleUpdateStatus = (claimId, newStatus) => {
    const updatedClaims = claims.map((c) =>
      c.ClaimID === claimId ? { ...c, Status: newStatus } : c
    );
    setClaims(updatedClaims);
    setFilteredClaims(updatedClaims);
  };

  const handleBack = () => {
    setShowForm(false);
    setShowDetail(false);
    setSelectedClaim(null);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Đang tải dữ liệu yêu cầu bảo hành...</p>
      </div>
    );
  }

  return (
    <div className="warranty-claim-management">
      <div className="page-header">
        <h1>Quản lý yêu cầu bảo hành</h1>
        {!showForm && !showDetail && (
          <button onClick={handleCreateClaim} className="btn btn-primary">
            <span>➕</span>
            Tạo yêu cầu mới
          </button>
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
          <ClaimSearch onSearch={handleSearch} />
          <WarrantyClaimList
            claims={filteredClaims}
            onEdit={handleEditClaim}
            onView={handleViewDetail}
            onUpdateStatus={handleUpdateStatus}
            userRole={user?.role}
          />
        </>
      ) : showForm ? (
        <WarrantyClaimForm
          claim={selectedClaim}
          onSave={handleSaveClaim}
          onCancel={handleBack}
        />
      ) : (
        <WarrantyClaimDetail
          claim={selectedClaim}
          onEdit={handleEditClaim}
          onUpdateStatus={handleUpdateStatus}
          userRole={user?.role}
        />
      )}
    </div>
  );
}

export default WarrantyClaimManagement;
