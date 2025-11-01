import Swal from "sweetalert2";
import "../../styles/ConfirmStatusToast.css";

/**
 * Custom Confirmation Dialog for Status Change using SweetAlert2
 * Usage: await confirmStatusChange(userId, newStatus)
 * Returns: Promise<{ confirmed: boolean, reason: string }>
 */

export const confirmStatusChange = async (userId, newStatus) => {
  let title = "";
  let text = "";
  let icon = "";
  let requireReason = false;
  let confirmButtonColor = "";

  // Configure based on status
  switch (newStatus) {
    case "Tạm khóa":
      icon = "warning";
      title = "Tạm khóa tài khoản này?";
      text = "Người dùng sẽ không thể đăng nhập cho đến khi được mở khóa.";
      requireReason = true;
      confirmButtonColor = "#f59e0b";
      break;
    case "Ngừng hoạt động":
      icon = "warning";
      title = "Bạn đang vô hiệu hóa tài khoản";
      text =
        "Tài khoản sẽ không thể đăng nhập. Dữ liệu vẫn được giữ lại và có thể khôi phục sau.";
      requireReason = true;
      confirmButtonColor = "#ef4444";
      break;
    case "Hoạt động":
      icon = "question";
      title = "Kích hoạt lại tài khoản này?";
      text = "Người dùng sẽ có thể đăng nhập trở lại.";
      requireReason = false;
      confirmButtonColor = "#10b981";
      break;
    default:
      icon = "question";
      title = "Xác nhận thay đổi trạng thái?";
  }

  // Show confirmation
  const result = await Swal.fire({
    title: title,
    text: text,
    icon: icon,
    showCancelButton: true,
    confirmButtonColor: confirmButtonColor,
    cancelButtonColor: "#6b7280",
    confirmButtonText: "Xác nhận",
    cancelButtonText: "Hủy",
    customClass: {
      popup: "swal-custom-popup",
      confirmButton: "swal-confirm-btn",
      cancelButton: "swal-cancel-btn",
    },
  });

  // If user cancelled
  if (!result.isConfirmed) {
    return { confirmed: false, reason: null };
  }

  // If reason is required, ask for it
  if (requireReason) {
    const reasonResult = await Swal.fire({
      title: `Lý do ${newStatus.toLowerCase()}`,
      input: "textarea",
      inputLabel: "Vui lòng nhập lý do:",
      inputPlaceholder: "Nhập lý do...",
      inputAttributes: {
        "aria-label": "Nhập lý do",
      },
      showCancelButton: true,
      confirmButtonColor: confirmButtonColor,
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Xác nhận",
      cancelButtonText: "Hủy",
      inputValidator: (value) => {
        if (!value || !value.trim()) {
          return "Vui lòng nhập lý do!";
        }
      },
      customClass: {
        popup: "swal-custom-popup",
        confirmButton: "swal-confirm-btn",
        cancelButton: "swal-cancel-btn",
      },
    });

    // If user cancelled at reason step
    if (!reasonResult.isConfirmed) {
      return { confirmed: false, reason: null };
    }

    return { confirmed: true, reason: reasonResult.value };
  }

  // No reason required
  return { confirmed: true, reason: null };
};

export default confirmStatusChange;
