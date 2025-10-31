import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import UserList from "./UserList";
import UserForm from "./UserForm";
import { authAPI, userAPI } from "../../services/api";
import { toast } from "react-toastify";
import { confirmStatusChange } from "./ConfirmStatusToast";
import "../../styles/UserManagement.css";

function UserManagement() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      // Check token trước khi gọi API
      const token =
        localStorage.getItem("authToken") ||
        sessionStorage.getItem("authToken");

      if (!token) {
        console.error("❌ NO TOKEN FOUND! User needs to login.");
        setError("Bạn chưa đăng nhập. Vui lòng đăng nhập lại.");
        setUsers([]);
        setLoading(false);
        return;
      }

      // GET /api/users - Lấy danh sách tất cả users
      const response = await userAPI.getAllUsers();

      if (response.success && response.data) {
        setUsers(response.data);
      } else {
        setError(response.message || "Không thể tải danh sách người dùng");
        setUsers([]);
      }
    } catch (error) {
      console.error("❌ Fetch users error:", error);
      setError(
        "Lỗi khi tải danh sách người dùng: " +
          (error.message || "Unknown error")
      );
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = () => {
    setEditingUser(null);
    setShowForm(true);
  };

  const handleEditUser = (userToEdit) => {
    setEditingUser(userToEdit);
    setShowForm(true);
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa người dùng này?")) {
      try {
        setLoading(true);
        const response = await userAPI.deleteUserById(userId);

        if (response.success) {
          await fetchUsers();
          toast.success("Xóa người dùng thành công!");
        } else {
          toast.error(response.message || "Không thể xóa người dùng");
        }
      } catch (error) {
        console.error("Delete user error:", error);
        toast.error("Đã xảy ra lỗi khi xóa người dùng");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSaveUser = async (userData) => {
    try {
      setLoading(true);

      if (editingUser) {
        // Update existing user - EVM_ADMIN update user khác
        // Backend UserResponse: id, username, email, phoneNumber, branchOffice, dateOfBirth, roles
        // Convert date from yyyy-MM-dd to dd-MM-yyyy format
        let formattedDate = editingUser.dateOfBirth;
        if (userData.dateOfBirth) {
          const [year, month, day] = userData.dateOfBirth.split("-");
          formattedDate = `${day}-${month}-${year}`;
        }

        const updateData = {
          username: userData.name || editingUser.username,
          email: userData.email || editingUser.email,
          phoneNumber: userData.phone || editingUser.phoneNumber,
          branchOffice: userData.department && userData.department.trim() 
            ? userData.department 
            : null, // Gửi null nếu rỗng, backend sẽ validate cho SC roles
          dateOfBirth: formattedDate,
          specialty: null,
        };

        const response = await userAPI.adminUpdateUser(
          editingUser.id,
          updateData
        );

        if (response.success) {
          await fetchUsers();
          setShowForm(false);
          setEditingUser(null);
          toast.success("Cập nhật người dùng thành công!");
        } else {
          toast.error(response.message || "Không thể cập nhật người dùng");
        }
      } else {
        // Create new user - Convert date from yyyy-MM-dd to dd-MM-yyyy
        const [year, month, day] = userData.dateOfBirth.split("-");
        const formattedDate = `${day}-${month}-${year}`;

        const registerData = {
          username: userData.name,
          email: userData.email,
          password: userData.password,
          roles: [userData.role],
          createdByEmail: user.email,
          phoneNumber: userData.phone,
          branchOffice: userData.department,
          dateOfBirth: formattedDate,
          specialty: null,
        };

        const response = await authAPI.register(registerData);

        if (response.success) {
          await fetchUsers();
          setShowForm(false);
          setEditingUser(null);
          toast.success("Tạo người dùng thành công!");
        } else {
          const errorMsg = response.message || "Không thể tạo người dùng mới";
          toast.error(errorMsg);
          if (response.errors) {
            console.error("Validation errors:", response.errors);
          }
        }
      }
    } catch (error) {
      console.error("Save user error:", error);
      toast.error("Đã xảy ra lỗi khi lưu người dùng");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (userId, newStatus) => {
    // Chỉ EVM_ADMIN mới được phép
    if (user?.role !== "EVM_ADMIN") {
      toast.error("Chỉ EVM_ADMIN mới có quyền thay đổi trạng thái người dùng");
      return;
    }

    // Map từ Vietnamese sang backend enum
    const statusMap = {
      "Tạm khóa": "LOCKED",
      "Ngừng hoạt động": "INACTIVE",
      "Hoạt động": "ACTIVE",
    };

    const backendStatus = statusMap[newStatus];
    if (!backendStatus) {
      toast.error("Trạng thái không hợp lệ");
      return;
    }

    // Show custom confirm toast and wait for user response
    const result = await confirmStatusChange(userId, newStatus);

    // If user cancelled, stop here
    if (!result.confirmed) {
      return;
    }

    // User confirmed, proceed with API call
    try {
      setLoading(true);
      const response = await userAPI.updateUserStatus(
        userId,
        backendStatus,
        result.reason
      );

      if (response.success) {
        await fetchUsers();
        toast.success(`Đã chuyển trạng thái sang "${newStatus}"`);
      } else {
        toast.error(response.message || "Không thể cập nhật trạng thái");
      }
    } catch (error) {
      console.error("Update status error:", error);
      toast.error("Đã xảy ra lỗi khi cập nhật trạng thái");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingUser(null);
  };

  if (user?.role !== "EVM_ADMIN" && user?.role !== "SC_ADMIN") {
    return (
      <div className="access-denied">
        <div className="access-denied-icon">🚫</div>
        <h2>Truy cập bị từ chối</h2>
        <p>Bạn không có quyền truy cập vào trang này.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Đang tải dữ liệu người dùng...</p>
      </div>
    );
  }

  // Lọc danh sách user theo role nếu là SC_Admin
  const filteredUsers =
    user?.role === "SC_ADMIN"
      ? users.filter((u) => u.role === "SC_STAFF" || u.role === "SC_TECHNICAL")
      : users;

  return (
    <div className="user-management">
      <div className="page-header">
        <h1>Quản lý người dùng</h1>
        {!showForm && (
          <button onClick={handleAddUser} className="btn btn-primary">
            <span>➕</span>
            Thêm người dùng
          </button>
        )}
      </div>

      {/* Hiển thị error nếu Backend chưa có API */}
      {error && (
        <div
          className="error-message"
          style={{
            padding: "12px 16px",
            backgroundColor: "#f8d7da",
            border: "1px solid #f5c6cb",
            borderRadius: "4px",
            marginBottom: "16px",
            color: "#721c24",
          }}
        >
          <strong>⚠️ Lỗi:</strong> {error}
          <br />
          <small>
            Backend team cần thêm endpoint: <code>GET /api/users</code>
          </small>
        </div>
      )}

      {!showForm ? (
        <UserList
          users={filteredUsers}
          onEdit={handleEditUser}
          onDelete={handleDeleteUser}
          onUpdateStatus={handleUpdateStatus}
        />
      ) : (
        <UserForm
          user={editingUser}
          onSave={handleSaveUser}
          onCancel={handleCancelForm}
        />
      )}
    </div>
  );
}

export default UserManagement;
