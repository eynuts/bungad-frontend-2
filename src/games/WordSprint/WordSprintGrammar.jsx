// src/games/WordSprint/WordSprintGrammar.jsx
import React, { useState, useEffect, useRef } from 'react';
import './WordSprintGrammar.css';
import grammarData from './WordSprintGrammarData';

const ProgressBar = ({ time, maxTime }) => {
    const progress = (time / maxTime) * 100;
    let color = '#10b981'; // Success Green
    if (progress <= 50) color = '#f59e0b'; // Orange
    if (progress <= 25) color = '#ef4444'; // Danger Red
    
    return (
        <div className="grammar-progress-container">
            <div
                className="grammar-progress-fill"
                style={{ width: `${progress}%`, backgroundColor: color }}
            ></div>
        </div>
    );
};

const WordSprintGrammar = ({ user, onBack }) => {
    // Game States: 'menu' | 'playing' | 'results'
    const [gameState, setGameState] = useState('menu');
    const [level, setLevel] = useState('Easy');
    const [questions, setQuestions] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [streak, setStreak] = useState(0);
    const [correctCount, setCorrectCount] = useState(0);
    
    const MAX_TIME = 10;
    const [timeLeft, setTimeLeft] = useState(MAX_TIME);
    const [powerUps, setPowerUps] = useState({ skip: 2, fifty: 1, hint: 1 });
    const [hintUsed, setHintUsed] = useState(false);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [answerResult, setAnswerResult] = useState(null);
    const timerRef = useRef(null);

    const shuffleArray = (arr) => [...arr].sort(() => Math.random() - 0.5);

    // Initialize Game
    const startSprint = () => {
        const rawQuestions = grammarData[level] || [];
        const levelQuestions = shuffleArray(rawQuestions).slice(0, 15);
        levelQuestions.forEach(q => q.options = shuffleArray([...q.options]));
        
        setQuestions(levelQuestions);
        setCurrentIndex(0);
        setScore(0);
        setStreak(0);
        setCorrectCount(0);
        setTimeLeft(MAX_TIME);
        setPowerUps({ skip: 2, fifty: 1, hint: 1 });
        setGameState('playing');
    };

    // Timer Logic
    useEffect(() => {
        if (gameState !== 'playing' || currentIndex >= questions.length) return;
        
        if (!selectedAnswer) {
            timerRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        handleAnswer(null); // Time out
                        return MAX_TIME;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timerRef.current);
    }, [currentIndex, selectedAnswer, questions, gameState]);

    const handleAnswer = (option) => {
        if (gameState !== 'playing' || selectedAnswer) return;
        
        clearInterval(timerRef.current);
        const currentQuestion = questions[currentIndex];
        const isCorrect = option === currentQuestion.answer;
        
        setSelectedAnswer(option);

        if (isCorrect) {
            setAnswerResult('correct');
            setScore(prev => prev + 10 + (streak * 5));
            setStreak(prev => prev + 1);
            setCorrectCount(prev => prev + 1);
        } else {
            setAnswerResult('wrong');
            setStreak(0);
        }

        setTimeout(() => {
            const nextIndex = currentIndex + 1;
            if (nextIndex < questions.length) {
                setCurrentIndex(nextIndex);
                setTimeLeft(MAX_TIME);
                setSelectedAnswer(null);
                setAnswerResult(null);
                setHintUsed(false);
            } else {
                setGameState('results');
            }
        }, 1200);
    };

    const usePowerUp = (type) => {
        if (powerUps[type] <= 0 || selectedAnswer) return;
        
        const currentQuestion = questions[currentIndex];

        if (type === 'skip') {
            const nextIndex = currentIndex + 1;
            if (nextIndex < questions.length) {
                setCurrentIndex(nextIndex);
                setTimeLeft(MAX_TIME);
            } else {
                setGameState('results');
            }
        } else if (type === 'fifty') {
            const incorrectOptions = currentQuestion.options.filter(o => o !== currentQuestion.answer);
            const optionsToRemove = shuffleArray(incorrectOptions).slice(0, 2);
            currentQuestion.options = currentQuestion.options.filter(o => !optionsToRemove.includes(o));
        } else if (type === 'hint') {
            setHintUsed(true);
        }
        
        setPowerUps(prev => ({ ...prev, [type]: prev[type] - 1 }));
    };

    // ---- RENDER: START MENU ----
    if (gameState === 'menu') {
        return (
            <div className="grammar-wrapper">
                <div className="grammar-start-card">
                    <header className="grammar-menu-header">
                        <h1>Grammar Sprint</h1>
                        <p className="player-tag">Ready to train, <b>{user.displayName || 'Explorer'}</b>?</p>
                    </header>

                    <div className="difficulty-container">
                        <h3>Select Difficulty</h3>
                        <div className="difficulty-buttons">
                            {['Easy', 'Intermediate', 'Advanced'].map(lv => (
                                <button
                                    key={lv}
                                    className={`diff-btn ${lv === level ? 'active' : ''}`}
                                    onClick={() => setLevel(lv)}
                                >
                                    {lv}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="menu-actions">
                        <button className="play-btn" onClick={startSprint}>
                            Start {level} Sprint
                        </button>
                        <button className="exit-btn-text" onClick={onBack}>
                            Return to Dashboard
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ---- RENDER: RESULTS PAGE ----
    if (gameState === 'results') {
        const accuracy = Math.round((correctCount / questions.length) * 100);
        return (
            <div className="grammar-wrapper">
                <div className="results-card">
                    <div className="results-icon">🏆</div>
                    <h2>Sprint Complete!</h2>
                    <p>Great job on the {level} module.</p>
                    
                    <div className="results-stats-grid">
                        <div className="stat-box">
                            <label>Final Score</label>
                            <span className="stat-value">{score}</span>
                        </div>
                        <div className="stat-box">
                            <label>Accuracy</label>
                            <span className="stat-value">{accuracy}%</span>
                        </div>
                    </div>

                    <div className="results-actions">
                        <button className="play-btn" onClick={() => setGameState('menu')}>
                            Try Again
                        </button>
                        <button className="exit-btn-text" onClick={onBack}>
                            Exit to Dashboard
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ---- RENDER: ACTIVE GAME ----
    return (
        <div className="grammar-game-wrapper">
            <div className="game-hud">
                <div className="hud-left">
                    <button className="hud-back" onClick={() => setGameState('menu')}>← Quit</button>
                    <div className="hud-stat">
                        <label>SCORE</label>
                        <span>{score}</span>
                    </div>
                </div>

                <div className="hud-center">
                    <div className="question-counter">
                        Q{currentIndex + 1} <span>/ {questions.length}</span>
                    </div>
                    <ProgressBar time={timeLeft} maxTime={MAX_TIME} />
                </div>

                <div className="hud-right">
                    <div className={`streak-badge ${streak > 0 ? 'active' : ''}`}>
                        {streak > 0 ? `🔥 ${streak}` : 'NO STREAK'}
                    </div>
                </div>
            </div>

            <main className="game-stage">
                <div className="question-card">
                    <div className="card-header">
                        <span className="level-tag">{level} Level</span>
                        <div className="timer-pill">{timeLeft}s</div>
                    </div>

                    <div className="question-content">
                        <h2>{questions[currentIndex]?.question}</h2>
                        {hintUsed && (
                            <div className="hint-box">
                                💡 Hint: Starts with <b>{questions[currentIndex]?.answer[0]}...</b>
                            </div>
                        )}
                    </div>

                    <div className="options-grid">
                        {questions[currentIndex]?.options.map((opt, idx) => {
                            let status = '';
                            if (selectedAnswer) {
                                if (opt === questions[currentIndex].answer) status = 'correct';
                                else if (opt === selectedAnswer && answerResult === 'wrong') status = 'wrong';
                            }
                            return (
                                <button
                                    key={idx}
                                    className={`option-btn ${status}`}
                                    onClick={() => handleAnswer(opt)}
                                    disabled={!!selectedAnswer}
                                >
                                    {opt}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </main>

            <footer className="power-up-bar">
                <button 
                    className="power-btn" 
                    disabled={powerUps.skip === 0 || !!selectedAnswer} 
                    onClick={() => usePowerUp('skip')}
                >
                    <span className="p-icon">⏭️</span> Skip ({powerUps.skip})
                </button>
                <button 
                    className="power-btn" 
                    disabled={powerUps.fifty === 0 || !!selectedAnswer} 
                    onClick={() => usePowerUp('fifty')}
                >
                    <span className="p-icon">✂️</span> 50/50 ({powerUps.fifty})
                </button>
                <button 
                    className="power-btn" 
                    disabled={powerUps.hint === 0 || !!selectedAnswer || hintUsed} 
                    onClick={() => usePowerUp('hint')}
                >
                    <span className="p-icon">💡</span> Hint ({powerUps.hint})
                </button>
            </footer>
        </div>
    );
};

export default WordSprintGrammar;