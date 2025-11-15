import React, { useState, useEffect, useCallback } from "react";
import { scTechnicianAPI, warrantyClaimAPI } from "../../services/api";
import { toast } from "react-toastify";
import { useAuth } from "../../contexts/AuthContext";
import "./AssignTechnicianToClaimModal.css";

function AssignTechnicianToClaimModal({ claim, onClose, onAssigned }) {
  const { user } = useAuth();
  const [technicians, setTechnicians] = useState([]);
  const [filteredTechnicians, setFilteredTechnicians] = useState([]);
  const [selectedTechId, setSelectedTechId] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSpecialty, setFilterSpecialty] = useState("all");

  const applyFilters = useCallback(() => {
    let filtered = [...technicians];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (tech) =>
          tech.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tech.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tech.phoneNumber?.includes(searchTerm)
      );
    }

    // Filter by specialty
    if (filterSpecialty !== "all") {
      filtered = filtered.filter((tech) => tech.specialty === filterSpecialty);
    }

    setFilteredTechnicians(filtered);
  }, [technicians, searchTerm, filterSpecialty]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  useEffect(() => {
    const fetchTechnicians = async () => {
      try {
        setLoading(true);
        const response = await scTechnicianAPI.getAllTechnicians({
          page: 0,
          size: 100,
        });

        if (response.success && response.data?.content) {
          let techList = response.data.content;

          // 🔒 FILTER: SC_ADMIN và SC_STAFF chỉ thấy technicians cùng branch
          if (
            (user?.role === "SC_ADMIN" || user?.role === "SC_STAFF") &&
            user?.branchOffice
          ) {
            techList = techList.filter(
              (tech) => tech.branchOffice === user.branchOffice
            );
          }

          setTechnicians(techList);
        }
      } catch (error) {
        console.error("Error fetching technicians:", error);
        toast.error("Không thể tải danh sách kỹ thuật viên");
      } finally {
        setLoading(false);
      }
    };

    fetchTechnicians();
  }, [user?.role, user?.branchOffice]);

  const handleAssign = async () => {
    if (!selectedTechId) {
      toast.warning("Vui lòng chọn kỹ thuật viên");
      return;
    }

    // 🔒 FE VALIDATION: Đảm bảo technician được chọn thuộc cùng branch
    const selectedTech = technicians.find((t) => t.id === selectedTechId);
    if (
      (user?.role === "SC_ADMIN" || user?.role === "SC_STAFF") &&
      selectedTech
    ) {
      if (selectedTech.branchOffice !== user.branchOffice) {
        toast.error(
          `❌ Bạn chỉ được phân công kỹ thuật viên của chi nhánh ${
            user.branchOffice || "của bạn"
          }`,
          {
            position: "top-right",
            autoClose: 5000,
          }
        );
        return;
      }
    }

    try {
      setLoading(true);
      const response = await warrantyClaimAPI.assignTechnician(
        claim.claimId,
        selectedTechId
      );

      if (response.success) {
        toast.success("Phân công kỹ thuật viên thành công!");
        onAssigned && onAssigned(response.data);
        onClose();
      } else {
        toast.error(response.message || "Không thể phân công kỹ thuật viên");
      }
    } catch (error) {
      console.error("Error assigning technician:", error);
      toast.error("Đã xảy ra lỗi khi phân công kỹ thuật viên");
    } finally {
      setLoading(false);
    }
  };

  const getUniqueSpecialties = () => {
    const specialties = technicians
      .map((tech) => tech.specialty)
      .filter(Boolean);
    return [...new Set(specialties)];
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="assign-technician-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>Phân Công Kỹ Thuật Viên</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          {/* Claim Info */}
          <div className="claim-info-section">
            <h3>Thông tin yêu cầu</h3>
            <div className="claim-info-grid">
              <div className="info-item">
                <span className="label">Mã yêu cầu:</span>
                <span className="value">{claim.claimId}</span>
              </div>
              <div className="info-item">
                <span className="label">Khách hàng:</span>
                <span className="value">{claim.customerName}</span>
              </div>
              <div className="info-item">
                <span className="label">Xe:</span>
                <span className="value">{claim.vehicleName || "N/A"}</span>
              </div>
              <div className="info-item">
                <span className="label">Mô tả vấn đề:</span>
                <span className="value">{claim.issueDescription || "N/A"}</span>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="filters-section">
            <div className="search-box">
              <input
                type="text"
                placeholder="Tìm kiếm theo tên, email, số điện thoại..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="specialty-filter">
              <label>Chuyên môn:</label>
              <select
                value={filterSpecialty}
                onChange={(e) => setFilterSpecialty(e.target.value)}
              >
                <option value="all">Tất cả</option>
                {getUniqueSpecialties().map((specialty) => (
                  <option key={specialty} value={specialty}>
                    {specialty}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Technician List */}
          <div className="technicians-list">
            {loading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Đang tải...</p>
              </div>
            ) : filteredTechnicians.length === 0 ? (
              <div className="empty-state">
                <p>Không tìm thấy kỹ thuật viên phù hợp</p>
              </div>
            ) : (
              filteredTechnicians.map((tech) => (
                <div
                  key={tech.id}
                  className={`technician-card ${
                    selectedTechId === tech.id ? "selected" : ""
                  }`}
                  onClick={() => setSelectedTechId(tech.id)}
                >
                  <div className="tech-header">
                    <div className="tech-name-section">
                      <h4>{tech.name}</h4>
                      {tech.specialty && (
                        <span className="specialty-badge">
                          {tech.specialty}
                        </span>
                      )}
                    </div>
                    <div className="radio-indicator">
                      <input
                        type="radio"
                        checked={selectedTechId === tech.id}
                        onChange={() => setSelectedTechId(tech.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                  <div className="tech-details">
                    <div className="detail-item">
                      <span className="icon">📧</span>
                      <span>{tech.email || "N/A"}</span>
                    </div>
                    <div className="detail-item">
                      <span className="icon">📞</span>
                      <span>{tech.phoneNumber || "N/A"}</span>
                    </div>
                    {tech.branchOffice && (
                      <div className="detail-item">
                        <span className="icon">🏢</span>
                        <span>{tech.branchOffice}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose} disabled={loading}>
            Hủy
          </button>
          <button
            className="btn-assign"
            onClick={handleAssign}
            disabled={loading || !selectedTechId}
          >
            {loading ? "Đang xử lý..." : "Phân Công"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AssignTechnicianToClaimModal;
