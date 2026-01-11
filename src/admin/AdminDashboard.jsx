import React, { useMemo } from "react";
import { 
  FaUsers, 
  FaUserPlus, 
  FaCalendarCheck, 
  FaCalendarDay, // Use Day as the stable alternative for Alt
  FaFileInvoiceDollar, 
  FaHourglassHalf, 
  FaCheckCircle, 
  FaTimesCircle,
  FaWallet, 
  FaChartLine,
  FaArrowUp
} from "react-icons/fa"; 
import "./AdminDashboard.css";

const AdminDashboard = ({ user, userStats, subscriptions }) => {
  // --- CORE LOGIC ---
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  const stats = useMemo(() => {
    const PRICE_MONTHLY = 50;   
    const PRICE_YEARLY = 480;

    let dailyRevenue = 0;
    let monthlyRevenue = 0;
    let yearlyRevenue = 0;

    let pending = 0;
    let approved = 0;
    let rejected = 0;

    subscriptions.forEach((sub) => {
      const status = sub.subscriptionStatus || "pending";

      if (status === "approved") approved++;
      if (status === "pending") pending++;
      if (status === "rejected") rejected++;

      if (status === "approved" && sub.approvedAt) {
        const amount = sub.subscriptionPlan === "monthly" ? PRICE_MONTHLY : PRICE_YEARLY;
        const approvedDate = new Date(Number(sub.approvedAt)); 

        if (!isNaN(approvedDate.getTime())) {
          if (approvedDate >= startOfDay) dailyRevenue += amount;
          if (approvedDate >= startOfMonth) monthlyRevenue += amount;
          if (approvedDate >= startOfYear) yearlyRevenue += amount;
        }
      }
    });

    return {
      totalSubs: subscriptions.length,
      pending,
      approved,
      rejected,
      dailyRevenue,
      monthlyRevenue,
      yearlyRevenue,
    };
  }, [subscriptions, startOfDay, startOfMonth, startOfYear]);

  return (
    <div className="dashboard-container">
      {/* 1. TOP HERO HEADER */}
      <header className="dashboard-hero">
        <div className="hero-content">
          <p className="hero-subtitle">
            System Overview • {now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
          <h1 className="hero-title">
            Welcome back, <span>{user?.displayName?.split(' ')[0] || "Admin"}</span> 👋
          </h1>
        </div>
        <div className="hero-badge">
          <div className="pulse-icon"></div>
          <span>Live Metrics</span>
        </div>
      </header>

      {/* 2. BENTO STYLE TOP STATS */}
      <section className="bento-grid">
        <div className="bento-item main-revenue-card">
          <div className="bento-inner">
            <div className="bento-label">
              <FaWallet /> <span>Monthly Revenue Performance</span>
            </div>
            <div className="bento-value">
              ₱{stats.monthlyRevenue.toLocaleString()}
            </div>
            <div className="bento-trend positive">
              <FaArrowUp /> <span>Growth tracking active</span>
            </div>
          </div>
        </div>
        
        <div className="bento-item platform-reach-card">
          <div className="bento-inner">
            <div className="bento-label">
              <FaUsers /> <span>Platform Reach</span>
            </div>
            <div className="bento-value">
              {userStats.totalUsers.toLocaleString()}
            </div>
            <p className="bento-subtext">Registered user accounts</p>
          </div>
        </div>
      </section>

      {/* 3. MAIN ANALYTICS ROW */}
      <div className="dashboard-main-grid">
        
        {/* User Growth Column */}
        <div className="grid-column">
          <h3 className="grid-label">User Growth</h3>
          <div className="stat-card">
            <div className="stat-icon-box yellow">
              <FaUserPlus />
            </div>
            <div className="stat-data">
              <span className="data-label">New Today</span>
              <span className="data-value">{userStats.daily}</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon-box blue">
              <FaCalendarCheck />
            </div>
            <div className="stat-data">
              <span className="data-label">Active this Month</span>
              <span className="data-value">{userStats.monthly}</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon-box purple">
              <FaCalendarDay />
            </div>
            <div className="stat-data">
              <span className="data-label">Growth this Year</span>
              <span className="data-value">{userStats.yearly}</span>
            </div>
          </div>
        </div>

        {/* Revenue Details Column */}
        <div className="grid-column">
          <h3 className="grid-label">Earnings Breakdown</h3>
          <div className="glass-revenue-card">
             <div className="glass-item">
                <span className="glass-label">Daily Earnings</span>
                <strong className="glass-value">₱{stats.dailyRevenue.toLocaleString()}</strong>
             </div>
             <div className="glass-separator"></div>
             <div className="glass-item">
                <span className="glass-label">Annual Revenue</span>
                <strong className="glass-value">₱{stats.yearlyRevenue.toLocaleString()}</strong>
             </div>
             <div className="glass-footer">
                <FaChartLine /> Total of {stats.approved} approved subs
             </div>
          </div>
        </div>

        {/* Subscription Requests Column */}
        <div className="grid-column">
          <h3 className="grid-label">Subscription Queue</h3>
          <div className="status-queue-list">
             <div className="queue-pill warning">
                <div className="pill-info">
                  <FaHourglassHalf />
                  <span>Pending</span>
                </div>
                <strong>{stats.pending}</strong>
             </div>

             <div className="queue-pill success">
                <div className="pill-info">
                  <FaCheckCircle />
                  <span>Approved</span>
                </div>
                <strong>{stats.approved}</strong>
             </div>

             <div className="queue-pill danger">
                <div className="pill-info">
                  <FaTimesCircle />
                  <span>Rejected</span>
                </div>
                <strong>{stats.rejected}</strong>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;