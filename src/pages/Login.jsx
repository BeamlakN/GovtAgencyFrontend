import { useState, useEffect } from "react";
import { loginAgency, forgotPassword } from "../api/auth";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, AlertCircle } from "lucide-react";

export default function Login() {
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
      setEmailError("Email is required");
      return false;
    }
    if (!emailRegex.test(email)) {
      setEmailError("Please enter a valid email address");
      return false;
    }
    setEmailError("");
    return true;
  };

  const validatePassword = (password) => {
    if (!password) {
      setPasswordError("Password is required");
      return false;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setPasswordError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
      return false;
    }
    setPasswordError("");
    return true;
  };

  const isAccountLocked = () => {
    if (lockoutTime && lockoutTime > Date.now()) {
      const minutesLeft = Math.ceil((lockoutTime - Date.now()) / 60000);
      const secondsLeft = Math.ceil((lockoutTime - Date.now()) / 1000);
      const timeString = minutesLeft > 0 
        ? `${minutesLeft} minute${minutesLeft !== 1 ? 's' : ''}`
        : `${secondsLeft} second${secondsLeft !== 1 ? 's' : ''}`;
      setError(`Too many failed attempts. Please try again in ${timeString}.`);
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
        setError("Account is banned. Please contact system administrator.");
        setLoading(false);
        return;
      }

      const TARGET_BUREAU_ID = import.meta.env.VITE_AGENCY_BUREAU_ID;

      if (user.role === "super_admin" && !user.bureauId) {
        console.log("Global Super Admin Access");
      } else if (user.bureauId !== TARGET_BUREAU_ID) {
        setError("Access Denied: Not your agency");
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
        setError("Invalid email or password. Please try again.");
      } else {
        setError(err.message || "Login failed. Please try again.");
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
      setError(`Too many failed login attempts. Account locked for ${LOCKOUT_DURATION_MINUTES} minutes.`);
      setAttempts(0);
      localStorage.removeItem("loginAttempts");
    } else {
      const remainingAttempts = MAX_ATTEMPTS - newAttempts;
      setError(`Invalid credentials. ${remainingAttempts} attempt${remainingAttempts !== 1 ? 's' : ''} remaining before lockout.`);
    }
  };

  const validateForgotEmail = (email) => {
    const emailRegex = /^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/;
    if (!email) {
      setForgotError("Email is required");
      return false;
    }
    if (!emailRegex.test(email)) {
      setForgotError("Please enter a valid email address");
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
        setForgotMessage("Password reset link has been sent to your email address.");
      } else {
        setForgotMessage("If an account exists with this email, you will receive a reset link.");
      }
      
      setForgotEmail("");
      
      // Auto close after 3 seconds on success
      setTimeout(() => {
        setShowForgot(false);
        setForgotMessage("");
        setForgotError("");
      }, 3000);
      
    } catch (err) {
      console.error("Forgot password error:", err);
      setForgotError(err.message || "Failed to send reset link. Please try again.");
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-4 relative overflow-hidden">
      <div className="absolute w-[400px] h-[400px] bg-green-500/20 blur-3xl rounded-full top-[-120px] left-[-120px]" />
      <div className="absolute w-[400px] h-[400px] bg-blue-500/20 blur-3xl rounded-full bottom-[-120px] right-[-120px]" />

      <div className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-8 z-10">
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto bg-green-600/20 rounded-full flex items-center justify-center mb-3">
            <span className="text-green-400 text-xl">🏛️</span>
          </div>

          <h1 className="text-2xl font-semibold text-white">
            Transport Agency Portal
          </h1>

          <p className="text-slate-300 text-sm mt-1">
            Secure Government Access System
          </p>
          
          {attempts > 0 && !lockoutTime && attempts < MAX_ATTEMPTS && (
            <div className="mt-3 text-xs text-amber-400 bg-amber-500/10 py-1 px-2 rounded-lg inline-block">
              {MAX_ATTEMPTS - attempts} login attempt{MAX_ATTEMPTS - attempts !== 1 ? 's' : ''} remaining
            </div>
          )}
          
          {lockoutTime && lockoutTime > Date.now() && (
            <div className="mt-3 text-xs text-red-400 bg-red-500/10 py-1 px-2 rounded-lg inline-block">
              Locked for {formatRemainingTime()}
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-400 text-red-200 text-sm p-3 rounded-lg mb-5 flex items-start gap-2">
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 text-slate-400" size={18} />
              <input
                type="email"
                className={`w-full pl-10 pr-3 py-3 rounded-lg border text-white outline-none focus:ring-2 transition-all ${
                  emailError
                    ? "border-red-500 focus:ring-red-500 bg-red-500/10"
                    : "border-white/20 focus:ring-green-500 bg-white/10"
                }`}
                placeholder="Enter your email"
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
              <p className="text-red-400 text-xs mt-1 ml-1">{emailError}</p>
            )}
          </div>

          <div>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 text-slate-400" size={18} />
              <input
                type={showPassword ? "text" : "password"}
                className={`w-full pl-10 pr-10 py-3 rounded-lg border text-white outline-none focus:ring-2 transition-all ${
                  passwordError
                    ? "border-red-500 focus:ring-red-500 bg-red-500/10"
                    : "border-white/20 focus:ring-green-500 bg-white/10"
                }`}
                placeholder={`Enter your password (min. ${MIN_PASSWORD_LENGTH} characters)`}
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
                className="absolute right-3 top-3 text-slate-400 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {passwordError && (
              <p className="text-red-400 text-xs mt-1 ml-1">{passwordError}</p>
            )}
            {!passwordError && password && (
              <p className="text-green-400 text-xs mt-1 ml-1 flex items-center gap-1">
                ✓ Password meets requirements
              </p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowForgot(true)}
              className="text-sm text-green-400 hover:underline transition-all"
              disabled={!!lockoutTime}
            >
              Forgot Password?
            </button>
            
            {attempts > 0 && !lockoutTime && (
              <span className="text-xs text-amber-400">
                {MAX_ATTEMPTS - attempts} attempts left
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !!lockoutTime}
            className={`w-full font-semibold py-3 rounded-lg transition-all ${
              loading || lockoutTime
                ? "bg-gray-600 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700"
            } text-white`}
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Signing in...
              </div>
            ) : lockoutTime ? (
              "Account Locked"
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <p className="text-xs text-center text-slate-400 mt-6">
          © 2026 Transport Agency. All rights reserved.
        </p>
      </div>

      {/* Forgot Password Modal */}
      {showForgot && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 p-6 rounded-xl w-full max-w-sm border border-white/10 shadow-2xl">
            <h2 className="text-white text-lg font-semibold mb-4">
              Reset Password
            </h2>
            
            <p className="text-slate-400 text-sm mb-4">
              Enter your email address and we'll send you a link to reset your password.
            </p>

            <input
              type="email"
              placeholder="Enter your email"
              className={`w-full p-3 rounded-lg text-white outline-none focus:ring-2 transition-all ${
                forgotError
                  ? "border-red-500 focus:ring-red-500 bg-red-500/10"
                  : "border border-white/20 focus:ring-green-500 bg-white/10"
              }`}
              value={forgotEmail}
              onChange={(e) => {
                setForgotEmail(e.target.value);
                if (forgotError) setForgotError("");
                if (forgotMessage) setForgotMessage("");
              }}
            />
            
            {forgotError && (
              <p className="text-red-400 text-xs mt-2">{forgotError}</p>
            )}
            
            {forgotMessage && (
              <div className="mt-3 p-3 bg-green-500/20 border border-green-400 rounded-lg">
                <p className="text-green-400 text-sm">{forgotMessage}</p>
              </div>
            )}

            <div className="flex gap-3 mt-5">
              <button
                onClick={handleForgotPassword}
                disabled={forgotLoading}
                className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {forgotLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Sending...
                  </div>
                ) : (
                  "Send Reset Link"
                )}
              </button>

              <button
                onClick={() => {
                  setShowForgot(false);
                  setForgotMessage("");
                  setForgotError("");
                  setForgotEmail("");
                }}
                className="flex-1 bg-slate-700 text-white py-2 rounded-lg hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}