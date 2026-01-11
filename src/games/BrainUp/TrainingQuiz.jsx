// src/games/BrainUp/TrainingQuiz.jsx
import React, { useState } from "react";
import Navbar from "./Navbar";
import { FaArrowLeft, FaTrophy, FaCheckCircle } from "react-icons/fa";
import "./Training.css";

// Import Firebase Realtime Database
import { getDatabase, ref, set, push } from "firebase/database";
import { db as firebaseDb } from "../../firebaseConfig"; // make sure your firebase.js exports "db"

const TrainingQuiz = ({ user, onBack, onNavigate, activePage, setActivePage, quizData }) => {
  const { subject, questions } = quizData || {};

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState([]);
  const [showScore, setShowScore] = useState(false);

  const handleBackToTraining = () => {
    if (onNavigate) onNavigate("training");
  };

  if (!questions || questions.length === 0) {
    return (
      <div className="training-page-container">
        <Navbar user={user} activePage={activePage} setActivePage={setActivePage} onBack={onBack} />
        <div className="training-main-layout">
          <header className="training-fixed-header">
            <h1>No Questions Found</h1>
            <p>We couldn't find any questions for the {subject} module.</p>
            <button className="return-home-btn" onClick={handleBackToTraining} style={{ marginTop: '2rem' }}>
              <FaArrowLeft /> Go Back
            </button>
          </header>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex) / questions.length) * 100;

  const handleAnswer = (option) => {
    const newAnswers = [...selectedAnswers, option];
    setSelectedAnswers(newAnswers);

    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setShowScore(true);
      saveScoreToFirebase(newAnswers); // <-- Save to Firebase when finished
    }
  };

  const calculateScore = () => {
    return selectedAnswers.reduce((acc, answer, idx) => {
      return answer === questions[idx].answer ? acc + 1 : acc;
    }, 0);
  };

  const saveScoreToFirebase = async (answers) => {
    if (!user || !user.uid) return;

    const score = answers.reduce((acc, answer, idx) => {
      return answer === questions[idx].answer ? acc + 1 : acc;
    }, 0);

    const db = getDatabase(); // use imported db if configured
    const userScoreRef = ref(db, `users/${user.uid}/trainingScores`);

    try {
      // push new score record
      await push(userScoreRef, {
        subject,
        score,
        total: questions.length,
        timestamp: Date.now(),
      });
      console.log("Score saved successfully!");
    } catch (error) {
      console.error("Error saving score:", error);
    }
  };

  return (
    <div className="training-page-container">
      <Navbar
        user={user}
        activePage={activePage}
        setActivePage={setActivePage}
        onBack={handleBackToTraining}
      />

      <div className="training-main-layout">
        <header className="training-fixed-header">
          <div className="header-top-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <button className="quit-btn" onClick={handleBackToTraining} style={{ background: 'rgba(255,75,110,0.1)', color: '#ff4b6e', border: '1px solid rgba(255,75,110,0.2)', padding: '0.6rem 1.2rem', borderRadius: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '700' }}>
              <FaArrowLeft /> Quit Practice
            </button>
            <div className="quiz-subject-badge" style={{ background: 'rgba(40, 194, 255, 0.1)', color: '#28c2ff', padding: '0.5rem 1rem', borderRadius: '0.8rem', fontWeight: '700', fontSize: '0.9rem' }}>
              {subject} Module
            </div>
          </div>

          {!showScore && (
            <div className="quiz-progress-section">
              <div className="progress-text" style={{ marginBottom: '0.8rem', color: '#8c96b5', fontSize: '1rem' }}>
                Question <span style={{ color: '#fff', fontWeight: '800' }}>{currentIndex + 1}</span> of {questions.length}
              </div>
              <div className="module-progress-track">
                <div className="module-progress-fill" style={{ width: `${progress}%`, transition: 'width 0.4s ease' }}></div>
              </div>
            </div>
          )}
        </header>

        <main className="training-scrollable-content">
          {!showScore ? (
            <div className="quiz-question-card" style={{ background: '#121426', borderRadius: '2rem', padding: '3rem', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
              <h2 className="question-display-text" style={{ fontSize: '2.2rem', marginBottom: '3rem', lineHeight: '1.4' }}>
                {currentQuestion.question}
              </h2>

              <div className="options-layout-grid">
                {currentQuestion.options.map((option, idx) => (
                  <button
                    key={idx}
                    className={`option-btn-card color-variant-${idx % 4}`}
                    onClick={() => handleAnswer(option)}
                  >
                    <div className="option-indicator">{String.fromCharCode(65 + idx)}</div>
                    <span className="option-label-text">{option}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="settlement-card" style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center', padding: '3rem', background: '#121426', borderRadius: '2.5rem', border: '1px solid rgba(255,255,255,0.08)' }}>
              <FaTrophy style={{ fontSize: '5rem', color: '#f1c40f', marginBottom: '1.5rem' }} />
              <h1 className="settlement-title" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Practice Complete!</h1>
              
              <div className="final-score-display" style={{ display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: '0.5rem', margin: '2rem 0' }}>
                <span style={{ fontSize: '5rem', fontWeight: '900', color: '#4be1ff' }}>{calculateScore()}</span>
                <span style={{ fontSize: '2rem', color: '#8c96b5' }}>/ {questions.length}</span>
              </div>
              
              <p style={{ color: '#8c96b5', marginBottom: '2.5rem', fontSize: '1.1rem' }}>
                You've completed your training in <strong>{subject}</strong>. Ready for another round?
              </p>

              <div className="settlement-footer-actions" style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <button className="export-csv-btn" onClick={handleBackToTraining} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FaCheckCircle /> Finish
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default TrainingQuiz;
