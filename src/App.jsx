import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import TechnicianManagement from "./components/Technician/TechnicianManagement";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Login from "./components/Auth/Login";
import Dashboard from "./components/Dashboard/Dashboard";
import VehicleManagement from "./components/Vehicle/VehicleManagement";
import WarrantyClaimManagement from "./components/Warranty/WarrantyClaimManagement";
import PartsManagement from "./components/Parts/PartsManagement";
import CampaignManagement from "./components/Campaign/CampaignManagement";
import ReportManagement from "./components/Report/ReportManagement";
import UserManagement from "./components/User/UserManagement";
import ProfileForm from "./components/User/ProfileForm";
import ShippingManagement from "./components/Shipping/ShippingManagement";
import Layout from "./components/Layout/Layout";
import "./styles/App.css";

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
          />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="vehicles" element={<VehicleManagement />} />
              <Route
                path="warranty-claims"
                element={<WarrantyClaimManagement />}
              />
              <Route path="parts" element={<PartsManagement />} />
              <Route path="campaigns" element={<CampaignManagement />} />
              <Route path="reports" element={<ReportManagement />} />
              <Route path="shipping" element={<ShippingManagement />} />
              <Route path="users" element={<UserManagement />} />
              <Route path="profile" element={<ProfileForm />} />
            </Route>
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
}

export default App;
