// src/games/BrainUp/DailyChallenge.jsx
import React, { useState, useEffect } from "react";
import { FaArrowLeft, FaBolt, FaCheckCircle, FaTimesCircle, FaClock } from "react-icons/fa";
import "./DailyChallenge.css";

const DailyChallenge = ({ question, onBack }) => {
  const [selected, setSelected] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState("00:00:00"); // countdown display

  // -------------------------
  // Countdown timer logic
  // -------------------------
  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999); // end of today

      const diff = endOfDay - now;
      if (diff <= 0) {
        setTimeLeft("00:00:00");
        return;
      }

      const hours = String(Math.floor(diff / (1000 * 60 * 60))).padStart(2, "0");
      const minutes = String(Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))).padStart(2, "0");
      const seconds = String(Math.floor((diff % (1000 * 60)) / 1000)).padStart(2, "0");

      setTimeLeft(`${hours}:${minutes}:${seconds}`);
    };

    updateTimer(); // initial call
    const interval = setInterval(updateTimer, 1000); // update every second

    return () => clearInterval(interval); // cleanup on unmount
  }, []);

  // Loading State
  if (!question) {
    return (
      <div className="daily-challenge-container loading-state">
        <div className="glitch-wrapper">
          <div className="spinner"></div>
          <p>Decrypting Daily Paradox...</p>
        </div>
      </div>
    );
  }

  const isCorrect = selected === question.answer;

  const handleSubmit = () => {
    if (selected) {
      setSubmitted(true);
      // Here you could trigger a confetti effect or update Firebase user XP
    }
  };

  return (
    <div className="daily-challenge-container">
      <div className="daily-challenge-layout">
        
        {/* --- TOP NAVIGATION BAR --- */}
        <header className="challenge-header">
          <button className="back-circle-btn" onClick={onBack} title="Abandon Challenge">
            <FaArrowLeft />
          </button>
          <div className="header-central-info">
            <span className="event-badge">
              <FaBolt className="bolt-icon" /> Exclusive Event
            </span>
            <h1>Quantum Thinking</h1>
          </div>
          <div className="timer-pill">
            <FaClock className="pulse-icon" /> 
            <span className="timer-text">{timeLeft}</span>
          </div>
        </header>

        {/* --- MAIN CHALLENGE AREA --- */}
        <main className="challenge-main-content">
          <div className="question-hero-card">
            <h2 className="question-display-text">{question.question}</h2>
          </div>

          <div className="options-grid-container">
            {question.options.map((opt, i) => {
              let statusClass = "";
              if (selected === opt) statusClass = "state-selected";
              
              if (submitted) {
                if (opt === question.answer) statusClass = "state-correct";
                else if (selected === opt) statusClass = "state-wrong";
                else statusClass = "state-disabled";
              }

              return (
                <div
                  key={i}
                  className={`challenge-option-tile ${statusClass}`}
                  onClick={() => !submitted && setSelected(opt)}
                >
                  <div className="option-index">{String.fromCharCode(65 + i)}</div>
                  <div className="option-content">{opt}</div>
                  
                  {submitted && opt === question.answer && (
                    <FaCheckCircle className="feedback-icon icon-success" />
                  )}
                  {submitted && selected === opt && opt !== question.answer && (
                    <FaTimesCircle className="feedback-icon icon-error" />
                  )}
                </div>
              );
            })}
          </div>
        </main>

        {/* --- DYNAMIC FOOTER --- */}
        <footer className="challenge-footer-tray">
          {!submitted ? (
            <div className="action-wrapper">
              <p className="instruction-text">
                {selected ? "Careful! You only get one attempt." : "Select the most logical sequence."}
              </p>
              <button 
                className="confirm-submission-btn" 
                onClick={handleSubmit} 
                disabled={!selected}
              >
                Lock In Answer
              </button>
            </div>
          ) : (
            <div className={`result-summary-bar ${isCorrect ? "is-success" : "is-failure"}`}>
              <div className="summary-text-group">
                <h3>{isCorrect ? "Paradox Solved!" : "Sequence Failed"}</h3>
                <p>
                  {isCorrect 
                    ? "Your streak is now 6 days! Your cognitive score increased." 
                    : `The correct path was: ${question.answer}. Better luck tomorrow!`}
                </p>
              </div>
              <button className="dashboard-return-btn" onClick={onBack}>
                Return to Dashboard
              </button>
            </div>
          )}
        </footer>
      </div>
    </div>
  );
};

export default DailyChallenge;
