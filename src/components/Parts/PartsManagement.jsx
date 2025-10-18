import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import PartsList from "./PartsList";
import PartsForm from "./PartsForm";
import PartsSearch from "./PartsSearch";
import PartsRequest from "./PartsRequest";
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

  useEffect(() => {
    const mockParts = [
      {
        ID_Product_Serial_SC: "PS001",
        Name_Product: "Pin Lithium 75kWh",
        Brand: "VinFast",
        Price: 300000000,
        Warranty_Period: 96,
        Description: "Pin chính cho VF8",
        Year_of_Manufacture: "2023-06-15",
        Part_Name: "Battery Pack",
        Total_Amount_Of_Product: 25,
        Manufacturer: "VinFast",
        Condition: "Mới",
        Status: "Có sẵn",
      },
      {
        ID_Product_Serial_SC: "PS002",
        Name_Product: "Motor điện 150kW",
        Brand: "VinFast",
        Price: 180000000,
        Warranty_Period: 60,
        Description: "Motor chính cho VF9",
        Year_of_Manufacture: "2023-07-20",
        Part_Name: "Electric Motor",
        Total_Amount_Of_Product: 15,
        Manufacturer: "VinFast",
        Condition: "Mới",
        Status: "Có sẵn",
      },
      {
        ID_Product_Serial_SC: "PS003",
        Name_Product: "BMS Controller",
        Brand: "VinFast",
        Price: 45000000,
        Warranty_Period: 48,
        Description: "Bộ quản lý pin",
        Year_of_Manufacture: "2023-08-10",
        Part_Name: "BMS",
        Total_Amount_Of_Product: 8,
        Manufacturer: "VinFast",
        Condition: "Mới",
        Status: "Thiếu hàng",
      },
    ];

    setTimeout(() => {
      setParts(mockParts);
      setFilteredParts(mockParts);
      setLoading(false);
    }, 1000);
  }, []);

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

  const handleDeletePart = (partId) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa phụ tùng này?")) {
      const updatedParts = parts.filter(
        (p) => p.ID_Product_Serial_SC !== partId
      );
      setParts(updatedParts);
      setFilteredParts(updatedParts);
    }
  };

  const handleSavePart = (partData) => {
    if (editingPart) {
      const updatedParts = parts.map((p) =>
        p.ID_Product_Serial_SC === editingPart.ID_Product_Serial_SC
          ? { ...p, ...partData }
          : p
      );
      setParts(updatedParts);
      setFilteredParts(updatedParts);
    } else {
      const newPart = {
        ...partData,
        ID_Product_Serial_SC: `PS${String(parts.length + 1).padStart(3, "0")}`,
      };
      const updatedParts = [...parts, newPart];
      setParts(updatedParts);
      setFilteredParts(updatedParts);
    }
    setShowForm(false);
    setEditingPart(null);
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
            {(user?.role === "SC_Staff" || user?.role === "SC_Technician") && (
              <button
                onClick={() => setShowRequestForm(true)}
                className="btn btn-secondary"
              >
                <span>📦</span>
                Yêu cầu phụ tùng
              </button>
            )}
            {(user?.role === "EVM_Staff" || user?.role === "Admin") && (
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
