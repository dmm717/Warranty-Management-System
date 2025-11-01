import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import { partsRequestAPI, evmInventoryAPI, vehicleAPI } from '../../services/api';

/**
 * Parts Request Form using SweetAlert2
 * SC_STAFF/SC_ADMIN request parts from EVM
 */
const PartsRequestForm = ({ isOpen, onClose, onSuccess, prefilledPart = null, userInfo }) => {
  const [vehicles, setVehicles] = useState([]);
  const [parts, setParts] = useState([]);

  useEffect(() => {
    if (isOpen) {
      showFormModal();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, prefilledPart]);

  const showFormModal = async () => {
    // Fetch data first
    await Promise.all([fetchVehicles(), fetchParts()]);

    // Show SweetAlert2 modal
    const { value: formValues } = await Swal.fire({
      title: 'Tạo Yêu Cầu Phụ Tùng',
      html: `
        <div style="text-align: left;">
          <div style="margin-bottom: 16px;">
            <label style="display: block; font-weight: 600; margin-bottom: 8px;">VIN (Tùy chọn)</label>
            <select id="swal-vin" class="swal2-input" style="width: 100%; padding: 10px;">
              <option value="">-- Chọn xe --</option>
              ${vehicles.map(v => `<option value="${v.vin}">${v.vin} - ${v.model}</option>`).join('')}
            </select>
          </div>

          <div style="margin-bottom: 16px;">
            <label style="display: block; font-weight: 600; margin-bottom: 8px;">
              Phụ tùng <span style="color: #ef4444;">*</span>
            </label>
            <select id="swal-part" class="swal2-input" style="width: 100%; padding: 10px;" required>
              <option value="">-- Chọn phụ tùng --</option>
              ${parts.map(p => `
                <option value="${p.id}" ${prefilledPart && (p.id === prefilledPart.id || p.id === prefilledPart.partTypeIdEVM) ? 'selected' : ''}>
                  ${p.partName} - ${p.manufacturer} (${p.stockStatus})
                </option>
              `).join('')}
            </select>
          </div>

          <div style="margin-bottom: 16px;">
            <label style="display: block; font-weight: 600; margin-bottom: 8px;">
              Số lượng <span style="color: #ef4444;">*</span>
            </label>
            <input id="swal-quantity" type="number" class="swal2-input" value="1" min="1" 
                   style="width: 100%; padding: 10px;" required>
          </div>

          <div style="margin-bottom: 16px;">
            <label style="display: block; font-weight: 600; margin-bottom: 8px;">Độ ưu tiên</label>
            <select id="swal-priority" class="swal2-input" style="width: 100%; padding: 10px;">
              <option value="LOW">Thấp</option>
              <option value="MEDIUM" selected>Trung bình</option>
              <option value="HIGH">Cao</option>
            </select>
          </div>

          <div style="margin-bottom: 16px;">
            <label style="display: block; font-weight: 600; margin-bottom: 8px;">
              Lý do <span style="color: #ef4444;">*</span>
            </label>
            <textarea id="swal-reason" class="swal2-textarea" rows="4" 
                      placeholder="Nhập lý do yêu cầu phụ tùng..." required
                      style="width: 100%; padding: 10px;">${prefilledPart ? `Yêu cầu nhập hàng cho ${prefilledPart.partName} (Tồn kho thấp)` : ''}</textarea>
          </div>
        </div>
      `,
      width: '600px',
      showCancelButton: true,
      confirmButtonText: 'Gửi yêu cầu',
      cancelButtonText: 'Hủy',
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#6b7280',
      showLoaderOnConfirm: true,
      preConfirm: () => {
        const vin = document.getElementById('swal-vin').value;
        const partTypeId = document.getElementById('swal-part').value;
        const quantity = document.getElementById('swal-quantity').value;
        const priority = document.getElementById('swal-priority').value;
        const reason = document.getElementById('swal-reason').value;

        // Validation
        if (!partTypeId) {
          Swal.showValidationMessage('Vui lòng chọn phụ tùng');
          return false;
        }
        
        if (!quantity || quantity < 1) {
          Swal.showValidationMessage('Số lượng phải lớn hơn 0');
          return false;
        }
        
        if (!reason.trim()) {
          Swal.showValidationMessage('Vui lòng nhập lý do yêu cầu');
          return false;
        }

        return {
          vin: vin || null,
          partTypeId,
          quantity: parseInt(quantity),
          priority,
          reason,
          requestedByStaffId: userInfo?.id,
          scBranchOffice: userInfo?.branchOffice
        };
      },
      allowOutsideClick: () => !Swal.isLoading()
    });

    if (formValues) {
      await handleSubmit(formValues);
    } else {
      onClose();
    }
  };

  const fetchVehicles = async () => {
    try {
      const response = await vehicleAPI.getAllVehicles({ page: 0, size: 100 });
      setVehicles(response.content || []);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      toast.error('Không thể tải danh sách xe');
    }
  };

  const fetchParts = async () => {
    try {
      const response = await evmInventoryAPI.getAllParts({ page: 0, size: 100 });
      setParts(response.content || []);
    } catch (error) {
      console.error('Error fetching parts:', error);
      toast.error('Không thể tải danh sách phụ tùng');
    }
  };

  const handleSubmit = async (requestData) => {
    try {
      await partsRequestAPI.createPartsRequest(requestData);
      
      Swal.fire({
        icon: 'success',
        title: 'Thành công!',
        text: 'Tạo yêu cầu phụ tùng thành công',
        confirmButtonColor: '#3b82f6'
      });
      
      if (onSuccess) {
        onSuccess();
      }
      
      onClose();
    } catch (error) {
      console.error('Error creating parts request:', error);
      Swal.fire({
        icon: 'error',
        title: 'Lỗi!',
        text: error.response?.data?.message || 'Không thể tạo yêu cầu phụ tùng',
        confirmButtonColor: '#ef4444'
      });
    }
  };

  return null; // SweetAlert2 handles the UI
};

export default PartsRequestForm;

