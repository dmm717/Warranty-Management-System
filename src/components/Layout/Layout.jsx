import React from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";
import "../../styles/Layout.css";
import buildingBg from "../../assets/buildingBlack.jpg";

function Layout() {
  return (
    <div className="layout">
      <Header />
      <div className="layout-body" style={{
        backgroundImage: `url(${buildingBg})`,
        backgroundPosition: 'center',
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }}>
        <Sidebar />
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default Layout;
