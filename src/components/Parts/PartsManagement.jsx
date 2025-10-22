import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import PartsList from "./PartsList";
import PartsForm from "./PartsForm";
import PartsSearch from "./PartsSearch";
import PartsRequest from "./PartsRequest";
import { partsRequestAPI } from "../../services/api";
import "../../styles/PartsManagement.css";

function PartsManagement() {
  const { user } = useAuth();
  const [parts, setParts] = useState([]);
  const [filteredParts, setFilteredParts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [editingPart, setEditingPart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("inventory");
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchParts();
  }, []);

  const fetchParts = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await partsRequestAPI.getAllPartsRequests({
        page: 0,
        size: 100,
        sortBy: "requestDate",
        sortDir: "desc",
      });

      if (response.success && response.data) {
        const transformedParts = response.data.content.map((part) => ({
          partsRequestId: part.partsRequestId,
          ID_Product_Serial_SC: part.partsRequestId,
          partNumber: part.partNumber,
          partName: part.partName,
          Name_Product: part.partName,
          quantity: part.quantity,
          Total_Amount_Of_Product: part.quantity,
          requestDate: part.requestDate,
          deliveryDate: part.deliveryDate,
          status: part.status,
          Status: part.status,
          partTypeId: part.partTypeId,
          Part_Name: part.partTypeId,
          vehicleId: part.vehicleId,
          // Default values for display
          Brand: "VinFast",
          Price: 0,
          Warranty_Period: 12,
          Description: part.partName,
          Condition: "Mới",
        }));

        setParts(transformedParts);
        setFilteredParts(transformedParts);
      } else {
        setError(response.message || "Không thể tải danh sách phụ tùng");
        setParts([]);
        setFilteredParts([]);
      }
    } catch (error) {
      console.error("Fetch parts error:", error);
      setError("Đã xảy ra lỗi khi tải dữ liệu");
      setParts([]);
      setFilteredParts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (searchTerm, categoryFilter, statusFilter) => {
    let filtered = parts;

    if (searchTerm) {
      filtered = filtered.filter(
        (part) =>
          part.Name_Product.toLowerCase().includes(searchTerm.toLowerCase()) ||
          part.Part_Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          part.ID_Product_Serial_SC.toLowerCase().includes(
            searchTerm.toLowerCase()
          )
      );
    }

    if (categoryFilter && categoryFilter !== "all") {
      filtered = filtered.filter((part) => part.Part_Name === categoryFilter);
    }

    if (statusFilter && statusFilter !== "all") {
      filtered = filtered.filter((part) => part.Status === statusFilter);
    }

    setFilteredParts(filtered);
  };

  const handleAddPart = () => {
    setEditingPart(null);
    setShowForm(true);
  };

  const handleEditPart = (part) => {
    setEditingPart(part);
    setShowForm(true);
  };

  const handleDeletePart = async (partId) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa phụ tùng này?")) {
      try {
        setLoading(true);
        const response = await partsRequestAPI.deletePartsRequest(partId);

        if (response.success) {
          await fetchParts(); // Reload data
        } else {
          alert(response.message || "Không thể xóa phụ tùng");
        }
      } catch (error) {
        console.error("Delete error:", error);
        alert("Đã xảy ra lỗi khi xóa phụ tùng");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSavePart = async (partData) => {
    try {
      setLoading(true);

      if (editingPart) {
        // Update existing part
        const response = await partsRequestAPI.updatePartsRequest(
          editingPart.partsRequestId || editingPart.ID_Product_Serial_SC,
          partData
        );

        if (response.success) {
          await fetchParts(); // Reload data
        } else {
          alert(response.message || "Không thể cập nhật phụ tùng");
        }
      } else {
        // Create new part request
        const response = await partsRequestAPI.createPartsRequest(partData);

        if (response.success) {
          await fetchParts(); // Reload data
        } else {
          alert(response.message || "Không thể tạo yêu cầu phụ tùng");
        }
      }

      setShowForm(false);
      setEditingPart(null);
    } catch (error) {
      console.error("Save error:", error);
      alert("Đã xảy ra lỗi khi lưu phụ tùng");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setShowRequestForm(false);
    setEditingPart(null);
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
        {!showForm && !showRequestForm && (
          <div className="header-actions">
            {(user?.role === "SC_STAFF" || user?.role === "SC_TECHNICAL") && (
              <button
                onClick={() => setShowRequestForm(true)}
                className="btn btn-secondary"
              >
                <span>📦</span>
                Yêu cầu phụ tùng
              </button>
            )}
            {(user?.role === "EVM_STAFF" || user?.role === "EVM_ADMIN") && (
              <button onClick={handleAddPart} className="btn btn-primary">
                <span>➕</span>
                Thêm phụ tùng
              </button>
            )}
          </div>
        )}
      </div>

      {!showForm && !showRequestForm ? (
        <>
          <div className="parts-tabs">
            <button
              className={`tab-btn ${activeTab === "inventory" ? "active" : ""}`}
              onClick={() => setActiveTab("inventory")}
            >
              Kho phụ tùng
            </button>
            <button
              className={`tab-btn ${activeTab === "requests" ? "active" : ""}`}
              onClick={() => setActiveTab("requests")}
            >
              Yêu cầu phụ tùng
            </button>
          </div>

          {activeTab === "inventory" ? (
            <>
              <PartsSearch onSearch={handleSearch} />
              <PartsList
                parts={filteredParts}
                onEdit={handleEditPart}
                onDelete={handleDeletePart}
                userRole={user?.role}
              />
            </>
          ) : (
            <PartsRequest userRole={user?.role} />
          )}
        </>
      ) : showForm ? (
        <PartsForm
          part={editingPart}
          onSave={handleSavePart}
          onCancel={handleCancelForm}
        />
      ) : (
        <PartsRequest
          userRole={user?.role}
          onCancel={handleCancelForm}
          isModal={true}
        />
      )}
    </div>
  );
}

export default PartsManagement;
