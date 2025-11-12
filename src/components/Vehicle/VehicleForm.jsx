import React, { useState, useEffect } from "react";
import { transformVehicleToBackend } from "../../services/api";
import { VEHICLE_TYPES, VEHICLE_STATUS_OPTIONS } from "../../constants";
import { toast } from "react-toastify";
import "../../styles/VehicleForm.css";

function VehicleForm({ vehicle, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    VIN: "",
    Owner: "",
    Phone_Number: "",
    Email: "",
    Status: "ACTIVE",
    Total_KM: 0,
    Purchase_Date: "",
    ID_Electric_Vehicle_Type: "",
    Picture: "",
    Usage_Type: "PERSONAL", // New field for usage type
  });

  const [imageFile, setImageFile] = useState(null); // Store actual file
  const [imagePreview, setImagePreview] = useState(""); // Store preview URL
  const [errors, setErrors] = useState({});

  // Generate sample VIN based on selected vehicle type (ISO 3779 format - 17 chars)
  const generateSampleVIN = () => {
    const typeId = formData.ID_Electric_Vehicle_Type;
    if (!typeId) {
      toast.warning("Vui lòng chọn loại xe trước!");
      return;
    }

    // Map vehicle type ID to model code
    const modelMap = {
      EVT001: "VF3",
      EVT002: "VF5",
      EVT003: "VF6",
      EVT004: "VF7",
      EVT005: "VF8",
      EVT006: "VF9",
      EVT007: "E34",
      EVT008: "LMG", // Limo Green
      EVT009: "MNG", // Minio Green
      EVT010: "HRG", // Herio Green
      EVT011: "NRG", // Nerio Green
    };

    const model = modelMap[typeId] || "VF8";

    // WMI (3 chars): VNA (VinFast Vietnam - Assembly line A)
    const wmi = "VNA";

    // VDS (6 chars): Model(3) + Variant(1) + Motor(1) + Check(1)
    const variant = "S"; // S=Standard, P=Plus, L=Lux, E=Eco
    const motor = "E"; // E=Electric
    const vds = `${model.padEnd(3, "0")}${variant}${motor}0`;

    // VIS (8 chars): Year(1) + Plant(1) + Serial(6)
    const yearChar = "S"; // S=2025, R=2024, P=2023...
    const plant = "H"; // H=Hai Phong, T=Test facility
    const serial = Math.floor(Math.random() * 1000000)
      .toString()
      .padStart(6, "0");
    const vis = `${yearChar}${plant}${serial}`;

    const sampleVIN = wmi + vds + vis;

    setFormData((prev) => ({ ...prev, VIN: sampleVIN }));
    toast.success(`VIN mẫu đã tạo: ${sampleVIN}`);
  };

  // Reverse mapping: Vietnamese label -> enum key
  const getStatusKey = (statusValue) => {
    if (!statusValue) return "ACTIVE";

    // If already enum key, return as is
    const validKeys = [
      "ACTIVE",
      "IN_WARRANTY",
      "INACTIVE",
      "RECALLED",
      "RETIRED",
    ];
    if (validKeys.includes(statusValue)) return statusValue;

    // Map Vietnamese to enum key
    const statusMap = {
      "Đang sử dụng": "ACTIVE",
      "Trong bảo hành": "IN_WARRANTY",
      "Ngừng hoạt động": "INACTIVE",
      "Đã triệu hồi": "RECALLED",
      "Đã thanh lý": "RETIRED",
    };

    return statusMap[statusValue] || "ACTIVE";
  };

  useEffect(() => {
    if (vehicle) {
      const vehicleTypeId =
        vehicle.Vehicle_Type_ID || vehicle.ID_Electric_Vehicle_Type || "";
      const newFormData = {
        VIN: vehicle.VIN || "",
        Owner: vehicle.Owner || "",
        Phone_Number: vehicle.Phone_Number || "",
        Email: vehicle.Email || "",
        Status: getStatusKey(vehicle.Status),
        Total_KM: vehicle.Total_KM || 0,
        Purchase_Date: vehicle.Purchase_Date || "",
        ID_Electric_Vehicle_Type: vehicleTypeId,
        Picture: vehicle.Picture || "",
        Usage_Type: vehicle.usageType || vehicle.Usage_Type || "PERSONAL", // Backend returns 'usageType' (camelCase)
      };
      setFormData(newFormData);

      // Load existing image preview from database
      if (
        vehicle.Picture &&
        vehicle.Picture !== "default-vehicle.jpg" &&
        vehicle.Picture !== ""
      ) {
        // Backend returns full Cloudinary URL, use it directly
        setImagePreview(vehicle.Picture);
      } else {
        setImagePreview(""); // Clear preview if no image
      }

      // Clear file input when editing (since we only have URL, not the file)
      setImageFile(null);
    }
  }, [vehicle]);

  const vehicleTypes = VEHICLE_TYPES;
  const statusOptions = VEHICLE_STATUS_OPTIONS;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // VIN validation - ISO 3779 format (17 characters)
    if (!formData.VIN.trim()) {
      newErrors.VIN = "VIN là bắt buộc";
    } else if (formData.VIN.length !== 17) {
      newErrors.VIN = "VIN phải có đúng 17 ký tự";
    } else if (!/^VN[A-Z][0-9A-Z]{6}[0-9A-Z]{8}$/.test(formData.VIN)) {
      newErrors.VIN =
        "VIN không đúng định dạng. Format: WMI(3) + VDS(6) + VIS(8). Ví dụ: VNAVF8SE0SH049834";
    }

    // Owner validation
    if (!formData.Owner.trim()) {
      newErrors.Owner = "Tên chủ xe là bắt buộc";
    } else if (formData.Owner.trim().length < 2) {
      newErrors.Owner = "Tên chủ xe phải có ít nhất 2 ký tự";
    }

    // Phone validation - Vietnam phone numbers
    if (!formData.Phone_Number.trim()) {
      newErrors.Phone_Number = "Số điện thoại là bắt buộc";
    } else if (!/^(03|05|07|08|09)[0-9]{8}$/.test(formData.Phone_Number)) {
      newErrors.Phone_Number =
        "Số điện thoại phải có 10 số và đúng mã vùng VN (03, 05, 07, 08, 09)";
    }

    // Email validation
    if (!formData.Email.trim()) {
      newErrors.Email = "Email là bắt buộc";
    } else if (
      !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(formData.Email)
    ) {
      newErrors.Email = "Email không đúng định dạng";
    }

    // Purchase Date validation - from 2021 onwards
    if (!formData.Purchase_Date) {
      newErrors.Purchase_Date = "Ngày mua là bắt buộc";
    } else {
      const purchaseYear = new Date(formData.Purchase_Date).getFullYear();
      const currentYear = new Date().getFullYear();
      if (purchaseYear < 2021) {
        newErrors.Purchase_Date = "Ngày mua phải từ năm 2021 trở đi";
      } else if (purchaseYear > currentYear) {
        newErrors.Purchase_Date = "Ngày mua không được lớn hơn năm hiện tại";
      }
    }

    // Vehicle Type validation
    if (!formData.ID_Electric_Vehicle_Type) {
      newErrors.ID_Electric_Vehicle_Type = "Loại xe là bắt buộc";
    }

    // Total KM validation
    if (formData.Total_KM < 0) {
      newErrors.Total_KM = "Số km không được âm";
    } else if (formData.Total_KM > 1000000) {
      newErrors.Total_KM = "Số km không hợp lệ (quá lớn)";
    }

    // Status validation
    if (!formData.Status) {
      newErrors.Status = "Trạng thái là bắt buộc";
    }

    // Usage Type validation
    if (!formData.Usage_Type) {
      newErrors.Usage_Type = "Loại sử dụng là bắt buộc";
    } else if (!["PERSONAL", "COMMERCIAL"].includes(formData.Usage_Type)) {
      newErrors.Usage_Type = "Loại sử dụng không hợp lệ";
    }

    setErrors(newErrors);

    // Show toast for first error
    if (Object.keys(newErrors).length > 0) {
      const firstError = Object.values(newErrors)[0];
      toast.error(firstError);
    }

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      // Pass both form data and image file to parent
      const isUpdate = !!vehicle;

      const backendData = transformVehicleToBackend(formData, isUpdate);

      // Send both data and image file
      onSave(backendData, imageFile);
    }
  };

  return (
    <div className="vehicle-form card">
      <div className="card-header">
        <h3 className="card-title">
          {vehicle ? "Chỉnh sửa thông tin xe" : "Đăng ký xe mới"}
        </h3>
      </div>

      <form onSubmit={handleSubmit} className="form">
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Loại xe *</label>
            <select
              name="ID_Electric_Vehicle_Type"
              value={formData.ID_Electric_Vehicle_Type}
              onChange={handleChange}
              className={`form-control ${
                errors.ID_Electric_Vehicle_Type ? "error" : ""
              } ${!formData.ID_Electric_Vehicle_Type ? "placeholder" : ""}`}
            >
              <option value="">Chọn loại xe</option>
              {vehicleTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
            {errors.ID_Electric_Vehicle_Type && (
              <div className="error-message">
                {errors.ID_Electric_Vehicle_Type}
              </div>
            )}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label
              className="form-label"
              style={{ display: "flex", alignItems: "center", gap: "8px" }}
            >
              <span>VIN (Số khung) *</span>
              <button
                type="button"
                onClick={generateSampleVIN}
                className="btn btn-outline"
                style={{
                  fontSize: "12px",
                  padding: "4px 8px",
                  marginLeft: "auto",
                }}
                title="Tạo VIN mẫu dựa trên loại xe đã chọn"
              >
                🎲 Tạo VIN mẫu
              </button>
            </label>
            <input
              type="text"
              name="VIN"
              value={formData.VIN}
              onChange={handleChange}
              className={`form-control ${errors.VIN ? "error" : ""}`}
              placeholder="VFVF81234H1234567"
              maxLength="18"
              style={{ textTransform: "uppercase" }}
            />
            {errors.VIN && <div className="error-message">{errors.VIN}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">Ngày mua *</label>
            <input
              type="date"
              name="Purchase_Date"
              value={formData.Purchase_Date}
              onChange={handleChange}
              className={`form-control ${errors.Purchase_Date ? "error" : ""}`}
            />
            {errors.Purchase_Date && (
              <div className="error-message">{errors.Purchase_Date}</div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Loại sử dụng *</label>
            <select
              name="Usage_Type"
              value={formData.Usage_Type}
              onChange={handleChange}
              className={`form-control ${errors.Usage_Type ? "error" : ""}`}
            >
              <option value="PERSONAL">Cá nhân</option>
              <option value="COMMERCIAL">Thương mại</option>
            </select>
            {errors.Usage_Type && (
              <div className="error-message">{errors.Usage_Type}</div>
            )}
            <small className="field-hint">
              Chọn loại sử dụng xe (cá nhân hoặc thương mại)
            </small>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Tên chủ xe *</label>
            <input
              type="text"
              name="Owner"
              value={formData.Owner}
              onChange={handleChange}
              className={`form-control ${errors.Owner ? "error" : ""}`}
              placeholder="Nguyễn Văn An"
            />
            {errors.Owner && (
              <div className="error-message">{errors.Owner}</div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Số điện thoại *</label>
            <input
              type="tel"
              name="Phone_Number"
              value={formData.Phone_Number}
              onChange={handleChange}
              className={`form-control ${errors.Phone_Number ? "error" : ""}`}
              placeholder="0912345678"
            />
            {errors.Phone_Number && (
              <div className="error-message">{errors.Phone_Number}</div>
            )}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Email *</label>
            <input
              type="email"
              name="Email"
              value={formData.Email}
              onChange={handleChange}
              className={`form-control ${errors.Email ? "error" : ""}`}
              placeholder="example@email.com"
            />
            {errors.Email && (
              <div className="error-message">{errors.Email}</div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Trạng thái</label>
            <select
              name="Status"
              value={formData.Status}
              onChange={handleChange}
              className="form-control"
            >
              {statusOptions.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Số KM đã đi</label>
            <input
              type="number"
              name="Total_KM"
              value={formData.Total_KM}
              onChange={handleChange}
              className={`form-control ${errors.Total_KM ? "error" : ""}`}
              placeholder="0"
              min="0"
              step="0.1"
            />
            {errors.Total_KM && (
              <div className="error-message">{errors.Total_KM}</div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Hình ảnh</label>
            <input
              type="file"
              name="Picture"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  // Check file size (max 5MB)
                  if (file.size > 5 * 1024 * 1024) {
                    toast.error("Kích thước ảnh không được vượt quá 5MB");
                    e.target.value = null;
                    return;
                  }

                  // Store file for upload
                  setImageFile(file);

                  // Create preview URL
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    setImagePreview(reader.result);
                    toast.success("Đã chọn ảnh thành công!");
                  };
                  reader.onerror = () => {
                    toast.error("Lỗi khi đọc file ảnh");
                  };
                  reader.readAsDataURL(file);
                }
              }}
              className="form-control"
            />
            <small className="form-help">
              Chọn hình ảnh từ thiết bị (tối đa 5MB)
            </small>
            {imagePreview && (
              <div
                style={{
                  marginTop: "10px",
                  border: "1px solid #ddd",
                  padding: "10px",
                  borderRadius: "8px",
                }}
              >
                <p
                  style={{
                    marginBottom: "5px",
                    fontSize: "14px",
                    color: "#666",
                  }}
                >
                  Xem trước:
                </p>
                <img
                  src={imagePreview}
                  alt="Preview"
                  style={{
                    maxWidth: "100%",
                    maxHeight: "200px",
                    objectFit: "contain",
                    borderRadius: "4px",
                  }}
                />
              </div>
            )}
          </div>
        </div>

        <div className="form-actions">
          <button type="button" onClick={onCancel} className="btn btn-outline">
            Hủy
          </button>
          <button type="submit" className="btn btn-primary">
            {vehicle ? "Cập nhật" : "Đăng ký"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default VehicleForm;
