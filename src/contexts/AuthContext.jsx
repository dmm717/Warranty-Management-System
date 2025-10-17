import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in from localStorage
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
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
        "sc_admin@vinfast.com": {
          id: "SCA001",
          name: "Nguyen Thi SC Admin",
          email: "sc_admin@vinfast.com",
          role: "SC_Admin",
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

      const foundUser = mockUsers[credentials.email];
      if (foundUser && credentials.password === "password123") {
        setUser(foundUser);
        localStorage.setItem("user", JSON.stringify(foundUser));
        return { success: true };
      } else {
        return { success: false, message: "Email hoặc mật khẩu không đúng" };
      }
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

  const value = {
    user,
    login,
    logout,
    loading,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
