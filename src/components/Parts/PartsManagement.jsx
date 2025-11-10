import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import PartsList from "./PartsList";
import PartsInventoryListEVM from "./PartsInventoryListEVM";
import PartsInventoryListSC from "./PartsInventoryListSC";
import PartsForm from "./PartsForm";
import PartsSearch from "./PartsSearch";
import PartsByTypeView from "./PartsByTypeView";
import SCPartsByTypeView from "./SCPartsByTypeView";
import {
  partsRequestAPI,
  evmInventoryAPI,
  scInventoryAPI,
} from "../../services/api";
import "../../styles/PartsManagement.css";

function PartsManagement() {
  const { user } = useAuth();
  const location = useLocation();
  const [partsRequests, setPartsRequests] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [filteredPartsRequests, setFilteredPartsRequests] = useState([]);
  const [filteredInventory, setFilteredInventory] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingRequest, setEditingRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("inventory");
  const [availableCategories, setAvailableCategories] = useState([]);
  const [viewMode, setViewMode] = useState("list"); // 'list' | 'partsByType'
  const [selectedPartType, setSelectedPartType] = useState(null);
  const [scViewMode, setScViewMode] = useState("list"); // 'list' | 'partsByType'
  const [selectedSCPartType, setSelectedSCPartType] = useState(null);

  // Handle navigation từ notification
  useEffect(() => {
    if (
      location.state?.fromNotification &&
      location.state?.highlightRequestId &&
      location.state?.activeTab === "requests"
    ) {
      // Chuyển sang tab requests
      setActiveTab("requests");

      // TODO: Scroll to and highlight the request
      // Có thể thêm logic highlight request sau khi fetch xong
    }
  }, [location]);

  useEffect(() => {
    if (activeTab === "inventory") {
      fetchInventory();
    } else {
      fetchPartsRequests();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const fetchInventory = async () => {
    try {
      setLoading(true);

      // Check role để gọi API tương ứng
      const isEVMRole =
        user?.role === "EVM_STAFF" || user?.role === "EVM_ADMIN";
      const isSCRole = user?.role === "SC_STAFF" || user?.role === "SC_ADMIN";

      let response;
      if (isEVMRole) {
        // EVM roles → fetch từ kho EVM
        response = await evmInventoryAPI.getAllPartTypes({
          page: 0,
          size: 100,
          sortBy: "partName",
          sortDir: "asc",
        });
      } else if (isSCRole) {
        // SC roles → fetch từ kho SC
        response = await scInventoryAPI.getAllPartTypes({
          page: 0,
          size: 100,
          sortBy: "partName",
          sortDir: "asc",
        });
      } else {
        // Unknown role
        console.error("Unknown user role:", user?.role);
        setInventory([]);
        setFilteredInventory([]);
        setLoading(false);
        return;
      }

      // ApiService wrap response: { success: true, data: Page<PartTypeDTO> }
      if (response.success && response.data?.content) {
        const inventoryData = response.data.content;
        setInventory(inventoryData);
        setFilteredInventory(inventoryData);

        // Extract unique categories from inventory data
        const categories = [
          ...new Set(inventoryData.map((item) => item.partName)),
        ].filter(Boolean);
        setAvailableCategories(categories);
      } else {
        console.error("No inventory data:", response);
        setInventory([]);
        setFilteredInventory([]);
      }
    } catch (error) {
      console.error("Fetch inventory error:", error);
      setInventory([]);
      setFilteredInventory([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPartsRequests = async () => {
    try {
      setLoading(true);

      const response = await partsRequestAPI.getAllPartsRequests({
        page: 0,
        size: 100,
        sortBy: "requestDate",
        sortDir: "desc",
      });
      // ApiService wrap response: { success: true, data: Page<PartsResponseListDTO> }
      if (response.success && response.data?.content) {
        // Transform to match PartsResponseListDTO from Backend
        const transformedRequests = response.data.content.map((request) => ({
          id: request.id,
          partNumber: request.partNumber,
          partName: request.partName,
          quantity: request.quantity,
          requestDate: request.requestDate,
          status: request.status, // Enum: PENDING, APPROVED, REJECTED, COMPLETED
          partTypeName: request.partTypeName || "N/A",
          vehicle: request.vehicle || null, // VehicleBasicInfoDTO
        }));

        setPartsRequests(transformedRequests);
        setFilteredPartsRequests(transformedRequests);
      } else {
        console.error("No parts requests data:", response);
        setPartsRequests([]);
        setFilteredPartsRequests([]);
      }
    } catch (error) {
      console.error("Fetch parts requests error:", error);
      setPartsRequests([]);
      setFilteredPartsRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (searchTerm, categoryFilter, statusFilter) => {
    if (activeTab === "inventory") {
      // Search trong inventory
      let filtered = inventory;

      if (searchTerm) {
        filtered = filtered.filter(
          (item) =>
            item.partName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.manufacturer &&
              item.manufacturer
                .toLowerCase()
                .includes(searchTerm.toLowerCase()))
        );
      }

      // Filter by category (partName)
      if (categoryFilter && categoryFilter !== "all") {
        filtered = filtered.filter((item) => item.partName === categoryFilter);
      }

      // Filter by stock status
      if (statusFilter && statusFilter !== "all") {
        filtered = filtered.filter((item) => {
          const stock = item.totalAmountOfProduct || 0;
          if (statusFilter === "IN_STOCK") return stock > 10;
          if (statusFilter === "LOW_STOCK") return stock > 0 && stock <= 10;
          if (statusFilter === "OUT_OF_STOCK") return stock === 0;
          return true;
        });
      }

      setFilteredInventory(filtered);
    } else {
      // Search trong parts requests
      let filtered = partsRequests;

      if (searchTerm) {
        filtered = filtered.filter(
          (request) =>
            request.partName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            request.partNumber
              .toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            request.id.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      if (categoryFilter && categoryFilter !== "all") {
        filtered = filtered.filter(
          (request) => request.partTypeName === categoryFilter
        );
      }

      if (statusFilter && statusFilter !== "all") {
        filtered = filtered.filter(
          (request) => request.status === statusFilter
        );
      }

      setFilteredPartsRequests(filtered);
    }
  };

  const handleAddPart = (prefilledPart = null) => {
    setEditingRequest(prefilledPart);
    setShowForm(true);
  };

  const handleEditPart = (request) => {
    setEditingRequest(request);
    setShowForm(true);
  };

  const handleDeletePart = async (requestId) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa yêu cầu phụ tùng này?")) {
      try {
        setLoading(true);
        const response = await partsRequestAPI.deletePartsRequest(requestId);

        if (response.success) {
          await fetchPartsRequests(); // Reload data
        } else {
          alert(response.message || "Không thể xóa yêu cầu");
        }
      } catch (error) {
        console.error("Delete error:", error);
        alert("Đã xảy ra lỗi khi xóa yêu cầu");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSavePart = async (requestData) => {
    try {
      setLoading(true);
      console.log("Saving parts request:", requestData);

      if (editingRequest) {
        // Update existing request
        const response = await partsRequestAPI.updatePartsRequest(
          editingRequest.id,
          requestData
        );

        console.log("Update response:", response);

        if (response.success) {
          toast.success("Cập nhật yêu cầu thành công!", {
            position: "top-right",
            autoClose: 3000,
          });
          await fetchPartsRequests(); // Reload data
        } else {
          toast.error(response.message || "Không thể cập nhật yêu cầu", {
            position: "top-right",
            autoClose: 5000,
          });
        }
      } else {
        // Create new parts request
        const response = await partsRequestAPI.createPartsRequest(requestData);

        console.log("Create response:", response);

        if (response.success) {
          toast.success("Tạo yêu cầu phụ tùng thành công!", {
            position: "top-right",
            autoClose: 3000,
          });
          await fetchPartsRequests(); // Reload data
        } else {
          toast.error(response.message || "Không thể tạo yêu cầu phụ tùng", {
            position: "top-right",
            autoClose: 5000,
          });
        }
      }

      setShowForm(false);
      setEditingRequest(null);
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Đã xảy ra lỗi hệ thống. Vui lòng kiểm tra console để biết chi tiết.", {
        position: "top-right",
        autoClose: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingRequest(null);
  };

  const handleApproveRequest = async (requestId) => {
    try {
      setLoading(true);
      await fetchPartsRequests(); // Reload to get updated data
      toast.success("Yêu cầu đã được duyệt thành công!", {
        position: "top-right",
        autoClose: 3000,
      });
    } catch (error) {
      console.error("Error after approving:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      setLoading(true);
      await fetchPartsRequests(); // Reload to get updated data
    } catch (error) {
      console.error("Error after rejecting:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStock = async (partTypeId, newStatus) => {
    try {
      setLoading(true);

      // Call API to update stock status
      const response = await evmInventoryAPI.updatePartTypeStatus(
        partTypeId,
        newStatus
      );

      if (response.success || response.data) {
        toast.success("Cập nhật trạng thái thành công!", {
          position: "top-right",
          autoClose: 3000,
        });
        // Refresh inventory to show updated status
        await fetchInventory();
      } else {
        toast.error(
          response.message || "Không thể cập nhật trạng thái phụ tùng",
          {
            position: "top-right",
            autoClose: 5000,
          }
        );
      }
    } catch (error) {
      console.error("Error updating stock status:", error);
      toast.error("Đã xảy ra lỗi khi cập nhật trạng thái", {
        position: "top-right",
        autoClose: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewPartsByType = (partTypeId, partName) => {
    setSelectedPartType({ id: partTypeId, name: partName });
    setViewMode("partsByType");
  };

  const handleBackToList = () => {
    setViewMode("list");
    setSelectedPartType(null);
  };

  const handleSCViewPartsByType = (partTypeId, partName) => {
    setSelectedSCPartType({ id: partTypeId, name: partName });
    setScViewMode("partsByType");
  };

  const handleBackToSCList = () => {
    setScViewMode("list");
    setSelectedSCPartType(null);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Đang tải dữ liệu phụ tùng...</p>
      </div>
    );
  }
  return (
    <div className="parts-management">
      <div className="page-header">
        <h1>Quản lý phụ tùng</h1>

        {/* Create button shown when not in form and user is SC_ADMIN and on requests tab */}
        {!showForm && user?.role === "SC_ADMIN" && activeTab === "requests" && (
          <div className="header-actions">
            <button onClick={() => handleAddPart(null)} className="btn btn-primary">
              <span>➕</span>
              Tạo yêu cầu phụ tùng
            </button>
          </div>
        )}
      </div>

      {showForm ? (
        <PartsForm part={editingRequest} onSave={handleSavePart} onCancel={handleCancelForm} />
      ) : (
        <>
          <div className="parts-tabs">
            <button
              className={`tab-btn ${activeTab === "inventory" ? "active" : ""}`}
              onClick={() => setActiveTab("inventory")}
            >
              Kho phụ tùng
            </button>

            {/* Show requests tab only for SC_ADMIN and EVM roles */}
            {(["SC_ADMIN", "EVM_STAFF", "EVM_ADMIN"].includes(user?.role)) && (
              <button
                className={`tab-btn ${activeTab === "requests" ? "active" : ""}`}
                onClick={() => setActiveTab("requests")}
              >
                Yêu cầu phụ tùng
              </button>
            )}
          </div>

          <PartsSearch onSearch={handleSearch} availableCategories={availableCategories} />

          {activeTab === "inventory" ? (
            // Inventory view: show EVM or SC inventory (and parts-by-type when selected)
            (user?.role === "EVM_STAFF" || user?.role === "EVM_ADMIN") ? (
              viewMode === "partsByType" ? (
                <PartsByTypeView partTypeId={selectedPartType?.id} partTypeName={selectedPartType?.name} onBack={handleBackToList} />
              ) : (
                <PartsInventoryListEVM
                  inventory={filteredInventory}
                  onUpdateStock={handleUpdateStock}
                  onViewPartsByType={handleViewPartsByType}
                />
              )
            ) : (
              scViewMode === "partsByType" ? (
                <SCPartsByTypeView partTypeId={selectedSCPartType?.id} partTypeName={selectedSCPartType?.name} onBack={handleBackToSCList} />
              ) : (
                <PartsInventoryListSC inventory={filteredInventory} onViewPartsByType={handleSCViewPartsByType} />
              )
            )
          ) : (
            <PartsList parts={filteredPartsRequests} onEdit={handleEditPart} onDelete={handleDeletePart} userRole={user?.role} />
          )}
        </>
      )}
    </div>
  );
}

export default PartsManagement;
