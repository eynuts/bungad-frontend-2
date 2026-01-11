// src/admin/AdminSubscription.jsx
import React, { useEffect, useMemo, useState } from "react";
import "./AdminSubscription.css";
import {
  FaCheck,
  FaTimes,
  FaSearch,
  FaUndo,
  FaHourglassHalf,
  FaCheckCircle,
  FaTimesCircle,
  FaUserShield,
  FaReceipt,
  FaCalendarAlt,
} from "react-icons/fa";

import { db } from "../firebaseConfig";
import { ref, get, update } from "firebase/database";

const AdminSubscription = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending"); // pending | approved | rejected
  const [search, setSearch] = useState("");

  /* ---------------------------------------------
      FETCH ALL ACCOUNTS WITH SUBSCRIPTIONS
  --------------------------------------------- */
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const snapshot = await get(ref(db, "accounts"));
        if (!snapshot.exists()) {
          setAccounts([]);
          return;
        }

        const data = snapshot.val();

        const list = Object.keys(data)
          .map((uid) => ({
            uid,
            ...data[uid],
          }))
          .filter(
            (acc) =>
              acc.subscriptionStatus === "pending" ||
              acc.subscriptionStatus === "approved" ||
              acc.subscriptionStatus === "rejected"
          );

        setAccounts(list);
      } catch (err) {
        console.error("Failed to load subscriptions:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAccounts();
  }, []);

  /* ---------------------------------------------
      UPDATE SUBSCRIPTION STATUS
  --------------------------------------------- */
  const updateStatus = async (uid, newStatus) => {
    try {
      const updates = {
        subscriptionStatus: newStatus,
      };

      if (newStatus === "approved") {
        updates.isSubscribed = true;
        updates.approvedAt = Date.now();
      }

      if (newStatus === "rejected") {
        updates.isSubscribed = false;
        updates.rejectedAt = Date.now();
      }

      if (newStatus === "pending") {
        updates.isSubscribed = false;
        updates.approvedAt = null;
        updates.rejectedAt = null;
      }

      await update(ref(db, `accounts/${uid}`), updates);

      setAccounts((prev) =>
        prev.map((acc) =>
          acc.uid === uid ? { ...acc, ...updates } : acc
        )
      );
    } catch (err) {
      console.error("Failed to update status:", err);
      alert("Error updating subscription status.");
    }
  };

  /* ---------------------------------------------
      FILTERED LIST (TAB + SEARCH)
  --------------------------------------------- */
  const filteredAccounts = useMemo(() => {
    return accounts.filter((acc) => {
      const matchesTab = acc.subscriptionStatus === activeTab;
      const matchesSearch =
        acc.name?.toLowerCase().includes(search.toLowerCase()) ||
        acc.email?.toLowerCase().includes(search.toLowerCase());

      return matchesTab && matchesSearch;
    });
  }, [accounts, activeTab, search]);

  /* ---------------------------------------------
      COUNTS
  --------------------------------------------- */
  const counts = useMemo(() => {
    return {
      pending: accounts.filter((a) => a.subscriptionStatus === "pending").length,
      approved: accounts.filter((a) => a.subscriptionStatus === "approved").length,
      rejected: accounts.filter((a) => a.subscriptionStatus === "rejected").length,
    };
  }, [accounts]);

  /* ---------------------------------------------
      FORMAT DATE UTILITY
  --------------------------------------------- */
  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  /* ---------------------------------------------
      RENDER TABLE
  --------------------------------------------- */
  const renderTable = () => (
    <div className="table-main-wrapper">
      <table className="subs-table">
        <thead>
          <tr>
            <th>User Profile</th>
            <th>Subscription Tier</th>
            <th>Transaction Details</th>
            <th>Status Date</th>
            <th className="text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredAccounts.length === 0 ? (
            <tr>
              <td colSpan="5" className="empty-msg-container">
                <div className="empty-state">
                  <FaSearch size={40} style={{ opacity: 0.2, marginBottom: "1rem" }} />
                  <p>No {activeTab} subscriptions found</p>
                </div>
              </td>
            </tr>
          ) : (
            filteredAccounts.map((acc) => (
              <tr key={acc.uid} className="fade-in-row">
                {/* USER */}
                <td>
                  <div className="user-cell">
                    <div className="avatar-circle">
                      {acc.name?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <div className="user-info">
                      <span className="user-name">{acc.name}</span>
                      <span className="user-email">{acc.email}</span>
                    </div>
                  </div>
                </td>

                {/* PLAN */}
                <td>
                  <div className="plan-cell">
                    <span className={`plan-badge ${acc.subscriptionPlan}`}>
                      {acc.subscriptionPlan}
                    </span>
                    <div className="amount-text">₱{acc.amount}</div>
                  </div>
                </td>

                {/* PAYMENT */}
                <td>
                  <div className="payment-cell">
                    <div className="ref-group">
                      <FaReceipt className="ref-icon" />
                      <span className="ref-number">{acc.referenceNumber}</span>
                    </div>
                    <span className="payment-method-tag">GCash Transfer</span>
                  </div>
                </td>

                {/* DATE */}
                <td className="date-cell">
                  <div className="date-group">
                    <FaCalendarAlt className="date-icon" />
                    <span>
                      {acc.subscriptionStatus === "pending" && formatDate(acc.submittedAt)}
                      {acc.subscriptionStatus === "approved" && formatDate(acc.approvedAt)}
                      {acc.subscriptionStatus === "rejected" && formatDate(acc.rejectedAt)}
                    </span>
                  </div>
                </td>

                {/* ACTIONS */}
                <td className="actions-cell">
                  <div className="action-button-group">
                    {activeTab === "pending" && (
                      <>
                        <button
                          className="btn-action approve"
                          title="Approve"
                          onClick={() => updateStatus(acc.uid, "approved")}
                        >
                          <FaCheck /> Approve
                        </button>
                        <button
                          className="btn-action decline"
                          title="Reject"
                          onClick={() => updateStatus(acc.uid, "rejected")}
                        >
                          <FaTimes />
                        </button>
                      </>
                    )}

                    {activeTab === "approved" && (
                      <>
                        <button
                          className="btn-action undo"
                          title="Return to Pending"
                          onClick={() => updateStatus(acc.uid, "pending")}
                        >
                          <FaUndo /> Reset
                        </button>
                        <button
                          className="btn-action decline-outline"
                          title="Revoke Subscription"
                          onClick={() => updateStatus(acc.uid, "rejected")}
                        >
                          <FaTimes /> Revoke
                        </button>
                      </>
                    )}

                    {activeTab === "rejected" && (
                      <button
                        className="btn-action undo"
                        title="Review Again"
                        onClick={() => updateStatus(acc.uid, "pending")}
                      >
                        <FaUndo /> Re-review
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  /* ---------------------------------------------
      MAIN UI RETURN
  --------------------------------------------- */
  return (
    <div className="admin-subs-container">
      <header className="subs-header">
        <div className="header-main-group">
          <div className="header-text-box">
            <div className="title-row">
              <FaUserShield className="header-icon" />
              <h2>Subscription Requests</h2>
            </div>
            <p>Verification queue for manual GCash & QR payments</p>
          </div>

          <nav className="status-toggle-bar">
            <button
              className={`toggle-tab pending ${activeTab === "pending" ? "active" : ""}`}
              onClick={() => setActiveTab("pending")}
            >
              <FaHourglassHalf />
              <span>Pending</span>
              <span className="badge-count">{counts.pending}</span>
            </button>

            <button
              className={`toggle-tab approved ${activeTab === "approved" ? "active" : ""}`}
              onClick={() => setActiveTab("approved")}
            >
              <FaCheckCircle />
              <span>Approved</span>
              <span className="badge-count">{counts.approved}</span>
            </button>

            <button
              className={`toggle-tab rejected ${activeTab === "rejected" ? "active" : ""}`}
              onClick={() => setActiveTab("rejected")}
            >
              <FaTimesCircle />
              <span>Rejected</span>
              <span className="badge-count">{counts.rejected}</span>
            </button>
          </nav>
        </div>

        <div className="search-box-container">
          <div className="search-input-wrapper">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search by name or email address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </header>

      {loading ? (
        <div className="loading-container">
          <div className="loader-ring"></div>
          <p>Synchronizing subscription records...</p>
        </div>
      ) : (
        <main className="subs-view-area">{renderTable()}</main>
      )}
    </div>
  );
};

export default AdminSubscription;