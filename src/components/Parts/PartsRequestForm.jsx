import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import {
  partsRequestAPI,
  evmInventoryAPI,
  vehicleAPI,
} from "../../services/api";

/**
 * Parts Request Form using SweetAlert2
 * SC_STAFF/SC_ADMIN request parts from EVM
 */
const PartsRequestForm = ({
  isOpen,
  onClose,
  onSuccess,
  prefilledPart = null,
  userInfo,
}) => {
  const [vehicles, setVehicles] = useState([]);
  const [parts, setParts] = useState([]);

  useEffect(() => {
    if (isOpen) {
      showFormModal();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, prefilledPart]);

  const showFormModal = async () => {
    // Form đã bị vô hiệu hóa
    toast.info("Chức năng tạo yêu cầu phụ tùng đã bị tắt");
    onClose();
  };

  const fetchVehicles = async () => {
    try {
      const response = await vehicleAPI.getAllVehicles({ page: 0, size: 100 });
      setVehicles(response.content || []);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      toast.error("Không thể tải danh sách xe");
    }
  };

  const fetchParts = async () => {
    try {
      const response = await evmInventoryAPI.getAllParts({
        page: 0,
        size: 100,
      });
      setParts(response.content || []);
    } catch (error) {
      console.error("Error fetching parts:", error);
      toast.error("Không thể tải danh sách phụ tùng");
    }
  };

  const handleSubmit = async (requestData) => {
    try {
      await partsRequestAPI.createPartsRequest(requestData);

      Swal.fire({
        icon: "success",
        title: "Thành công!",
        text: "Tạo yêu cầu phụ tùng thành công",
        confirmButtonColor: "#3b82f6",
      });

      if (onSuccess) {
        onSuccess();
      }

      onClose();
    } catch (error) {
      console.error("Error creating parts request:", error);
      Swal.fire({
        icon: "error",
        title: "Lỗi!",
        text: error.response?.data?.message || "Không thể tạo yêu cầu phụ tùng",
        confirmButtonColor: "#ef4444",
      });
    }
  };

  return null; // SweetAlert2 handles the UI
};

export default PartsRequestForm;
