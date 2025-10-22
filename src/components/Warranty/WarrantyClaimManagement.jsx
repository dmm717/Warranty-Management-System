import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import WarrantyClaimList from "./WarrantyClaimList";
import WarrantyClaimForm from "./WarrantyClaimForm";
import WarrantyClaimDetail from "./WarrantyClaimDetail";
import ClaimSearch from "./ClaimSearch";
import { warrantyClaimAPI } from "../../services/api";
import { WARRANTY_CLAIM_STATUS } from "../../constants";
import "../../styles/WarrantyClaimManagement.css";

function WarrantyClaimManagement() {
  const { user } = useAuth();
  const [claims, setClaims] = useState([]);
  const [filteredClaims, setFilteredClaims] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch claims từ API
  useEffect(() => {
    fetchClaims();
  }, []);

  const fetchClaims = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await warrantyClaimAPI.getAllClaims({
        page: 0,
        size: 100, // Lấy nhiều records để hiển thị
        sortBy: "claimDate",
        sortDir: "desc",
      });

      if (response.success && response.data) {
        // Transform data từ BE sang format FE
        const transformedClaims = response.data.content.map((claim) => ({
          ClaimID: claim.claimId,
          CustomerName: claim.customerName,
          CustomerPhone: claim.phoneNumber,
          ClaimDate: claim.claimDate,
          IssueDescription: claim.issueDescription,
          Status: WARRANTY_CLAIM_STATUS[claim.status] || claim.status,
          Email: claim.email,
          Vehicle_ID: claim.vehicleId,
          VIN: claim.vin || claim.vehicleId,
          VehicleName: claim.vehicleName || "N/A",
          RequiredPart: claim.requiredPart,
          SC_TechID: claim.scTechId,
        }));

        setClaims(transformedClaims);
        setFilteredClaims(transformedClaims);
      } else {
        setError(
          response.message || "Không thể tải danh sách yêu cầu bảo hành"
        );
      }
    } catch (error) {
      console.error("Error fetching claims:", error);
      setError("Đã xảy ra lỗi khi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

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

  const handleSaveClaim = async (claimData) => {
    try {
      setLoading(true);

      if (selectedClaim) {
        // Update existing claim
        const response = await warrantyClaimAPI.updateClaim(
          selectedClaim.ClaimID,
          claimData
        );

        if (response.success) {
          // Reload claims để có data mới nhất
          await fetchClaims();
          setShowForm(false);
          setSelectedClaim(null);
        } else {
          alert(response.message || "Không thể cập nhật yêu cầu bảo hành");
        }
      } else {
        // Create new claim
        const response = await warrantyClaimAPI.createClaim(claimData);

        if (response.success) {
          // Reload claims để có data mới nhất
          await fetchClaims();
          setShowForm(false);
          setSelectedClaim(null);
        } else {
          alert(response.message || "Không thể tạo yêu cầu bảo hành");
        }
      }
    } catch (error) {
      console.error("Error saving claim:", error);
      alert("Đã xảy ra lỗi khi lưu yêu cầu bảo hành");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (claimId, newStatus) => {
    try {
      setLoading(true);

      // Convert Vietnamese status to backend enum
      const statusMap = {
        "Chờ duyệt": "PENDING",
        "Đã duyệt": "APPROVED",
        "Đang xử lý": "IN_PROGRESS",
        "Hoàn thành": "COMPLETED",
        "Từ chối": "REJECTED",
      };

      const backendStatus = statusMap[newStatus] || newStatus;
      const response = await warrantyClaimAPI.updateClaimStatus(
        claimId,
        backendStatus
      );

      if (response.success) {
        // Reload claims để có data mới nhất
        await fetchClaims();
      } else {
        alert(response.message || "Không thể cập nhật trạng thái");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Đã xảy ra lỗi khi cập nhật trạng thái");
    } finally {
      setLoading(false);
    }
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
