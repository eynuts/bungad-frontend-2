// src/admin/AdminRevenue.jsx
import React, { useEffect, useState } from "react";
import "./AdminRevenue.css";
import { ref, onValue } from "firebase/database";
import { db } from "../firebaseConfig";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { saveAs } from "file-saver";
import {
  FaFilePdf,
  FaFileCsv,
  FaWallet,
  FaCalendarDay,
  FaCalendarAlt,
  FaChartLine,
  FaArrowUp,
  FaUserCircle,
  FaReceipt,
  FaDownload,
} from "react-icons/fa";

const AdminRevenue = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [revenues, setRevenues] = useState({
    daily: 0,
    monthly: 0,
    yearly: 0,
  });

  const PRICE_MONTHLY = 50;
  const PRICE_YEARLY = 480;

  /* ---------------------------------------------
      FETCH ALL APPROVED SUBSCRIPTIONS
  --------------------------------------------- */
  useEffect(() => {
    const accountsRef = ref(db, "accounts");
    const unsubscribe = onValue(accountsRef, (snapshot) => {
      const data = snapshot.val() || {};
      const list = Object.keys(data)
        .map((uid) => ({
          uid,
          ...data[uid],
        }))
        .filter((acc) => acc.subscriptionStatus === "approved");

      setAccounts(list);
      computeRevenue(list);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  /* ---------------------------------------------
      CALCULATE REVENUE LOGIC
  --------------------------------------------- */
  const computeRevenue = (list) => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const startOfYear = new Date(now.getFullYear(), 0, 1).getTime();

    let daily = 0, monthly = 0, yearly = 0;

    list.forEach((acc) => {
      const approvedDate = acc.approvedAt; // Expected timestamp
      const amount = acc.subscriptionPlan === "monthly" ? PRICE_MONTHLY : PRICE_YEARLY;

      if (approvedDate >= startOfDay) daily += amount;
      if (approvedDate >= startOfMonth) monthly += amount;
      if (approvedDate >= startOfYear) yearly += amount;
    });

    setRevenues({ daily, monthly, yearly });
  };

  /* ---------------------------------------------
      EXPORT UTILITIES
  --------------------------------------------- */
  const getFilteredData = (type) => {
    const now = new Date();
    if (type === "Daily") {
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      return accounts.filter((acc) => acc.approvedAt >= startOfDay);
    } else if (type === "Monthly") {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
      return accounts.filter((acc) => acc.approvedAt >= startOfMonth);
    } else if (type === "Yearly") {
      const startOfYear = new Date(now.getFullYear(), 0, 1).getTime();
      return accounts.filter((acc) => acc.approvedAt >= startOfYear);
    }
    return accounts;
  };

  const downloadPDF = (type) => {
    const data = getFilteredData(type);
    const doc = new jsPDF();
    doc.text(`Revenue Report - ${type}`, 14, 20);
    
    const rows = data.map((acc, i) => [
      i + 1,
      acc.name || "N/A",
      acc.email,
      acc.subscriptionPlan.toUpperCase(),
      `P${acc.subscriptionPlan === "monthly" ? PRICE_MONTHLY : PRICE_YEARLY}`,
      new Date(acc.approvedAt).toLocaleDateString(),
      acc.referenceNumber || "-"
    ]);

    autoTable(doc, {
      startY: 30,
      head: [["#", "Name", "Email", "Plan", "Amount", "Date", "Ref #"]],
      body: rows,
      theme: 'striped'
    });
    doc.save(`Revenue_${type}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const downloadCSV = (type) => {
    const data = getFilteredData(type);
    let csv = "Name,Email,Plan,Amount,Date,Reference\n";
    data.forEach((acc) => {
      const amount = acc.subscriptionPlan === "monthly" ? PRICE_MONTHLY : PRICE_YEARLY;
      csv += `${acc.name},${acc.email},${acc.subscriptionPlan},${amount},${new Date(acc.approvedAt).toLocaleDateString()},${acc.referenceNumber || "-"}\n`;
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, `Revenue_${type}.csv`);
  };

  if (loading) return (
    <div className="revenue-loader-container">
      <div className="loader-ring"></div>
      <p>Analyzing Financial Data...</p>
    </div>
  );

  return (
    <div className="admin-revenue-container">
      {/* Header Section */}
      <header className="revenue-dashboard-header">
        <div className="header-left">
          <div className="title-with-icon">
            <FaChartLine className="main-icon" />
            <div>
              <h2>Financial Analytics</h2>
              <p>Real-time revenue monitoring and reporting</p>
            </div>
          </div>
        </div>
        <div className="header-right">
          <div className="lifetime-badge">
            <FaWallet className="badge-icon" />
            <div className="badge-content">
              <span>Lifetime Sales</span>
              <strong>{accounts.length} Approved</strong>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="revenue-stats-grid">
        {[
          { label: "Daily Income", key: "daily", icon: <FaCalendarDay />, class: "daily" },
          { label: "Monthly Income", key: "monthly", icon: <FaCalendarAlt />, class: "monthly" },
          { label: "Yearly Income", key: "yearly", icon: <FaChartLine />, class: "yearly" }
        ].map((stat) => (
          <div className={`rev-card ${stat.class}`} key={stat.key}>
            <div className="card-top">
              <div className="card-icon-wrapper">{stat.icon}</div>
              <div className="trend-indicator">
                <FaArrowUp /> <span>+2.5%</span>
              </div>
            </div>
            <div className="card-body">
              <span className="card-label">{stat.label}</span>
              <h3 className="card-amount">₱{revenues[stat.key].toLocaleString()}</h3>
            </div>
            <div className="card-footer">
              <button className="export-btn pdf" onClick={() => downloadPDF(stat.label.split(' ')[0])}>
                <FaFilePdf /> PDF
              </button>
              <button className="export-btn csv" onClick={() => downloadCSV(stat.label.split(' ')[0])}>
                <FaFileCsv /> CSV
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Transaction Table */}
      <div className="revenue-content-section">
        <div className="section-header">
          <div className="header-title">
            <FaReceipt />
            <h3>Recent Transactions</h3>
          </div>
          <button className="download-all-btn" onClick={() => downloadPDF("All")}>
            <FaDownload /> Export All
          </button>
        </div>

        <div className="table-container">
          <table className="revenue-modern-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Status</th>
                <th>Plan Details</th>
                <th>Transaction Date</th>
                <th>Ref Number</th>
                <th>Total Paid</th>
              </tr>
            </thead>
            <tbody>
              {accounts.length === 0 ? (
                <tr>
                  <td colSpan="6" className="empty-row">No approved transactions found in the database.</td>
                </tr>
              ) : (
                accounts.slice().reverse().map((acc) => (
                  <tr key={acc.uid}>
                    <td>
                      <div className="customer-cell">
                        <FaUserCircle className="user-avatar" />
                        <div className="user-text">
                          <span className="user-name">{acc.name || "Unknown"}</span>
                          <span className="user-email">{acc.email}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="status-pill-approved">Completed</span>
                    </td>
                    <td>
                      <span className={`plan-pill ${acc.subscriptionPlan}`}>
                        {acc.subscriptionPlan}
                      </span>
                    </td>
                    <td className="date-cell">
                      {new Date(acc.approvedAt).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric'
                      })}
                    </td>
                    <td className="ref-cell">#{acc.referenceNumber || "N/A"}</td>
                    <td className="amount-cell">
                      ₱{(acc.subscriptionPlan === "monthly" ? PRICE_MONTHLY : PRICE_YEARLY).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminRevenue;