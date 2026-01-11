// src/components/pages/Home.jsx
import React, { useState, useEffect, Suspense } from "react";
import "../styles/Home.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

import { auth, provider as googleProvider, db } from "../firebaseConfig";
import { signInWithPopup, onAuthStateChanged, signOut } from "firebase/auth";
import { ref, get, set, update } from "firebase/database";

import BrainUp from "../games/BrainUp/BrainUp";
import Quizzes from "../games/BrainUp/Quizzes";
import CreateLobby from "../games/BrainUp/CreateLobby";
import Admin from "../admin/Admin";
import Subscription from "./Subscription"; // ✅ MODAL IMPORT
import logo from "../assets/logo.png";

const SmartMathArena = React.lazy(() =>
  import("../games/SmartMathArena/SmartMathArena")
);
const WordSprint = React.lazy(() =>
  import("../games/WordSprint/WordSprint")
);

const GameCard = ({ name, tagline, iconClass, colorClass, isNew, onPlay, delay }) => (
  <div className={`home-game-card home-${colorClass}`} style={{ "--delay": `${delay}s` }}>
    <div className="home-card-visual">
      <div className="home-icon-blob">
        <i className={`fas ${iconClass}`}></i>
      </div>
      {isNew && <span className="home-new-tag">NEW</span>}
    </div>
    <div className="home-card-info">
      <h3>{name}</h3>
      <p>{tagline}</p>
      <button className="home-btn-launch" onClick={onPlay}>
        Launch Game <i className="fas fa-arrow-right"></i>
      </button>
    </div>
  </div>
);

const Home = () => {
  const [currentPage, setCurrentPage] = useState("home");
  const [payload, setPayload] = useState(null);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriptionDetails, setSubscriptionDetails] = useState(null);
  const [showSubscription, setShowSubscription] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  // 🔹 Theme Toggle
  useEffect(() => {
    if (isDarkMode) document.documentElement.removeAttribute("data-theme");
    else document.documentElement.setAttribute("data-theme", "light");
  }, [isDarkMode]);

  // 🔹 Auth + Account Sync
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setIsAdmin(false);
        setIsSubscribed(false);
        return;
      }

      setUser(firebaseUser);

      const userRef = ref(db, `accounts/${firebaseUser.uid}`);
      const snapshot = await get(userRef);

      if (!snapshot.exists()) {
        await set(userRef, {
          uid: firebaseUser.uid,
          name: firebaseUser.displayName,
          email: firebaseUser.email,
          photoURL: firebaseUser.photoURL,
          isAdmin: false,
          isSubscribed: false,
          createdAt: Date.now(),
          lastLogin: Date.now(),
        });
        setIsAdmin(false);
        setIsSubscribed(false);
      } else {
        const data = snapshot.val();
        setIsAdmin(!!data.isAdmin);
        setIsSubscribed(!!data.isSubscribed);

        if (data.isSubscribed) {
          setSubscriptionDetails({
            plan: data.subscriptionPlan || "monthly",
            approvedAt: data.approvedAt,
          });
        } else {
          setSubscriptionDetails(null);
        }

        await update(userRef, { lastLogin: Date.now() });
      }
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login Error:", error);
    }
  };

  const logoutUser = async () => {
    await signOut(auth);
    setCurrentPage("home");
    setPayload(null);
    setIsAdmin(false);
    setIsSubscribed(false);
  };

  // 🔐 LOGIN + SUBSCRIPTION GUARD
  const handleChangeScreen = (screenName, data = {}) => {
    if (!user) {
      loginWithGoogle();
      return;
    }

    if (!isSubscribed && screenName !== "admin") {
      setShowSubscription(true);
      return;
    }

    setCurrentPage(screenName);
    setPayload(data);
  };

  const pageComponents = {
    BrainUp,
    Quizzes,
    "SmartMath Arena": (props) => (
      <SmartMathArena {...props} onChangeScreen={handleChangeScreen} />
    ),
    "Word Sprint: Vocabulary Master": WordSprint,
    createLobby: CreateLobby,
    admin: (props) => <Admin {...props} onBack={() => setCurrentPage("home")} />,
  };

  if (currentPage !== "home") {
    const SelectedPage = pageComponents[currentPage];
    return (
      <Suspense fallback={<div className="home-loader-screen"><div className="home-spinner"></div></div>}>
        <SelectedPage
          user={user}
          onBack={() => setCurrentPage("home")}
          onNavigate={handleChangeScreen}
          {...(payload || {})}
        />
      </Suspense>
    );
  }

  // 🔹 Game List
  const games = [
    {
      name: "BrainUp",
      tagline: "Daily cognitive challenges designed for high school mastery.",
      iconClass: "fa-brain",
      colorClass: "variant-blue",
      isNew: true,
    },
    {
      name: "SmartMath Arena",
      tagline: "Compete in real-time. Solve fast, rank high, and dominate.",
      iconClass: "fa-calculator",
      colorClass: "variant-purple",
      isNew: true,
    },
    {
      name: "Word Sprint: Vocabulary Master",
      tagline: "Expand your lexicon in a race against the clock.",
      iconClass: "fa-feather-alt",
      colorClass: "variant-orange",
      isNew: true,
    },
  ];

  return (
    <div className="home-app-shell">
      {/* HEADER */}
      <header className="home-glass-nav">
        <div className="home-nav-wrapper">
          <div className="home-brand">
            <div className="home-brand-logo">
              <img src={logo} alt="BUNGAD Logo" className="home-logo-img" />
            </div>
            <span className="home-brand-name">BUN<span>GAD</span></span>
          </div>

          <div className="home-nav-actions">
            {user ? (
              <div className="home-user-controls">
                {isAdmin && (
                  <button
                    className="home-admin-btn"
                    title="Admin Panel"
                    onClick={() => handleChangeScreen("admin")}
                  >
                    <i className="fas fa-user-shield"></i>
                  </button>
                )}
                <div className="home-profile-dropdown">
                  <div className="home-avatar-wrapper">
                    <img src={user.photoURL} alt="User" className="home-nav-avatar" />
                  </div>
                  <div className="home-dropdown-content">
                    <p className="home-user-name">{user.displayName}</p>
                    <p className="home-user-email">{user.email}</p>
                    <button onClick={logoutUser} className="home-drop-item home-logout">
                      <i className="fas fa-sign-out-alt"></i> Logout
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button onClick={loginWithGoogle} className="home-google-btn">
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* BODY */}
      <div className="home-main-layout">
        <aside className="home-side-menu">
          <nav className="home-side-nav">
            <button className="home-side-item home-active">
              <i className="fas fa-th-large"></i> Dashboard
            </button>
            <button className="home-side-item" onClick={() => handleChangeScreen("BrainUp")}>
              <i className="fas fa-brain"></i> BrainUp
            </button>
            <button className="home-side-item" onClick={() => handleChangeScreen("SmartMath Arena")}>
              <i className="fas fa-calculator"></i> Math Arena
            </button>
            <button className="home-side-item" onClick={() => handleChangeScreen("Word Sprint: Vocabulary Master")}>
              <i className="fas fa-feather-alt"></i> Word Sprint
            </button>
          </nav>

          <div className="home-side-footer">
            <div className="home-theme-toggle">
              <div className="home-theme-label">
                <i className={`fas ${isDarkMode ? "fa-moon" : "fa-sun"}`}></i>
                <span>{isDarkMode ? "Dark" : "Light"}</span>
              </div>
              <label className="theme-switch">
                <input type="checkbox" checked={!isDarkMode} onChange={() => setIsDarkMode(!isDarkMode)} />
                <span className="theme-slider">
                  <i className="fas fa-moon theme-icon moon"></i>
                  <i className="fas fa-sun theme-icon sun"></i>
                </span>
              </label>
            </div>

            <div
              className="home-premium-card"
              onClick={() => setShowSubscription(true)}
              style={{ cursor: "pointer" }}
            >
              <p>{isSubscribed ? "Premium Active" : "Unlock Subscription"}</p>
              {isSubscribed && subscriptionDetails && (
                <div className="home-premium-info">
                  <span className="premium-plan-badge">{subscriptionDetails.plan === "monthly" ? "Monthly" : "Yearly"}</span>
                  {/* Removed countdown */}
                </div>
              )}
              {!isSubscribed && (
                <button className="home-btn-premium">
                  Upgrade
                </button>
              )}
            </div>
          </div>
        </aside>

        <main className="home-scroll-container">
          <div className="home-content-inner">
            <div className="home-game-grid">
              {games.map((game, index) => (
                <GameCard key={game.name} {...game} delay={index * 0.1} onPlay={() => handleChangeScreen(game.name)} />
              ))}
            </div>
          </div>
        </main>
      </div>

      {/* 🔥 SUBSCRIPTION MODAL */}
      {showSubscription && (
        <Subscription
          user={user}
          onClose={() => setShowSubscription(false)}
          onSubscribed={() => {
            setIsSubscribed(true);
            setShowSubscription(false);
          }}
        />
      )}
    </div>
  );
};

export default Home;
