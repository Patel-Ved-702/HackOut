import React, { useState } from 'react';
import { Leaf, Zap, ShieldCheck, EyeOff, Eye, ArrowRight } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleRegister = (e: React.FormEvent) => {
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
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-transparent"></div>
        </div>

        <div className="relative z-10 flex items-center gap-2 mb-10">
          <Leaf className="w-8 h-8 text-emerald-400" />
          <div className="flex flex-col">
            <span className="text-xl font-black text-white leading-tight">RenewGuard <span className="text-emerald-400">AI</span></span>
            <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Predictive Maintenance</span>
          </div>
        </div>

        <div className="relative z-10 flex-1 flex flex-col justify-center max-w-lg">
          <h1 className="text-5xl font-black text-white leading-[1.1] mb-6">
            Join the Next Era of<br/>Energy Operations.
          </h1>
          <p className="text-lg text-slate-300 font-medium leading-relaxed max-w-md">
            Create an account to unify your fleet, detect microscopic anomalies, and eliminate unplanned downtime.
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
        </div>
      </div>

      {/* Right Panel - Register Form */}
      <div className="w-full lg:w-[45%] flex flex-col justify-center items-center p-8 sm:p-12 lg:p-16 bg-white relative overflow-y-auto">
        <div className="w-full max-w-[400px]">
          
          <div className="mb-8 text-center lg:text-left">
            <h2 className="text-3xl font-black text-slate-900 mb-2">Create Account</h2>
            <p className="text-sm font-medium text-slate-500">Sign up to get started with RenewGuard AI.</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            
            <div className="flex gap-4">
              <div className="space-y-1.5 flex-1">
                <label className="text-xs font-bold text-slate-700 ml-1">First Name</label>
                <input 
                  type="text" 
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="John"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-black text-sm placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  required
                />
              </div>
              <div className="space-y-1.5 flex-1">
                <label className="text-xs font-bold text-slate-700 ml-1">Last Name</label>
                <input 
                  type="text" 
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Doe"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-black text-sm placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 ml-1">Work Email</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-black text-sm placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
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
                  placeholder="Create a strong password"
                  className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 bg-slate-50 text-black text-sm placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  required
                  minLength={8}
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
              <p className="text-[10px] text-slate-500 font-medium ml-1">Must be at least 8 characters.</p>
            </div>

            <button 
              type="submit"
              className="w-full py-3.5 mt-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-xl shadow-emerald-900/10 transition-all flex items-center justify-center gap-2"
            >
              Create Account <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <p className="mt-8 text-center text-xs font-bold text-slate-500">
            Already have an account? <Link to="/login" className="text-emerald-600 hover:text-emerald-700 transition-colors">Sign in here</Link>
          </p>
        </div>

        {/* Decorative Leaf Icon Bottom Right */}
        <div className="absolute bottom-6 right-8 hidden xl:flex flex-col items-center">
          <Leaf className="w-8 h-8 text-emerald-100 mb-2" />
        </div>
      </div>
      
    </div>
  );
};
