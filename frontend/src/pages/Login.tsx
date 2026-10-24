import { useTranslation } from "../context/useTranslation";
import React, { useEffect, useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Logo } from "../components/Logo";
import * as api from "../api";
import { USER_KEY } from "../utils/impersonation";
import { getPasswordPolicy, validatePassword } from "../utils/passwordPolicy";
import { PasswordRequirements } from "../components/PasswordRequirements";
import { PasswordInput } from "../components/PasswordInput";
import { PasswordMatch } from "../components/PasswordMatch";
import { AuthStatusErrorPanel } from "../components/AuthStatusErrorPanel";
import {
  clearOidcAutoLoginSuppression,
  isOidcAutoLoginSuppressed,
} from "../utils/oidcLogout";

export const Login: React.FC = () => {
  const tr = useTranslation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const {
    login,
    logout,
    authEnabled,
    registrationEnabled,
    authStatusError,
    retryAuthStatus,
    oidcEnabled,
    oidcEnforced,
    oidcProvider,
    bootstrapRequired,
    authOnboardingRequired,
    isAuthenticated,
    loading: authLoading,
    user,
  } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryMustReset = searchParams.get("mustReset") === "1";
  const oidcErrorCode = searchParams.get("oidcError");
  const oidcErrorMessage = searchParams.get("oidcErrorMessage");
  const oidcReturnTo = searchParams.get("returnTo") || "/";
  const mustReset = Boolean(user?.mustResetPassword) || queryMustReset;
  const passwordPolicy = getPasswordPolicy(undefined, tr);

  useEffect(() => {
    if (!oidcErrorCode) return;
    setError(oidcErrorMessage || tr("OIDC sign-in failed"));
  }, [tr, oidcErrorCode, oidcErrorMessage]);

  useEffect(() => {
    if (authStatusError) return;
    if (authLoading || authEnabled === null) return;
    if (authOnboardingRequired) {
      navigate("/auth-setup", { replace: true });
      return;
    }
    if (!authEnabled) {
      navigate("/", { replace: true });
      return;
    }
    if (bootstrapRequired) {
      navigate("/register", { replace: true });
      return;
    }
    if (oidcEnforced && !mustReset) {
      if (!oidcErrorCode) {
        if (!isOidcAutoLoginSuppressed()) api.startOidcSignIn(oidcReturnTo);
      }
      return;
    }
    if (isAuthenticated) {
      if (mustReset) return;
      navigate("/", { replace: true });
    }
  }, [
    authEnabled,
    authLoading,
    authOnboardingRequired,
    authStatusError,
    bootstrapRequired,
    isAuthenticated,
    mustReset,
    navigate,
    oidcEnforced,
    oidcErrorCode,
    oidcReturnTo,
  ]);

  if (authStatusError) {
    return (
      <AuthStatusErrorPanel
        message={authStatusError}
        onRetry={retryAuthStatus}
        fullScreen
      />
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      const stored = localStorage.getItem(USER_KEY);
      const storedUser = stored
        ? (JSON.parse(stored) as { mustResetPassword?: boolean } | null)
        : null;
      if (storedUser?.mustResetPassword) {
        setPassword("");
        return;
      }
      navigate("/");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : tr("Failed to login");
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleMustReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!newPassword || !confirmNewPassword) {
      setError(tr("Please enter and confirm a new password"));
      return;
    }
    const passwordError = validatePassword(newPassword, passwordPolicy, tr);
    if (passwordError) {
      setError(passwordError);
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError(tr("New passwords do not match"));
      return;
    }

    setLoading(true);
    try {
      const response = await api.api.post<{
        user: {
          id: string;
          email: string;
          name: string;
          role?: string;
          mustResetPassword?: boolean;
        };
      }>("/auth/must-reset-password", { newPassword });

      localStorage.setItem(USER_KEY, JSON.stringify(response.data.user));

      window.location.href = "/";
    } catch (err: unknown) {
      let message = tr("Failed to reset password");
      if (api.isAxiosError(err)) {
        message =
          err.response?.data?.message || err.response?.data?.error || message;
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-wrap">
        <div className="text-center">
          <Logo className="mx-auto h-12 w-auto" />
          <h2 className="auth-heading">
            {mustReset
              ? tr("Reset your password")
              : oidcEnforced
                ? tr("Sign in with {0}", { 0: oidcProvider || "OIDC" })
                : tr("Sign in to your account")}
          </h2>
          {!mustReset && !oidcEnforced && registrationEnabled ? (
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {tr("Or")}{" "}
              <Link to="/register" className="ui-link">
                {tr("create a new account")}{" "}
              </Link>
            </p>
          ) : mustReset ? (
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {tr("Choose a new password to continue.")}{" "}
            </p>
          ) : null}
        </div>
        <form
          className="auth-panel"
          onSubmit={mustReset ? handleMustReset : handleSubmit}
        >
          {error && (
            <div className="ui-alert-error">
              <div>{tr(error)}</div>
            </div>
          )}
          {oidcEnforced && !mustReset ? (
            <div>
              <button
                type="button"
                onClick={() => {
                  clearOidcAutoLoginSuppression();
                  api.startOidcSignIn(oidcReturnTo);
                }}
                className="ui-button-primary w-full"
              >
                {tr("Continue with")} {oidcProvider || "OIDC"}
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {!mustReset ? (
                  <>
                    <div>
                      <label htmlFor="email" className="sr-only">
                        {tr("Email address")}{" "}
                      </label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        className="ui-input block w-full"
                        placeholder={tr("Email address")}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                    <div>
                      <label htmlFor="password" className="sr-only">
                        {tr("Password")}{" "}
                      </label>
                      <PasswordInput
                        id="password"
                        name="password"
                        autoComplete="current-password"
                        required
                        className="ui-input block w-full"
                        placeholder={tr("Password")}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label htmlFor="newPassword" className="sr-only">
                        {tr("New password")}{" "}
                      </label>
                      <PasswordInput
                        id="newPassword"
                        name="newPassword"
                        autoComplete="new-password"
                        required
                        minLength={passwordPolicy.minLength}
                        maxLength={passwordPolicy.maxLength}
                        pattern={passwordPolicy.patternHtml}
                        className="ui-input block w-full"
                        placeholder={tr("New password")}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                    </div>
                    <div>
                      <label htmlFor="confirmNewPassword" className="sr-only">
                        {tr("Confirm new password")}{" "}
                      </label>
                      <PasswordInput
                        id="confirmNewPassword"
                        name="confirmNewPassword"
                        autoComplete="new-password"
                        required
                        minLength={passwordPolicy.minLength}
                        maxLength={passwordPolicy.maxLength}
                        className="ui-input block w-full"
                        placeholder={tr("Confirm new password")}
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                      />
                      <PasswordMatch
                        password={newPassword}
                        confirmPassword={confirmNewPassword}
                      />
                    </div>
                  </>
                )}
              </div>
              {mustReset && (
                <PasswordRequirements
                  password={newPassword}
                  policy={passwordPolicy}
                  className="text-gray-600 dark:text-gray-400"
                />
              )}
            </>
          )}

          {!mustReset && !oidcEnforced && (
            <div className="flex justify-end">
              <Link to="/reset-password" className="ui-link text-sm">
                {tr("Forgot your password?")}{" "}
              </Link>
            </div>
          )}

          {(!oidcEnforced || mustReset) && (
            <div>
              <button
                type="submit"
                disabled={loading}
                className="ui-button-primary w-full"
              >
                {mustReset
                  ? loading
                    ? tr("Updating...")
                    : tr("Set new password")
                  : loading
                    ? tr("Signing in...")
                    : tr("Sign in")}
              </button>
            </div>
          )}

          {!mustReset && oidcEnabled && !oidcEnforced && (
            <div>
              <button
                type="button"
                onClick={() => {
                  clearOidcAutoLoginSuppression();
                  api.startOidcSignIn("/");
                }}
                className="ui-button-secondary w-full"
              >
                {tr("Continue with")} {oidcProvider || "OIDC"}
              </button>
            </div>
          )}

          {mustReset && (
            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setNewPassword("");
                  setConfirmNewPassword("");
                  logout();
                }}
                className="ui-link text-sm"
              >
                {tr("Sign in as a different user")}{" "}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
