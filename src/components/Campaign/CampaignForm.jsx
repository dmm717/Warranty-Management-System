import React, { useState, useEffect, useRef } from "react";
import "../../styles/CampaignForm.css";
import { VEHICLE_TYPES, TECHNICIAN_SPECIALTIES } from "../../constants";
import { createPortal } from "react-dom";

function CampaignForm({ campaign, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    CampaignsTypeName: "",
    StartDate: "",
    EndDate: "",
    RequiredParts: "",
    Description: "",
    Status: "PLANNED", // Luôn là PLANNED khi EVM_ADMIN tạo mới
    CompletedVehicles: 0,
    YearScope: "", // Phạm vi năm sản xuất (VD: 2020-2023)
    vehicleTypeIds: [], // Mảng ID các loại xe áp dụng chiến dịch
    specialty: "", // Chuyên môn kỹ thuật viên cho chiến dịch
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (campaign) {
      // Map campaign data to form fields (handle both camelCase and PascalCase)
      setFormData({
        CampaignsTypeName:
          campaign.CampaignsTypeName ||
          campaign.campaignsTypeName ||
          campaign.campaignName ||
          "",
        StartDate: campaign.StartDate || campaign.startDate || "",
        EndDate: campaign.EndDate || campaign.endDate || "",
        RequiredParts: campaign.RequiredParts || campaign.requiredParts || "",
        Description: campaign.Description || campaign.description || "",
        Status: campaign.Status || campaign.status || "PLANNED",
        CompletedVehicles:
          campaign.CompletedVehicles || campaign.completedVehicles || 0,
        YearScope: campaign.YearScope || campaign.yearScope || "",
        vehicleTypeIds: Array.isArray(campaign.vehicleTypeIds)
          ? campaign.vehicleTypeIds.map(vt => typeof vt === 'object' ? vt.id || vt.vehicleTypeId : vt)
          : campaign.vehicleTypeIds ? [campaign.vehicleTypeIds] : [],
        specialty: campaign.specialty || "",
      });
    }
  }, [campaign]);

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

  const handleVehicleTypeChange = (id) => {
    if (!id) return;
    setFormData(prev => {
      const current = new Set((prev.vehicleTypeIds || []).map(String));
      const sid = String(id);
      if (current.has(sid)) {
        current.delete(sid);
      } else {
        current.add(sid);
      }
      const next = Array.from(current);
      return { ...prev, vehicleTypeIds: next };
    });
    if (errors.vehicleTypeIds) {
      setErrors(prev => ({ ...prev, vehicleTypeIds: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (formData.CompletedVehicles < 0) {
      newErrors.CompletedVehicles = "Số xe hoàn thành không được âm"; //PQD_fix_v1
    }
    if (!formData.CampaignsTypeName.trim()) {
      newErrors.CampaignsTypeName = "Tên chiến dịch là bắt buộc";
    }

    if (!formData.StartDate) {
      newErrors.StartDate = "Ngày bắt đầu là bắt buộc";
    }

    if (!formData.EndDate) {
      newErrors.EndDate = "Ngày kết thúc là bắt buộc";
    }

    if (
      formData.StartDate &&
      formData.EndDate &&
      formData.StartDate >= formData.EndDate
    ) {
      newErrors.EndDate = "Ngày kết thúc phải sau ngày bắt đầu";
    }

    if (!formData.Description || !formData.Description.trim()) {
      newErrors.Description = "Mô tả là bắt buộc";
    }

    if (!formData.RequiredParts || !formData.RequiredParts.trim()) {
      newErrors.RequiredParts = "Phụ tùng yêu cầu là bắt buộc";
    }

    // if (!formData.YearScope || !formData.YearScope.trim()) {
    //   newErrors.YearScope = "Phạm vi năm sản xuất là bắt buộc";
    // }

    if (!formData.vehicleTypeIds || formData.vehicleTypeIds.length === 0) {
      newErrors.vehicleTypeIds = "Loại xe điện là bắt buộc";
    }

    if (!formData.specialty || !formData.specialty.trim()) {
      newErrors.specialty = "Chuyên môn kỹ thuật viên là bắt buộc";
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
    <div className="campaign-form card">
      <div className="card-header">
        <h3 className="card-title">
          {campaign ? "Chỉnh sửa Service Campaign" : "Tạo Service Campaign mới"}
        </h3>
      </div>

      <form onSubmit={handleSubmit} className="form">
        <div className="form-section">
          <h4 className="section-title">Thông tin cơ bản</h4>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Tên chiến dịch *</label>
              <input
                type="text"
                name="CampaignsTypeName"
                value={formData.CampaignsTypeName}
                onChange={handleChange}
                className={`form-control ${
                  errors.CampaignsTypeName ? "error" : ""
                }`}
                placeholder="Cập nhật phần mềm BMS"
              />
              {errors.CampaignsTypeName && (
                <div className="error-message">{errors.CampaignsTypeName}</div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Loại xe điện *</label>

              <VehicleTypeDropdown className="vehicle-dropdown"
                vehicleTypes={VEHICLE_TYPES}
                selectedIds={formData.vehicleTypeIds}
                onSelect={handleVehicleTypeChange}
                singleSelect={false}
                error={errors.vehicleTypeIds}
              />
            </div>
          </div>
          <div className="form-technician-specialty">

            <div className="form-group">
              <label className="form-label">Chuyên môn kỹ thuật viên *</label>
              <select
                name="specialty"
                value={formData.specialty}
                onChange={handleChange}
                className={`form-control ${
                  errors.specialty ? "error" : ""
                }`}
              >
                <option value="">Chọn chuyên môn</option>
                {TECHNICIAN_SPECIALTIES.map((spec) => (
                  <option key={spec.value} value={spec.value}>
                    {spec.label}
                  </option>
                ))}
              </select>
              {errors.specialty && (
                <div className="error-message">{errors.specialty}</div>
              )}
            </div>

            {campaign && (
              <div className="form-group">
                <label className="form-label">Trạng thái</label>
                <select
                  name="Status"
                  value={formData.Status}
                  onChange={handleChange}
                  className="form-control"
                >
                  <option value="PLANNED">Chuẩn bị</option>
                  <option value="ACTIVE">Đang triển khai</option>
                  
                  <option value="COMPLETED">Hoàn thành</option>
                  
                </select>
                
                <small className="form-help">
                  Chọn trạng thái mới cho chiến dịch
                </small>
              </div>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Ngày bắt đầu *</label>
              <input
                type="date"
                name="StartDate"
                value={formData.StartDate}
                onChange={handleChange}
                className={`form-control ${errors.StartDate ? "error" : ""}`}
              />
              {errors.StartDate && (
                <div className="error-message">{errors.StartDate}</div>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">Ngày kết thúc *</label>
              <input
                type="date"
                name="EndDate"
                value={formData.EndDate}
                onChange={handleChange}
                className={`form-control ${errors.EndDate ? "error" : ""}`}
              />
              {errors.EndDate && (
                <div className="error-message">{errors.EndDate}</div>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Phụ tùng yêu cầu *</label>
              <input
                type="text"
                name="RequiredParts"
                value={formData.RequiredParts}
                onChange={handleChange}
                className={`form-control ${
                  errors.RequiredParts ? "error" : ""
                }`}
                placeholder="Cáp sạc Type 2, Pin Lithium..."
              />
              {errors.RequiredParts && (
                <div className="error-message">{errors.RequiredParts}</div>
              )}
              <small className="form-help">
                Nhập "Không" nếu không cần phụ tùng
              </small>
            </div>

            {/* ✅ Thêm phạm vi năm sản xuất */}
            {/*
            <div className="form-group">
              <label className="form-label">Phạm vi năm sản xuất *</label>
              <input
                type="text"
                name="YearScope"
                value={formData.YearScope}
                onChange={handleChange}
                className={`form-control ${errors.YearScope ? "error" : ""}`}
                placeholder="VD: 2020-2023 hoặc 2022"
              />
              {errors.YearScope && (
                <div className="error-message">{errors.YearScope}</div>
              )}
              <small className="form-help">
                Năm sản xuất của các dòng xe áp dụng chiến dịch
              </small>
            </div>
            */}
          </div>

          

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Mô tả chi tiết *</label>
              <textarea
                name="Description"
                value={formData.Description}
                onChange={handleChange}
                className={`form-control ${errors.Description ? "error" : ""}`}
                placeholder="Mô tả chi tiết về chiến dịch, mục đích, đối tượng áp dụng..."
                rows="4"
              />
              {errors.Description && (
                <div className="error-message">{errors.Description}</div>
              )}
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" onClick={onCancel} className="btn btn-outline">
            Hủy
          </button>
          <button type="submit" className="btn btn-primary">
            {campaign ? "Cập nhật" : "Tạo Service Campaign"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CampaignForm;

/* -------------------------------------------------------------------------
  VehicleTypeDropdown - small local component that renders a toggle button
  and an expandable panel containing the checkbox grid. Implemented here to
  avoid adding new files. Handles outside click to close.
------------------------------------------------------------------------- */
function VehicleTypeDropdown({ vehicleTypes, selectedIds, onSelect, singleSelect = false, disabled, error }) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const toggleRef = useRef(null);
  const panelRef = useRef(null);
  const [panelStyle, setPanelStyle] = useState({});

  useEffect(() => {
    const handleOutside = (e) => {
      // Click inside the original dropdown wrapper should keep open
      if (dropdownRef.current && dropdownRef.current.contains(e.target)) return;
      // Click inside the portal panel should also keep open
      if (panelRef.current && panelRef.current.contains(e.target)) return;
      // Otherwise close
      setOpen(false);
    };

    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  // adjust panel width to match toggle width when opened
  useEffect(() => {
    if (!open) return;

    const adjust = () => {
      const toggleEl = toggleRef.current;
      if (!toggleEl) return;
      const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
      const rect = toggleEl.getBoundingClientRect();
      // prefer matching toggle width, but clamp to viewport and a sensible max
      const maxAllowed = Math.min(760, viewportWidth - 32);
      const width = Math.min(rect.width || toggleEl.offsetWidth, maxAllowed);

      // compute fixed position to avoid clipping by parent overflow/staking contexts
      if (viewportWidth <= 768) {
        setPanelStyle({ position: 'fixed', width: 'calc(100% - 16px)', left: 8, top: rect.bottom + 8 });
      } else {
        setPanelStyle({ position: 'fixed', width: width + 'px', left: rect.left + 'px', top: rect.bottom + 8 + 'px' });
      }
    };

    adjust();
    window.addEventListener('resize', adjust);
    window.addEventListener('scroll', adjust, true);
    return () => {
      window.removeEventListener('resize', adjust);
      window.removeEventListener('scroll', adjust, true);
    };
  }, [open]);

  // normalize selected ids to strings to avoid type-mismatch (number vs string)
  const normalizedSelectedIds = new Set((selectedIds || []).map(String));
  const selectedLabels = vehicleTypes
    .filter((vt) => normalizedSelectedIds.has(String(vt.id)))
    .map((vt) => vt.name + " (" + vt.id + ")");

  return (
    <div className="vehicle-dropdown" ref={dropdownRef}>
      <button
        type="button"
        className={`form-control vehicle-dropdown-toggle ${selectedIds && selectedIds.length ? 'has-value' : ''} ${error ? 'error' : ''}`}
        ref={toggleRef}
        onClick={() => !disabled && setOpen((s) => !s)}
        aria-expanded={open}
        disabled={disabled}
      >
        <span className="vehicle-dropdown-label">
          {selectedLabels.length > 0 ? selectedLabels.join(', ') : 'Chọn model xe...'}
        </span>
        <span className={`caret ${open ? 'open' : ''}`}></span>
      </button>

      {error && (
        <div className="error-message">{error}</div>
      )}

      {open && createPortal(
        <div ref={panelRef} className="vehicle-dropdown-panel" style={{ ...panelStyle, zIndex: 9999 }}>
          <div className="vehicle-types-grid">
            {vehicleTypes.map((vt) => (
              <div className="vehicle-item" key={vt.id}>
                <label
                  className="vehicle-checkbox"
                  onClick={(e) => {
                    e.preventDefault();
                    // notify click to toggle selection
                    if (singleSelect) {
                      onSelect && onSelect(vt.id);
                      setOpen(false);
                    } else {
                      // For multi-select always notify caller with the id; caller will toggle
                      onSelect && onSelect(vt.id);
                    }
                  }}
                >
                  <input
                    type={singleSelect ? 'radio' : 'checkbox'}
                    name={singleSelect ? 'vehicle-type-radio' : undefined}
                    checked={normalizedSelectedIds.has(String(vt.id))}
                    readOnly
                    disabled={disabled}
                  />
                  <span>{vt.name} ({vt.id})</span>
                </label>
              </div>
            ))}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
