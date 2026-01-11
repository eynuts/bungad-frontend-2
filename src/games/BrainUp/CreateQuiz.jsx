// src/games/BrainUp/CreateQuiz.jsx
import React, { useState, useCallback } from "react";
import { 
  FaClock, FaCheckCircle, FaStar, FaAngleLeft, FaFlask 
} from "react-icons/fa";
import { IoPersonCircleSharp } from "react-icons/io5"; 
import "./CreateQuiz.css";
import { getDatabase, ref, push, set } from "firebase/database";
import { db as firebaseDb } from "../../firebaseConfig";

const QuestionCard = React.memo(({ question, qIndex, handleQuestionChange, handleOptionChange, handleCorrectOption, handleFinishEditing }) => {
  return (
    <div className="cq-question-card">
      <div className="cq-question-header">
        <div className="cq-question-index">Question {qIndex + 1}</div>
        <div className="cq-question-toolbar">
          <button className="cq-toolbar-btn">K</button>
          <button className="cq-toolbar-btn">T</button>
          <button className="cq-toolbar-btn">R</button>
          <button className="cq-toolbar-btn"><FaStar /></button>
        </div>
      </div>
      <div className="cq-question-text-area">
        <textarea
          value={question.text}
          onChange={(e) => handleQuestionChange(qIndex, e.target.value)}
          onBlur={() => handleFinishEditing(question.id)}
          placeholder="Enter your question..."
          rows="3"
        />
      </div>
      <div className="cq-options-grid">
        {question.options.map((option, oIndex) => (
          <div key={option.id} className="cq-option-input-group">
            <span className="cq-option-label">{option.id})</span>
            <input
              type="text"
              value={option.text}
              onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
              onBlur={() => handleFinishEditing(question.id)}
              placeholder={`Option ${option.id}`}
              className="cq-option-input"
            />
            <input
              type="radio"
              name={`correct-${question.id}`}
              checked={option.correct}
              onChange={() => handleCorrectOption(qIndex, oIndex)}
            />
            {option.correct && <FaCheckCircle className="cq-option-status-icon cq-correct" />}
          </div>
        ))}
      </div>
    </div>
  );
});

const CreateQuiz = ({ user, onNavigate }) => {
  const [quizDetails, setQuizDetails] = useState({
    name: "",
    timePerQuestion: 30,
  });

  const [questions, setQuestions] = useState([
    {
      id: 1,
      text: "",
      options: [
        { id: 'A', text: "", correct: false },
        { id: 'B', text: "", correct: false },
        { id: 'C', text: "", correct: false },
        { id: 'D', text: "", correct: false },
      ],
    },
  ]);

  const [previewQuestionId, setPreviewQuestionId] = useState(1);
  const [publishing, setPublishing] = useState(false);

  const handleQuizNameChange = (value) => setQuizDetails(prev => ({ ...prev, name: value }));
  const handleTimeChange = (delta) => {
    setQuizDetails(prev => ({ ...prev, timePerQuestion: Math.max(1, prev.timePerQuestion + delta) }));
  };

  const handleQuestionChange = useCallback((qIndex, value) => {
    setQuestions(prev => {
      const newQuestions = [...prev];
      newQuestions[qIndex] = { ...newQuestions[qIndex], text: value };
      return newQuestions;
    });
  }, []);

  const handleOptionChange = useCallback((qIndex, oIndex, value) => {
    setQuestions(prev => {
      const newQuestions = [...prev];
      newQuestions[qIndex].options[oIndex] = { ...newQuestions[qIndex].options[oIndex], text: value };
      return newQuestions;
    });
  }, []);

  const handleCorrectOption = useCallback((qIndex, oIndex) => {
    setQuestions(prev => {
      const newQuestions = [...prev];
      newQuestions[qIndex].options = newQuestions[qIndex].options.map((opt, i) => ({ ...opt, correct: i === oIndex }));
      return newQuestions;
    });
  }, []);

  const handleAddQuestion = () => {
    setQuestions(prev => [
      ...prev,
      {
        id: prev.length + 1,
        text: "",
        options: [
          { id: 'A', text: "", correct: false },
          { id: 'B', text: "", correct: false },
          { id: 'C', text: "", correct: false },
          { id: 'D', text: "", correct: false },
        ],
      },
    ]);
  };

  const handleFinishEditing = (questionId) => setPreviewQuestionId(questionId);

  // -------------------------
  // PUBLISH QUIZ AND CREATE LOBBY
  // -------------------------
  const handlePublishQuiz = async () => {
    if (!quizDetails.name.trim()) {
      alert("Quiz name cannot be empty!");
      return;
    }

    setPublishing(true);
    try {
      const db = firebaseDb;

      // 1️⃣ Push quiz into brainup/quizzes
      const quizzesRef = ref(db, "brainup/quizzes");
      const newQuizRef = push(quizzesRef);

      // 2️⃣ Generate 6-digit lobby code
      const lobbyCode = Math.floor(100000 + Math.random() * 900000).toString();

      await set(newQuizRef, {
        title: quizDetails.name,
        timePerQuestion: quizDetails.timePerQuestion,
        questions,
        createdBy: user?.uid || "unknown",
        createdAt: Date.now(),
        lobbyCode,
      });

      // 3️⃣ Create a lobby in brainup/lobbies
      const lobbiesRef = ref(db, `brainup/lobbies/${lobbyCode}`);
      await set(lobbiesRef, {
        quizId: newQuizRef.key,
        hostId: user?.uid || "unknown",
        lobbyCode,
        players: {}, // empty initially
        gameStarted: false,
        createdAt: Date.now(),
      });

      setPublishing(false);
      console.log("Quiz published and lobby created! Lobby Code:", lobbyCode);

      // Navigate to CreateLobby page
      if (typeof onNavigate === "function") {
        onNavigate("createLobby", { lobbyCode, quizId: newQuizRef.key });
      }
    } catch (err) {
      setPublishing(false);
      console.error("Error publishing quiz and creating lobby:", err);
    }
  };

  const QuizPreview = ({ question }) => (
    <div className="cq-quiz-preview-card">
      <div className="cq-preview-header">
        <h3 className="cq-preview-title">{quizDetails.name || "Quiz Preview"}</h3>
        <FaClock className="cq-preview-clock-icon" />
        <span className="cq-preview-time">{quizDetails.timePerQuestion} sec per question</span>
      </div>
      <p className="cq-preview-question-text">{question?.text || "Question will appear here..."}</p>
      <div className="cq-preview-answer-stats">
        {question?.options.map(opt => (
          <div key={opt.id} className="cq-preview-option">
            <div className={`cq-option-text-preview ${opt.correct ? 'correct-bar' : ''}`}>
              {opt.id}) {opt.text || "Option text..."}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="create-quiz-page">
      <div className="brainup-header">
        <button 
          onClick={() => typeof onNavigate === "function" ? onNavigate("quizzes") : console.warn("onNavigate undefined")} 
          className="back-to-quizzes-btn"
        >
          <FaAngleLeft /> <span>Back</span>
        </button>
        <h1 className="cq-page-title">Create a Quiz</h1>
        <div className="cq-header-right">
          <div className="user-info">
            <span className="username">{user?.displayName || "You"}</span>
            <span className="level">Level {user?.level || 1}</span>
            {user?.photoURL ? (
              <img src={user.photoURL} alt="User Avatar" className="user-avatar" />
            ) : (
              <IoPersonCircleSharp className="user-avatar-placeholder" />
            )}
          </div>
        </div>
      </div>

      <div className="cq-layout">
        <div className="cq-left-column">
          <h2 className="cq-section-heading">Quiz Details & Questions</h2>

          <div className="cq-quiz-details-card">
            <div className="cq-detail-section">
              <FaFlask className="cq-detail-icon" />
              <span className="cq-detail-label">Quiz Name</span>
              <input
                type="text"
                value={quizDetails.name}
                onChange={(e) => handleQuizNameChange(e.target.value)}
                placeholder="Enter quiz name..."
                className="cq-quiz-name-input"
              />
            </div>

            <div className="cq-detail-section">
              <FaClock className="cq-detail-icon" />
              <span className="cq-detail-label">Time per Question</span>
              <div className="cq-time-limit-controls">
                <button className="cq-control-btn" onClick={() => handleTimeChange(-1)}>-</button>
                <span className="cq-time-value">{quizDetails.timePerQuestion}</span>
                <button className="cq-control-btn" onClick={() => handleTimeChange(1)}>+</button>
                <span className="cq-time-unit">sec</span>
              </div>
            </div>
          </div>

          <div className="cq-questions-list">
            {questions.map((q, qIndex) => (
              <QuestionCard
                key={q.id}
                question={q}
                qIndex={qIndex}
                handleQuestionChange={handleQuestionChange}
                handleOptionChange={handleOptionChange}
                handleCorrectOption={handleCorrectOption}
                handleFinishEditing={handleFinishEditing}
              />
            ))}
            <button className="cq-add-question-btn" onClick={handleAddQuestion}>
              + Add Question
            </button>
          </div>
        </div>

        <div className="cq-right-column">
          <QuizPreview question={questions.find(q => q.id === previewQuestionId)} />
          <button 
            className="cq-publish-quiz-btn" 
            onClick={handlePublishQuiz}
            disabled={publishing}
          >
            {publishing ? "Publishing..." : "Publish Quiz & Create Lobby"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateQuiz;
