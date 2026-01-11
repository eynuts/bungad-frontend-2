// src/admin/Admin.jsx
import React, { useEffect, useState } from "react";
import "./admin.css";
import {
  FaHome,
  FaTachometerAlt,
  FaUsers,
  FaFileInvoiceDollar,
  FaBars,
  FaTimes,
  FaMoneyBillWave,
  FaGamepad,
  FaChevronRight,
  FaUserShield
} from "react-icons/fa";
import { ref, onValue } from "firebase/database";
import { db } from "../firebaseConfig";

// Admin sections
import AdminDashboard from "./AdminDashboard";
import AdminUser from "./AdminUser";
import AdminSubscription from "./AdminSubscription";
import AdminRevenue from "./AdminRevenue";
import AdminGame from "./AdminGame";

const Admin = ({ user, onBack }) => {
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [users, setUsers] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);

  const [userStats, setUserStats] = useState({
    totalUsers: 0,
    daily: 0,
    monthly: 0,
    yearly: 0
  });

  const [loading, setLoading] = useState(true);

  // 🔥 FETCH FROM accounts (Logic remains unchanged)
  useEffect(() => {
    const accountsRef = ref(db, "accounts");

    const unsubscribe = onValue(accountsRef, snapshot => {
      const data = snapshot.val() || {};

      const usersList = [];
      const subsList = [];

      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfYear = new Date(now.getFullYear(), 0, 1);

      let daily = 0;
      let monthly = 0;
      let yearly = 0;

      Object.keys(data).forEach(uid => {
        const acc = data[uid];

        const account = {
          uid,
          ...acc
        };

        usersList.push(account);

        // 📊 USER STATS
        if (acc.createdAt) {
          const created = new Date(acc.createdAt);
          if (created >= startOfDay) daily++;
          if (created >= startOfMonth) monthly++;
          if (created >= startOfYear) yearly++;
        }

        // 💳 SUBSCRIPTIONS (pending / approved / rejected)
        if (acc.subscriptionStatus) {
          subsList.push({
            uid: acc.uid,
            name: acc.name,
            email: acc.email,
            subscriptionPlan: acc.subscriptionPlan,
            subscriptionStatus: acc.subscriptionStatus,
            approvedAt: acc.approvedAt,
            referenceNumber: acc.referenceNumber,
            submittedAt: acc.submittedAt,
            isSubscribed: acc.isSubscribed
          });
        }        
      });

      setUsers(usersList);
      setSubscriptions(subsList);
      setUserStats({
        totalUsers: usersList.length,
        daily,
        monthly,
        yearly
      });

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const toggleSidebar = () => setSidebarOpen(prev => !prev);

  // Helper to get Page Title
  const getPageTitle = () => {
    switch(activeMenu) {
      case 'dashboard': return 'System Overview';
      case 'subscriptions': return 'Subscription Management';
      case 'revenue': return 'Financial Reports';
      case 'users': return 'User Directory';
      case 'games': return 'Game Controls';
      default: return 'Admin Panel';
    }
  };

  return (
    <div className={`admin-portal-wrapper ${sidebarOpen ? "sidebar-visible" : "sidebar-hidden"}`}>
      
      {/* --- NEW MODERN SIDEBAR --- */}
      <aside className="modern-sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <FaUserShield className="logo-icon" />
            <span>Admin<span>Core</span></span>
          </div>
          <button className="mobile-close-btn" onClick={toggleSidebar}>
            <FaTimes />
          </button>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-group">
            <p className="nav-label">Main Menu</p>
            <button
              className={`nav-link ${activeMenu === "dashboard" ? "active" : ""}`}
              onClick={() => setActiveMenu("dashboard")}
            >
              <FaTachometerAlt /> <span>Dashboard</span>
              {activeMenu === "dashboard" && <FaChevronRight className="active-indicator" />}
            </button>

            <button
              className={`nav-link ${activeMenu === "subscriptions" ? "active" : ""}`}
              onClick={() => setActiveMenu("subscriptions")}
            >
              <FaFileInvoiceDollar /> <span>Subscriptions</span>
              {activeMenu === "subscriptions" && <FaChevronRight className="active-indicator" />}
            </button>

            <button
              className={`nav-link ${activeMenu === "revenue" ? "active" : ""}`}
              onClick={() => setActiveMenu("revenue")}
            >
              <FaMoneyBillWave /> <span>Revenue</span>
              {activeMenu === "revenue" && <FaChevronRight className="active-indicator" />}
            </button>

            <button
              className={`nav-link ${activeMenu === "users" ? "active" : ""}`}
              onClick={() => setActiveMenu("users")}
            >
              <FaUsers /> <span>Users List</span>
              {activeMenu === "users" && <FaChevronRight className="active-indicator" />}
            </button>

          </div>
        </nav>

        <div className="sidebar-footer">
          <button className="exit-button" onClick={onBack}>
            <FaHome /> <span>Return to Portal</span>
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT SECTION --- */}
      <main className="admin-main-viewport">
        
        {/* TOP NAVBAR */}
        <header className="admin-top-bar">
          <div className="header-left">
            <button className="menu-toggle-btn" onClick={toggleSidebar}>
              <FaBars />
            </button>
            <h1 className="page-heading">{getPageTitle()}</h1>
          </div>
          
          <div className="header-right">
            <div className="admin-user-pill">
              <div className="status-dot"></div>
              <span>{user?.email || "Administrator"}</span>
            </div>
          </div>
        </header>

        {/* DYNAMIC CONTENT BODY */}
        <div className="admin-scroll-content">
          {loading ? (
            <div className="admin-loader">
              <div className="spinner"></div>
              <p>Synchronizing Database...</p>
            </div>
          ) : (
            <div className="content-fade-in">
              {activeMenu === "dashboard" && (
                <AdminDashboard
                  user={user}
                  userStats={userStats}
                  subscriptions={subscriptions}
                />
              )}

              {activeMenu === "subscriptions" && (
                <AdminSubscription
                  subscriptions={subscriptions}
                />
              )}

              {activeMenu === "users" && (
                <AdminUser users={users} setUsers={setUsers} />
              )}

              {activeMenu === "revenue" && (
                <AdminRevenue subscriptions={subscriptions} />
              )}

              {activeMenu === "games" && (
                <AdminGame users={users} />
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Admin;