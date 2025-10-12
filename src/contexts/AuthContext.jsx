import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registeredUsers, setRegisteredUsers] = useState([]);

  useEffect(() => {
    // Check if user is logged in from localStorage
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    // Load registered users
    const storedUsers = localStorage.getItem("registeredUsers");
    if (storedUsers) {
      setRegisteredUsers(JSON.parse(storedUsers));
    }

    setLoading(false);
  }, []);

  const login = async (credentials) => {
    try {
      // Mock login logic - replace with actual API call
      const mockUsers = {
        "sc_staff@vinfast.com": {
          id: "SC001",
          name: "Nguyen Van A",
          email: "sc_staff@vinfast.com",
          role: "SC_Staff",
          department: "Service Center",
        },
        "sc_tech@vinfast.com": {
          id: "SCT001",
          name: "Tran Van B",
          email: "sc_tech@vinfast.com",
          role: "SC_Technician",
          department: "Service Center",
        },
        "evm_staff@vinfast.com": {
          id: "EVM001",
          name: "Le Thi C",
          email: "evm_staff@vinfast.com",
          role: "EVM_Staff",
          department: "Manufacturing",
        },
        "admin@vinfast.com": {
          id: "ADM001",
          name: "Pham Van D",
          email: "admin@vinfast.com",
          role: "Admin",
          department: "IT",
        },
      };

      // Check in mock users
      const foundMockUser = mockUsers[credentials.email];
      if (foundMockUser && credentials.password === "password123") {
        setUser(foundMockUser);
        localStorage.setItem("user", JSON.stringify(foundMockUser));
        return { success: true };
      }
      
      // Check in registered users
      const foundRegisteredUser = registeredUsers.find(u => u.email === credentials.email);
      if (foundRegisteredUser && credentials.password === "password123") { // In real app, passwords would be hashed
        setUser(foundRegisteredUser);
        localStorage.setItem("user", JSON.stringify(foundRegisteredUser));
        return { success: true };
      }
      
      // No user found or wrong password
      return { success: false, message: "Email hoặc mật khẩu không đúng" };
    } catch (error) {
      return { success: false, message: "Login failed" };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  const updateProfile = (updatedInfo) => {
    const updatedUser = { ...user, ...updatedInfo };
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
    return { success: true };
  };

  const register = async (userData) => {
    try {
      // Check if email already exists in mock users or registered users
      const mockUsers = {
        "sc_staff@vinfast.com": true,
        "sc_tech@vinfast.com": true,
        "evm_staff@vinfast.com": true,
        "admin@vinfast.com": true,
      };
      
      if (mockUsers[userData.email] || registeredUsers.some(u => u.email === userData.email)) {
        return { success: false, message: "Email này đã được sử dụng" };
      }
      
      // Create new user with ID
      const newUser = {
        id: `USER${Date.now().toString().slice(-5)}`,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        department: userData.department,
        // Password would normally be hashed on the server side
      };
      
      // Store in local storage (in a real app, this would be a server request)
      const updatedUsers = [...registeredUsers, newUser];
      setRegisteredUsers(updatedUsers);
      localStorage.setItem("registeredUsers", JSON.stringify(updatedUsers));
      
      return { success: true };
    } catch (error) {
      return { success: false, message: "Đăng ký thất bại" };
    }
  };

  const value = {
    user,
    login,
    logout,
    loading,
    updateProfile,
    register,
    registeredUsers
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
