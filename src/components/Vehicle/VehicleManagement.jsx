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
  const [deleteConfirm, setDeleteConfirm] = useState({
    show: false,
    vehicleId: null,
    vehicleName: "",
  });

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

      if (
        response.success &&
        response.data?.content &&
        Array.isArray(response.data.content)
      ) {
        // Transform data từ BE sang format FE
        const transformedVehicles = response.data.content.map((vehicle) => {
          const transformed = {
            vehicleId: vehicle.id, // VIN
            VIN: vehicle.id,
            Vehicle_Name: vehicle.name,
            Owner: vehicle.owner,
            Phone_Number: vehicle.phoneNumber,
            Email: vehicle.email,
            Status: VEHICLE_STATUS[vehicle.status] || vehicle.status,
            Total_KM: vehicle.totalKm,
            Purchase_Date: vehicle.purchaseDate,
            Picture: vehicle.picture,
            Usage_Type: vehicle.usageType || "PERSONAL", // ✅ ADD USAGE TYPE from backend
            // Vehicle Type info - using flat fields from ListResponseDTO
            Vehicle_Type: vehicle.modelName || "N/A",
            Vehicle_Type_ID: vehicle.vehicleTypeId || null,
          };
          return transformed;
        });

        setVehicles(transformedVehicles);
        setFilteredVehicles(transformedVehicles);
      } else {
        const errorMsg = response.message || "Không thể tải danh sách xe";
        toast.error(errorMsg);
      }
    } catch {
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

  const handleDeleteVehicle = (vehicleId) => {
    // Find vehicle name for confirmation message
    const vehicle = vehicles.find((v) => v.vehicleId === vehicleId);
    const vehicleName = vehicle
      ? `${vehicle.vehicleType?.modelName || ""} (${vehicleId})`
      : vehicleId;

    // Show confirmation dialog
    setDeleteConfirm({
      show: true,
      vehicleId: vehicleId,
      vehicleName: vehicleName,
    });
  };

  const confirmDeleteVehicle = async () => {
    try {
      setLoading(true);
      const response = await vehicleAPI.deleteVehicle(deleteConfirm.vehicleId);

      if (response.success) {
        await fetchVehicles();
        toast.success("Xóa xe thành công!");
      } else {
        toast.error(response.message || "Không thể xóa xe");
      }
    } catch {
      toast.error("Đã xảy ra lỗi khi xóa xe");
    } finally {
      setLoading(false);
      setDeleteConfirm({ show: false, vehicleId: null, vehicleName: "" });
    }
  };

  const cancelDeleteVehicle = () => {
    setDeleteConfirm({ show: false, vehicleId: null, vehicleName: "" });
  };

  const handleSaveVehicle = async (vehicleData, imageFile) => {
    try {
      setLoading(true);

      if (editingVehicle) {
        // Update existing vehicle - use VIN as ID
        // Check duplicate phone (excluding current vehicle)
        const duplicatePhone = vehicles.find(
          (v) =>
            v.Phone_Number === vehicleData.phoneNumber &&
            v.VIN !== editingVehicle.VIN
        );
        if (duplicatePhone) {
          toast.error("Số điện thoại đã được sử dụng bởi xe khác!");
          setLoading(false);
          return;
        }
        const response = await vehicleAPI.updateVehicleWithImage(
          editingVehicle.VIN,
          vehicleData,
          imageFile
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
        // Thêm xe mới - Check duplicates
        const duplicateVIN = vehicles.find(
          (v) => v.VIN === vehicleData.vehicleId
        );
        if (duplicateVIN) {
          toast.error("VIN đã tồn tại trong hệ thống!");
          setLoading(false);
          return;
        }

        const duplicatePhone = vehicles.find(
          (v) => v.Phone_Number === vehicleData.phoneNumber
        );
        if (duplicatePhone) {
          toast.error("Số điện thoại đã được sử dụng bởi xe khác!");
          setLoading(false);
          return;
        }
        const response = await vehicleAPI.createVehicleWithImage(
          vehicleData,
          imageFile
        );
        if (response.success) {
          await fetchVehicles();
          setShowForm(false);
          setEditingVehicle(null);
          toast.success("Thêm xe mới thành công!");
        } else {
          toast.error(response.message || "Không thể thêm xe mới");
        }
      }
    } catch {
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

      {/* Delete Confirmation Dialog */}
      {deleteConfirm.show && (
        <div className="delete-overlay" onClick={cancelDeleteVehicle}>
          <div className="delete-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="delete-icon">⚠️</div>
            <h3 className="delete-title">Xóa xe này?</h3>
            <p className="delete-message">
              Xe{" "}
              <span className="delete-vehicle-name">
                {deleteConfirm.vehicleName}
              </span>{" "}
              sẽ bị xóa vĩnh viễn khỏi hệ thống.
            </p>
            <div className="delete-actions">
              <button
                className="delete-btn-cancel"
                onClick={cancelDeleteVehicle}
              >
                Không, giữ lại
              </button>
              <button
                className="delete-btn-confirm"
                onClick={confirmDeleteVehicle}
              >
                Có, xóa ngay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default VehicleManagement;
