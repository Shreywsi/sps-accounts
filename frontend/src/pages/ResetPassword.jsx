import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Eye, EyeOff, Lock, CheckCircle, AlertCircle } from "lucide-react";
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

export default function ResetPassword() {
  const navigate = useNavigate();
  const { uid, token } = useParams();
  
  const [form, setForm] = useState({
    new_password: "",
    confirm_password: "",
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState("");

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });

    if (e.target.name === "new_password") {
      checkPasswordStrength(e.target.value);
    }
  };

  const checkPasswordStrength = (password) => {
    if (password.length === 0) {
      setPasswordStrength("");
      return;
    }

    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++;
    if (password.match(/\d/)) strength++;
    if (password.match(/[^a-zA-Z\d]/)) strength++;

    if (strength <= 1) setPasswordStrength("Weak");
    else if (strength <= 2) setPasswordStrength("Medium");
    else if (strength <= 3) setPasswordStrength("Strong");
    else setPasswordStrength("Very Strong");
  };

  const validateForm = () => {
    if (form.new_password.length < 8) {
      setError("Password must be at least 8 characters long");
      return false;
    }
    if (form.new_password !== form.confirm_password) {
      setError("Passwords do not match");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) return;

    setLoading(true);

    try {
      const response = await API.post("/auth/reset-password/", {
        uid,
        token,
        new_password: form.new_password,
      });
      setSuccess(true);
    } catch (err) {
      setError(
        err.response?.data?.error || 
        "Failed to reset password. The link may be invalid or expired."
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
            Set your <em>new password.</em>
          </h1>
          <p className="auth-subcopy">
            Create a strong password to secure your account. 
            Make sure it's at least 8 characters with a mix of letters, numbers, and symbols.
          </p>
        </div>

        <div className="auth-stats">
          <div>
            <div className="auth-stat-num">Secure</div>
            <div className="auth-stat-label">Password Reset</div>
          </div>
          <div>
            <div className="auth-stat-num">Strong</div>
            <div className="auth-stat-label">Security</div>
          </div>
          <div>
            <div className="auth-stat-num">Fast</div>
            <div className="auth-stat-label">Process</div>
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
            <h1 className="auth-title">Reset Password</h1>
            <p className="auth-lede">
              {success 
                ? "Password reset successful"
                : "Enter your new password below"
              }
            </p>
          </div>

          {success ? (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-600" />
              <p className="text-gray-700 mb-6">
                Your password has been reset successfully. You can now log in with your new password.
              </p>
              <button
                onClick={() => navigate("/")}
                className="auth-submit"
              >
                Go to Login
              </button>
            </div>
          ) : (
            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="auth-field">
                <label className="auth-label" htmlFor="new_password">
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="new_password"
                    className="auth-input pl-10 pr-10"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    value={form.new_password}
                    onChange={handleChange}
                    autoComplete="new-password"
                    required
                  />
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {passwordStrength && (
                  <div className="mt-1 text-xs">
                    <span className={`font-medium ${
                      passwordStrength === "Weak" ? "text-red-600" :
                      passwordStrength === "Medium" ? "text-yellow-600" :
                      passwordStrength === "Strong" ? "text-green-600" :
                      "text-green-700"
                    }`}>
                      Password strength: {passwordStrength}
                    </span>
                  </div>
                )}
              </div>

              <div className="auth-field">
                <label className="auth-label" htmlFor="confirm_password">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    id="confirm_password"
                    className="auth-input pl-10 pr-10"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={form.confirm_password}
                    onChange={handleChange}
                    autoComplete="new-password"
                    required
                  />
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {form.confirm_password && form.new_password !== form.confirm_password && (
                  <div className="mt-1 text-xs text-red-600">
                    Passwords do not match
                  </div>
                )}
              </div>

              {error && <p className="auth-error">{error}</p>}

              <button className="auth-submit" disabled={loading}>
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          )}

          <button 
            className="auth-back"
            onClick={() => navigate("/")}
          >
            Back to Sign In
          </button>
        </div>
      </div>
    </div>
  );
}