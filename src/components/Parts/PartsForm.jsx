import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { evmInventoryAPI, vehicleAPI } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import "../../styles/PartsForm.css";

// Temporary EVM Part Types - TODO: Get from Backend API /api/evm/part-types

function PartsForm({ part, onSave, onCancel }) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    partTypeId: "",
    quantity: 1,
    vin: "",
  });

  const [errors, setErrors] = useState({});
  const [partTypes, setPartTypes] = useState([]);
  const [filteredPartTypes, setFilteredPartTypes] = useState([]);
  const [partSearchTerm, setPartSearchTerm] = useState("");
  const [showPartDropdown, setShowPartDropdown] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPartTypes();
    fetchVehicles();

    if (part) {
      setFormData({
        partTypeId: part.partType?.id || part.partTypeId || "",
        quantity: part.quantity || 1,
        vin: part.vin || part.vehicleId || "",
      });
    }
  }, [part]);

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

  const fetchVehicles = async () => {
    try {
      const response = await vehicleAPI.getAllVehicles({ page: 0, size: 100 });
      if (response.success && response.data?.content) {
        setVehicles(response.data.content);
      }
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      toast.error("Không thể tải danh sách xe");
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

    if (!formData.partTypeId) {
      newErrors.partTypeId = "Phụ tùng yêu cầu là bắt buộc";
    }

    if (!formData.quantity || formData.quantity < 1) {
      newErrors.quantity = "Số lượng phải lớn hơn 0";
    }

    // VIN is required according to PartsRequestCreateDTO @NotBlank
    if (!formData.vin || formData.vin.trim() === "") {
      newErrors.vin = "VIN xe là bắt buộc";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      // Get selected part info from API response
      const selectedPart = partTypes.find(
        (pt) => pt.id === formData.partTypeId
      );

      if (!selectedPart) {
        toast.error("Vui lòng chọn phụ tùng hợp lệ");
        return;
      }

      // Validate user data from API
      if (!user?.id) {
        toast.error("Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.");
        return;
      }

      // Format date to yyyy-MM-dd
      const formatDate = (date) => {
        if (!date) return null;
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      };

      const today = formatDate(new Date());

      // Transform to match Backend PartsRequestCreateDTO
      // All data comes from API responses, not hardcoded
      const requestData = {
        partName: selectedPart.partName, // @NotBlank - From API: evmInventoryAPI.getAllPartTypesNoPagination()
        quantity: parseInt(formData.quantity) || 1, // @NotNull, @Min(1)
        requestDate: today, // @NotNull LocalDate
        deliveryDate: today, // Optional LocalDate
        partTypeId: selectedPart.id, // @NotBlank - From API: selected part type ID
        vin: formData.vin.trim(), // @NotBlank - Required VIN
        requestedByStaffId: String(user.id), // @NotBlank String - Must be String, not number
        branchOffice: user.branchOffice || "", // @NotBlank - From API: AuthContext user.branchOffice from login response
      };

      // Validate required fields according to PartsRequestCreateDTO
      if (!requestData.partTypeId) {
        toast.error("Vui lòng chọn loại phụ tùng");
        return;
      }

      if (!requestData.quantity || requestData.quantity < 1) {
        toast.error("Số lượng phải lớn hơn 0");
        return;
      }

      if (!requestData.vin || requestData.vin.trim() === "") {
        toast.error("Vui lòng chọn VIN xe");
        return;
      }

      if (!requestData.branchOffice || requestData.branchOffice.trim() === "") {
        toast.error("Không tìm thấy thông tin chi nhánh. Vui lòng đăng nhập lại.");
        return;
      }

      // Log request data chi tiết để debug
      console.log("========================================");
      console.log("[PartsForm] REQUEST BODY sẽ gửi đến Backend:");
      console.log(JSON.stringify(requestData, null, 2));
      console.log("----------------------------------------");
      console.log("[PartsForm] Chi tiết từng field:");
      console.log("- partName:", requestData.partName, "(type:", typeof requestData.partName + ")");
      console.log("- quantity:", requestData.quantity, "(type:", typeof requestData.quantity + ")");
      console.log("- requestDate:", requestData.requestDate, "(type:", typeof requestData.requestDate + ")");
      console.log("- deliveryDate:", requestData.deliveryDate, "(type:", typeof requestData.deliveryDate + ")");
      console.log("- partTypeId:", requestData.partTypeId, "(type:", typeof requestData.partTypeId + ")");
      console.log("- vin:", requestData.vin, "(type:", typeof requestData.vin + ")");
      console.log("- requestedByStaffId:", requestData.requestedByStaffId, "(type:", typeof requestData.requestedByStaffId + ")");
      console.log("- branchOffice:", requestData.branchOffice, "(type:", typeof requestData.branchOffice + ")");
      console.log("----------------------------------------");
      console.log("[PartsForm] User info từ AuthContext:");
      console.log("- user.id:", user.id, "(type:", typeof user.id + ")");
      console.log("- user.branchOffice:", user.branchOffice, "(type:", typeof user.branchOffice + ")");
      console.log("- user.role:", user?.role);
      console.log("========================================");
      
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
          <div className="form-group" style={{ position: "relative" }}>
            <label className="form-label">
              <span className="label-icon">🔧</span>
              Phụ tùng yêu cầu <span className="required">*</span>
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

          <div className="form-group">
            <label className="form-label">
              <span className="label-icon">🚗</span>
              VIN xe <span className="required">*</span>
            </label>
            <select
              name="vin"
              value={formData.vin}
              onChange={handleChange}
              className={`form-control ${errors.vin ? "error" : ""}`}
              disabled={loading}
            >
              <option value="">-- Chọn VIN xe --</option>
              {vehicles.map((vehicle) => (
                <option key={vehicle.vehicleId || vehicle.id} value={vehicle.vehicleId || vehicle.id}>
                  {vehicle.vehicleId || vehicle.id} - {vehicle.name || vehicle.vehicleName || "N/A"}
                </option>
              ))}
            </select>
            {errors.vin && (
              <div className="error-message">⚠️ {errors.vin}</div>
            )}
            <small className="form-help">
              Chọn VIN xe cần yêu cầu phụ tùng (bắt buộc)
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
              ? "✅ Yêu cầu"
              : "✅ Tạo yêu cầu"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default PartsForm;
