// src/pages/App.jsx
import React, { useState } from "react";
import Home from "./Home";
import BrainUp from "../games/BrainUp/BrainUp";
import Quizzes from "../games/BrainUp/Quizzes";
import CreateQuiz from "../games/BrainUp/CreateQuiz";
import CreateLobby from "../games/BrainUp/CreateLobby";
import "../styles/App.css";

export default function App({ user }) {
  const [currentPage, setCurrentPage] = useState("home");
  const [publishedQuiz, setPublishedQuiz] = useState(null);

  const handleNavigate = (page, payload = null) => {
    // When CreateQuiz publishes → store quiz data
    if (page === "createLobby" && payload) {
      setPublishedQuiz(payload);
    }

    setCurrentPage(page);
  };

  return (
    <div className="app-container">
      {currentPage === "home" && (
        <Home onNavigate={handleNavigate} user={user} />
      )}

      {currentPage === "brainup" && (
        <BrainUp user={user} onNavigate={handleNavigate} />
      )}

      {currentPage === "quizzes" && (
        <Quizzes user={user} onNavigate={handleNavigate} />
      )}

      {currentPage === "createQuiz" && (
        <CreateQuiz user={user} onNavigate={handleNavigate} />
      )}


      {currentPage === "createLobby" && (
        <CreateLobby
          user={user}
          lobbyData={publishedQuiz} // renamed from quiz → lobbyData
          onNavigate={handleNavigate}
        />
      )}

    </div>
  );
}
