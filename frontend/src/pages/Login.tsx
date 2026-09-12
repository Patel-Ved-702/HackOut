import React, { useState } from 'react';
import { Leaf, Zap, ShieldCheck, Activity, EyeOff, Eye, Chrome, ArrowRight } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('demo@renewguard.io');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate authentication
    localStorage.setItem('auth_token', 'mock_token');
    // Force a full browser navigation to root to ensure App.tsx picks up the token
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-white flex font-sans">
      
      {/* Left Panel - Image Background */}
      <div className="hidden lg:flex w-[55%] relative flex-col justify-between p-12 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="/login_bg.jpg" 
            alt="Wind Turbine at Sunset" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 via-slate-900/40 to-transparent"></div>
        </div>

        <div className="relative z-10 flex items-center gap-2 mb-20">
          <Leaf className="w-8 h-8 text-emerald-400" />
          <div className="flex flex-col">
            <span className="text-xl font-black text-white leading-tight">RenewGuard <span className="text-emerald-400">AI</span></span>
            <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Predictive Maintenance</span>
          </div>
        </div>

        <div className="relative z-10 flex-1 flex flex-col justify-center max-w-lg">
          <h1 className="text-5xl font-black text-white leading-[1.1] mb-6">
            Smarter Insights.<br/>Longer Asset Life.
          </h1>
          <p className="text-lg text-slate-300 font-medium leading-relaxed max-w-md">
            AI-powered fault detection and predictive maintenance for your solar & wind assets.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-8 text-white mt-12 border-t border-white/20 pt-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur flex items-center justify-center">
              <Zap className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xs font-bold leading-tight">24/7<br/><span className="font-normal text-slate-300">Monitoring</span></div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xs font-bold leading-tight">Higher<br/><span className="font-normal text-slate-300">Reliability</span></div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur flex items-center justify-center">
              <Leaf className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xs font-bold leading-tight">Sustainable<br/><span className="font-normal text-slate-300">Energy Future</span></div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-[45%] flex flex-col justify-center items-center p-8 sm:p-12 lg:p-24 bg-white relative">
        <div className="w-full max-w-[400px]">
          
          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-3xl font-black text-slate-900 mb-2">Welcome Back</h2>
            <p className="text-sm font-medium text-slate-500">Sign in to your RenewGuard AI account</p>
          </div>

          <form onSubmit={handleSignIn} className="space-y-5">
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 ml-1">Email Address</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  required
                />
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-sm border border-slate-400 text-slate-400 flex items-center justify-center text-[10px] font-bold">@</div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 ml-1">Password</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  required
                />
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-sm border-2 border-slate-400 border-t-0 border-x-0 rounded-t-full mt-[-2px]"></div>
                <div className="absolute left-[18px] top-[14px] w-1 h-1 rounded-full bg-slate-400"></div>

                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" className="w-4 h-4 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500 focus:ring-offset-0 transition-colors" />
                <span className="text-xs font-bold text-slate-600 group-hover:text-slate-900 transition-colors">Remember me</span>
              </label>
            <a href="#" onClick={(e) => { e.preventDefault(); alert("Password reset email sent to " + email); }} className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors">Forgot password?</a>
          </div>

          <button 
            type="submit"
            className="w-full py-3.5 mt-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-xl shadow-emerald-900/10 transition-all flex items-center justify-center gap-2"
          >
            Sign In <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 flex items-center gap-4">
          <div className="h-px bg-slate-200 flex-1"></div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">or</span>
          <div className="h-px bg-slate-200 flex-1"></div>
        </div>

        <button 
          type="button"
          onClick={() => {
            localStorage.setItem('auth_token', 'mock_token');
            window.location.href = '/';
          }}
          className="w-full mt-6 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-sm"
        >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <p className="mt-10 text-center text-xs font-bold text-slate-500">
            Don't have an account? <Link to="/register" className="text-emerald-600 hover:text-emerald-700 transition-colors">Create one</Link>
          </p>
        </div>

        {/* Decorative Leaf Icon Bottom Right */}
        <div className="absolute bottom-8 right-8 hidden xl:flex flex-col items-center">
          <Leaf className="w-8 h-8 text-emerald-100 mb-2" />
          <div className="text-[9px] font-bold text-slate-400 text-center uppercase tracking-widest leading-relaxed">
            Renewable Energy<br/>Deserves Smarter Care
          </div>
        </div>
      </div>
      
    </div>
  );
};
