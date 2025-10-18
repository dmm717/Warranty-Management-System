import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import UserList from "./UserList";
import UserForm from "./UserForm";
import "../../styles/UserManagement.css";

function UserManagement() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const mockUsers = [
      {
        id: "SC001",
        name: "Nguyễn Văn An",
        email: "sc_staff@vinfast.com",
        role: "SC_Staff",
        department: "Service Center",
        phone: "0912345678",
        status: "Hoạt động",
        joinDate: "2023-01-15",
        lastLogin: "2025-10-09",
      },
      {
        id: "SCT001",
        name: "Trần Văn Bình",
        email: "sc_tech@vinfast.com",
        role: "SC_Technician",
        department: "Service Center",
        phone: "0987654321",
        status: "Hoạt động",
        joinDate: "2023-02-20",
        lastLogin: "2025-10-08",
      },
      {
        id: "EVM001",
        name: "Lê Thị Cẩm",
        email: "evm_staff@vinfast.com",
        role: "EVM_Staff",
        department: "Manufacturing",
        phone: "0901234567",
        status: "Hoạt động",
        joinDate: "2023-01-10",
        lastLogin: "2025-10-09",
      },
      {
        id: "ADM001",
        name: "Phạm Văn Dũng",
        email: "admin@vinfast.com",
        role: "Admin",
        department: "IT",
        phone: "0976543210",
        status: "Hoạt động",
        joinDate: "2022-12-01",
        lastLogin: "2025-10-09",
      },
      {
        id: "SC002",
        name: "Hoàng Thị Em",
        email: "sc_staff2@vinfast.com",
        role: "SC_Staff",
        department: "Service Center",
        phone: "0965432109",
        status: "Tạm khóa",
        joinDate: "2023-03-05",
        lastLogin: "2025-09-28",
      },
    ];

    setTimeout(() => {
      setUsers(mockUsers);
      setLoading(false);
    }, 1000);
  }, []);

  const handleAddUser = () => {
    setEditingUser(null);
    setShowForm(true);
  };

  const handleEditUser = (userToEdit) => {
    setEditingUser(userToEdit);
    setShowForm(true);
  };

  const handleDeleteUser = (userId) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa người dùng này?")) {
      setUsers(users.filter((u) => u.id !== userId));
    }
  };

  const handleSaveUser = (userData) => {
    if (editingUser) {
      const updatedUsers = users.map((u) =>
        u.id === editingUser.id ? { ...u, ...userData } : u
      );
      setUsers(updatedUsers);
    } else {
      const newUser = {
        ...userData,
        id: `USR${String(users.length + 1).padStart(3, "0")}`,
        joinDate: new Date().toISOString().split("T")[0],
        lastLogin: "Chưa đăng nhập",
        status: "Hoạt động",
      };
      setUsers([...users, newUser]);
    }
    setShowForm(false);
    setEditingUser(null);
  };

  const handleUpdateStatus = (userId, newStatus) => {
    setUsers(
      users.map((u) => (u.id === userId ? { ...u, status: newStatus } : u))
    );
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingUser(null);
  };

  if (user?.role !== "Admin" && user?.role !== "SC_Admin") {
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
    user?.role === "SC_Admin"
      ? users.filter((u) => u.role === "SC_Staff" || u.role === "SC_Technician")
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
