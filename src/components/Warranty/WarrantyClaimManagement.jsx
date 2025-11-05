import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { ArrowLeft, Plus } from "lucide-react";
import { useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import WarrantyClaimList from "./WarrantyClaimList";
import WarrantyClaimForm from "./WarrantyClaimForm";
import WarrantyClaimDetail from "./WarrantyClaimDetail";
import ClaimSearch from "./ClaimSearch";
import { warrantyClaimAPI } from "../../services/api";
import { WARRANTY_CLAIM_STATUS } from "../../constants";
import notificationService from "../../services/NotificationService";
import "../../styles/WarrantyClaimManagement.css";

function WarrantyClaimManagement() {
  const { user } = useAuth();
  const location = useLocation();
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

  // Handle navigation từ notification
  useEffect(() => {
    if (
      location.state?.highlightClaimId &&
      location.state?.fromNotification &&
      claims.length > 0
    ) {
      const claimId = location.state.highlightClaimId;
      const claim = claims.find((c) => c.claimId === claimId);

      if (claim) {
        setSelectedClaim(claim);
        setShowDetail(true);
        setShowForm(false);
      }
    }
  }, [location.state, claims]);

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

      if (response.success && response.data?.content) {
        // Debug: Xem data thực tế từ Backend
        // Transform data từ BE sang format FE - match với Backend DTOs
        const transformedClaims = response.data.content.map((claim) => ({
          claimId: claim.claimId,
          customerName: claim.customerName,
          customerPhone: claim.customerPhone,
          // claimDate: Backend trả LocalDate "yyyy-MM-dd", có thể null
          claimDate: claim.claimDate || new Date().toISOString().split("T")[0],
          // status: Backend có thể trả enum string hoặc null
          status: claim.status || "PENDING",
          vehicleName: claim.vehicleName || "N/A",
        }));

        setClaims(transformedClaims);
        setFilteredClaims(transformedClaims);
      } else {
        setError(
          response.message || "Không thể tải danh sách yêu cầu bảo hành"
        );
      }
    } catch {
      setError("Đã xảy ra lỗi khi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (searchTerm, statusFilter) => {
    let filtered = claims;

    if (searchTerm) {
      filtered = filtered.filter(
        (claim) =>
          claim.claimId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          claim.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          claim.customerPhone.includes(searchTerm) ||
          claim.vehicleName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter && statusFilter !== "all") {
      filtered = filtered.filter((claim) => claim.status === statusFilter);
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
          selectedClaim.claimId,
          claimData
        );

        if (response.success) {
          await fetchClaims();
          setShowForm(false);
          setSelectedClaim(null);
          toast.success("Cập nhật yêu cầu bảo hành thành công!", {
            position: "top-right",
            autoClose: 3000,
          });
        } else {
          toast.error(
            response.message || "Không thể cập nhật yêu cầu bảo hành",
            {
              position: "top-right",
              autoClose: 5000,
            }
          );
        }
      } else {
        // Create new claim - Thêm createdByUserId
        const claimDataWithUserId = {
          ...claimData,
          createdByUserId: user?.id, // Thêm userId để backend lưu
        };

        const response = await warrantyClaimAPI.createClaim(
          claimDataWithUserId
        );

        if (response.success) {
          await fetchClaims();

          // Gửi notification cho SC_ADMIN nếu user là SC_STAFF
          if (user?.role === "SC_STAFF" && response.data) {
            try {
              await notificationService.sendWarrantyClaimNotification({
                claimId: response.data.claimId,
                customerName: claimData.customerName,
                branchOffice: user.branchOffice,
                createdBy: user.username || user.email,
              });
            } catch {
              // Không throw error để không ảnh hưởng đến flow tạo claim
            }
          }

          setShowForm(false);
          setSelectedClaim(null);
          toast.success(
            "Tạo yêu cầu bảo hành thành công! Thông báo đã được gửi đến SC_ADMIN.",
            {
              position: "top-right",
              autoClose: 5000,
            }
          );
        } else {
          toast.error(response.message || "Không thể tạo yêu cầu bảo hành", {
            position: "top-right",
            autoClose: 5000,
          });
        }
      }
    } catch {
      toast.error("Đã xảy ra lỗi khi lưu yêu cầu bảo hành", {
        position: "top-right",
        autoClose: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (
    claimId,
    newStatus,
    rejectionReason = null
  ) => {
    try {
      setLoading(true);

      // SC_ADMIN duyệt/từ chối → Gọi approve-reject endpoint
      if (
        user?.role === "SC_ADMIN" &&
        (newStatus === "APPROVED" || newStatus === "REJECTED")
      ) {
        const approveRejectData = {
          claimId: claimId,
          action: newStatus === "APPROVED" ? "APPROVE" : "REJECT",
          rejectionReason: rejectionReason || "",
          approvedByUserId: user?.id,
        };

        const response = await warrantyClaimAPI.approveOrRejectClaim(
          approveRejectData
        );

        if (response.success) {
          await fetchClaims();

          // Hiển thị toast notification
          toast.success(
            newStatus === "APPROVED"
              ? "✅ Đã duyệt yêu cầu bảo hành thành công! Thông báo đã được gửi đến SC_STAFF."
              : "❌ Đã từ chối yêu cầu bảo hành. Thông báo đã được gửi đến SC_STAFF.",
            {
              position: "top-right",
              autoClose: 5000,
            }
          );
        } else {
          toast.error(response.message || "Không thể cập nhật trạng thái", {
            position: "top-right",
            autoClose: 5000,
          });
        }
      } else {
        // Các trường hợp khác: dùng endpoint updateClaimStatus thông thường
        const response = await warrantyClaimAPI.updateClaimStatus(
          claimId,
          newStatus
        );

        if (response.success) {
          await fetchClaims();
          toast.success("Cập nhật trạng thái thành công!", {
            position: "top-right",
            autoClose: 3000,
          });
        } else {
          toast.error(response.message || "Không thể cập nhật trạng thái", {
            position: "top-right",
            autoClose: 5000,
          });
        }
      }
    } catch {
      toast.error("Đã xảy ra lỗi khi cập nhật trạng thái", {
        position: "top-right",
        autoClose: 5000,
      });
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
        {!showForm &&
          !showDetail &&
          user?.role !== "SC_ADMIN" &&
          user?.role !== "EVM_ADMIN" && (
            <button onClick={handleCreateClaim} className="btn btn-primary">
              <span>➕</span>
              Tạo yêu cầu mới
            </button>
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
