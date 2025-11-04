import React, { useState, useEffect } from "react";
import { vehicleAPI, evmInventoryAPI } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import "../../styles/PartsForm.css";

// Temporary EVM Part Types - TODO: Get from Backend API /api/evm/part-types
const PART_TYPES = [
  { id: "EVM-PT001", name: "Pin (Battery)" },
  { id: "EVM-PT002", name: "Động cơ điện (Electric Motor)" },
  { id: "EVM-PT003", name: "Bộ sạc (Charger)" },
  { id: "EVM-PT004", name: "Hệ thống phanh (Brake System)" },
  { id: "EVM-PT005", name: "Lốp xe (Tires)" },
  { id: "EVM-PT006", name: "Đèn (Lights)" },
  { id: "EVM-PT007", name: "Camera (Camera)" },
  { id: "EVM-PT008", name: "Màn hình điều khiển (Display)" },
];

function PartsForm({ part, onSave, onCancel }) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    vehicleId: "",
    partTypeId: "",
    quantity: 1,
  });

  const [errors, setErrors] = useState({});
  const [vehicles, setVehicles] = useState([]);
  const [partTypes, setPartTypes] = useState([]);
  const [filteredPartTypes, setFilteredPartTypes] = useState([]);
  const [partSearchTerm, setPartSearchTerm] = useState("");
  const [showPartDropdown, setShowPartDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchVehicles();
    fetchPartTypes();

    if (part) {
      setFormData({
        vehicleId: part.vehicle?.id || part.vehicleId || "",
        partTypeId: part.partType?.id || part.partTypeId || "",
        quantity: part.quantity || 1,
      });
    }
  }, [part]);

  const fetchVehicles = async () => {
    try {
      const response = await vehicleAPI.getAllVehicles({
        page: 0,
        size: 100,
        sortBy: "name",
        sortDir: "asc",
      });

      if (response.success && response.data?.content) {
        setVehicles(response.data.content);
      }
    } catch (error) {
      console.error("Error fetching vehicles:", error);
    }
  };

  const fetchPartTypes = async () => {
    try {
      setLoading(true);
      // Get all EVM part types for dropdown
      const response = await evmInventoryAPI.getAllPartTypesNoPagination();

      if (response.success && response.data) {
        setPartTypes(response.data);
        setFilteredPartTypes(response.data);
      }
    } catch (error) {
      console.error("Error fetching part types:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePartSearch = (e) => {
    const searchValue = e.target.value;
    setPartSearchTerm(searchValue);
    setShowPartDropdown(true);

    if (searchValue.trim() === "") {
      setFilteredPartTypes(partTypes);
    } else {
      const filtered = partTypes.filter((part) => {
        const searchLower = searchValue.toLowerCase();
        return (
          part.id?.toLowerCase().includes(searchLower) ||
          part.partName?.toLowerCase().includes(searchLower) ||
          part.manufacturer?.toLowerCase().includes(searchLower) ||
          part.partNumber?.toLowerCase().includes(searchLower)
        );
      });
      setFilteredPartTypes(filtered);
    }
  };

  const handleSelectPart = (part) => {
    setFormData((prev) => ({
      ...prev,
      partTypeId: part.id,
    }));
    setPartSearchTerm(`${part.partName} - ${part.manufacturer || "N/A"}`);
    setShowPartDropdown(false);

    if (errors.partTypeId) {
      setErrors((prev) => ({
        ...prev,
        partTypeId: "",
      }));
    }
  };

  const getStockStatusBadge = (status) => {
    const statusMap = {
      IN_STOCK: { label: "Còn hàng", color: "#22c55e" },
      LOW_STOCK: { label: "Sắp hết", color: "#f59e0b" },
      OUT_OF_STOCK: { label: "Hết hàng", color: "#ef4444" },
    };
    const info = statusMap[status] || { label: status, color: "#6b7280" };
    return (
      <span
        style={{
          color: info.color,
          fontSize: "12px",
          fontWeight: "600",
          marginLeft: "8px",
        }}
      >
        [{info.label}]
      </span>
    );
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.vehicleId) {
      newErrors.vehicleId = "VIN xe là bắt buộc";
    }

    if (!formData.partTypeId) {
      newErrors.partTypeId = "Phụ tùng cần thay thế là bắt buộc";
    }

    if (!formData.quantity || formData.quantity < 1) {
      newErrors.quantity = "Số lượng phải lớn hơn 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      // Get selected part info
      const selectedPart = partTypes.find(
        (pt) => pt.id === formData.partTypeId
      );
      const selectedVehicle = vehicles.find((v) => v.id === formData.vehicleId);

      // Transform to match Backend PartsRequestCreateDTO
      const requestData = {
        partNumber: selectedPart?.id || formData.partTypeId,
        partName: selectedPart?.partName || "",
        quantity: parseInt(formData.quantity),
        requestDate: new Date().toISOString().split("T")[0],
        deliveryDate: null,
        partTypeId: formData.partTypeId,
        vin: selectedVehicle?.id || formData.vehicleId, // Send VIN (vehicle ID)
        requestedByStaffId: user?.id || "", // Current user ID
        branchOffice: user?.branchOffice || "", // User's branch
      };

      console.log("Sending parts request:", requestData);
      onSave(requestData);
    }
  };

  return (
    <div className="parts-form card">
      <div className="card-header">
        <h3 className="card-title">
          {part ? "Chỉnh sửa yêu cầu phụ tùng" : "Tạo yêu cầu phụ tùng mới"}
        </h3>
      </div>

      <form onSubmit={handleSubmit} className="form">
        <div className="form-section">
          <div className="form-group">
            <label className="form-label">
              <span className="label-icon">🚗</span>
              VIN Xe <span className="required">*</span>
            </label>
            <select
              name="vehicleId"
              value={formData.vehicleId}
              onChange={handleChange}
              className={`form-control ${errors.vehicleId ? "error" : ""}`}
              disabled={loading}
            >
              <option value="">-- Chọn xe cần thay phụ tùng --</option>
              {vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  VIN: {vehicle.id} - {vehicle.name} - Chủ xe: {vehicle.owner}
                </option>
              ))}
            </select>
            {errors.vehicleId && (
              <div className="error-message">⚠️ {errors.vehicleId}</div>
            )}
            <small className="form-help">Chọn xe cần thay thế phụ tùng</small>
          </div>

          <div className="form-group" style={{ position: "relative" }}>
            <label className="form-label">
              <span className="label-icon">🔧</span>
              Phụ tùng cần thay thế <span className="required">*</span>
            </label>
            <input
              type="text"
              value={partSearchTerm}
              onChange={handlePartSearch}
              onFocus={() => setShowPartDropdown(true)}
              className={`form-control ${errors.partTypeId ? "error" : ""}`}
              placeholder="🔍 Tìm kiếm theo tên, ID, nhà sản xuất..."
              disabled={loading}
              autoComplete="off"
            />
            {errors.partTypeId && (
              <div className="error-message">⚠️ {errors.partTypeId}</div>
            )}

            {showPartDropdown && filteredPartTypes.length > 0 && (
              <div className="parts-dropdown">
                <div className="parts-dropdown-header">
                  <strong>{filteredPartTypes.length}</strong> phụ tùng tìm thấy
                  <button
                    type="button"
                    onClick={() => setShowPartDropdown(false)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "18px",
                      color: "#666",
                    }}
                  >
                    ✕
                  </button>
                </div>
                <div className="parts-dropdown-list">
                  {filteredPartTypes.map((partType) => (
                    <div
                      key={partType.id}
                      className="parts-dropdown-item"
                      onClick={() => handleSelectPart(partType)}
                    >
                      <div className="part-item-header">
                        <strong style={{ color: "#1e40af", fontSize: "14px" }}>
                          {partType.partName}
                        </strong>
                        {partType.stockStatus &&
                          getStockStatusBadge(partType.stockStatus)}
                      </div>
                      <div className="part-item-details">
                        <span style={{ fontSize: "12px", color: "#666" }}>
                          🆔 {partType.id} | 🏭 {partType.manufacturer || "N/A"}
                          {partType.partNumber &&
                            ` | 🔢 ${partType.partNumber}`}
                        </span>
                      </div>
                      <div className="part-item-stock">
                        <span
                          style={{
                            fontSize: "12px",
                            color: "#059669",
                            fontWeight: "500",
                          }}
                        >
                          📦 Tồn kho:{" "}
                          {partType.totalAmountOfProduct !== undefined
                            ? partType.totalAmountOfProduct
                            : "N/A"}
                        </span>
                        {partType.warrantyPeriod && (
                          <span
                            style={{
                              fontSize: "12px",
                              color: "#7c3aed",
                              marginLeft: "10px",
                            }}
                          >
                            🛡️ BH: {partType.warrantyPeriod} tháng
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <small className="form-help">
              Tìm kiếm và chọn phụ tùng từ kho trung tâm EVM
            </small>
          </div>

          <div className="form-group">
            <label className="form-label">
              <span className="label-icon">📦</span>
              Số lượng <span className="required">*</span>
            </label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              className={`form-control ${errors.quantity ? "error" : ""}`}
              placeholder="Nhập số lượng cần yêu cầu"
              min="1"
              max="100"
            />
            {errors.quantity && (
              <div className="error-message">⚠️ {errors.quantity}</div>
            )}
            <small className="form-help">
              Số lượng phụ tùng cần yêu cầu (tối thiểu: 1)
            </small>
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-outline"
            disabled={loading}
          >
            ❌ Hủy
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading
              ? "⏳ Đang tải..."
              : part
              ? "✏️ Cập nhật"
              : "✅ Tạo yêu cầu"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default PartsForm;
