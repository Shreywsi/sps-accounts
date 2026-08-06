import { useState } from "react";
import { useNavigate } from "react-router-dom";
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

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

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
      setMessage(error.response?.data?.detail || "Signup failed. Please try again.");
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
              <input
                id="password"
                name="password"
                type="password"
                className="auth-input"
                placeholder="Create a password"
                value={form.password}
                onChange={handleChange}
                autoComplete="new-password"
              />
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