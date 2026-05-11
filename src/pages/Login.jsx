import { useState, useEffect } from "react";
import { loginAgency, forgotPassword } from "../api/auth";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff, Mail, Lock, AlertCircle } from "lucide-react";

// Import your logo image here
import Logo from "@/assets/logo.png"; 

export default function Login() {
  const { t, i18n } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Validation errors
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  
  // Login attempt tracking
  const [attempts, setAttempts] = useState(0);
  const [lockoutTime, setLockoutTime] = useState(null);
  const [remainingLockoutSeconds, setRemainingLockoutSeconds] = useState(0);
  
  const MAX_ATTEMPTS = 5;
  const LOCKOUT_DURATION_MINUTES = 15;
  const MIN_PASSWORD_LENGTH = 8;

  // Forgot password states
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotMessage, setForgotMessage] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState("");

  const navigate = useNavigate();

  // Load attempts from localStorage on mount
  useEffect(() => {
    const savedAttempts = localStorage.getItem("loginAttempts");
    const savedLockout = localStorage.getItem("loginLockout");
    
    if (savedAttempts) {
      setAttempts(parseInt(savedAttempts));
    }
    
    if (savedLockout) {
      const lockoutTimeValue = parseInt(savedLockout);
      if (lockoutTimeValue > Date.now()) {
        setLockoutTime(lockoutTimeValue);
      } else {
        localStorage.removeItem("loginAttempts");
        localStorage.removeItem("loginLockout");
        setAttempts(0);
      }
    }
  }, []);

  // Update remaining lockout seconds
  useEffect(() => {
    if (lockoutTime && lockoutTime > Date.now()) {
      const interval = setInterval(() => {
        const remaining = Math.max(0, Math.ceil((lockoutTime - Date.now()) / 1000));
        setRemainingLockoutSeconds(remaining);
        
        if (remaining === 0) {
          setLockoutTime(null);
          setAttempts(0);
          localStorage.removeItem("loginAttempts");
          localStorage.removeItem("loginLockout");
          clearInterval(interval);
        }
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [lockoutTime]);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/;
    if (!email) {
      setEmailError(t("login.emailRequired"));
      return false;
    }
    if (!emailRegex.test(email)) {
      setEmailError(t("login.emailInvalid"));
      return false;
    }
    setEmailError("");
    return true;
  };

  const validatePassword = (password) => {
    if (!password) {
      setPasswordError(t("login.passwordRequired"));
      return false;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setPasswordError(t("login.passwordMin", { min: MIN_PASSWORD_LENGTH }));
      return false;
    }
    setPasswordError("");
    return true;
  };

  const isAccountLocked = () => {
    if (lockoutTime && lockoutTime > Date.now()) {
      const msLeft = lockoutTime - Date.now();
      const minutesLeft = Math.ceil(msLeft / 60000);
      const secondsLeft = Math.ceil(msLeft / 1000);
      const timeString =
        minutesLeft > 0
          ? t("login.waitMinutes", { count: minutesLeft })
          : t("login.waitSeconds", { count: secondsLeft });
      setError(t("login.tooManyAttempts", { time: timeString }));
      return true;
    }
    return false;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    
    if (isAccountLocked()) {
      return;
    }
    
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);
    
    if (!isEmailValid || !isPasswordValid) {
      return;
    }
    
    setLoading(true);

    try {
      const data = await loginAgency(email, password);
      
      setAttempts(0);
      localStorage.removeItem("loginAttempts");
      localStorage.removeItem("loginLockout");
      
      const user = data.user;
      const token = data.token;

      if (user.banned) {
        setError(t("login.accountBanned"));
        setLoading(false);
        return;
      }

      const TARGET_BUREAU_ID = import.meta.env.VITE_AGENCY_BUREAU_ID;

      if (user.role === "super_admin" && !user.bureauId) {
        console.log("Global Super Admin Access");
      } else if (user.bureauId !== TARGET_BUREAU_ID) {
        setError(t("login.accessDenied"));
        setLoading(false);
        incrementAttempts();
        return;
      }

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      navigate("/dashboard");

    } catch (err) {
      incrementAttempts();
      
      if (err.message.includes("Invalid credentials") || err.message.includes("Invalid email or password")) {
        setError(t("login.invalidCredentials"));
      } else {
        setError(err.message || t("login.loginFailed"));
      }
    }

    setLoading(false);
  };
  
  const incrementAttempts = () => {
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);
    localStorage.setItem("loginAttempts", newAttempts.toString());
    
    if (newAttempts >= MAX_ATTEMPTS) {
      const lockoutExpiry = Date.now() + (LOCKOUT_DURATION_MINUTES * 60 * 1000);
      setLockoutTime(lockoutExpiry);
      localStorage.setItem("loginLockout", lockoutExpiry.toString());
      setError(t("login.accountLockedMinutes", { minutes: LOCKOUT_DURATION_MINUTES }));
      setAttempts(0);
      localStorage.removeItem("loginAttempts");
    } else {
      const remainingAttempts = MAX_ATTEMPTS - newAttempts;
      setError(
        t("login.attemptsLeftBeforeLockout", { count: remainingAttempts })
      );
    }
  };

  const validateForgotEmail = (email) => {
    const emailRegex = /^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/;
    if (!email) {
      setForgotError(t("login.forgotEmailRequired"));
      return false;
    }
    if (!emailRegex.test(email)) {
      setForgotError(t("login.emailInvalid"));
      return false;
    }
    setForgotError("");
    return true;
  };

  const handleForgotPassword = async () => {
    if (!validateForgotEmail(forgotEmail)) {
      return;
    }
    
    setForgotLoading(true);
    setForgotMessage("");
    setForgotError("");

    try {
      const res = await forgotPassword(forgotEmail);
      
      if (res.message) {
        setForgotMessage(res.message);
      } else if (res.success) {
        setForgotMessage(t("login.resetSent"));
      } else {
        setForgotMessage(t("login.resetGeneric"));
      }
      
      setForgotEmail("");
      
      setTimeout(() => {
        setShowForgot(false);
        setForgotMessage("");
        setForgotError("");
      }, 3000);
      
    } catch (err) {
      setForgotError(err.message || t("login.forgotFailed"));
    } finally {
      setForgotLoading(false);
    }
  };

  const formatRemainingTime = () => {
    const minutes = Math.floor(remainingLockoutSeconds / 60);
    const seconds = remainingLockoutSeconds % 60;
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  const lang = i18n.language?.startsWith("am") ? "am" : "en";

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-slate-800 px-4 py-8">
      {/* Language Switcher */}
      <div className="absolute top-4 end-4 flex items-center gap-2">
        <label htmlFor="login-lang" className="sr-only">{t("login.languageLabel")}</label>
        <select
          id="login-lang"
          value={lang}
          onChange={(e) => i18n.changeLanguage(e.target.value)}
          className="rounded-lg border border-slate-600 bg-slate-900/80 text-slate-100 text-xs py-1.5 px-2 outline-none focus:ring-2 focus:ring-slate-400"
        >
          <option value="en">English</option>
          <option value="am">አማርኛ</option>
        </select>
      </div>

      <div className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl shadow-lg p-6">
        <div className="text-center mb-6">
          {/* Logo Section */}
          <div className="w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <img 
              src={Logo} 
              alt="DVCLA Logo" 
              className="max-h-full max-w-full object-contain" 
            />
          </div>

          <h1 className="text-lg font-bold text-slate-900">
            {t("login.title")}
          </h1>

          <p className="text-slate-500 text-sm mt-1">
            {t("login.subtitle")}
          </p>
          
          {attempts > 0 && !lockoutTime && attempts < MAX_ATTEMPTS && (
            <div className="mt-3 text-xs text-amber-600 bg-amber-50 py-1 px-2 rounded-lg inline-block">
              {t("login.attemptsRemainingBanner", { count: MAX_ATTEMPTS - attempts })}
            </div>
          )}
          
          {lockoutTime && lockoutTime > Date.now() && (
            <div className="mt-3 text-xs text-red-600 bg-red-50 py-1 px-2 rounded-lg inline-block">
              {t("login.lockedFor", { time: formatRemainingTime() })}
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg mb-4 flex items-start gap-2">
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 text-slate-400" size={16} />
              <input
                type="email"
                className={`w-full pl-9 pr-3 py-2.5 rounded-lg border text-slate-900 outline-none focus:ring-2 transition-all text-sm ${
                  emailError
                    ? "border-red-300 focus:ring-red-500 bg-red-50"
                    : "border-slate-200 focus:ring-slate-900 bg-white"
                }`}
                placeholder={t("login.emailPlaceholder")}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) validateEmail(e.target.value);
                }}
                onBlur={() => validateEmail(email)}
                disabled={!!lockoutTime}
                required
              />
            </div>
            {emailError && (
              <p className="text-red-600 text-xs mt-1 ml-1">{emailError}</p>
            )}
          </div>

          <div>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 text-slate-400" size={16} />
              <input
                type={showPassword ? "text" : "password"}
                className={`w-full pl-9 pr-9 py-2.5 rounded-lg border text-slate-900 outline-none focus:ring-2 transition-all text-sm ${
                  passwordError
                    ? "border-red-300 focus:ring-red-500 bg-red-50"
                    : "border-slate-200 focus:ring-slate-900 bg-white"
                }`}
                placeholder={t("login.passwordPlaceholder", { min: MIN_PASSWORD_LENGTH })}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (passwordError) validatePassword(e.target.value);
                }}
                onBlur={() => validatePassword(password)}
                disabled={!!lockoutTime}
                required
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {passwordError && (
              <p className="text-red-600 text-xs mt-1 ml-1">{passwordError}</p>
            )}
            {!passwordError && password && (
              <p className="text-green-600 text-xs mt-1 ml-1 flex items-center gap-1 font-medium">
                ✓ {t("login.passwordOk")}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowForgot(true)}
              className="text-sm font-medium text-slate-600 hover:text-slate-800 hover:underline transition-all"
              disabled={!!lockoutTime}
            >
              {t("login.forgotPassword")}
            </button>
            
            {attempts > 0 && !lockoutTime && (
              <span className="text-xs font-bold text-amber-500">
                {t("login.attemptsLeftShort", { count: MAX_ATTEMPTS - attempts })}
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !!lockoutTime}
            className={`w-full font-bold py-2.5 rounded-lg transition-all text-sm ${
              loading || lockoutTime
                ? "bg-slate-400 cursor-not-allowed"
                : "bg-slate-900 hover:bg-slate-800 shadow-sm"
            } text-white`}
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                {t("login.signingIn")}
              </div>
            ) : lockoutTime ? (
              t("login.accountLocked")
            ) : (
              t("login.signIn")
            )}
          </button>
        </form>

        <p className="text-xs text-center text-slate-400 mt-6 font-medium">
          {t("login.copyright")}
        </p>
      </div>

      {/* Forgot Password Modal */}
      {showForgot && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-2xl w-full max-w-sm border border-slate-200 shadow-2xl">
            <h2 className="text-slate-900 text-lg font-bold mb-4">
              {t("login.resetPassword")}
            </h2>
            
            <p className="text-slate-600 text-sm mb-6 leading-relaxed">
              {t("login.resetDescription")}
            </p>

            <input
              type="email"
              placeholder={t("login.emailPlaceholder")}
              className={`w-full p-3 rounded-xl text-slate-900 outline-none focus:ring-2 transition-all font-medium ${
                forgotError
                  ? "border-red-300 focus:ring-red-500 bg-red-50"
                  : "border border-slate-200 focus:ring-slate-900 bg-white shadow-sm"
              }`}
              value={forgotEmail}
              onChange={(e) => {
                setForgotEmail(e.target.value);
                if (forgotError) setForgotError("");
                if (forgotMessage) setForgotMessage("");
              }}
            />
            
            {forgotError && (
              <p className="text-red-600 text-xs mt-2 font-bold">{forgotError}</p>
            )}
            
            {forgotMessage && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-xl">
                <p className="text-green-600 text-sm font-bold">{forgotMessage}</p>
              </div>
            )}

            <div className="flex gap-3 mt-8">
              <button
                onClick={handleForgotPassword}
                disabled={forgotLoading}
                className="flex-1 bg-slate-900 text-white py-2.5 rounded-xl font-bold hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                {forgotLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  </div>
                ) : (
                  t("login.sendResetLink")
                )}
              </button>

              <button
                onClick={() => {
                  setShowForgot(false);
                  setForgotMessage("");
                  setForgotError("");
                  setForgotEmail("");
                }}
                className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-xl font-bold hover:bg-slate-200 transition-colors"
              >
                {t("common.cancel")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}