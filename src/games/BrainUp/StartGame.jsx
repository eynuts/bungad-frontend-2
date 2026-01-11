// src/games/BrainUp/StartGame.jsx
import React, { useState, useEffect, useRef } from "react";
import { ref, onValue, update, get } from "firebase/database";
import { db as firebaseDb } from "../../firebaseConfig";
import { 
  FaClock, 
  FaTrophy, 
  FaDownload, 
  FaHome, 
  FaCrown, 
  FaChartBar,
  FaArrowLeft,
  FaCheckCircle,
  FaTimesCircle
} from "react-icons/fa";
import "./StartGame.css";

export default function StartGame({ user, lobbyCode, title, questions, onNavigate }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [scores, setScores] = useState([]);
  const [timeLeft, setTimeLeft] = useState(10);
  const [isHost, setIsHost] = useState(false);
  const [isQuizFinished, setIsQuizFinished] = useState(false);

  const timerRef = useRef(null);
  const username = user?.displayName || "Player";
  const db = firebaseDb;

  // -----------------------------
  // CHECK IF CURRENT USER IS HOST
  // -----------------------------
  useEffect(() => {
    const lobbyRef = ref(db, `brainup/lobbies/${lobbyCode}`);
    const unsubscribe = onValue(lobbyRef, (snap) => {
      if (!snap.exists()) return;
      setIsHost(snap.val().hostId === user?.uid);
    });
    return () => unsubscribe();
  }, [db, lobbyCode, user]);

  // -----------------------------
  // LISTEN FOR QUIZ FINISH (ALL PLAYERS)
  // -----------------------------
  useEffect(() => {
    const finishedRef = ref(db, `brainup/lobbies/${lobbyCode}/isQuizFinished`);
    const unsubscribe = onValue(finishedRef, (snap) => {
      if (snap.exists() && snap.val() === true) {
        setIsQuizFinished(true);
      }
    });

    return () => unsubscribe();
  }, [db, lobbyCode]);

  // -----------------------------
  // TIMER LOGIC
  // -----------------------------
  useEffect(() => {
    if (isQuizFinished) return;
    
    const qTime = questions[currentIndex]?.timePerQuestion || 10;
    setTimeLeft(qTime);
    
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          if (isHost) goNextQuestion(); // Only host triggers the skip
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [currentIndex, questions, isQuizFinished, isHost]);

  // -----------------------------
  // SYNC SCORES & CURRENT QUESTION
  // -----------------------------
  useEffect(() => {
    const scoresRef = ref(db, `brainup/lobbies/${lobbyCode}/scores`);
    const questionRef = ref(db, `brainup/lobbies/${lobbyCode}/currentQuestion`);

    const unsubscribeScores = onValue(scoresRef, snap => {
      const list = snap.exists() ? Object.values(snap.val()) : [];
      setScores(list.sort((a, b) => b.score - a.score));
    });

    const unsubscribeQuestion = onValue(questionRef, snap => {
      if (snap.exists()) {
        const remoteIndex = snap.val();
        setCurrentIndex(remoteIndex);
        setSelectedOption(null);
      }
    });

    return () => {
      unsubscribeScores();
      unsubscribeQuestion();
    };
  }, [lobbyCode, db]);

  // -----------------------------
  // GO TO NEXT QUESTION
  // -----------------------------
  const goNextQuestion = async () => {
    if (currentIndex >= questions.length - 1) {
      // Host sets quiz finished in Firebase
      if (isHost) {
        const lobbyUpdateRef = ref(db, `brainup/lobbies/${lobbyCode}`);
        await update(lobbyUpdateRef, { isQuizFinished: true });
      }
      return;
    }

    if (isHost) {
      const lobbyUpdateRef = ref(db, `brainup/lobbies/${lobbyCode}`);
      await update(lobbyUpdateRef, { currentQuestion: currentIndex + 1 });
    }
  };

  // -----------------------------
  // HANDLE PLAYER ANSWERS
  // -----------------------------
  const handleAnswer = async (optionIndex) => {
    if (selectedOption !== null || isHost || timeLeft === 0) return;

    setSelectedOption(optionIndex);
    const question = questions[currentIndex];
    const isCorrect = question.options[optionIndex]?.correct;

    if (isCorrect) {
      const playerScoreRef = ref(db, `brainup/lobbies/${lobbyCode}/scores/${user.uid}`);
      const scoreSnap = await get(playerScoreRef);
      const currentScore = scoreSnap.exists() ? (scoreSnap.val().score || 0) : 0;

      await update(playerScoreRef, {
        username,
        score: currentScore + 1,
      });
    }
  };

  // -----------------------------
  // DOWNLOAD CSV
  // -----------------------------
  const downloadCSV = () => {
    if (!scores || scores.length === 0) return;
    const csvHeader = "Rank,Username,Score\n";
    const csvRows = scores.map((p, i) => `${i + 1},${p.username},${p.score}`).join("\n");
    const blob = new Blob([csvHeader + csvRows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${title}_Results.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- SETTLEMENT PAGE ---
  if (isQuizFinished) {
    return (
      <div className="settlement-wrapper">
        <div className="settlement-card">
          <FaTrophy className="final-trophy-icon" />
          <h1 className="settlement-title">Quiz Finished!</h1>
          <p className="settlement-subtitle">{title}</p>
          
          <div className="final-leaderboard-list">
            {scores.map((p, idx) => (
              <div key={idx} className={`leaderboard-entry ${idx === 0 ? 'rank-1' : ''}`}>
                <div className="entry-rank">
                  {idx === 0 ? <FaCrown className="crown-icon" /> : `#${idx + 1}`}
                </div>
                <div className="entry-name">{p.username}</div>
                <div className="entry-score">{p.score} pts</div>
              </div>
            ))}
          </div>

          <div className="settlement-footer-actions">
            {isHost && (
              <button className="export-csv-btn" onClick={downloadCSV}>
                <FaDownload /> Export CSV Results
              </button>
            )}
            <button className="return-home-btn" onClick={() => onNavigate("quizzes")}>
              <FaHome /> Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- QUESTION PAGE ---
  const currentQuestion = questions[currentIndex];

  return (
    <div className="gameplay-wrapper">
      <header className="gameplay-header">
        <div className="header-info">
          <button className="quit-btn" onClick={() => onNavigate("quizzes")}>
            <FaArrowLeft /> Exit
          </button>
          <div className="quiz-meta">
            <span className="quiz-meta-title">{title}</span>
            <span className="question-counter">Question {currentIndex + 1} / {questions.length}</span>
          </div>
        </div>
        
        <div className={`timer-box ${timeLeft < 5 ? "timer-urgent" : ""}`}>
          <FaClock />
          <span>{timeLeft}s</span>
        </div>
      </header>

      <div className="gameplay-main">
        <section className="question-section">
          <div className="progress-container">
            <div 
              className="progress-fill" 
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            ></div>
          </div>

          <div className="question-card-display">
            <h2 className="question-text-large">{currentQuestion?.text}</h2>
          </div>

          <div className="options-layout-grid">
            {currentQuestion?.options.map((opt, idx) => {
              const isSelected = selectedOption === idx;
              const isCorrect = opt.correct;
              
              let btnClass = `option-btn-card color-variant-${idx}`;
              if (isSelected) btnClass += isCorrect ? " correct-pick" : " wrong-pick";
              if (isHost) btnClass += " host-preview";

              return (
                <button
                  key={idx}
                  className={btnClass}
                  onClick={() => handleAnswer(idx)}
                  disabled={isHost || selectedOption !== null || timeLeft === 0}
                >
                  <div className="option-indicator">{String.fromCharCode(65 + idx)}</div>
                  <span className="option-label-text">{opt.text}</span>
                  {isSelected && (
                    <div className="selection-icon">
                      {isCorrect ? <FaCheckCircle /> : <FaTimesCircle />}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        <aside className="live-scores-sidebar">
          <div className="sidebar-title">
            <FaChartBar /> Live Standings
          </div>
          <div className="sidebar-scroll-list">
            {scores.map((p, i) => (
              <div key={i} className="mini-score-row">
                <span className="mini-rank">{i + 1}</span>
                <span className="mini-name">{p.username}</span>
                <span className="mini-pts">{p.score}</span>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
