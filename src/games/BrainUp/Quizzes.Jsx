// src/games/BrainUp/Quizzes.jsx
import React, { useState } from "react";
import { FaPencilAlt, FaUserPlus, FaTrophy, FaUnlock, FaBrain } from "react-icons/fa";
import Navbar from "./Navbar";
import CreateQuiz from "./CreateQuiz";
import JoinQuiz from "./JoinQuiz"; // NEW
import "./Quizzes.css";

const Quizzes = ({ user, onNavigate, onBack, activePage, setActivePage }) => {
  const [activeAction, setActiveAction] = useState(null); // "create" or "join"


  // Rewards Card Data
  const rewardsData = {
    level: 20,
    perk: "Speed Reader Perk",
  };


  // --------------------------
  // RENDER PAGES BASED ON ACTION
  // --------------------------
  if (activeAction === "create") {
    return (
      <CreateQuiz
        user={user}
        onNavigate={(page, payload) => {
          if (page === "createLobby") {
            if (typeof onNavigate === "function") {
              onNavigate("createLobby", payload);
            } else {
              console.warn("onNavigate not defined for Quizzes");
            }
          } else {
            console.warn("Unhandled navigation page:", page, payload);
          }
        }}
        onBack={() => setActiveAction(null)}
      />
    );
  }

  if (activeAction === "join") {
    return (
      <JoinQuiz
        user={user}
        onNavigate={onNavigate} // Navigate to lobby or back to quizzes
        onBack={() => setActiveAction(null)}
      />
    );
  }

  // --------------------------
  // DEFAULT DASHBOARD
  // --------------------------
  return (
    <div className="brainup-dashboard">
      {/* Navbar */}
      <Navbar
        user={user}
        activePage={activePage}
        setActivePage={setActivePage}
        onBack={onBack}
      />

      {/* Main Grid */}
      <div className="dashboard-grid quizzes-layout">
        {/* LEFT COLUMN: Quiz Actions */}
        <div className="quiz-actions-container">
          <h2 className="section-title">Available Quizzes</h2>
          <div className="quiz-action-buttons">
            <button
              className="quiz-action-btn create-quiz-btn"
              onClick={() => setActiveAction("create")}
            >
              <FaPencilAlt className="quiz-icon" />
              <span>Create Quiz</span>
            </button>
            <button
              className="quiz-action-btn join-quiz-btn"
              onClick={() => setActiveAction("join")}
            >
              <FaUserPlus className="quiz-icon" />
              <span>Join Quiz</span>
            </button>
          </div>
        </div>


      </div>
    </div>
  );
};

export default Quizzes;
