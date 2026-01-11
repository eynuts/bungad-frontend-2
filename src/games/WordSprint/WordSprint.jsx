// src/games/WordSprint/WordSprint.jsx
import React, { useState } from 'react';
import WordSprintVocabulary from './WordSprintVocabulary';
import WordSprintGrammar from './WordSprintGrammar';
import './WordSprint.css';

const WordSprint = ({ user, onBack }) => {
    const [screen, setScreen] = useState('menu'); // 'menu' | 'vocabulary' | 'grammar'

    if (screen === 'vocabulary') {
        return <WordSprintVocabulary user={user} onBack={() => setScreen('menu')} />;
    }

    if (screen === 'grammar') {
        return <WordSprintGrammar user={user} onBack={() => setScreen('menu')} />;
    }

    // ---- FULL SCREEN UPDATED GUI ----
    return (
        <div className="word-sprint-wrapper">
            <div className="start-screen-container">
                
                <header className="game-header">
                    <div className="brand-box">
                        <h1 className="game-title">Word Sprint</h1>
                        <span className="status-badge">English Training</span>
                    </div>
                    
                    <div className="player-profile">
                        <div className="avatar-circle">
                            {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'P'}
                        </div>
                        <div className="player-info">
                            <p className="player-label">Active Session</p>
                            <p className="player-name">{user.displayName || "Explorer"}</p>
                        </div>
                    </div>
                </header>

                <main className="menu-main-content">
                    <div className="welcome-text">
                        <h2>Ready to improve?</h2>
                        <p>Select a module to begin your learning sprint.</p>
                    </div>

                    <div className="game-selector-grid">
                        <button 
                            className="mode-card vocab" 
                            onClick={() => setScreen('vocabulary')}
                        >
                            <div className="card-visual">📖</div>
                            <div className="card-details">
                                <h3>Vocabulary</h3>
                                <p>Master new words & definitions</p>
                            </div>
                            <div className="card-arrow">→</div>
                        </button>

                        <button 
                            className="mode-card grammar" 
                            onClick={() => setScreen('grammar')}
                        >
                            <div className="card-visual">✍️</div>
                            <div className="card-details">
                                <h3>Grammar</h3>
                                <p>Perfect your sentence structure</p>
                            </div>
                            <div className="card-arrow">→</div>
                        </button>
                    </div>
                </main>

                <footer className="game-footer">
                    <button className="back-btn-modern" onClick={onBack}>
                        <span className="btn-icon">←</span> Exit to Dashboard
                    </button>
                </footer>

            </div>
        </div>
    );
};

export default WordSprint;