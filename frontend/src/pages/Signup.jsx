import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import API from "../api/axios";
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

export default function Signup() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    password: "",
  });

  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState("");

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });

    // Password strength check
    if (e.target.name === "password") {
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!form.username || form.username.length < 3) {
      setIsError(true);
      setMessage("Username must be at least 3 characters long");
      return;
    }

    if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) {
      setIsError(true);
      setMessage("Please enter a valid email address");
      return;
    }

    if (!form.phone || form.phone.length < 10) {
      setIsError(true);
      setMessage("Please enter a valid phone number");
      return;
    }

    if (!form.password || form.password.length < 8) {
      setIsError(true);
      setMessage("Password must be at least 8 characters long");
      return;
    }

    if (passwordStrength === "Weak") {
      setIsError(true);
      setMessage("Please choose a stronger password");
      return;
    }

    setLoading(true);
    setMessage("");
    setIsError(false);

    try {
      const res = await API.post("/auth/signup/", form);

      setIsError(false);
      setMessage(res.data.message || "Account created. Redirecting to sign in…");

      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (error) {
      console.log(error.response);

      setIsError(true);
      
      // Handle different error formats
      if (error.response?.data) {
        const errorData = error.response.data;
        
        // Check for field-specific errors
        if (errorData.username) {
          setMessage(errorData.username[0]);
        } else if (errorData.email) {
          setMessage(errorData.email[0]);
        } else if (errorData.password) {
          setMessage(errorData.password[0]);
        } else if (errorData.phone) {
          setMessage(errorData.phone[0]);
        } else if (errorData.non_field_errors) {
          setMessage(errorData.non_field_errors[0]);
        } else if (errorData.detail) {
          setMessage(errorData.detail);
        } else {
          setMessage("Signup failed. Please check your input and try again.");
        }
      } else {
        setMessage("Signup failed. Please try again.");
      }
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
            Join the staff <em>directory in minutes.</em>
          </h1>
          <p className="auth-subcopy">
            Create your operator account to get access to rosters,
            attendance, and reporting tools for your classroom or office.
          </p>
        </div>

        <figure className="auth-demo-photo">
          <img
            src="https://shouryapublicschool.com/wp-content/uploads/2026/06/school-pic2.png"
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
            <div className="auth-stat-num">Secure</div>
            <div className="auth-stat-label">Campus &amp; transport</div>
          </div>
        </div>
      </div>

      {/* ---------------- Right: signup form ---------------- */}
      <div className="auth-form-panel">
        <div className="auth-card">
          <div className="auth-mobile-crest">
            <CrestMark size={52} />
            <div className="auth-crest-name" style={{ color: "#1b2a4a" }}>
              Shourya Public School
            </div>
          </div>

          <div className="auth-card-header">
            <h1 className="auth-title">Create your account</h1>
            <p className="auth-lede">
              Fill in your details to register as a new operator.
            </p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-field">
              <label className="auth-label" htmlFor="username">
                Username
              </label>
              <input
                id="username"
                name="username"
                className="auth-input"
                placeholder="e.g. j.smith"
                value={form.username}
                onChange={handleChange}
                autoComplete="username"
              />
            </div>

            <div className="auth-field-row">
              <div className="auth-field">
                <label className="auth-label" htmlFor="first_name">
                  First name
                </label>
                <input
                  id="first_name"
                  name="first_name"
                  className="auth-input"
                  placeholder="Jordan"
                  value={form.first_name}
                  onChange={handleChange}
                  autoComplete="given-name"
                />
              </div>

              <div className="auth-field">
                <label className="auth-label" htmlFor="last_name">
                  Last name
                </label>
                <input
                  id="last_name"
                  name="last_name"
                  className="auth-input"
                  placeholder="Smith"
                  value={form.last_name}
                  onChange={handleChange}
                  autoComplete="family-name"
                />
              </div>
            </div>

            <div className="auth-field">
              <label className="auth-label" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                className="auth-input"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
              />
            </div>

            <div className="auth-field">
              <label className="auth-label" htmlFor="phone">
                Phone
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                className="auth-input"
                placeholder="(555) 123-4567"
                value={form.phone}
                onChange={handleChange}
                autoComplete="tel"
              />
            </div>

            <div className="auth-field">
              <label className="auth-label" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  className="auth-input pr-10"
                  placeholder="Create a password"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="new-password"
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

            {message && (
              <p className={isError ? "auth-error" : "auth-success"}>
                {message}
              </p>
            )}

            <button className="auth-submit" disabled={loading}>
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>

          <button className="auth-back" onClick={() => navigate("/")}>
            Back to sign in
          </button>
        </div>
      </div>
    </div>
  );
}