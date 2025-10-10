import React, { useState, useEffect } from "react";
import "./PartsForm.css";

function PartsForm({ part, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    Name_Product: "",
    Brand: "VinFast",
    Price: 0,
    Warranty_Period: 12,
    Description: "",
    Year_of_Manufacture: "",
    Part_Name: "",
    Total_Amount_Of_Product: 0,
    Manufacturer: "VinFast",
    Condition: "Mới",
    Status: "Có sẵn",
  });

  const [errors, setErrors] = useState({});

  const categories = [
    "Battery Pack",
    "Electric Motor",
    "BMS",
    "Inverter",
    "Charger",
    "Brake System",
    "Suspension",
    "Body Parts",
  ];

  const conditions = ["Mới", "Đã qua sử dụng", "Tân trang"];
  const manufacturers = ["VinFast", "Bosch", "Continental", "Denso", "Magna"];

  useEffect(() => {
    if (part) {
      setFormData(part);
    }
  }, [part]);

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

    if (!formData.Name_Product.trim()) {
      newErrors.Name_Product = "Tên sản phẩm là bắt buộc";
    }

    if (!formData.Part_Name) {
      newErrors.Part_Name = "Danh mục là bắt buộc";
    }

    if (!formData.Description.trim()) {
      newErrors.Description = "Mô tả là bắt buộc";
    }

    if (formData.Price <= 0) {
      newErrors.Price = "Giá phải lớn hơn 0";
    }

    if (formData.Total_Amount_Of_Product < 0) {
      newErrors.Total_Amount_Of_Product = "Số lượng không được âm";
    }

    if (formData.Warranty_Period <= 0) {
      newErrors.Warranty_Period = "Thời gian bảo hành phải lớn hơn 0";
    }

    if (!formData.Year_of_Manufacture) {
      newErrors.Year_of_Manufacture = "Năm sản xuất là bắt buộc";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSave(formData);
    }
  };

  return (
    <div className="parts-form card">
      <div className="card-header">
        <h3 className="card-title">
          {part ? "Chỉnh sửa phụ tùng" : "Thêm phụ tùng mới"}
        </h3>
      </div>

      <form onSubmit={handleSubmit} className="form">
        <div className="form-section">
          <h4 className="section-title">Thông tin cơ bản</h4>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Tên sản phẩm *</label>
              <input
                type="text"
                name="Name_Product"
                value={formData.Name_Product}
                onChange={handleChange}
                className={`form-control ${errors.Name_Product ? "error" : ""}`}
                placeholder="Pin Lithium 75kWh"
              />
              {errors.Name_Product && (
                <div className="error-message">{errors.Name_Product}</div>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">Danh mục *</label>
              <select
                name="Part_Name"
                value={formData.Part_Name}
                onChange={handleChange}
                className={`form-control ${errors.Part_Name ? "error" : ""}`}
              >
                <option value="">Chọn danh mục</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              {errors.Part_Name && (
                <div className="error-message">{errors.Part_Name}</div>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Thương hiệu</label>
              <input
                type="text"
                name="Brand"
                value={formData.Brand}
                onChange={handleChange}
                className="form-control"
                placeholder="VinFast"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Nhà sản xuất</label>
              <select
                name="Manufacturer"
                value={formData.Manufacturer}
                onChange={handleChange}
                className="form-control"
              >
                {manufacturers.map((manufacturer) => (
                  <option key={manufacturer} value={manufacturer}>
                    {manufacturer}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Mô tả *</label>
              <textarea
                name="Description"
                value={formData.Description}
                onChange={handleChange}
                className={`form-control ${errors.Description ? "error" : ""}`}
                placeholder="Mô tả chi tiết về sản phẩm..."
                rows="3"
              />
              {errors.Description && (
                <div className="error-message">{errors.Description}</div>
              )}
            </div>
          </div>
        </div>

        <div className="form-section">
          <h4 className="section-title">Thông tin kỹ thuật</h4>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Giá (VNĐ) *</label>
              <input
                type="number"
                name="Price"
                value={formData.Price}
                onChange={handleChange}
                className={`form-control ${errors.Price ? "error" : ""}`}
                placeholder="0"
                min="0"
              />
              {errors.Price && (
                <div className="error-message">{errors.Price}</div>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">Thời gian bảo hành (tháng) *</label>
              <input
                type="number"
                name="Warranty_Period"
                value={formData.Warranty_Period}
                onChange={handleChange}
                className={`form-control ${
                  errors.Warranty_Period ? "error" : ""
                }`}
                placeholder="12"
                min="1"
              />
              {errors.Warranty_Period && (
                <div className="error-message">{errors.Warranty_Period}</div>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Năm sản xuất *</label>
              <input
                type="date"
                name="Year_of_Manufacture"
                value={formData.Year_of_Manufacture}
                onChange={handleChange}
                className={`form-control ${
                  errors.Year_of_Manufacture ? "error" : ""
                }`}
              />
              {errors.Year_of_Manufacture && (
                <div className="error-message">
                  {errors.Year_of_Manufacture}
                </div>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">Tình trạng</label>
              <select
                name="Condition"
                value={formData.Condition}
                onChange={handleChange}
                className="form-control"
              >
                {conditions.map((condition) => (
                  <option key={condition} value={condition}>
                    {condition}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h4 className="section-title">Kho hàng</h4>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Số lượng *</label>
              <input
                type="number"
                name="Total_Amount_Of_Product"
                value={formData.Total_Amount_Of_Product}
                onChange={handleChange}
                className={`form-control ${
                  errors.Total_Amount_Of_Product ? "error" : ""
                }`}
                placeholder="0"
                min="0"
              />
              {errors.Total_Amount_Of_Product && (
                <div className="error-message">
                  {errors.Total_Amount_Of_Product}
                </div>
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
                <option value="Có sẵn">Có sẵn</option>
                <option value="Thiếu hàng">Thiếu hàng</option>
                <option value="Hết hàng">Hết hàng</option>
                <option value="Ngừng sản xuất">Ngừng sản xuất</option>
              </select>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" onClick={onCancel} className="btn btn-outline">
            Hủy
          </button>
          <button type="submit" className="btn btn-primary">
            {part ? "Cập nhật" : "Thêm phụ tùng"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default PartsForm;
