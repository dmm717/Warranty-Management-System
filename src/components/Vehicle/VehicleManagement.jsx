import React, { useState, useEffect } from "react";
import VehicleList from "./VehicleList";
import VehicleForm from "./VehicleForm";
import VehicleSearch from "./VehicleSearch";
import "./VehicleManagement.css";

function VehicleManagement() {
  const [vehicles, setVehicles] = useState([]);
  const [filteredVehicles, setFilteredVehicles] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [loading, setLoading] = useState(true);

  // Mock data - replace với API calls
  useEffect(() => {
    const mockVehicles = [
      {
        Vehicle_ID: "VH001",
        Vehicle_Name: "VinFast VF8",
        VIN: "VF8ABC12345678901",
        Owner: "Nguyễn Văn An",
        Phone_Number: "0912345678",
        Email: "nguyenvanan@email.com",
        Status: "Đang sử dụng",
        Total_KM: 15230.5,
        Production_Date: "2023-05-15",
        ID_Electric_Vehicle_Type: "EVT001",
      },
      {
        Vehicle_ID: "VH002",
        Vehicle_Name: "VinFast VF9",
        VIN: "VF9DEF12345678902",
        Owner: "Trần Thị Bình",
        Phone_Number: "0987654321",
        Email: "tranthibinh@email.com",
        Status: "Bảo hành",
        Total_KM: 8750.2,
        Production_Date: "2023-08-20",
        ID_Electric_Vehicle_Type: "EVT002",
      },
      {
        Vehicle_ID: "VH003",
        Vehicle_Name: "VinFast VF8",
        VIN: "VF8GHI12345678903",
        Owner: "Lê Minh Cường",
        Phone_Number: "0901234567",
        Email: "leminhcuong@email.com",
        Status: "Đang sử dụng",
        Total_KM: 22100.8,
        Production_Date: "2023-03-10",
        ID_Electric_Vehicle_Type: "EVT001",
      },
    ];

    setTimeout(() => {
      setVehicles(mockVehicles);
      setFilteredVehicles(mockVehicles);
      setLoading(false);
    }, 1000);
  }, []);

  const handleSearch = (searchTerm, filterType) => {
    let filtered = vehicles;

    if (searchTerm) {
      filtered = filtered.filter(
        (vehicle) =>
          vehicle.VIN.toLowerCase().includes(searchTerm.toLowerCase()) ||
          vehicle.Owner.toLowerCase().includes(searchTerm.toLowerCase()) ||
          vehicle.Phone_Number.includes(searchTerm) ||
          vehicle.Vehicle_Name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterType && filterType !== "all") {
      filtered = filtered.filter((vehicle) => vehicle.Status === filterType);
    }

    setFilteredVehicles(filtered);
  };

  const handleAddVehicle = () => {
    setEditingVehicle(null);
    setShowForm(true);
  };

  const handleEditVehicle = (vehicle) => {
    setEditingVehicle(vehicle);
    setShowForm(true);
  };

  const handleDeleteVehicle = (vehicleId) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa xe này?")) {
      const updatedVehicles = vehicles.filter(
        (v) => v.Vehicle_ID !== vehicleId
      );
      setVehicles(updatedVehicles);
      setFilteredVehicles(updatedVehicles);
    }
  };

  const handleSaveVehicle = (vehicleData) => {
    if (editingVehicle) {
      // Update existing vehicle
      const updatedVehicles = vehicles.map((v) =>
        v.Vehicle_ID === editingVehicle.Vehicle_ID
          ? { ...v, ...vehicleData }
          : v
      );
      setVehicles(updatedVehicles);
      setFilteredVehicles(updatedVehicles);
    } else {
      // Add new vehicle
      const newVehicle = {
        ...vehicleData,
        Vehicle_ID: `VH${String(vehicles.length + 1).padStart(3, "0")}`,
      };
      const updatedVehicles = [...vehicles, newVehicle];
      setVehicles(updatedVehicles);
      setFilteredVehicles(updatedVehicles);
    }
    setShowForm(false);
    setEditingVehicle(null);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingVehicle(null);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Đang tải dữ liệu xe...</p>
      </div>
    );
  }

  return (
    <div className="vehicle-management">
      <div className="page-header">
        <h1>Quản lý xe</h1>
        <button onClick={handleAddVehicle} className="btn btn-primary">
          <span>➕</span>
          Đăng ký xe mới
        </button>
      </div>

      {!showForm ? (
        <>
          <VehicleSearch onSearch={handleSearch} />
          <VehicleList
            vehicles={filteredVehicles}
            onEdit={handleEditVehicle}
            onDelete={handleDeleteVehicle}
          />
        </>
      ) : (
        <VehicleForm
          vehicle={editingVehicle}
          onSave={handleSaveVehicle}
          onCancel={handleCancelForm}
        />
      )}
    </div>
  );
}

export default VehicleManagement;
