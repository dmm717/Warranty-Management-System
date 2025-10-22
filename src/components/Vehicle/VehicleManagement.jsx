import React, { useState, useEffect } from "react";
import VehicleList from "./VehicleList";
import VehicleForm from "./VehicleForm";
import VehicleSearch from "./VehicleSearch";
import { vehicleAPI } from "../../services/api";
import { VEHICLE_STATUS } from "../../constants";
import { toast } from "react-toastify";
import "../../styles/VehicleManagement.css";

function VehicleManagement() {
  const [vehicles, setVehicles] = useState([]);
  const [filteredVehicles, setFilteredVehicles] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch vehicles từ API
  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      setLoading(true);

      const response = await vehicleAPI.getAllVehicles({
        page: 0,
        size: 100,
        sortBy: "name",
        sortDir: "asc",
      });

      if (response.success && response.data) {
        // Transform data từ BE sang format FE
        const transformedVehicles = response.data.content.map((vehicle) => ({
          Vehicle_ID: vehicle.vehicleId,
          Vehicle_Name: vehicle.vehicleName,
          VIN: vehicle.vehicleId,
          Owner: vehicle.owner,
          Phone_Number: vehicle.phoneNumber,
          Email: vehicle.email,
          Status: VEHICLE_STATUS[vehicle.status] || vehicle.status,
          Total_KM: vehicle.totalKm,
          Production_Date: vehicle.productionDate,
          ID_Electric_Vehicle_Type: vehicle.electricVehicleTypeId,
          Picture: vehicle.picture,
        }));

        setVehicles(transformedVehicles);
        setFilteredVehicles(transformedVehicles);
      } else {
        console.error("Failed to fetch vehicles:", response.message);
        toast.error(response.message || "Không thể tải danh sách xe");
      }
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      toast.error("Đã xảy ra lỗi khi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

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

  const handleDeleteVehicle = async (vehicleId) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa xe này?")) {
      try {
        setLoading(true);
        const response = await vehicleAPI.deleteVehicle(vehicleId);

        if (response.success) {
          // Reload vehicles
          await fetchVehicles();
          toast.success("Xóa xe thành công!");
        } else {
          toast.error(response.message || "Không thể xóa xe");
        }
      } catch (error) {
        console.error("Delete error:", error);
        toast.error("Đã xảy ra lỗi khi xóa xe");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSaveVehicle = async (vehicleData) => {
    try {
      setLoading(true);

      if (editingVehicle) {
        // Update existing vehicle
        const response = await vehicleAPI.updateVehicle(
          editingVehicle.Vehicle_ID,
          vehicleData
        );

        if (response.success) {
          await fetchVehicles();
          setShowForm(false);
          setEditingVehicle(null);
          toast.success("Cập nhật thông tin xe thành công!");
        } else {
          toast.error(response.message || "Không thể cập nhật thông tin xe");
        }
      } else {
        // Thêm xe mới
        const response = await vehicleAPI.createVehicle(vehicleData);

        if (response.success) {
          await fetchVehicles();
          setShowForm(false);
          setEditingVehicle(null);
          toast.success("Thêm xe mới thành công!");
        } else {
          toast.error(response.message || "Không thể thêm xe mới");
        }
      }
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Đã xảy ra lỗi khi lưu thông tin xe");
    } finally {
      setLoading(false);
    }
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
