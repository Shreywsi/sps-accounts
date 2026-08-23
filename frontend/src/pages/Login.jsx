import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { loginUser } from "../api/auth";
import { useAuth } from "../context/AuthContext";
import "./auth.css";

// Official Shourya Public School logo, in a soft badge for contrast on navy.
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

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({
    username: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!form.username || form.username.length < 3) {
      setError("Please enter a valid username");
      return;
    }

    if (!form.password || form.password.length < 1) {
      setError("Please enter your password");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await loginUser(form);

      login(
        res.data.user,
        res.data.tokens.access
      );

      localStorage.setItem(
        "refreshToken",
        res.data.tokens.refresh
      );

      // Redirect based on role
      if (res.data.user.role === "ADMIN") {
        navigate("/dashboard");
      } else if (res.data.user.role === "OPERATOR") {
        navigate("/operator/dashboard");
      }
    } catch (err) {
      setError(
        err.response?.data?.non_field_errors?.[0] ||
          err.response?.data?.message ||
          "Login failed. Check your username and password and try again."
      );
    }

    setLoading(false);
  };

  return (
    <div className="auth-page">
      {/* ---------------- Left: identity / branding panel ---------------- */}
      <div className="auth-visual">
        <div className="auth-crest">
          <CrestMark />
          <div className="auth-crest-name">
            Shourya Public School
            <span>School Accounts</span>
          </div>
        </div>

        <div className="auth-visual-body">
          <div className="auth-eyebrow">CBSE &middot; English Medium &middot; Co-Educational</div>
          <h1 className="auth-headline">
            One account for every <em>classroom, roster, and record.</em>
          </h1>
          <p className="auth-subcopy">
            Sign in to manage attendance, grades, and schedules for Nursery
            through Class VIII — all in one place, built for how our school
            actually runs.
          </p>
        </div>

        <figure className="auth-demo-photo">
          <img
            src="https://shouryapublicschool.com/wp-content/uploads/2026/06/school-pic1.png"
            alt="Shourya Public School campus"
          />
          <figcaption>Shourya Public School, Rangapani</figcaption>
        </figure>

        <div className="auth-stats">
          <div>
            <div className="auth-stat-num">CBSE</div>
            <div className="auth-stat-label">Curriculum</div>
          </div>
          <div>
            <div className="auth-stat-num">N&ndash;VIII</div>
            <div className="auth-stat-label">Nursery to Class VIII</div>
          </div>
          <div>
            <div className="auth-stat-num">Smart</div>
            <div className="auth-stat-label">Classrooms &amp; labs</div>
          </div>
        </div>
      </div>

      {/* ---------------- Right: login form ---------------- */}
      <div className="auth-form-panel">
        <div className="auth-card">
          <div className="auth-mobile-crest">
            <CrestMark size={52} />
            <div className="auth-crest-name" style={{ color: "#1b2a4a" }}>
              Shourya Public School
            </div>
          </div>

          <div className="auth-card-header">
            <h1 className="auth-title">Welcome back</h1>
            <p className="auth-lede">
              Sign in with your school-issued username to continue.
            </p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-field">
              <label className="auth-label" htmlFor="username">
                Username
              </label>
              <input
                id="username"
                className="auth-input"
                type="text"
                name="username"
                placeholder="e.g. shourya.admin"
                value={form.username}
                onChange={handleChange}
                autoComplete="username"
              />
            </div>

            <div className="auth-field">
              <label className="auth-label" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  className="auth-input pr-10"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && <p className="auth-error">{error}</p>}

            <button className="auth-submit" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              className="text-sm text-gray-600 hover:text-blue-600 underline"
              onClick={() => navigate("/forgot-password")}
            >
              Forgot password?
            </button>
          </div>

          <p className="auth-switch">
            New operator?{" "}
            <button
              type="button"
              className="auth-link-btn"
              onClick={() => navigate("/signup")}
            >
              Create an account
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}