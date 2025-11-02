import React, { useState } from "react";
import { campaignDistrictAPI, recallDistrictAPI } from "../../services/api";
import { toast } from "react-toastify";
import "./TechnicianAssignment.css";

const TechnicianAssignmentModal = ({
  show,
  onClose,
  entityType, // 'CAMPAIGN' or 'RECALL'
  entityId,
  entityName,
}) => {
  const [district, setDistrict] = useState("");
  const [vehicleVinIds, setVehicleVinIds] = useState("");
  const [loading, setLoading] = useState(false);

  const vietnamDistricts = [
    "Quận 1",
    "Quận 2",
    "Quận 3",
    "Quận 4",
    "Quận 5",
    "Quận 6",
    "Quận 7",
    "Quận 8",
    "Quận 9",
    "Quận 10",
    "Quận 11",
    "Quận 12",
    "Quận Bình Thạnh",
    "Quận Tân Bình",
    "Quận Phú Nhuận",
    "Quận Gò Vấp",
    "Quận Bình Tân",
    "Quận Tân Phú",
    "Huyện Hóc Môn",
    "Huyện Củ Chi",
    "Huyện Bình Chánh",
    "Huyện Nhà Bè",
    "Huyện Cần Giờ",
    "Thành phố Thủ Đức",
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!district.trim()) {
      toast.error("Vui lòng chọn quận/huyện");
      return;
    }

    if (!vehicleVinIds.trim()) {
      toast.error("Vui lòng nhập danh sách VIN xe");
      return;
    }

    setLoading(true);
    try {
      const vinList = vehicleVinIds
        .split(",")
        .map((v) => v.trim())
        .filter((v) => v);

      const assignmentData = {
        district: district,
        vehicleVinIds: vinList,
      };

      if (entityType === "CAMPAIGN") {
        await campaignDistrictAPI.assignTechniciansByDistrict(
          entityId,
          assignmentData
        );
        toast.success(
          `✅ Đã phân công kỹ thuật viên ở ${district} cho ${vinList.length} xe trong chiến dịch`
        );
      } else {
        await recallDistrictAPI.assignTechniciansByDistrict(
          entityId,
          assignmentData
        );
        toast.success(
          `✅ Đã phân công kỹ thuật viên ở ${district} cho ${vinList.length} xe trong chiến dịch triệu hồi`
        );
      }

      onClose(true); // true = refresh parent
    } catch (error) {
      toast.error(
        "❌ Lỗi phân công: " + (error.response?.data?.message || error.message)
      );
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="modal-overlay" onClick={() => onClose(false)}>
      <div
        className="modal-content technician-assignment"
        onClick={(e) => e.stopPropagation()}
      >
        <h3>👨‍🔧 Phân Công Kỹ Thuật Viên Theo Quận</h3>

        <div className="entity-info">
          <p>
            <strong>
              {entityType === "CAMPAIGN" ? "📋 Chiến dịch" : "⚠️ Triệu hồi"}:
            </strong>{" "}
            {entityName}
          </p>
          <p>
            <strong>Mã:</strong> <code>{entityId}</code>
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <label>
            Quận/Huyện <span className="required">*</span>
            <small className="help-text">
              Hệ thống sẽ tự động tìm kỹ thuật viên trong quận này
            </small>
          </label>
          <select
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            required
          >
            <option value="">-- Chọn quận/huyện --</option>
            {vietnamDistricts.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          <label>
            Danh Sách VIN Xe <span className="required">*</span>
            <small className="help-text">
              Nhập các VIN cách nhau bằng dấu phẩy. VD: VF8_VIN_001, VF9_VIN_002
            </small>
          </label>
          <textarea
            value={vehicleVinIds}
            onChange={(e) => setVehicleVinIds(e.target.value)}
            placeholder="VF8_VIN_001, VF8_VIN_002, VF9_VIN_003"
            rows="4"
            required
          />

          <div className="info-box">
            <strong>ℹ️ Quy trình phân công:</strong>
            <ol>
              <li>Hệ thống tìm tất cả kỹ thuật viên trong quận được chọn</li>
              <li>Phân công các xe cho kỹ thuật viên</li>
              <li>Tạo tracking record cho mỗi xe</li>
              <li>Gửi thông báo cho kỹ thuật viên</li>
            </ol>
          </div>

          <div className="modal-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? "Đang phân công..." : "✅ Phân Công"}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => onClose(false)}
              disabled={loading}
            >
              Hủy
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TechnicianAssignmentModal;
