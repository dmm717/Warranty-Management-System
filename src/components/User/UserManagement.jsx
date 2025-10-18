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
    // TODO: Replace with real API call
    const fetchUsers = async () => {
      setLoading(true);
      try {
        // const response = await fetch('/api/users');
        // const data = await response.json();
        // setUsers(data);
        setUsers([]); // Set empty initially, replace with API data
      } catch (error) {
        // Handle error (show notification, etc.)
        console.error('Fetch users error:', error);
        setUsers([]);
      }
      setLoading(false);
    };
    fetchUsers();
  }, []);

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
        // await fetch(`/api/users/${userId}`, { method: 'DELETE' });
        // After successful delete, refetch or update state
        setUsers(users.filter((u) => u.id !== userId));
      } catch (error) {
        // Handle error (show notification, etc.)
        console.error('Delete user error:', error);
      }
    }
  };

  const handleSaveUser = async (userData) => {
    try {
      if (editingUser) {
        // await fetch(`/api/users/${editingUser.id}`, {
        //   method: 'PUT',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(userData),
        // });
        // Refetch or update state after success
        setUsers(users.map((u) =>
          u.id === editingUser.id ? { ...u, ...userData } : u
        ));
      } else {
        // const response = await fetch('/api/users', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(userData),
        // });
        // const newUser = await response.json();
        // setUsers([...users, newUser]);
        setUsers([...users, {
          ...userData,
          id: `USR${String(users.length + 1).padStart(3, "0")}`,
          joinDate: new Date().toISOString().split("T")[0],
          lastLogin: "Chưa đăng nhập",
          status: "Hoạt động",
        }]);
      }
    } catch (error) {
      // Handle error (show notification, etc.)
      console.error('Save user error:', error);
    }
    setShowForm(false);
    setEditingUser(null);
  };

  const handleUpdateStatus = async (userId, newStatus) => {
    try {
      // await fetch(`/api/users/${userId}/status`, {
      //   method: 'PATCH',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ status: newStatus }),
      // });
      setUsers(
        users.map((u) => (u.id === userId ? { ...u, status: newStatus } : u))
      );
    } catch (error) {
      // Handle error (show notification, etc.)
      console.error('Update status error:', error);
    }
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
