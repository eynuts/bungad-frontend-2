import React, { useState, useRef, useEffect } from "react";
import { io } from "socket.io-client";
import "./SmartMathArena.css"; 

// 1. IMPORT THE BACKGROUND IMAGE (Updated to .png)
import bgImage from "../../assets/Smart/bg.png"; 

const SERVER_URL =
  import.meta.env.VITE_SMARTMATH_SERVER || "https://bungad-backend.onrender.com";
const LEADERBOARD_ENDPOINT = `${SERVER_URL}/leaderboard`; 

// --- Sub-Components ---

const RankProgressBadge = ({ rank, points }) => {
    const rankClass = rank.toLowerCase().replace(/\s/g, "");
    const progressPercent = Math.min(100, Math.max(0, points)); 
    
    const rankParts = rank.split(' ');
    let nextRankText = 'Next Rank'; 
    if (rankParts.length === 2 && rankParts[1] === 'III') {
        nextRankText = `${rankParts[0]} II`;
    } else if (rankParts.length === 2 && rankParts[1] === 'II') {
        nextRankText = `${rankParts[0]} I`;
    } else if (rankParts.length === 2 && rankParts[1] === 'I') {
        nextRankText = 'Next Tier';
    }

    return (
        <div className="rankProgressBadge">
            <div className={`rankBadge ${rankClass}`}>
                <span role="img" aria-label="trophy">🏆</span> {rank}
            </div>
            <div className="rankProgressContainer">
                <div className="rankProgressMeta">
                    <span className="currentPoints">{points} / 100</span>
                    <span className="nextRankText">{nextRankText}</span>
                </div>
                <div className="rankProgressBar">
                    <div 
                        className="progressBarFill" 
                        style={{ width: `${progressPercent}%` }}
                    ></div>
                </div>
            </div>
        </div>
    );
};

const PlayerScoreCard = ({ player, score, isCurrentUser }) => (
  <div
    key={player.uid || player.id}
    className={`scoreCard ${isCurrentUser ? "currentUser" : ""}`}
  >
    <div className="avatarWrapper">
      {player.avatar ? (
        <img src={player.avatar} alt="avatar" className="circularAvatar" />
      ) : (
        <div className="defaultAvatarCircle">{player.name[0]}</div>
      )}
    </div>
    <div className="playerInfo">
      <div className="playerName">{player.name}</div>
      <div className="playerScore">{score ?? 0} <small>PTS</small></div>
    </div>
    {isCurrentUser && <span className="youTag">YOU</span>}
  </div>
);

const GameTimer = ({ timeLeft, roundTime }) => {
    const percentage = (timeLeft / roundTime) * 100;
    const color = percentage > 50 ? 'green' : percentage > 20 ? 'orange' : 'red';
    return (
        <div className="gameTimer">
            <div className={`timerBar ${color}`} style={{ width: `${percentage}%` }}></div>
            <div className="timerText">{timeLeft}s</div>
        </div>
    );
};

const LeaderboardItem = ({ rank, name, score, rankText, avatar, isCurrentUser }) => (
    <div className={`leaderboardItem ${isCurrentUser ? "currentUserL" : ""}`}>
        <span className="rank">{rank}.</span>
        <div className="playerInfoL">
            <div className="avatarSmallWrapper">
                {avatar ? (
                    <img src={avatar} alt="avatar" className="circularAvatar" />
                ) : (
                    <div className="defaultAvatarCircle small">{name[0]}</div>
                )}
            </div>
            <span className="name">{name}</span>
        </div>
        <span className="rankText">{rankText}</span>
        <span className="score">{score}</span>
    </div>
);

// --- Main Component ---

export default function SmartMathArena({ user, onBack }) {
  // Rank States
  const [currentRank, setCurrentRank] = useState(
    localStorage.getItem('smartMathRank') || "Bronze III"
  ); 
  const [rankPoints, setRankPoints] = useState(
    Number(localStorage.getItem('smartMathPoints')) || 50
  ); 

  // Game States
  const [socket, setSocket] = useState(null);
  const [status, setStatus] = useState("idle");
  const [queuePos, setQueuePos] = useState(null);
  const [roomId, setRoomId] = useState(null);
  const [players, setPlayers] = useState([]);
  const [question, setQuestion] = useState(null);
  const [round, setRound] = useState({ current: 0, total: 10, roundTime: 12 });
  const [timeLeft, setTimeLeft] = useState(0);
  const [answer, setAnswer] = useState("");
  const [scores, setScores] = useState({});
  const [messages, setMessages] = useState([]); 
  
  // State for Real Global Leaderboard
  const [globalLeaderboard, setGlobalLeaderboard] = useState([]);
  const [lbLoading, setLbLoading] = useState(false);

  const timerRef = useRef(null);

  const appendMsg = (t) => {
    setMessages((m) =>
      [...m, `${new Date().toLocaleTimeString()} ${t}`].slice(-8)
    );
  };

  const fetchLeaderboard = async () => {
        if (lbLoading) return;
        setLbLoading(true);
        try {
            const response = await fetch(LEADERBOARD_ENDPOINT);
            if (!response.ok) throw new Error(`Status: ${response.status}`);
            const data = await response.json();
            setGlobalLeaderboard(data);
            appendMsg("Leaderboard loaded successfully.");
        } catch (error) {
            console.error("Failed to fetch leaderboard:", error);
            appendMsg("Failed to load leaderboard from server.");
        } finally {
            setLbLoading(false);
        }
    };
    
    useEffect(() => {
        if (status === 'idle' && globalLeaderboard.length === 0 && !lbLoading) {
            fetchLeaderboard();
        }
    }, [status, lbLoading, globalLeaderboard.length]); 

    const resetMatchState = () => {
        clearTimer();
      
        if (socket) {
          socket.disconnect();
          setSocket(null);
        }
      
        setStatus("idle");
        setQueuePos(null);
        setRoomId(null);
        setPlayers([]);
        setScores({});
        setQuestion(null);
        setAnswer("");
      };
      
  const startMatchmaking = () => {
    if (!user) {
      alert("Please log in first!");
      return;
    }
    if (socket?.connected) return;


    const s = io(SERVER_URL, { autoConnect: false });
    setSocket(s);

    s.on("connect", () => {
      appendMsg("Connected to server");
      setStatus("searching");

      s.emit("joinQueue", {
        name: user.displayName || `Player-${Math.floor(Math.random() * 9000) + 100}`,
        uid: user.uid,
        avatar: user.photoURL || "",
        rank: currentRank, 
        rankPoints: rankPoints, 
      });
    });

    s.on("connect_error", (err) => {
      appendMsg("Socket error: " + err.message);
      setStatus("idle");
    });

    s.on("queueStatus", (payload) => setQueuePos(payload?.position ?? null));

    s.on("matched", (payload) => {
      setRoomId(payload?.roomId ?? null);
      setPlayers(Array.isArray(payload?.players) ? payload.players : []);
      setStatus("matched");
      appendMsg("Match found! Prepare for battle.");
    });

    s.on("newRound", (payload) => {
      setStatus("in-match");
      setQuestion(payload?.question ?? "");
      const newRoundState = {
        current: payload?.round ?? 0,
        total: payload?.totalRounds ?? 10,
        roundTime: payload?.roundTime ?? 12,
      };
      setRound(newRoundState);
      setTimeLeft(newRoundState.roundTime);
      setAnswer("");
      startTimer(newRoundState.roundTime);
      appendMsg(`Round ${newRoundState.current}: ${payload?.question}`);
    });

    s.on("roundResult", (payload) => {
      appendMsg(
        `✅ Correct Answer: ${payload?.correctAnswer}${
          payload?.winnerName ? ` — ${payload.winnerName} was fastest!` : ""
        }`
      );
      if (payload?.scores) setScores(payload.scores); 
      clearTimer();
    });

    s.on("scoreUpdate", (payload) => {
      if (payload?.scores) setScores(payload.scores);
    });

    s.on("matchEnd", (payload) => {
      setStatus("finished");
      setScores(payload?.scores ?? {});
      appendMsg("Match finished. See results below.");
      clearTimer();
      fetchLeaderboard(); 
    });

    s.on("rankUpdate", (payload) => {
      if (payload?.rank) {
        setCurrentRank(payload.rank);
        localStorage.setItem('smartMathRank', payload.rank); 
        appendMsg(`Rank updated to: ${payload.rank}`);
      }
      if (payload?.rankPoints !== undefined) {
          setRankPoints(payload.rankPoints); 
          localStorage.setItem('smartMathPoints', payload.rankPoints); 
          appendMsg(`Rank Points updated to: ${payload.rankPoints}`);
      }
    });

    s.on("playerDisconnect", () => {
      appendMsg("🛑 Opponent disconnected. Match cancelled.");
      setStatus("finished");
      clearTimer();
    });

    s.connect();
  };

  const leaveMatchmaking = () => {
    if (!socket) return;
    socket.emit("leaveQueue");
    setStatus("idle");
    setQueuePos(null);
    setPlayers([]);
    socket.disconnect();
    setSocket(null);
  };

  const submitAnswer = (e) => {
    e.preventDefault();
    if (!socket || !roomId || !question || !answer.trim()) return;

    socket.emit("submitAnswer", {
      roomId,
      answer: answer.trim(),
      uid: user?.uid,
    });
    setAnswer(""); 
  };

  const startTimer = (seconds) => {
    clearTimer();
    setTimeLeft(seconds);

    timerRef.current = setInterval(() => {
      setTimeLeft((t) => (t <= 1 ? (clearTimer(), 0) : t - 1));
    }, 1000);
  };

  const clearTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  };

  const handleBack = () => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
    onBack();
  };

  const getSortedPlayers = () => players.slice().sort((a, b) => (scores[b.id] || 0) - (scores[a.id] || 0));

  const renderMatchScoreboard = () =>
    Array.isArray(players) && players.length > 0 ? (
      <div className="scoreboard">
        {getSortedPlayers().map((p) => ( 
          <PlayerScoreCard
            key={p.uid || p.id}
            player={p}
            score={scores[p.id]} 
            isCurrentUser={p.uid === user?.uid}
          />
        ))}
      </div>
    ) : null;

  const renderGlobalLeaderboard = () => {
    if (lbLoading) return <p style={{textAlign: 'center', padding: '20px'}}>Loading leaderboard...</p>;
    if (globalLeaderboard.length === 0) return <p style={{textAlign: 'center', padding: '20px'}}>No leaderboard data available.</p>;

    return (
        <div className="leaderboardGlobal">
            <div className="leaderboardHeader">
                <span className="rank">#</span>
                <span className="playerInfoL">Player</span>
                <span className="rankText">Rank</span>
                <span className="score">Points</span>
            </div>
            {globalLeaderboard.slice(0, 10).map((p, index) => ( 
                <LeaderboardItem 
                    key={p.uid} 
                    rank={index + 1} 
                    name={p.name}
                    rankText={p.rank || 'Unranked'}
                    score={p.score || 0} 
                    avatar={p.avatar}
                    isCurrentUser={user?.uid === p.uid} 
                />
            ))}
            <button className="actionButton refreshButton" onClick={fetchLeaderboard} disabled={lbLoading}>
                {lbLoading ? 'Refreshing...' : 'Refresh Leaderboard'}
            </button>
        </div>
    );
  }

const isMatchRunning = status === 'searching' || status === 'matched' || status === 'in-match';
const isMatchFinished = status === 'finished';

const sidebarTitle = isMatchRunning 
    ? "Live Match Score" 
    : isMatchFinished
    ? "Final Results" 
    : "Global Top 10"; 

const sidebarContent = isMatchRunning || isMatchFinished 
    ? renderMatchScoreboard() 
    : renderGlobalLeaderboard();

  return (
    <div 
        className="sma-container" 
        style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="headerBar">
        <button className="backButton" onClick={handleBack}>
          <span role="img" aria-label="back">◀</span> MENU
        </button>
        <h1 className="arenaTitle">SmartMath Arena</h1>
        <RankProgressBadge rank={currentRank} points={rankPoints} />
      </div>

      <div className="gameLayout">
        <div className="gameSidebar">
            <div className="sidebarBlock scoreTicker fullHeightBlock">
                <h3 className="blockTitle">{sidebarTitle}</h3>
                {sidebarContent}
            </div>
        </div>

        <div className="gameMain">
          {status === "idle" && (
            <div className="mainCard idleCard">
              <h2>Ready to CLIMB the Leaderboard?</h2>
              <p>Play 1v1 math duels to test your speed and accuracy.</p>
              <button className="actionButton primary" onClick={startMatchmaking}>
                PLAY MATCH
              </button>
            </div>
          )}

          {status === "searching" && (
            <div className="mainCard searchingCard">
              <h2><span role="img" aria-label="searching">🔎</span> Searching for Opponent...</h2>
              <div className="spinner"></div>
              <p>Estimated Queue Position: {queuePos || '1'}</p>
              <button className="actionButton secondary" onClick={leaveMatchmaking}>
                Cancel Search
              </button>
            </div>
          )}

          {status === "matched" && (
            <div className="mainCard matchedCard">
              <h2><span role="img" aria-label="matched">⚔️</span> Match Found! Get Ready...</h2>
              <div className="playerVS">
                {players.map((p) => (
                    <div key={p.uid || p.id} className="playerMatchProfile">
                        <div className="avatarLarge">
                            {p.avatar ? (
                                <img src={p.avatar} alt="avatar" className="circularAvatar" />
                            ) : (
                                <div className="defaultAvatarCircle large">{p.name[0]}</div>
                            )}
                        </div>
                        <p>{p.name}</p>
                    </div>
                ))}
              </div>
              <p className="startHint">Battle starts in T-minus...</p>
            </div>
          )}

          {status === "in-match" && (
            <div className="mainCard matchCard">
              <div className="roundHeader">
              <div className="roundInfo">ROUND {round.current} / {round.total}</div>
                <GameTimer timeLeft={timeLeft} roundTime={round.roundTime} />
              </div>
              
              <div className="questionBox">
                <h3 className="questionText">{question}</h3>
              </div>

              <form onSubmit={submitAnswer} className="answerForm">
                <input
                  type="text"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Type your answer here..."
                  autoFocus
                  disabled={timeLeft === 0}
                />
                <button 
                  className="actionButton submit" 
                  type="submit" 
                  disabled={timeLeft === 0 || !answer.trim()}
                >
                  <span role="img" aria-label="submit">SEND</span>
                </button>
              </form>
            </div>
          )}

          {status === "finished" && (
            <div className="mainCard resultCard">
              <h2><span role="img" aria-label="trophy">🏆</span> Match Complete!</h2>
              
              <div className="finalRanking">
                <h3 className="blockTitle">Final Leaderboard</h3>
                {getSortedPlayers().map((p, i) => (
                  <div key={p.uid || p.id} className="rankItem">
                    <span className={`rankNumber ${i === 0 ? 'winner' : ''}`}>#{i + 1}</span>
                    <div className="playerInfo horizontal">
                        <div className="avatarSmallWrapper">
                            {p.avatar ? (
                            <img src={p.avatar} alt="avatar" className="circularAvatar" />
                            ) : (
                            <div className="defaultAvatarCircle small">{p.name[0]}</div>
                            )}
                        </div>
                        <strong className="playerNameInline">{p.name}</strong>
                    </div>

                    <span className="finalScore">{scores[p.id] || 0} pts</span>
                  </div>
                ))}
              </div>
              
              <div className="rankUpdate">Your new Rank: <RankProgressBadge rank={currentRank} points={rankPoints} /></div>

              <div className="actionGroup">
                    <button
                    className="actionButton primary"
                    onClick={resetMatchState}
                    >
                    PLAY AGAIN
                    </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

}

