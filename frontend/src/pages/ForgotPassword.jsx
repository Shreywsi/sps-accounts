import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import API from "../api/axios";
import "./auth.css";

// Official Shourya Public School logo
function CrestMark({ size = 68 }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        borderRadius: "50%",
        background: "#F7F4EC",
        flexShrink: 0,
        overflow: "hidden",
        border: "1px solid rgba(201,162,39,0.5)",
      }}
    >
      <img
        src="https://shouryapublicschool.com/wp-content/uploads/2026/06/shourya-logo.png"
        alt="Shourya Public School logo"
        style={{ width: "78%", height: "78%", objectFit: "contain" }}
      />
    </span>
  );
}

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const response = await API.post("/auth/forgot-password/", { email });
      setSuccess(true);
    } catch (err) {
      setError(
        err.response?.data?.error || 
        "Failed to send reset email. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Left panel */}
      <div className="auth-visual">
        <div className="auth-crest">
          <CrestMark />
          <div className="auth-crest-name">
            Shourya Public School
            <span>School Accounts</span>
          </div>
        </div>

        <div className="auth-visual-body">
          <div className="auth-eyebrow">Password Recovery</div>
          <h1 className="auth-headline">
            Reset your <em>password in seconds.</em>
          </h1>
          <p className="auth-subcopy">
            Enter your email address and we'll send you a secure link to reset your password.
          </p>
        </div>

        <div className="auth-stats">
          <div>
            <div className="auth-stat-num">Secure</div>
            <div className="auth-stat-label">Password Reset</div>
          </div>
          <div>
            <div className="auth-stat-num">24hr</div>
            <div className="auth-stat-label">Link Validity</div>
          </div>
          <div>
            <div className="auth-stat-num">Fast</div>
            <div className="auth-stat-label">Recovery</div>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="auth-form-panel">
        <div className="auth-card">
          <div className="auth-mobile-crest">
            <CrestMark size={52} />
            <div className="auth-crest-name" style={{ color: "#1b2a4a" }}>
              Shourya Public School
            </div>
          </div>

          <div className="auth-card-header">
            <h1 className="auth-title">Forgot Password</h1>
            <p className="auth-lede">
              {success 
                ? "Check your email for reset instructions"
                : "Enter your email to receive a password reset link"
              }
            </p>
          </div>

          {success ? (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-600" />
              <p className="text-gray-700 mb-6">
                If an account with this email exists, a password reset link has been sent to your email.
              </p>
              <button
                onClick={() => navigate("/")}
                className="auth-submit"
              >
                Back to Login
              </button>
            </div>
          ) : (
            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="auth-field">
                <label className="auth-label" htmlFor="email">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    id="email"
                    className="auth-input pl-10"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                </div>
              </div>

              {error && <p className="auth-error">{error}</p>}

              <button className="auth-submit" disabled={loading}>
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>
          )}

          <button 
            className="auth-back"
            onClick={() => navigate("/")}
          >
            <ArrowLeft size={16} className="inline mr-1" />
            Back to Sign In
          </button>
        </div>
      </div>
    </div>
  );
}