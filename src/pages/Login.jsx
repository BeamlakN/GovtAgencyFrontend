import { useState } from "react";
import { loginAgency, forgotPassword } from "../api/auth";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Forgot password states
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotMessage, setForgotMessage] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await loginAgency(email, password);

      const user = data.user;
      const token = data.token;

      if (user.banned) {
        setError("Account is banned");
        setLoading(false);
        return;
      }

      const TARGET_BUREAU_ID = import.meta.env.VITE_AGENCY_BUREAU_ID;

      if (user.role === "super_admin" && !user.bureauId) {
        console.log("Global Super Admin Access");
      } else if (user.bureauId !== TARGET_BUREAU_ID) {
        setError("Access Denied: Not your agency");
        setLoading(false);
        return;
      }

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      navigate("/dashboard");

    } catch (err) {
      setError(err.message);
    }

    setLoading(false);
  };

  const handleForgotPassword = async () => {
    setForgotLoading(true);
    setForgotMessage("");

    try {
      const res = await forgotPassword(forgotEmail);
      setForgotMessage(res.message || "Reset link sent to your email");
    } catch (err) {
      setForgotMessage(err.message);
    }

    setForgotLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-4 relative overflow-hidden">

      {/* glow */}
      <div className="absolute w-[400px] h-[400px] bg-green-500/20 blur-3xl rounded-full top-[-120px] left-[-120px]" />
      <div className="absolute w-[400px] h-[400px] bg-blue-500/20 blur-3xl rounded-full bottom-[-120px] right-[-120px]" />

      {/* card */}
      <div className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-8 z-10">

        {/* header */}
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
        </div>

        {/* error */}
        {error && (
          <div className="bg-red-500/20 border border-red-400 text-red-200 text-sm p-3 rounded-lg mb-5">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">

          {/* email */}
          <div className="relative">
            <Mail className="absolute left-3 top-3.5 text-slate-400" size={18} />
            <input
              type="email"
              className="w-full pl-10 pr-3 py-3 rounded-lg border border-white/20 text-white outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* password */}
          <div className="relative">
            <Lock className="absolute left-3 top-3.5 text-slate-400" size={18} />
            <input
              type={showPassword ? "text" : "password"}
              className="w-full pl-10 pr-10 py-3 rounded-lg bg-white/10 border border-white/20 text-white outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-slate-500"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* forgot password */}
          <div className="text-right">
            <button
              type="button"
              onClick={() => setShowForgot(true)}
              className="text-sm text-green-400 hover:underline"
            >
              Forgot Password?
            </button>
          </div>

          <button
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="text-xs text-center text-slate-400 mt-6">
          © 2026 Transport Agency
        </p>
      </div>

      {/* 🔐 Forgot Password Modal */}
      {showForgot && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-slate-900 p-6 rounded-xl w-full max-w-sm border border-white/10">

            <h2 className="text-white text-lg font-semibold mb-4">
              Reset Password
            </h2>

            <input
              type="email"
              placeholder="Enter your email"
              className="w-full p-3 rounded bg-white/10 text-white mb-3"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
            />

            {forgotMessage && (
              <p className="text-sm text-green-400 mb-2">
                {forgotMessage}
              </p>
            )}

            <div className="flex gap-3 mt-4">
              <button
                onClick={handleForgotPassword}
                className="flex-1 bg-green-600 text-white py-2 rounded"
              >
                {forgotLoading ? "Sending..." : "Send"}
              </button>

              <button
                onClick={() => setShowForgot(false)}
                className="flex-1 bg-gray-600 text-white py-2 rounded"
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