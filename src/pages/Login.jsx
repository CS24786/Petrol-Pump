import React, { useState, useEffect } from 'react';
import { Lock, User, Eye, EyeOff, ShieldCheck, AlertCircle, ArrowRight, HelpCircle } from 'lucide-react';
import { authenticateUser, setSessionUser, ensureDefaultAdmin } from '../utils/auth';

export default function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [showHelpTooltip, setShowHelpTooltip] = useState(false);

  // Initialize and ensure default admin account exists in Dexie DB
  useEffect(() => {
    async function init() {
      try {
        await ensureDefaultAdmin();
      } catch (e) {
        console.error('Initialization error:', e);
      } finally {
        setIsInitializing(false);
      }
    }
    init();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!username.trim()) {
      setErrorMsg('Please enter your username.');
      return;
    }
    if (!password) {
      setErrorMsg('Please enter your password.');
      return;
    }

    setIsLoading(true);
    try {
      await new Promise(r => setTimeout(r, 200));
      const user = await authenticateUser(username, password);
      setSessionUser(user, false);
      onLoginSuccess(user);
    } catch (err) {
      setErrorMsg(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen w-full relative flex flex-col justify-between bg-slate-900 bg-cover bg-center select-none overflow-hidden"
      style={{
        backgroundImage: "url('./login_background.jpg')"
      }}
    >
      {/* Top Header Bar */}
      <header className="relative z-10 w-full px-6 sm:px-12 py-6 flex items-center justify-between">
        {/* Top-Left: DIYAL Filling Station Logo & Brand Text */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <img
            src="./logo.png"
            alt="Diyal Filling Station"
            className="h-9 sm:h-10 w-auto object-contain drop-shadow-sm"
            onError={(e) => { e.target.src = './logo.jpg'; }}
          />
          <div className="flex flex-col leading-none">
            <span className="text-xl sm:text-2xl font-black tracking-wider text-[#0e2137] drop-shadow-xs">
              DIYAL
            </span>
            <span className="text-[10px] sm:text-[11px] font-bold tracking-widest uppercase text-[#c52227] mt-0.5">
              FILLING STATION
            </span>
          </div>
        </div>

        {/* Top-Right: Fueling Your Journey */}
        <div className="text-white text-xs sm:text-sm font-medium tracking-wide drop-shadow-sm">
          Fueling Your Journey
        </div>
      </header>

      {/* Central Login Card */}
      <main className="relative z-10 w-full flex items-center justify-center px-4 my-auto">
        <div className="w-full max-w-[385px] sm:max-w-[395px] bg-white/85 backdrop-blur-md rounded-[28px] sm:rounded-[32px] shadow-2xl shadow-slate-900/20 border border-white/60 p-7 sm:p-8 transition-all">
          
          {/* Card Brand Header */}
          <div className="flex flex-col items-center">
            {/* Centered Logo Lockup: Flame Icon + Brand Text */}
            <div className="flex items-center justify-center gap-2.5 sm:gap-3">
              <img
                src="./logo.png"
                alt="Diyal Logo"
                className="h-10 sm:h-11 w-auto object-contain shrink-0"
                onError={(e) => { e.target.src = './logo.jpg'; }}
              />
              <div className="flex flex-col text-left leading-none">
                <span className="text-xl sm:text-2xl font-black tracking-wider text-[#0e2137]">
                  DIYAL
                </span>
                <span className="text-[10px] sm:text-[11px] font-bold tracking-widest uppercase text-[#c52227] mt-0.5">
                  FILLING STATION
                </span>
              </div>
            </div>

            <h2 className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight mt-5">
              Welcome Back
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Sign in to your station account
            </p>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="mt-4 p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-700 text-xs flex items-center gap-2 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="mt-5 sm:mt-6 space-y-3 sm:space-y-3.5">
            {/* Username Input */}
            <div className="relative">
              <div className="flex items-center bg-[#f3f4f6]/90 hover:bg-[#f3f4f6] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#c52227]/20 focus-within:border-[#c52227] border border-slate-200/80 rounded-xl px-3.5 py-2.5 sm:py-3 transition-all">
                <User className="w-4 h-4 text-slate-400 shrink-0 mr-2.5" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username"
                  autoFocus
                  disabled={isLoading || isInitializing}
                  className="w-full bg-transparent text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowHelpTooltip(!showHelpTooltip)}
                  title="Default credentials: admin / admin"
                  className="text-slate-400 hover:text-slate-600 transition-colors p-0.5 ml-1 cursor-pointer"
                >
                  <HelpCircle className="w-4 h-4" />
                </button>
              </div>

              {/* Tooltip for help */}
              {showHelpTooltip && (
                <div className="absolute right-0 top-full mt-1.5 z-20 bg-slate-800 text-white text-[11px] rounded-lg px-2.5 py-1.5 shadow-lg border border-slate-700">
                  Default credentials: <strong>admin</strong> / <strong>admin</strong>
                </div>
              )}
            </div>

            {/* Password Input */}
            <div>
              <div className="flex items-center bg-[#f3f4f6]/90 hover:bg-[#f3f4f6] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#c52227]/20 focus-within:border-[#c52227] border border-slate-200/80 rounded-xl px-3.5 py-2.5 sm:py-3 transition-all">
                <Lock className="w-4 h-4 text-slate-400 shrink-0 mr-2.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  disabled={isLoading || isInitializing}
                  className="w-full bg-transparent text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  className="text-slate-400 hover:text-slate-600 transition-colors p-0.5 ml-1 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Sign In Button */}
            <div className="pt-1.5">
              <button
                type="submit"
                disabled={isLoading || isInitializing}
                className="w-full py-3 sm:py-3.5 px-4 bg-[#c52227] hover:bg-[#b01e23] active:bg-[#991a1e] text-white rounded-xl text-xs sm:text-sm font-bold tracking-wide shadow-md shadow-red-700/25 hover:shadow-lg hover:shadow-red-700/35 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    <span>Signing in...</span>
                  </div>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Secure Login Footer */}
          <div className="mt-5 flex items-center justify-center gap-1.5 text-slate-400 text-xs font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
            <span>Secure Login</span>
          </div>

        </div>
      </main>

      {/* Empty bottom spacer to maintain vertical balance */}
      <div className="h-6"></div>
    </div>
  );
}
