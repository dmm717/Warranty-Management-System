import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import UserList from "./UserList";
import UserForm from "./UserForm";
import { authAPI, userAPI } from "../../services/api";
import { toast } from "react-toastify";
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
      // TODO: Backend team cần implement endpoint này
      // GET /api/users - Lấy danh sách tất cả users
      const response = await userAPI.getAllUsers();

      if (response.success && response.data) {
        setUsers(response.data);
      } else {
        console.warn("Failed to fetch users:", response.message);
        setUsers([]);
      }
    } catch (error) {
      console.error("Fetch users error:", error);
      setError(
        "Backend chưa có API GET /api/users. Vui lòng yêu cầu Backend team implement endpoint này."
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
        // Update existing user
        const response = await userAPI.updateUser(userData);

        if (response.success) {
          await fetchUsers();
          setShowForm(false);
          setEditingUser(null);
          toast.success("Cập nhật người dùng thành công!");
        } else {
          toast.error(response.message || "Không thể cập nhật người dùng");
        }
      } else {
        // Create new user - sử dụng register API
        const registerData = {
          username: userData.name,
          email: userData.email,
          password: userData.password,
          roles: [userData.role], // Backend expects array of roles
          createdByEmail: user.email, // Email của user đang đăng nhập (EVM_ADMIN)
        };

        console.log("Creating user with data:", registerData);
        console.log("Current user email:", user.email);

        const response = await authAPI.register(registerData);

        console.log("Register response:", response);

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
    try {
      setLoading(true);
      // Note: Backend chưa có endpoint update status
      // Tạm thời update local state
      setUsers(
        users.map((u) => (u.id === userId ? { ...u, status: newStatus } : u))
      );
    } catch (error) {
      console.error("Update status error:", error);
      alert("Đã xảy ra lỗi khi cập nhật trạng thái");
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
