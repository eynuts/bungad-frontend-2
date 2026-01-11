// src/admin/AdminUser.jsx
import React, { useState, useMemo } from "react";
import "./AdminUser.css";
import {
  FaTrash,
  FaUserShield,
  FaSearch,
  FaUsers,
  FaShieldAlt,
  FaCalendarAlt,
  FaUserEdit,
  FaCircle,
} from "react-icons/fa";
import { ref, update, remove } from "firebase/database";
import { db } from "../firebaseConfig";

const AdminUser = ({ users, setUsers }) => {
  const [search, setSearch] = useState("");

  /* ---------------------------------------------
      FILTERED USERS FOR SEARCH
  --------------------------------------------- */
  const filteredUsers = useMemo(() => {
    return users.filter(
      (user) =>
        user.name?.toLowerCase().includes(search.toLowerCase()) ||
        user.email?.toLowerCase().includes(search.toLowerCase())
    );
  }, [users, search]);

  /* ---------------------------------------------
      CALCULATE STATS
  --------------------------------------------- */
  const stats = useMemo(() => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    return {
      total: users.length,
      admins: users.filter((u) => u.isAdmin).length,
      recent: users.filter((u) => u.lastLogin && new Date(u.lastLogin) > weekAgo).length,
    };
  }, [users]);

  /* ---------------------------------------------
      DELETE USER
  --------------------------------------------- */
  const handleDelete = async (uid) => {
    if (window.confirm("Are you sure you want to permanently delete this user? This cannot be undone.")) {
      try {
        await remove(ref(db, `accounts/${uid}`));
        setUsers(users.filter((u) => u.uid !== uid));
      } catch (err) {
        console.error("Delete error:", err);
        alert("❌ Error removing user.");
      }
    }
  };

  /* ---------------------------------------------
      PROMOTE / DEMOTE ADMIN
  --------------------------------------------- */
  const toggleAdmin = async (uid) => {
    const user = users.find((u) => u.uid === uid);
    if (!user) return;

    const newStatus = !user.isAdmin;
    const originalUsers = [...users];

    setUsers(users.map((u) => (u.uid === uid ? { ...u, isAdmin: newStatus } : u)));

    try {
      await update(ref(db, `accounts/${uid}`), { isAdmin: newStatus });
    } catch (err) {
      console.error("Update error:", err);
      setUsers(originalUsers);
      alert("❌ Failed to update permissions.");
    }
  };

  return (
    <div className="admin-user-container">
      {/* Header Section */}
      <header className="user-dashboard-header">
        <div className="header-left">
          <div className="title-with-icon">
            <FaUsers className="main-icon" />
            <div>
              <h2 className="white-title">User Management</h2>
              <p>Monitor system access and manage administrative privileges</p>
            </div>
          </div>
        </div>

        <div className="header-right">
          <div className="search-glass-wrapper">
            <FaSearch className="search-glass-icon" />
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="user-stats-grid">
        <div className="user-stat-card total">
          <div className="stat-icon-box"><FaUsers /></div>
          <div className="stat-content">
            <span className="stat-label">Total Database</span>
            <h3 className="stat-number">{stats.total}</h3>
          </div>
        </div>

        <div className="user-stat-card admin">
          <div className="stat-icon-box"><FaShieldAlt /></div>
          <div className="stat-content">
            <span className="stat-label">Administrative</span>
            <h3 className="stat-number">{stats.admins}</h3>
          </div>
        </div>

        <div className="user-stat-card recent">
          <div className="stat-icon-box"><FaCalendarAlt /></div>
          <div className="stat-content">
            <span className="stat-label">Active (7 Days)</span>
            <h3 className="stat-number">{stats.recent}</h3>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="user-content-section">
        <div className="section-header">
          <div className="header-title">
            <FaUserShield />
            <h3>Access Control List</h3>
          </div>
          <div className="user-count-pill">{filteredUsers.length} Users Found</div>
        </div>

        <div className="table-scroll-container">
          <table className="user-modern-table">
            <thead>
              <tr>
                <th>Member Profile</th>
                <th>Last Session</th>
                <th>Privilege Level</th>
                <th>Account Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="empty-row">
                    No users found matching your search criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.uid} className="user-row-hover">
                    <td>
                      <div className="member-cell">
                        <div className="avatar-letter">
                          {user.name?.charAt(0).toUpperCase() || "U"}
                        </div>
                        <div className="member-meta">
                          <span className="member-name">{user.name || "Anonymous"}</span>
                          <span className="member-email">{user.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="date-cell">
                      {user.lastLogin 
                        ? new Date(user.lastLogin).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                        : "Never logged in"}
                    </td>
                    <td>
                      <span className={`role-pill ${user.isAdmin ? "admin" : "member"}`}>
                        {user.isAdmin ? "Administrator" : "Standard Member"}
                      </span>
                    </td>
                    <td>
                      <div className="status-indicator">
                        <FaCircle className="online-dot" />
                        <span>Active</span>
                      </div>
                    </td>
                    <td>
                      <div className="user-action-group">
                        <button
                          className={`btn-icon-round shield ${user.isAdmin ? "is-admin" : ""}`}
                          title={user.isAdmin ? "Revoke Admin" : "Grant Admin"}
                          onClick={() => toggleAdmin(user.uid)}
                        >
                          <FaShieldAlt />
                        </button>
                        <button
                          className="btn-icon-round trash"
                          title="Remove Account"
                          onClick={() => handleDelete(user.uid)}
                        >
                          <FaTrash />
                        </button>
                      </div>
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

export default AdminUser;