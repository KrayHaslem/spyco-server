import { useState, type FormEvent } from "react";
import { useAuth } from "../../hooks/useAuth";
import PasswordInput from "../core/PasswordInput";

function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const result = await login(email, password);

    if (!result.success) {
      setError(result.error || "Login failed");
    }

    setIsLoading(false);
  };

  return (
    <div className="login-page">
      <div className="login-page__container">
        <h1 className="login-page__title">SPYCO PO System</h1>
        <p className="login-page__subtitle">Sign in to your account</p>

        <form onSubmit={handleSubmit} className="login-page__form">
          {error && <div className="login-page__error">{error}</div>}

          <div className="form-group">
            <label className="form-group__label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              disabled={isLoading}
            />
          </div>

          <PasswordInput
            id="password"
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            disabled={isLoading}
          />

          <button
            type="submit"
            className="btn btn--primary btn--lg login-page__submit"
            disabled={isLoading}
          >
            {isLoading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
