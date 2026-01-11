// src/components/Navbar.jsx
import React from "react";
import { FaBrain } from "react-icons/fa";
import "./Navbar.css";

const Navbar = ({ activePage, setActivePage, onBack, user }) => {
  const navItems = [
    { label: "Dashboard", key: "dashboard" },
    { label: "Training Modules", key: "training" }, // <-- use key 'training'
    { label: "Quizzes", key: "quizzes" },
  ];

  return (
    <header className="navbar-header">
      {/* Logo */}
      <div className="logo-container">
        <FaBrain className="logo-icon" />
        <span className="logo-text">BrainUp</span>
      </div>

      {/* Navigation */}
      <nav className="navbar-nav">
        <button className="nav-link back-btn" onClick={onBack}>
          ← Home
        </button>
        {navItems.map((item) => (
          <button
            key={item.key}
            className={`nav-link ${activePage === item.key ? "active" : ""}`}
            onClick={() => setActivePage(item.key)} // <-- just change activePage
          >
            {item.icon && item.icon} {item.label}
          </button>
        ))}
      </nav>

      {/* User Info */}
      <div className="user-info">
        <span>{user?.displayName || "You"}</span>
        <img
          className="avatar-small"
          src={user?.photoURL || "https://via.placeholder.com/150/28c2ff/FFFFFF?text=A"}
          alt="avatar"
        />
      </div>
    </header>
  );
};

export default Navbar;
