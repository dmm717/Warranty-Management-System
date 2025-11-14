import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import "../../styles/RecallForm.css";
import { VEHICLE_TYPES, RECALL_STATUS_OPTIONS, TECHNICIAN_SPECIALTIES } from "../../constants";
import { useAuth } from "../../contexts/AuthContext";
import { recallAPI, vehicleAPI, scTechnicianAPI } from "../../services/api";
import { toast } from "react-toastify";

function RecallForm({ recall, onSave, onCancel }) {
  const { user } = useAuth();
  const isEVMAdmin = user?.role === "EVM_ADMIN";

  const [formData, setFormData] = useState({
    name: "",
    issueDescription: "",
    startDate: "",
    requiredAction: "",
    partsRequired: "",
    status: "INACTIVE",
    notificationSent: false,
    evmApprovalStatus: "WAITING",
    vehicleTypeIds: [],
    technicianIds: [],
    vehicleId: [],
    electricVehicleId: "",
    scTechnicianId: "",
    specialty: ""
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [technicians, setTechnicians] = useState([]);

  // Filter vehicles based on selected vehicle types
  const filteredVehicles = React.useMemo(() => {
    if (!formData.vehicleTypeIds || formData.vehicleTypeIds.length === 0) {
      return vehicles;
    }
    
    // Filter vehicles that match the selected vehicle types
    return vehicles.filter(vehicle => {
      const vehicleTypeId = vehicle.vehicleTypeId || vehicle.typeId || vehicle.modelId;
      return formData.vehicleTypeIds.includes(String(vehicleTypeId));
    });
  }, [vehicles, formData.vehicleTypeIds]);

  // Show electric vehicle combobox when vehicle types are selected
  const showElectricVehicleCombobox = formData.vehicleTypeIds && formData.vehicleTypeIds.length > 0;

  // Fetch vehicles and technicians on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch vehicles
        const vehiclesRes = await vehicleAPI.getAllVehicles({ page: 0, size: 1000 });
        if (vehiclesRes && vehiclesRes.success && vehiclesRes.data) {
          const vehicleList = vehiclesRes.data.content || vehiclesRes.data;
          setVehicles(Array.isArray(vehicleList) ? vehicleList : []);
        }

        // Fetch technicians
        const techniciansRes = await scTechnicianAPI.getAllTechnicians({ page: 0, size: 1000 });
        if (techniciansRes && techniciansRes.success && techniciansRes.data) {
          const technicianList = techniciansRes.data.content || techniciansRes.data;
          setTechnicians(Array.isArray(technicianList) ? technicianList : []);
        }
      } catch (error) {
        console.error("Error fetching vehicles/technicians:", error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (recall) {
      setFormData({
        name: recall.name || recall.RecallName || "",
        issueDescription: recall.issueDescription || recall.IssueDescription || "",
        startDate: recall.startDate || recall.StartDate || "",
        requiredAction: recall.requiredAction || recall.RequiredAction || "",
        partsRequired: recall.partsRequired || recall.PartsRequired || "",
        status: recall.status || recall.Status || "INACTIVE",
        notificationSent: recall.notificationSent ?? false,
        evmApprovalStatus: recall.evmApprovalStatus || "WAITING",
        // derive vehicle type ids from available shapes: prefer detailed DTOs, then id arrays, then fallback to names
        vehicleTypeIds: (() => {
          const fromDto = recall.vehicleTypeInfoDTOS && Array.isArray(recall.vehicleTypeInfoDTOS)
            ? recall.vehicleTypeInfoDTOS.map((v) => v.id)
            : null;
          const fromIds = recall.vehicleTypeIds || recall.VehicleModelIds || null;
          const fromNames = recall.VehicleModels || null; // names are not ideal but keep as fallback

          const source = fromDto || fromIds || fromNames || [];
          return Array.isArray(source) ? source.map(String) : [];
        })(),
        technicianIds: recall.technicianIds || [],
        vehicleId: recall.vehicleId || [],
        electricVehicleId: recall.electricVehicleId || "",
        scTechnicianId: recall.scTechnicianId || "",
        specialty: recall.specialty || "-chọn chuyên môn-",
      });
    }
  }, [recall]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = "Tên recall là bắt buộc";
    }
    
    // Chỉ validate vehicleTypeIds khi tạo mới, không validate khi edit
    if (!recall && formData.vehicleTypeIds.length === 0) {
      newErrors.vehicleTypeIds = "Phải chọn ít nhất một model xe";
    }
    
    if (!formData.startDate) {
      newErrors.startDate = "Ngày bắt đầu là bắt buộc";
    }
    
    if (!formData.issueDescription.trim()) {
      newErrors.issueDescription = "Mô tả vấn đề là bắt buộc";
    } else if (formData.issueDescription.length < 20) {
      newErrors.issueDescription = "Mô tả vấn đề phải có ít nhất 20 ký tự";
    }

    if (!formData.requiredAction.trim()) {
      newErrors.requiredAction = "Hành động yêu cầu là bắt buộc";
    }
    
    if (!formData.specialty) {
      newErrors.specialty = "Chuyên môn kỹ thuật viên là bắt buộc";
    }
    
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setLoading(true);

    const requestData = {
      name: formData.name,
      issueDescription: formData.issueDescription,
      startDate: formData.startDate,
      requiredAction: formData.requiredAction,
      partsRequired: formData.partsRequired,
      status: formData.status,
      notificationSent: formData.notificationSent,
      evmApprovalStatus: formData.evmApprovalStatus,
      // Chỉ gửi vehicleTypeIds khi tạo mới, không gửi khi edit để tránh lỗi backend
      ...(recall ? {} : { vehicleTypeIds: formData.vehicleTypeIds }),
      technicianIds: formData.technicianIds,
      vehicleId: formData.vehicleId,
      // Add new fields
      electricVehicleId: formData.electricVehicleId || null,
      scTechnicianId: formData.scTechnicianId || null,
      specialty: formData.specialty
    };

    try {
      if (recall) {
        // If editing: detect vehicle types that were removed (unselected) and delete them via API
        try {
          const recallId = recall.id || recall.Recall_ID;
          const originalIds = (
            (recall.vehicleTypeInfoDTOS && Array.isArray(recall.vehicleTypeInfoDTOS)
              ? recall.vehicleTypeInfoDTOS.map((v) => String(v.id))
              : null) ||
            (recall.vehicleTypeIds && Array.isArray(recall.vehicleTypeIds)
              ? recall.vehicleTypeIds.map(String)
              : null) ||
            (recall.VehicleModelIds && Array.isArray(recall.VehicleModelIds)
              ? recall.VehicleModelIds.map(String)
              : [])
          );

          const currentIds = (requestData.vehicleTypeIds || []).map(String);
          const removed = originalIds.filter((id) => !currentIds.includes(id));
          if (removed.length > 0) {
            // delete removed types sequentially to avoid rate issues
            for (const vtId of removed) {
              try {
                console.debug('RecallForm: removing vehicle type', recallId, vtId);
                await recallAPI.removeVehicleType(recallId, vtId);
              } catch (err) {
                console.warn('Failed to remove vehicle type', vtId, err);
              }
            }
          }
        } catch (err) {
          console.warn('Error while removing unselected vehicle types', err);
        }
        // Try updating via API first. If API not available or fails, fallback to local save.
        try {
          const recallId = recall.id || recall.Recall_ID;

          const response = await recallAPI.updateRecall(recallId, requestData);

          if (response && response.success) {
            toast.success("Cập nhật Recall thành công!");
            onSave && onSave(response.data);
          } else {
            // Detailed logging for diagnosis
            try {
              console.error("Update recall API failed", {
                recallId,
                requestData,
                responseStatus: response?.status,
                responseMessage: response?.message,
                responseErrors: response?.errors,
                rawResponse: response,
              });
            } catch (logErr) {
              console.error("Update recall API failed (unable to stringify response)", logErr);
            }

            // Do NOT save locally when backend returns an error. Inform the user and keep the form open for retry.
            toast.error("Lưu thất bại: " + (response?.message || "Không thể tạo Recall. Vui lòng thử lại."));
            // do not call onSave — user must retry or cancel
            return;
          }
        } catch (err) {
          // Unexpected exception - log full error + request data
          try {
            console.error("Update recall API threw exception", {
              error: err,
              requestData,
              recallId: recall?.id || recall?.Recall_ID,
            });
          } catch (logErr) {
            console.error("Error while logging exception", logErr);
          }

          // Do NOT save locally on exception. Inform user and keep form open for retry.
          toast.error("Lưu thất bại: Không thể kết nối đến server. Vui lòng thử lại.");
          return;
        }
      } else {
        // Create
        try {
          const response = await recallAPI.createRecall(requestData);
          if (response && response.success) {
            toast.success("Tạo Recall thành công!");
            onSave && onSave(response.data);
          } else {
            try {
              console.error("Create recall API failed", {
                requestData,
                responseStatus: response?.status,
                responseMessage: response?.message,
                responseErrors: response?.errors,
                rawResponse: response,
              });
            } catch (logErr) {
              console.error("Create recall API failed (unable to stringify response)", logErr);
            }

            // Do NOT save locally when create fails. Inform the user and keep the form open for retry.
            toast.error("Lưu thất bại: " + (response?.message || "Không thể tạo Recall. Vui lòng thử lại."));
            return;
          }
        } catch (err) {
          try {
            console.error("Create recall API threw exception", { error: err, requestData });
          } catch (logErr) {
            console.error("Error while logging create exception", logErr);
          }

          // Do NOT save locally on exception. Inform user and keep the form open for retry.
          toast.error("Lưu thất bại: Không thể kết nối đến server. Vui lòng thử lại.");
          return;
        }
      }
    } catch (error) {
      console.error("Unexpected error submitting recall:", error);
      toast.error(error?.message || "Có lỗi xảy ra khi lưu Recall");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="recall-form card">
      <div className="card-header">
        <h3 className="card-title">
          {recall ? "Chỉnh sửa Recall" : "Tạo Recall mới"}
        </h3>
        <p className="card-subtitle">
          Thông tin recall và danh sách xe bị ảnh hưởng
        </p>
      </div>
      {/* debug block removed - form now renders without printing raw recall prop */}
      <form onSubmit={handleSubmit} className="form">
        {/* Tên Recall - ALWAYS FIRST */}
        <div className="form-section">
          <div className="form-group">
            <label className="form-label">Tên Recall *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`form-control ${errors.name ? "error" : ""}`}
              placeholder="VD: Thu hồi pin VF8 2023"
              disabled={loading}
            />
            {errors.name && (
              <div className="error-message">{errors.name}</div>
            )}
          </div>
        </div>

        {/* ===== COMBOBOX SECTIONS ===== */}
        
        {/* List Vehicle Models - chỉ hiển thị khi tạo mới, ẩn khi edit */}
        {!recall && (
          <div className="form-section">
            <div className="form-group">
              <label className="form-label">Loại xe bị ảnh hưởng *</label>

              {/* Dropdown toggle that expands a panel containing the checkbox grid */}
              <div className="vehicle-dropdown">
                {/* We'll create a stable ref to handle outside clicks below */}
              </div>

              <VehicleTypeDropdown
                vehicleTypes={VEHICLE_TYPES}
                selectedIds={formData.vehicleTypeIds}
                // toggle behavior for multi-select: add if missing, remove if present
                onSelect={(id) => {
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
                }}
                singleSelect={false}
                error={errors.vehicleTypeIds}
                disabled={loading}
              />

              {errors.vehicleTypeIds && (
                <div className="error-message">{errors.vehicleTypeIds}</div>
              )}
              <small className="form-help">
                Chọn một hoặc nhiều model xe từ danh sách. Chạm hoặc click để chọn.
              </small>
            </div>
          </div>
        )}

        {/* Status và EVM Approval */}
        <div className="form-section">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Trạng thái</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="form-control"
                disabled={loading}
              >
                {RECALL_STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
                
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Phê duyệt EVM</label>
              <select
                name="evmApprovalStatus"
                value={formData.evmApprovalStatus}
                onChange={handleChange}
                className="form-control"
                disabled={loading || !isEVMAdmin}
              >
                <option value="WAITING">Chờ phê duyệt</option>
                <option value="Approved">Đã phê duyệt</option>
                <option value="Disapproved">Không phê duyệt</option>
              </select>
              {!isEVMAdmin && (
                <small className="form-help">
                  Chỉ EVM Admin có thể thay đổi trạng thái phê duyệt
                </small>
              )}
            </div>
          </div>
        </div>

        {/* SC Technician 
        <div className="form-section">
          <div className="form-group">
            <label className="form-label">Kỹ thuật viên SC (SC Technician)</label>
            <select
              name="scTechnicianId"
              value={formData.scTechnicianId}
              onChange={handleChange}
              className="form-control"
              disabled={loading}
            >
              <option value="">-- Chọn kỹ thuật viên (tùy chọn) --</option>
              {technicians.map((tech) => (
                <option key={tech.id} value={tech.id}>
                  {tech.name} - {tech.specialty || 'Chưa có chuyên môn'}
                </option>
              ))}
            </select>
            {errors.scTechnicianId && (
              <div className="error-message">{errors.scTechnicianId}</div>
            )}
          </div>
        </div>
      */}
        
        {/* Specialty */}
        <div className="form-section">
          <div className="form-group">
            <label className="form-label">Chuyên môn kỹ thuật viên *</label>
            <select
              name="specialty"
              value={formData.specialty}
              onChange={handleChange}
              className="form-control"
              disabled={loading}
            >
              <option value="">-- Chọn chuyên môn --</option>
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
        </div>
        
        {/* ===== TEXT INPUT / TEXTAREA SECTIONS (BOTTOM) ===== */}
        
        {/* Ngày bắt đầu */}
        <div className="form-section">
          <div className="form-group">
            <label className="form-label">Ngày bắt đầu *</label>
            <input
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              className={`form-control ${errors.startDate ? "error" : ""}`}
              disabled={loading}
            />
            {errors.startDate && (
              <div className="error-message">{errors.startDate}</div>
            )}
          </div>
        </div>

        {/* Mô tả vấn đề */}
        <div className="form-section">
          <div className="form-group">
            <label className="form-label">Mô tả vấn đề *</label>
            <textarea
              name="issueDescription"
              value={formData.issueDescription}
              onChange={handleChange}
              className={`form-control ${errors.issueDescription ? "error" : ""}`}
              rows="4"
              placeholder="Phát hiện lỗi trong hệ thống quản lý pin..."
              disabled={loading}
            />
            {errors.issueDescription && (
              <div className="error-message">{errors.issueDescription}</div>
            )}
            <small className="form-help">Tối thiểu 20 ký tự</small>
          </div>
        </div>

        {/* Hành động yêu cầu */}
        <div className="form-section">
          <div className="form-group">
            <label className="form-label">Hành động yêu cầu *</label>
            <textarea
              name="requiredAction"
              value={formData.requiredAction}
              onChange={handleChange}
              className={`form-control ${errors.requiredAction ? "error" : ""}`}
              rows="3"
              placeholder="VD: Thay thế module pin và cập nhật firmware BMS"
              disabled={loading}
            />
            {errors.requiredAction && (
              <div className="error-message">{errors.requiredAction}</div>
            )}
          </div>
        </div>

        {/* Phụ tùng cần thiết */}
        <div className="form-section">
          <div className="form-group">
            <label className="form-label">Phụ tùng cần thiết</label>
            <textarea
              name="partsRequired"
              value={formData.partsRequired}
              onChange={handleChange}
              className="form-control"
              rows="3"
              placeholder="VD: Pin Lithium-ion 100kWh, Bộ điều khiển BMS v2.1"
              disabled={loading}
            />
            <small className="form-help">
              Liệt kê các phụ tùng cần thiết cho việc sửa chữa
            </small>
          </div>
        </div>

        {/* Warning */}
        <div className="recall-warning">
          <div className="warning-icon">⚠️</div>
          <div className="warning-content">
            <h5>Lưu ý quan trọng</h5>
            <ul>
              <li>Thông tin recall sẽ được gửi đến tất cả Service Centers</li>
              <li>Danh sách xe bị ảnh hưởng sẽ được tự động cập nhật</li>
              <li>Đảm bảo mô tả vấn đề rõ ràng và chi tiết</li>
            </ul>
          </div>
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <button 
            type="button" 
            onClick={onCancel} 
            className="btn btn-outline"
            disabled={loading}
          >
            Hủy
          </button>
          <button 
            type="submit" 
            className="btn btn-danger"
            disabled={loading}
          >
            {loading && <span className="spinner-small"></span>}
            {loading 
              ? (recall ? "Đang cập nhật..." : "Đang tạo...")
              : (recall ? "Cập nhật Recall" : "Tạo Recall")
            }
          </button>
        </div>
      </form>
    </div>
  );
}

export default RecallForm;

/* -------------------------------------------------------------------------
  VehicleTypeDropdown - small local component that renders a toggle button
  and an expandable panel containing the checkbox grid. Implemented here to
  avoid adding new files. Handles outside click to close.
------------------------------------------------------------------------- */
function VehicleTypeDropdown({ vehicleTypes, selectedIds, onSelect, singleSelect = false, disabled }) {
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
        className={`form-control vehicle-dropdown-toggle ${selectedIds.length ? 'has-value' : ''}`}
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

      {open && createPortal(
  <div ref={panelRef} className="vehicle-dropdown-panel" style={{ ...panelStyle, zIndex: 9999 }}>
          <div className="vehicle-types-grid">
            {vehicleTypes.map((vt) => (
              <div className="vehicle-item" key={vt.id}>
                <label
                  className="vehicle-checkbox"
                    onClick={(e) => {
                    e.preventDefault();
                    // debug: log which id was clicked and current selection
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
