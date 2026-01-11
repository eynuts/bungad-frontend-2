// src/games/BrainUp/JoinQuiz.jsx
import React, { useState } from "react";
import { ref, get, push, set, onValue } from "firebase/database";
import { db as firebaseDb } from "../../firebaseConfig";
import { 
  FaArrowLeft, 
  FaSignInAlt, 
  FaUsers, 
  FaHourglassHalf, 
  FaExclamationCircle,
  FaGamepad,
  FaCheckCircle
} from "react-icons/fa";
import "./JoinQuiz.css";

const JoinQuiz = ({ user, onNavigate }) => {
  const [lobbyCode, setLobbyCode] = useState("");
  const [joinedLobby, setJoinedLobby] = useState(null);
  const [players, setPlayers] = useState([]);
  const [error, setError] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  const db = firebaseDb;

  const handleJoin = async () => {
    const trimmedCode = lobbyCode.trim().toUpperCase();
    
    if (!trimmedCode) {
      setError("Please enter a lobby code.");
      return;
    }

    setIsJoining(true);
    setError("");
    
    const lobbyRef = ref(db, `brainup/lobbies/${trimmedCode}`);

    try {
      const snapshot = await get(lobbyRef);

      if (!snapshot.exists()) {
        setError("Lobby not found. Double check the code.");
        setIsJoining(false);
        return;
      }

      const lobbyData = snapshot.val();

      // Check if game already started
      if (lobbyData.gameStarted) {
        setError("This game has already started.");
        setIsJoining(false);
        return;
      }

      // Add current user to the lobby's player list
      const playersRef = ref(db, `brainup/lobbies/${trimmedCode}/players`);
      const newPlayerRef = push(playersRef);

      await set(newPlayerRef, {
        id: newPlayerRef.key,
        uid: user?.uid || "unknown",
        username: user?.displayName || "Anonymous Player",
      });

      setJoinedLobby(trimmedCode);

      // Listen for player list updates (sync UI with other players)
      onValue(playersRef, (snap) => {
        const list = snap.exists() ? Object.values(snap.val()) : [];
        setPlayers(list);
      });

      // Listen for the host to trigger the game start
      const gameStartRef = ref(db, `brainup/lobbies/${trimmedCode}/gameStarted`);
      onValue(gameStartRef, async (snap) => {
        if (snap.val()) {
          // Fetch the associated quiz questions
          const questionsRef = ref(db, `brainup/quizzes/${lobbyData.quizId}/questions`);
          const questionsSnap = await get(questionsRef);
          const questions = questionsSnap.exists() ? questionsSnap.val() : [];

          if (typeof onNavigate === "function") {
            onNavigate("startGame", {
              lobbyCode: trimmedCode,
              title: lobbyData.title || "BrainUp Quiz",
              questions,
            });
          }
        }
      });
    } catch (err) {
      console.error("Error joining lobby:", err);
      setError("Connection error. Please try again.");
      setIsJoining(false);
    }
  };

  return (
    <div className="join-page-wrapper">
      {/* Navigation Header */}
      <header className="join-nav-header">
        <button className="join-back-btn" onClick={() => onNavigate("quizzes")}>
          <FaArrowLeft /> Exit to Dashboard
        </button>
      </header>

      <main className="join-content-container">
        {!joinedLobby ? (
          /* STEP 1: ENTER CODE FORM */
          <section className="join-card appearance-animate">
            <div className="join-icon-header">
              <FaGamepad />
            </div>
            <h1 className="join-title">Join a Match</h1>
            <p className="join-desc">Enter the code provided by the host to enter the lobby.</p>
            
            <div className="join-input-wrapper">
              <input
                type="text"
                value={lobbyCode}
                onChange={(e) => setLobbyCode(e.target.value)}
                placeholder="ENTER CODE"
                className={`lobby-input-field ${error ? "error-border" : ""}`}
                maxLength={6}
                onKeyPress={(e) => e.key === 'Enter' && handleJoin()}
              />
              {error && (
                <span className="join-error-msg">
                  <FaExclamationCircle /> {error}
                </span>
              )}
            </div>

            <button 
              className="join-confirm-button" 
              onClick={handleJoin}
              disabled={isJoining}
            >
              {isJoining ? "Connecting..." : "Join Lobby"}
            </button>
          </section>
        ) : (
          /* STEP 2: WAITING ROOM */
          <section className="join-card lobby-waiting-card appearance-animate">
            <div className="waiting-hero-section">
              <div className="waiting-animation-container">
                <FaHourglassHalf className="hourglass-spin" />
              </div>
              <h2 className="waiting-title">Ready to Play!</h2>
              <p className="waiting-subtitle">Waiting for host to launch the match...</p>
            </div>

            <div className="lobby-summary-box">
              <div className="summary-item">
                <span className="summary-label">LOBBY CODE</span>
                <span className="summary-value highlight-blue">{joinedLobby}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">STATUS</span>
                <span className="summary-value">
                  <FaCheckCircle className="status-icon" /> Ready
                </span>
              </div>
            </div>

            <div className="players-lobby-section">
              <div className="players-lobby-header">
                <FaUsers />
                <span>Challengers Joined ({players.length})</span>
              </div>
              
              <div className="players-bubble-grid">
                {players.map((p, idx) => (
                  <div key={p.id || idx} className="player-bubble">
                    <div className="player-avatar-small">
                      {p.username?.charAt(0).toUpperCase()}
                    </div>
                    <span className="player-bubble-name">{p.username}</span>
                    {p.uid === user?.uid && <span className="player-self-badge">YOU</span>}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default JoinQuiz;