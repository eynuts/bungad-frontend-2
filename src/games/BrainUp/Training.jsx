// src/games/BrainUp/Training.jsx
import React from "react";
import Navbar from "./Navbar";
import questionBank from "./question"; 
import { FaGraduationCap, FaChevronRight } from "react-icons/fa";
import "./Training.css";

const subjects = [
  { name: "Mathematics", color: "#4be1ff", icon: "🧮", desc: "Master numbers, algebra, and logic." },
  { name: "Science", color: "#ffb84b", icon: "🔬", desc: "Explore the laws of nature and biology." },
  { name: "English", color: "#ff4b6e", icon: "📖", desc: "Enhance grammar and literature skills." },
  { name: "Filipino", color: "#9b59b6", icon: "📝", desc: "Wika, panitikan, at kulturang Pilipino." },
  { name: "History", color: "#f1c40f", icon: "🏛️", desc: "Journey through time and civilizations." },
  // Adding duplicates just to demonstrate the scroll functionality
  { name: "Mathematics", color: "#4be1ff", icon: "📐", desc: "Advanced geometry and calculus practice." },
  { name: "Science", color: "#ffb84b", icon: "🧪", desc: "Chemistry and physics fundamentals." },
];

const shuffleArray = (array) => [...array].sort(() => Math.random() - 0.5);

const getRandomQuestions = (questions, count = 10) => {
  if (!questions || questions.length === 0) return [];
  const shuffled = shuffleArray(questions);
  return shuffled.slice(0, Math.min(count, shuffled.length));
};

const shuffleQuestionOptions = (questions) => {
  return questions.map((q) => ({
    ...q,
    options: shuffleArray(q.options),
  }));
};

const Training = ({ user, onNavigate, onBack, activePage, setActivePage }) => {
  const handleCardClick = (subject) => {
    const subjectQuestions = questionBank[subject.name] || [];
    let randomQuestions = getRandomQuestions(subjectQuestions, 10);
    randomQuestions = shuffleQuestionOptions(randomQuestions);

    if (onNavigate) {
      onNavigate("trainingModule", { 
        subject: subject.name, 
        questions: randomQuestions 
      });
    }
  };

  return (
    <div className="training-page-container">
      {/* Navbar stays at the very top */}
      <Navbar
        user={user}
        activePage={activePage}
        setActivePage={setActivePage}
        onBack={onBack}
      />

      <div className="training-main-layout">
        {/* Fixed Header Section */}
        <header className="training-fixed-header">
          <div className="study-badge">
            <FaGraduationCap /> 
            <span>Self-Paced Learning</span>
          </div>
          <h1>Training Modules</h1>
          <p>Select a subject to start a randomized 10-question practice session.</p>
        </header>

        {/* Scrollable Area for Subjects */}
        <main className="training-scrollable-content">
          <div className="subjects-bento-grid">
            {subjects.map((subject, index) => (
              <div
                key={`${subject.name}-${index}`}
                className="subject-bento-card"
                onClick={() => handleCardClick(subject)}
                style={{ "--subject-theme": subject.color }}
              >
                <div className="card-header-row">
                  <div className="bento-icon-wrapper">{subject.icon}</div>
                  <div className="card-action-icon">
                    <FaChevronRight />
                  </div>
                </div>
                
                <div className="card-body">
                  <h2 className="bento-title">{subject.name}</h2>
                  <p className="bento-desc">{subject.desc}</p>
                </div>

                <div className="card-footer-meta">
                  <div className="module-pill">10 Questions</div>
                  <div className="module-progress-track">
                    <div className="module-progress-fill"></div>
                  </div>
                </div>
                
                <div className="bento-glow-effect"></div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Training;