import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { FlowLogo } from '../components/FlowLogo';
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

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 md:p-10 font-sans">
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden w-full max-w-5xl grid grid-cols-1 md:grid-cols-12 min-h-[600px]">
        
        {/* Left Side: Brand & Visuals */}
        <div className="hidden md:flex md:col-span-6 bg-slate-50/50 p-12 flex-col justify-between border-r border-slate-100 select-none">
          {/* Logo */}
          <FlowLogo size="md" showSubtitle={true} />

          {/* Heading */}
          <div className="my-auto py-8">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
              Take control of <br />
              your <span className="text-violet-600">money</span>.
            </h1>
            <p className="mt-4 text-sm text-slate-500 max-w-sm leading-relaxed font-medium">
              Track income, manage expenses, set budgets and build better financial habits.
            </p>

            {/* Realistic Miniature Flow Dashboard Preview */}
            <div className="relative mt-8 bg-white border border-slate-100/80 rounded-2xl p-4 shadow-xl shadow-slate-200/50 max-w-md select-none overflow-hidden group hover:border-violet-200 transition-all duration-300">
              
              {/* Mini Dashboard Header */}
              <div className="flex justify-between items-center pb-3 mb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-400"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
                  <span className="text-[10px] font-bold text-slate-800 font-display ml-1">Flow Dashboard</span>
                </div>
                <span className="text-[9px] font-bold text-violet-600 bg-violet-50 border border-violet-100 px-2 py-0.5 rounded-md">
                  September 2026 ▾
                </span>
              </div>

              {/* Mini Stat Cards Grid */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-100/80">
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Income</p>
                  <p className="text-xs font-extrabold text-slate-800 font-display mt-0.5">₹8,000</p>
                  <span className="text-[7px] font-bold text-emerald-600 bg-emerald-50 px-1 py-0.2 rounded mt-1 inline-block">+100%</span>
                </div>
                <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-100/80">
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Spent</p>
                  <p className="text-xs font-extrabold text-slate-800 font-display mt-0.5">₹2,420</p>
                  <span className="text-[7px] font-bold text-rose-500 bg-rose-50 px-1 py-0.2 rounded mt-1 inline-block">30.3%</span>
                </div>
                <div className="bg-violet-600 text-white p-2.5 rounded-xl shadow-xs shadow-violet-200">
                  <p className="text-[8px] font-bold text-violet-200 uppercase tracking-wider">Saved</p>
                  <p className="text-xs font-extrabold font-display mt-0.5">₹5,580</p>
                  <span className="text-[7px] font-bold text-emerald-300 bg-white/10 px-1 py-0.2 rounded mt-1 inline-block">69.8% rate</span>
                </div>
              </div>

              {/* Mini Money Flow Progress Bar */}
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 mb-3 space-y-1.5">
                <div className="flex justify-between items-center text-[9px] font-semibold">
                  <span className="text-slate-500">Money Flow</span>
                  <span className="text-emerald-600 font-bold">₹5,580 Surplus</span>
                </div>
                <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden flex">
                  <div className="h-full bg-violet-600 rounded-l-full" style={{ width: '30.3%' }}></div>
                  <div className="h-full bg-emerald-500 rounded-r-full" style={{ width: '69.7%' }}></div>
                </div>
              </div>

              {/* Mini Recent Transactions */}
              <div className="space-y-1.5">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Recent Activity</p>
                <div className="flex justify-between items-center text-[10px] bg-slate-50/50 p-1.5 rounded-lg border border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-rose-100 text-rose-600 flex items-center justify-center text-[10px]">🍕</span>
                    <span className="font-semibold text-slate-700">Food & Dining</span>
                  </div>
                  <span className="font-extrabold text-slate-800">-₹120</span>
                </div>
                <div className="flex justify-between items-center text-[10px] bg-slate-50/50 p-1.5 rounded-lg border border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-blue-100 text-blue-600 flex items-center justify-center text-[10px]">🚗</span>
                    <span className="font-semibold text-slate-700">Transportation</span>
                  </div>
                  <span className="font-extrabold text-slate-800">-₹180</span>
                </div>
              </div>

              {/* Overlay Floating Badge */}
              <div className="absolute -bottom-2 -right-2 bg-white border border-slate-100 px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-lg group-hover:scale-105 transition-all">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-[10px] font-extrabold text-slate-800 font-display flex items-center gap-1">
                  <span>🟢</span> You're on track
                </span>
              </div>
            </div>
          </div>

          {/* Footer branding */}
          <div className="text-[10px] text-slate-400 font-medium">
            © {new Date().getFullYear()} Flow · Your money, clearly.
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
