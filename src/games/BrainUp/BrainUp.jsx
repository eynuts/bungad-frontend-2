// src/games/BrainUp/BrainUp.jsx
import React, { useState, useEffect } from "react";
import "./BrainUp.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

import Navbar from "./Navbar";
import Quizzes from "./Quizzes";
import Training from "./Training";
import TrainingQuiz from "./TrainingQuiz"; 
import CreateLobby from "./CreateLobby";
import StartGame from "./StartGame";
import DailyChallenge from "./DailyChallenge"; // New daily page
import LogicDailyChallenge from "./dailyquestion"; // Your 100 questions

import { getDatabase, ref, get } from "firebase/database";
import { db as firebaseDb } from "../../firebaseConfig";

// All subjects from Training.jsx
const subjects = [
  { key: "mathematics", name: "Mathematics" },
  { key: "science", name: "Science" },
  { key: "english", name: "English" },
  { key: "filipino", name: "Filipino" },
  { key: "history", name: "History" },
];

const BrainUp = ({ user, onBack, onNavigate, lobbyData }) => {
  const [activePage, setActivePage] = useState("dashboard");
  const [currentLobbyData, setCurrentLobbyData] = useState(lobbyData || null);
  const [startGameData, setStartGameData] = useState(null);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [currentModuleData, setCurrentModuleData] = useState(null); 
  const [performanceData, setPerformanceData] = useState({}); // store averages per subject
  const [dailyQuestion, setDailyQuestion] = useState(null); // Daily challenge state

  // -------------------------
  // Auto-enter lobby page when lobbyData is passed
  // -------------------------
  useEffect(() => {
    if (lobbyData) {
      setCurrentLobbyData(lobbyData);
      setActivePage("createLobby");
    }
  }, [lobbyData]);

  // -------------------------
  // Fetch last 5 training scores per subject (WORKING analytics)
  // -------------------------
  useEffect(() => {
    if (!user || !user.uid) return;

    const db = getDatabase();

    subjects.forEach(async (subject) => {
      try {
        // Correct v9 modular syntax
        const snapshot = await get(ref(db, `users/${user.uid}/trainingScores`));
        if (!snapshot.exists()) return;

        const allScores = [];
        snapshot.forEach((child) => {
          const data = child.val();
          if (data.subject === subject.name) {
            allScores.push((data.score / data.total) * 100);
          }
        });

        const last5 = allScores.slice(-5);
        const avgPercent = last5.length > 0 ? last5.reduce((a, b) => a + b, 0) / last5.length : 0;

        setPerformanceData((prev) => ({
          ...prev,
          [subject.key]: Math.round(avgPercent),
        }));
      } catch (err) {
        console.error("Error fetching scores:", err);
      }
    });
  }, [user]);

  // -------------------------
  // Get day of the year
  // -------------------------
  function getDayOfYear(date = new Date()) {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date - start;
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
  }

  // -------------------------
  // Fetch today's daily challenge
  // -------------------------
  useEffect(() => {
    if (!LogicDailyChallenge || LogicDailyChallenge.length === 0) return;

    // Determine today's question ID (1-100 looped if more days than questions)
    const dayId = ((getDayOfYear() - 1) % LogicDailyChallenge.length) + 1;
    const question = LogicDailyChallenge.find(q => q.id === dayId);
    setDailyQuestion(question || null);
  }, []);

  // -------------------------
  // Internal navigation handler
  // -------------------------
  const handleInternalNavigate = async (page, payload = {}) => {
    switch (page) {
      case "createLobby":
        setCurrentLobbyData(payload);
        setActivePage("createLobby");
        break;
      case "quizzes":
        setActivePage("quizzes");
        break;
      case "training":
        setActivePage("training");
        break;
      case "trainingModule": 
        setCurrentModuleData(payload); 
        setActivePage("trainingModule");
        break;
      case "dashboard":
        setActivePage("dashboard");
        break;
      case "dailyChallenge":
        setActivePage("dailyChallenge");
        break;
      case "startgame":
      case "startGame":
        if (!payload.questions || payload.questions.length === 0) {
          if (!payload.quizId) {
            console.error("Missing quizId for StartGame");
            return;
          }

          setLoadingQuestions(true);
          try {
            const snapshot = await get(ref(firebaseDb, `brainup/quizzes/${payload.quizId}/questions`));
            setLoadingQuestions(false);

            if (snapshot.exists()) {
              setStartGameData({ ...payload, questions: snapshot.val() });
              setActivePage("startgame");
            } else {
              console.error("No questions found in Firebase");
            }
          } catch (err) {
            setLoadingQuestions(false);
            console.error("Firebase error:", err);
          }
        } else {
          setStartGameData(payload);
          setActivePage("startgame");
        }
        break;
      default:
        console.warn("Unhandled navigation:", page);
    }
  };

  // -------------------------
  // RENDER PAGES
  // -------------------------
  if (activePage === "startgame") {
    if (loadingQuestions) return <div className="loading-state"><h2>Loading Battle...</h2></div>;
    return (
      <StartGame
        user={user}
        lobbyCode={startGameData?.lobbyCode}
        questions={startGameData?.questions}
        title={startGameData?.title}
        onNavigate={handleInternalNavigate}
      />
    );
  }

  if (activePage === "dailyChallenge") {
    return <DailyChallenge question={dailyQuestion} onBack={() => setActivePage("dashboard")} />;
  }

  if (activePage === "createLobby") {
    return <CreateLobby user={user} lobbyData={currentLobbyData} onNavigate={handleInternalNavigate} />;
  }

  if (activePage === "quizzes") {
    return (
      <Quizzes
        user={user}
        onNavigate={handleInternalNavigate}
        onBack={() => setActivePage("dashboard")}
        activePage={activePage}
        setActivePage={setActivePage}
      />
    );
  }

  if (activePage === "training") {
    return (
      <Training
        user={user}
        onNavigate={handleInternalNavigate}
        onBack={() => setActivePage("dashboard")}
        activePage={activePage}
        setActivePage={setActivePage}
      />
    );
  }

  if (activePage === "trainingModule") {
    return (
      <TrainingQuiz
        user={user}
        quizData={currentModuleData}
        onNavigate={handleInternalNavigate}
        onBack={() => setActivePage("training")}
        activePage={activePage}
        setActivePage={setActivePage}
      />
    );
  }

  // -------------------------
  // DASHBOARD
  // -------------------------
  return (
    <div className="brainup-dashboard-page">
      <Navbar
        user={user}
        activePage={activePage}
        setActivePage={setActivePage}
        onBack={onBack}
      />

      <div className="dashboard-content">
        <header className="dashboard-welcome-section">
          <h1>Welcome back, {user?.displayName || "Scholar"}!</h1>
          <p>Sharpen your skills or join a live battle below.</p>
        </header>

        <main className="dashboard-bento-grid">
          {/* --- DAILY CHALLENGE CARD --- */}
          <section className="bento-card daily-challenge-box">
            <div className="bento-card-header">
              <span className="bento-badge"><i className="fas fa-bolt"></i> DAILY CHALLENGE</span>
            </div>
            <div className="bento-card-body">
              {dailyQuestion ? (
                <>
                  <h3>Daily Logic Challenge</h3>
                  <p>{dailyQuestion.question}</p>
                  <button
                    className="bento-action-btn primary-btn"
                    onClick={() => handleInternalNavigate("dailyChallenge")}
                  >
                    Start Challenge
                  </button>
                </>
              ) : (
                <p>Loading today's challenge...</p>
              )}
            </div>
          </section>

          {/* --- QUICK ACCESS NAVIGATION --- */}
          <section className="bento-card quick-nav-box">
            <div className="nav-shortcut" onClick={() => handleInternalNavigate("training")}>
              <div className="shortcut-icon training-icon"><i className="fas fa-graduation-cap"></i></div>
              <div className="shortcut-text">
                <h4>Training</h4>
                <p>Practice at your own pace</p>
              </div>
              <i className="fas fa-chevron-right arrow-icon"></i>
            </div>
            <div className="nav-shortcut" onClick={() => handleInternalNavigate("quizzes")}>
              <div className="shortcut-icon quiz-icon"><i className="fas fa-gamepad"></i></div>
              <div className="shortcut-text">
                <h4>Quiz Lobby</h4>
                <p>Join live competitions</p>
              </div>
              <i className="fas fa-chevron-right arrow-icon"></i>
            </div>
          </section>

          {/* --- PERFORMANCE ANALYTICS --- */}
          <section className="bento-card performance-box">
            <h3><i className="fas fa-chart-line"></i> Performance</h3>

            {/* Dynamic Sparkline */}
            <div className="dashboard-sparkline">
              <svg width="100%" height="80" viewBox="0 0 300 80">
                <polyline
                  fill="none"
                  stroke="#4be1ff"
                  strokeWidth="3"
                  strokeLinecap="round"
                  points={subjects.map((sub, i) => {
                    const percent = performanceData[sub.key] ?? 0;
                    const x = (i / (subjects.length - 1)) * 300;
                    const y = 80 - (percent / 100) * 80;
                    return `${x},${y}`;
                  }).join(" ")}
                />
              </svg>
            </div>

            <div className="skill-meter-row">
              {subjects.map((sub) => (
                <div className="skill-item" key={sub.key}>
                  <span className="skill-name">{sub.name}</span>
                  <span className="skill-value">{performanceData[sub.key] ?? 0}%</span>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default BrainUp;
