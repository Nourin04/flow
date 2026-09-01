import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Mail, Lock, User, ArrowRight, Eye, EyeOff, AlertCircle } from 'lucide-react';

export const Login: React.FC = () => {
  const { login, signup } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      if (isSignUp) {
        if (!name.trim()) {
          setError('Name is required');
          setLoading(false);
          return;
        }
        const res = await signup(name.trim(), email.trim(), password);
        if (!res.success) {
          setError(res.message || 'An account with this email already exists.');
        } else if (res.message) {
          setSuccessMessage(res.message);
        }
      } else {
        const res = await login(email.trim(), password);
        if (!res.success) {
          setError(res.message || 'Invalid email or password.');
        }
      }
    } catch (err) {
      console.error(err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo: window.location.origin }
        });
      } catch (err: any) {
        setError(err.message || 'Google authentication failed.');
      }
    } else {
      login('noureen@example.com', 'password');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 md:p-10 font-sans">
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden w-full max-w-5xl grid grid-cols-1 md:grid-cols-12 min-h-[600px]">
        
        {/* Left Side: Brand & Visuals */}
        <div className="hidden md:flex md:col-span-6 bg-slate-50/50 p-12 flex-col justify-between border-r border-slate-100 select-none">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-accent flex items-center justify-center text-white shadow-md shadow-violet-200">
              <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
              </svg>
            </div>
            <span className="font-display font-bold text-lg tracking-tight text-slate-800">Flow</span>
            <span className="text-[10px] text-slate-400 font-medium">Your money, clearly.</span>
          </div>

          {/* Heading */}
          <div className="my-auto py-8">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
              Take control of <br />
              your <span className="text-violet-600">money</span>.
            </h1>
            <p className="mt-4 text-sm text-slate-500 max-w-sm leading-relaxed font-medium">
              Track income, manage expenses, set budgets and build better financial habits.
            </p>

            {/* Mock Dashboard Illustration */}
            <div className="relative mt-12 bg-white border border-slate-100 rounded-2xl p-5 shadow-lg shadow-slate-100/60 max-w-sm">
              <div className="flex justify-between items-center mb-4">
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                </div>
                <span className="text-[9px] font-semibold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md">Flow Preview</span>
              </div>
              <div className="space-y-3">
                <div className="h-2 w-2/3 bg-slate-100 rounded-full"></div>
                <div className="h-2 w-1/2 bg-slate-100 rounded-full"></div>
                {/* SVG Mock Line Chart */}
                <svg className="w-full h-24 text-violet-500 overflow-visible mt-2" viewBox="0 0 100 30" fill="none">
                  <path
                    d="M0 25 C10 20, 20 28, 30 18 C40 8, 50 15, 60 5 C70 -5, 80 12, 100 8"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <path
                    d="M0 25 C10 20, 20 28, 30 18 C40 8, 50 15, 60 5 C70 -5, 80 12, 100 8 L100 30 L0 30 Z"
                    fill="url(#gradient)"
                    opacity="0.08"
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="currentColor" />
                      <stop offset="100%" stopColor="transparent" />
                    </linearGradient>
                  </defs>
                  <circle cx="60" cy="5" r="2.5" className="fill-violet-600 animate-ping" />
                  <circle cx="60" cy="5" r="2" className="fill-violet-600" />
                </svg>
              </div>
              
              {/* Overlay coin badge */}
              <div className="absolute -bottom-4 -right-4 bg-white border border-slate-100 px-3 py-2 rounded-xl flex items-center gap-2 shadow-md">
                <div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center text-white text-xs font-semibold">
                  ₹
                </div>
                <div className="text-[10px]">
                  <p className="text-slate-400 font-semibold -mb-0.5">Saved</p>
                  <p className="text-slate-800 font-extrabold font-display">64.3%</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer branding */}
          <div className="text-[10px] text-slate-400 font-medium">
            © {new Date().getFullYear()} Flow Inc. All rights reserved.
          </div>
        </div>

        {/* Right Side: Authentication form */}
        <div className="col-span-1 md:col-span-6 p-8 md:p-12 flex flex-col justify-center bg-white">
          <div className="w-full max-w-sm mx-auto space-y-6">
            
            {/* Header info */}
            <div>
              <h2 className="text-2xl font-bold text-slate-900 font-display">
                {isSignUp ? 'Create your account' : 'Welcome back 👋'}
              </h2>
              <p className="text-xs text-slate-400 mt-1 font-medium">
                {isSignUp 
                  ? 'Sign up to start tracking your stipend or salary.' 
                  : 'Log in to continue to your account'}
              </p>
            </div>

            {/* Google OAuth Button */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full border border-slate-200/80 rounded-xl px-4 py-2.5 text-xs text-slate-600 hover:bg-slate-50 font-semibold flex items-center justify-center gap-2.5 active:scale-98 transition-all"
            >
              {/* Google G Logo */}
              <svg className="w-4.5 h-4.5" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582l3.51-3.51C17.642 1.09 14.97 0 12 0 7.354 0 3.307 2.69 1.266 6.643l4 3.122Z"
                />
                <path
                  fill="#4285F4"
                  d="M23.455 12.273c0-.818-.073-1.609-.209-2.373H12v4.582h6.418a5.525 5.525 0 0 1-2.4 3.627l3.782 2.927c2.209-2.036 3.655-5.036 3.655-8.764Z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.266 14.235A7.106 7.106 0 0 1 4.909 12c0-.79.136-1.545.357-2.235l-4-3.122A11.916 11.916 0 0 0 0 12c0 1.927.455 3.755 1.266 5.357l4-3.122Z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.955-1.073 7.936-2.91l-3.782-2.927c-1.05.709-2.39 1.136-4.154 1.136-3.21 0-5.918-2.164-6.89-5.073l-4.009 3.109C3.307 21.31 7.354 24 12 24Z"
                />
              </svg>
              Continue with Google
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 select-none">
              <span className="h-px bg-slate-100 flex-1"></span>
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">or</span>
              <span className="h-px bg-slate-100 flex-1"></span>
            </div>

            {/* Error or Success notification banner */}
            {error && (
              <div className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl p-3 flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {successMessage && (
              <div className="text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-xl p-3 animate-in fade-in">
                {successMessage}
              </div>
            )}

            {/* Email Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500" htmlFor="name">Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => { setName(e.target.value); if (error) setError(''); }}
                      placeholder="Noureen"
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-violet-500 focus:bg-white transition-all font-medium"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500" htmlFor="email">Email address</label>
                <div className="relative">
                  <Mail className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${error ? 'text-rose-400' : 'text-slate-400'}`} />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); if (error) setError(''); }}
                    placeholder="you@example.com"
                    className={`w-full pl-9 pr-4 py-2.5 rounded-xl text-xs font-medium transition-all focus:outline-hidden ${
                      error 
                        ? 'bg-rose-50/40 border border-rose-300 text-slate-900 focus:border-rose-500 focus:bg-white' 
                        : 'bg-slate-50 border border-slate-200/80 text-slate-800 placeholder-slate-400 focus:border-violet-500 focus:bg-white'
                    }`}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-slate-500" htmlFor="password">Password</label>
                  {!isSignUp && (
                    <a href="#forgot" onClick={(e) => { e.preventDefault(); alert("Please use your registered password or reset it via your Supabase dashboard."); }} className="text-[10px] font-semibold text-violet-600 hover:text-violet-700">
                      Forgot password?
                    </a>
                  )}
                </div>
                <div className="relative">
                  <Lock className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${error ? 'text-rose-400' : 'text-slate-400'}`} />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); if (error) setError(''); }}
                    placeholder="Enter your password"
                    className={`w-full pl-9 pr-10 py-2.5 rounded-xl text-xs font-medium transition-all focus:outline-hidden ${
                      error 
                        ? 'bg-rose-50/40 border border-rose-300 text-slate-900 focus:border-rose-500 focus:bg-white' 
                        : 'bg-slate-50 border border-slate-200/80 text-slate-800 placeholder-slate-400 focus:border-violet-500 focus:bg-white'
                    }`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-hidden cursor-pointer"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {/* Inline Error Message */}
                {error && (
                  <p className="text-[11px] font-semibold text-rose-500 flex items-center gap-1.5 mt-1.5 animate-in fade-in">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                    <span>{error}</span>
                  </p>
                )}
              </div>

              {/* Remember me (only for Login) */}
              {!isSignUp && (
                <div className="flex items-center justify-between py-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded-sm border-slate-300 text-violet-600 focus:ring-violet-500 w-3.5 h-3.5"
                    />
                    <span className="text-[11px] font-semibold text-slate-500">Remember me</span>
                  </label>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-violet-600 hover:bg-violet-700 text-white rounded-xl py-2.5 text-xs font-semibold shadow-md shadow-violet-100 flex items-center justify-center gap-1.5 active:scale-98 disabled:opacity-50 transition-all cursor-pointer"
              >
                {loading ? 'Processing...' : isSignUp ? 'Create account' : 'Log in'}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>

            {/* Toggle Sign Up / Sign In */}
            <div className="text-center pt-2 select-none">
              <button
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError('');
                }}
                className="text-xs font-semibold text-slate-500 hover:text-slate-700"
              >
                {isSignUp ? (
                  <>
                    Already have an account? <span className="text-violet-600 hover:underline">Log in</span>
                  </>
                ) : (
                  <>
                    Don't have an account? <span className="text-violet-600 hover:underline">Sign up</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
