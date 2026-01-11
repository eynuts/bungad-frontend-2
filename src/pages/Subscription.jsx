// src/components/pages/Subscription.jsx
import React, { useState, useEffect } from "react";
import "../styles/Subscription.css";
import { ref, update, get, onValue } from "firebase/database";
import { db, auth } from "../firebaseConfig";

import monthlyQR from "../assets/monthly.png";
import yearlyQR from "../assets/yearly.png";

const Subscription = ({ user, onClose }) => {
  const [plan, setPlan] = useState("monthly");
  const [reference, setReference] = useState("");
  const [loading, setLoading] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);

  const prices = { monthly: 50, yearly: 480 };

  // Format countdown
  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const days = Math.floor(totalSeconds / (24 * 3600));
    const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  };

  // 🔥 Load subscription from Firebase
  useEffect(() => {
    if (!user) return;

    const userRef = ref(db, `accounts/${user.uid}`);

    const unsubscribe = onValue(userRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setSubscriptionStatus(data.subscriptionStatus || null);

        // Countdown only if approved
        if (data.subscriptionStatus === "approved" && data.approvedAt && data.subscriptionPlan) {
          const startDate = new Date(Number(data.approvedAt));
          const duration =
            data.subscriptionPlan === "monthly"
              ? 30 * 24 * 60 * 60 * 1000
              : 365 * 24 * 60 * 60 * 1000;
          const endDate = new Date(startDate.getTime() + duration);

          const updateCountdown = () => {
            const now = new Date();
            const diff = endDate - now;
            if (diff > 0) setTimeLeft(diff);
            else {
              setTimeLeft(0);
              setSubscriptionStatus("expired");
              update(userRef, { subscriptionStatus: "expired", isSubscribed: false });
            }
          };

          updateCountdown();
          const interval = setInterval(updateCountdown, 1000);
          return () => clearInterval(interval);
        } else {
          setTimeLeft(null); // no countdown if not approved
        }
      } else {
        setSubscriptionStatus(null);
      }
    });

    return () => unsubscribe();
  }, [user]);

  // Submit payment
  const handleSubmit = async () => {
    if (!reference.trim()) {
      alert("Please enter a reference number");
      return;
    }

    setLoading(true);
    try {
      await update(ref(db, `accounts/${user.uid}`), {
        subscriptionStatus: "pending",
        subscriptionPlan: plan,
        referenceNumber: reference.trim(),
        submittedAt: Date.now(),
        isSubscribed: false,
      });
      setSubscriptionStatus("pending");
    } catch (err) {
      console.error(err);
      alert("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Approved view with countdown
  if (subscriptionStatus === "approved") {
    return (
      <div className="sub-overlay">
        <div className="sub-modal status-view">
          <h2>Premium Active</h2>
          <p>Welcome! Your premium features are now unlocked.</p>
          {timeLeft !== null && (
            <p>
              Time left: <strong>{formatTime(timeLeft)}</strong>
            </p>
          )}
          <button className="btn-primary" onClick={onClose}>
            Start Playing
          </button>
        </div>
      </div>
    );
  }

  // ⏳ Pending view
  if (subscriptionStatus === "pending") {
    return (
      <div className="sub-overlay">
        <div className="sub-modal status-view">
          <h2>Payment Pending</h2>
          <p>Your payment is waiting for admin approval.</p>
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    );
  }

  // ❌ Expired view
  if (subscriptionStatus === "expired") {
    return (
      <div className="sub-overlay">
        <div className="sub-modal status-view">
          <h2>Subscription Expired</h2>
          <p>Your subscription has ended. Renew to access premium features.</p>
          <button className="btn-primary" onClick={() => setSubscriptionStatus(null)}>
            Renew
          </button>
        </div>
      </div>
    );
  }

  // 💳 Plan selection & payment
  return (
    <div className="sub-overlay">
      <div className="sub-modal">
        <button className="close-x" onClick={onClose}>
          &times;
        </button>

        <h2>Select Plan</h2>
        <div className="sub-plans">
          <div className={`plan-mini ${plan === "monthly" ? "active" : ""}`} onClick={() => setPlan("monthly")}>
            Monthly ₱{prices.monthly}
          </div>
          <div className={`plan-mini ${plan === "yearly" ? "active" : ""}`} onClick={() => setPlan("yearly")}>
            Yearly ₱{prices.yearly}
          </div>
        </div>

        <div className="sub-input-group">
          <input
            type="text"
            placeholder="Reference Number"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
          />
        </div>

        <div className="sub-actions">
          <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? "Submitting..." : "Submit Payment"}
          </button>
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
        </div>

        <div className="sub-qr">
          <img src={plan === "monthly" ? monthlyQR : yearlyQR} alt="QR Code" />
          <p>Pay ₱{prices[plan]}</p>
        </div>
      </div>
    </div>
  );
};

export default Subscription;
