import React from 'react';
import { ArrowRight, Play, CheckCircle2, Leaf, Sun, Wind, Activity, ShieldCheck, AlertCircle, Zap, ShieldAlert, Cpu } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Landing: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans relative overflow-hidden">
      {/* Background Image with Gradient Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src="/landing_bg.jpg" 
          alt="Solar and Wind Farm Sunrise" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/90 to-transparent"></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 w-full px-8 py-5 flex items-center justify-between border-b border-white/20">
        <div className="flex items-center gap-2">
          <Leaf className="w-8 h-8 text-emerald-600" />
          <div className="flex flex-col">
            <span className="text-xl font-black text-slate-900 leading-tight">RenewGuard <span className="text-emerald-600">AI</span></span>
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Predictive Maintenance</span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-600">
          <a href="#" className="text-emerald-600 border-b-2 border-emerald-600 pb-1">Home</a>
          <a href="#" className="hover:text-slate-900 transition-colors">Features</a>
          <a href="#" className="hover:text-slate-900 transition-colors">About</a>
          <a href="#" className="hover:text-slate-900 transition-colors">Contact</a>
        </div>

        <div className="flex items-center gap-4">
          <Link to="/login" className="px-5 py-2 rounded-full border border-slate-300 text-slate-700 font-bold text-sm hover:bg-slate-50 bg-white transition-colors">
            Login
          </Link>
          <Link to="/login" className="px-5 py-2 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm flex items-center gap-2 transition-colors shadow-lg shadow-emerald-900/20">
            Get Started <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </nav>

      {/* Main Hero Section */}
      <main className="relative z-10 flex-1 flex flex-col md:flex-row items-center w-full max-w-[1500px] mx-auto px-8 pt-12 pb-24">
        
        {/* Left Content */}
        <div className="w-full md:w-[55%] pr-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-bold mb-6">
            <Cpu className="w-3.5 h-3.5" />
            AI-Powered | Solar & Wind Assets
          </div>
          
          <h1 className="text-5xl lg:text-6xl font-black text-slate-900 leading-[1.1] mb-6 tracking-tight">
            Predictive Maintenance <br/>
            for <span className="text-emerald-700">Solar & Wind Assets</span>
          </h1>
          
          <p className="text-lg text-slate-600 mb-10 max-w-2xl font-medium leading-relaxed">
            Turn your asset data into actionable insights. RenewGuard AI uses advanced AI and machine learning to detect faults, predict failures, and keep your solar and wind assets running at peak performance.
          </p>

          {/* 4 Feature Columns */}
          <div className="grid grid-cols-4 gap-6 mb-10 border-b border-slate-200 pb-10">
            <div>
              <div className="w-8 h-8 rounded bg-emerald-100 flex items-center justify-center mb-3">
                <Activity className="w-4 h-4 text-emerald-700" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 mb-1">Fault Detection</h4>
              <p className="text-xs text-slate-500 font-medium">Detect anomalies early from sensor data</p>
            </div>
            <div>
              <div className="w-8 h-8 rounded bg-emerald-100 flex items-center justify-center mb-3">
                <Activity className="w-4 h-4 text-emerald-700" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 mb-1">Predictive Insights</h4>
              <p className="text-xs text-slate-500 font-medium">Forecast failures & reduce downtime</p>
            </div>
            <div>
              <div className="w-8 h-8 rounded bg-emerald-100 flex items-center justify-center mb-3">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 mb-1">Smart Maintenance</h4>
              <p className="text-xs text-slate-500 font-medium">Get actionable recommendations</p>
            </div>
            <div>
              <div className="w-8 h-8 rounded bg-emerald-100 flex items-center justify-center mb-3">
                <Zap className="w-4 h-4 text-emerald-700" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 mb-1">Higher Efficiency</h4>
              <p className="text-xs text-slate-500 font-medium">Maximize energy production</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/login" className="px-6 py-3.5 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm flex items-center gap-2 transition-colors shadow-xl shadow-emerald-900/20">
              Get Started Free <ArrowRight className="w-4 h-4" />
            </Link>
            <button 
              onClick={() => alert("Product Demo Video coming soon!")}
              className="px-6 py-3.5 rounded-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-sm flex items-center gap-2 transition-colors shadow-sm"
            >
              <Play className="w-4 h-4 text-emerald-600" /> Watch Demo
            </button>
          </div>
        </div>

        {/* Right Floating Widgets Overlay */}
        <div className="w-full md:w-[45%] relative h-[500px]">
          {/* Asset Health Overview Widget */}
          <div className="absolute top-0 left-0 bg-white/90 backdrop-blur-md border border-white p-5 rounded-2xl shadow-2xl w-[320px]">
            <h4 className="text-xs font-bold text-slate-800 mb-4">Asset Health Overview</h4>
            <div className="flex items-center gap-6">
              {/* Fake Donut */}
              <div className="relative w-24 h-24 rounded-full border-8 border-emerald-500 flex items-center justify-center">
                {/* Fake slices using borders - simplified for UI */}
                <div className="absolute inset-[-8px] rounded-full border-8 border-amber-400 border-t-transparent border-r-transparent border-b-transparent transform -rotate-45"></div>
                <div className="absolute inset-[-8px] rounded-full border-8 border-rose-500 border-t-transparent border-r-transparent border-l-transparent transform rotate-45" style={{clipPath: 'polygon(50% 50%, 100% 100%, 0% 100%)'}}></div>
                <div className="text-center">
                  <div className="text-xl font-black text-slate-900">248</div>
                  <div className="text-[8px] text-slate-500 font-bold uppercase">Total Assets</div>
                </div>
              </div>
              <div className="space-y-2 flex-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500"></div><span className="text-slate-600 font-medium">Healthy</span></div>
                  <div className="font-bold text-slate-900">196 <span className="text-slate-400 font-normal">(79.0%)</span></div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-400"></div><span className="text-slate-600 font-medium">Warning</span></div>
                  <div className="font-bold text-slate-900">34 <span className="text-slate-400 font-normal">(13.7%)</span></div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-rose-500"></div><span className="text-slate-600 font-medium">Critical</span></div>
                  <div className="font-bold text-slate-900">18 <span className="text-slate-400 font-normal">(7.3%)</span></div>
                </div>
              </div>
            </div>
          </div>

          {/* AI Detection Summary Widget */}
          <div className="absolute top-4 right-0 bg-white/90 backdrop-blur-md border border-white p-5 rounded-2xl shadow-2xl w-[260px]">
            <h4 className="text-xs font-bold text-slate-800 mb-4 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> AI Detection Summary
            </h4>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-slate-700" />
                </div>
                <div>
                  <div className="text-xl font-black text-slate-900">27</div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Anomalies Detected</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center">
                  <ShieldAlert className="w-5 h-5 text-rose-500" />
                </div>
                <div>
                  <div className="text-xl font-black text-slate-900">11</div>
                  <div className="text-[10px] font-bold text-rose-500 uppercase tracking-wide">High-Risk Assets</div>
                </div>
              </div>
            </div>
          </div>

          {/* Predicted Failures Widget */}
          <div className="absolute bottom-10 left-10 bg-white/90 backdrop-blur-md border border-white p-5 rounded-2xl shadow-2xl w-[280px]">
            <h4 className="text-xs font-bold text-slate-800 mb-3">Predicted Failures (Next 7 Days)</h4>
            <div className="space-y-2">
              {[
                { label: 'Inverter Overheating', count: 5, color: 'bg-rose-500', icon: AlertCircle },
                { label: 'Bearing Anomaly', count: 3, color: 'bg-orange-500', icon: Activity },
                { label: 'Output Degradation', count: 2, color: 'bg-amber-400', icon: Zap },
                { label: 'Vibration Anomaly', count: 1, color: 'bg-purple-500', icon: Activity },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between text-xs py-1">
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center text-white ${item.color}`}>
                      <item.icon className="w-2.5 h-2.5" />
                    </div>
                    <span className="font-medium text-slate-700">{item.label}</span>
                  </div>
                  <span className="font-bold text-slate-900">{item.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Trend Chart Widget (Mockup) */}
          <div className="absolute bottom-4 right-[-20px] bg-white/90 backdrop-blur-md border border-white p-4 rounded-2xl shadow-2xl w-[320px]">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-slate-800">Power Generation Trend</h4>
              <div className="flex gap-2 text-[9px] font-bold">
                <span className="text-amber-500 flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div> Solar</span>
                <span className="text-sky-500 flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-sky-500"></div> Wind</span>
              </div>
            </div>
            {/* SVG Mock Chart */}
            <div className="h-24 w-full relative">
              <svg viewBox="0 0 100 40" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                <path d="M0 30 Q 10 25, 20 28 T 40 20 T 60 25 T 80 15 T 100 20 L 100 40 L 0 40 Z" fill="#fef3c7" opacity="0.6"/>
                <path d="M0 30 Q 10 25, 20 28 T 40 20 T 60 25 T 80 15 T 100 20" fill="none" stroke="#f59e0b" strokeWidth="1.5"/>
                
                <path d="M0 20 Q 15 15, 30 25 T 50 15 T 70 20 T 90 10 T 100 15 L 100 40 L 0 40 Z" fill="#e0f2fe" opacity="0.6"/>
                <path d="M0 20 Q 15 15, 30 25 T 50 15 T 70 20 T 90 10 T 100 15" fill="none" stroke="#0ea5e9" strokeWidth="1.5"/>
              </svg>
              <div className="absolute bottom-[-10px] w-full flex justify-between text-[8px] text-slate-400 font-mono">
                <span>Sep 6</span><span>Sep 7</span><span>Sep 8</span><span>Sep 9</span><span>Sep 10</span><span>Sep 11</span><span>Sep 12</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Features Banner */}
      <div className="relative z-10 w-full bg-white/80 backdrop-blur-md border-t border-slate-200 mt-auto">
        <div className="max-w-[1500px] mx-auto px-8 py-5 flex items-center justify-between text-xs font-bold text-slate-700">
          <div className="flex items-center gap-3">
            <Leaf className="w-6 h-6 text-emerald-600" />
            <div>
              <div>Cleaner Energy.</div>
              <div>Smarter Maintenance.</div>
              <div className="text-emerald-700">A Sustainable Future.</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Sun className="w-5 h-5 text-emerald-600" /> Solar Farms & Panels
          </div>
          <div className="flex items-center gap-2">
            <Wind className="w-5 h-5 text-emerald-600" /> Wind Farms & Turbines
          </div>
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-600" /> Real-time Insights & Predictions
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" /> Improved Uptime & Lower Costs
          </div>
        </div>
      </div>
    </div>
  );
};
