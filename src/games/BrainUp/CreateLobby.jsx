// src/games/BrainUp/CreateLobby.jsx
import React, { useEffect, useState } from "react";
import { ref, onValue, update } from "firebase/database";
import { db as firebaseDb } from "../../firebaseConfig";
import { 
  FaCopy, 
  FaCheck, 
  FaArrowLeft, 
  FaUsers, 
  FaPlay, 
  FaRocket,
  FaHashtag 
} from "react-icons/fa";
import "./CreateLobby.css";

const CreateLobby = ({ lobbyData, user, onNavigate }) => {
  const [players, setPlayers] = useState([]);
  const [copied, setCopied] = useState(false);
  const [startingGame, setStartingGame] = useState(false);

  const db = firebaseDb;

  useEffect(() => {
    if (!lobbyData?.lobbyCode) return;

    const lobbyCode = lobbyData.lobbyCode;
    const quizId = lobbyData.quizId;
    const title = lobbyData.title;

    const playersRef = ref(db, `brainup/lobbies/${lobbyCode}/players`);
    const gameStartRef = ref(db, `brainup/lobbies/${lobbyCode}/gameStarted`);

    // Listen to player list updates
    const unsubscribePlayers = onValue(playersRef, (snap) => {
      const list = snap.exists() ? Object.values(snap.val()) : [];
      setPlayers(list);
    });

    // Listen for game start signal
    const unsubscribeGameStart = onValue(gameStartRef, async (snap) => {
      if (snap.val()) {
        // Fetch quiz questions once the game is triggered
        const questionsRef = ref(db, `brainup/quizzes/${quizId}/questions`);
        onValue(questionsRef, (questionsSnap) => {
          const questions = questionsSnap.exists() ? questionsSnap.val() : [];
          
          if (typeof onNavigate === "function") {
            onNavigate("startGame", {
              lobbyCode,
              title,
              questions,
            });
          }
        }, { onlyOnce: true });
      }
    });

    return () => {
      unsubscribePlayers();
      unsubscribeGameStart();
    };
  }, [db, lobbyData, onNavigate]);

  // Loading state if data hasn't arrived yet
  if (!lobbyData) {
    return (
      <div className="loading-lobby">
        <div className="loader-spinner"></div>
        <p>Initializing Lobby...</p>
      </div>
    );
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(lobbyData.lobbyCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleStart = async () => {
    if (startingGame || players.length === 0) return;
    setStartingGame(true);

    try {
      const lobbyRef = ref(db, `brainup/lobbies/${lobbyData.lobbyCode}`);
      await update(lobbyRef, { gameStarted: true });
    } catch (err) {
      console.error("Failed to start game:", err);
      setStartingGame(false);
    }
  };

  return (
    <div className="lobby-page-wrapper">
      {/* Header Section */}
      <header className="lobby-top-bar">
        <button className="lobby-back-btn" onClick={() => onNavigate("quizzes")}>
          <FaArrowLeft /> Exit Lobby
        </button>
        <div className="lobby-status-tag">
          <span className="pulse-dot"></span>
          Waiting for Players
        </div>
      </header>

      <main className="lobby-main-content">
        <div className="lobby-grid">
          
          {/* LEFT COLUMN: Lobby Info & Code */}
          <section className="lobby-info-column">
            <div className="quiz-details-card">
              <FaRocket className="quiz-icon-large" />
              <h1 className="display-quiz-title">{lobbyData.title}</h1>
              <p className="quiz-subtitle">Host: {user?.displayName || "You"}</p>
            </div>

            <div className="code-display-card">
              <div className="code-header">
                <FaHashtag />
                <span>Join Code</span>
              </div>
              <div className="code-box-container">
                <span className="code-number">{lobbyData.lobbyCode}</span>
                <button 
                  className={`code-copy-btn ${copied ? "success" : ""}`} 
                  onClick={handleCopyCode}
                >
                  {copied ? <FaCheck /> : <FaCopy />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
              <p className="code-instruction">
                Share this code with your friends to start the match!
              </p>
            </div>

            <button
              className="lobby-launch-btn"
              onClick={handleStart}
              disabled={startingGame || players.length === 0}
            >
              {startingGame ? (
                "Launching Match..."
              ) : (
                <>
                  <FaPlay /> Start Game
                </>
              )}
            </button>
          </section>

          {/* RIGHT COLUMN: Player List */}
          <section className="lobby-players-column">
            <div className="players-list-card">
              <div className="list-header">
                <FaUsers />
                <h3>Players Joined</h3>
                <span className="player-count-pill">{players.length}</span>
              </div>

              <div className="players-scroll-area">
                {players.length > 0 ? (
                  <div className="players-flex-grid">
                    {players.map((p, idx) => (
                      <div key={p.id || idx} className="player-entry-item">
                        <div className="player-avatar-circle">
                          {p.username?.charAt(0).toUpperCase() || "P"}
                        </div>
                        <span className="player-username-text">{p.username}</span>
                        {p.username === user?.displayName && (
                          <span className="you-tag">HOST</span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-players-state">
                    <div className="ping-animation"></div>
                    <p>Waiting for the first challenger...</p>
                  </div>
                )}
              </div>
            </div>
          </section>

        </div>
      </main>
    </div>
  );
};

export default CreateLobby; 