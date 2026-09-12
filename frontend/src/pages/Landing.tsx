import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, Play, CheckCircle2, Leaf, Sun, Wind, Activity, ShieldCheck, 
  AlertCircle, Zap, ShieldAlert, Cpu, Mail, Phone, MapPin, Clock, Send, 
  Check, Layers, TrendingUp, BarChart3, Sliders, Wrench, Sparkles, 
  CheckCircle, Server, HelpCircle, Users, Target
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const Landing: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'home' | 'features' | 'about' | 'contact'>('home');
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    company: '',
    assetType: 'all',
    message: ''
  });

  // Smooth scroll helper that accounts for sticky navbar height
  const scrollToSection = (id: 'home' | 'features' | 'about' | 'contact') => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      const navHeight = 80;
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
      window.scrollTo({
        top: id === 'home' ? 0 : elementPosition - navHeight,
        behavior: 'smooth'
      });
    }
  };

  // Update active section on scroll
  useEffect(() => {
    const handleScroll = () => {
      const sections: ('home' | 'features' | 'about' | 'contact')[] = ['home', 'features', 'about', 'contact'];
      const scrollPosition = window.scrollY + 120;

      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactSubmitted(true);
    setTimeout(() => {
      setContactForm({ name: '', email: '', company: '', assetType: 'all', message: '' });
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans relative">
      
      {/* Sticky Navigation Bar - Stays pinned at top while scrolling */}
      <nav className="sticky top-0 z-50 w-full px-6 lg:px-12 py-4 flex items-center justify-between bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-sm transition-all">
        <button 
          onClick={() => scrollToSection('home')}
          className="flex items-center gap-2.5 text-left focus:outline-none group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Leaf className="w-6 h-6 text-emerald-600" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-black text-slate-900 tracking-tight leading-tight">
              RenewGuard <span className="text-emerald-600">AI</span>
            </span>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
              Predictive Maintenance
            </span>
          </div>
        </button>

        {/* Navigation Tabs */}
        <div className="hidden md:flex items-center gap-8 text-sm font-bold">
          <button 
            onClick={() => scrollToSection('home')} 
            className={`pb-1 transition-all ${
              activeSection === 'home' 
                ? 'text-emerald-700 border-b-2 border-emerald-600' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Home
          </button>
          <button 
            onClick={() => scrollToSection('features')} 
            className={`pb-1 transition-all ${
              activeSection === 'features' 
                ? 'text-emerald-700 border-b-2 border-emerald-600' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Features
          </button>
          <button 
            onClick={() => scrollToSection('about')} 
            className={`pb-1 transition-all ${
              activeSection === 'about' 
                ? 'text-emerald-700 border-b-2 border-emerald-600' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            About
          </button>
          <button 
            onClick={() => scrollToSection('contact')} 
            className={`pb-1 transition-all ${
              activeSection === 'contact' 
                ? 'text-emerald-700 border-b-2 border-emerald-600' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Contact
          </button>
        </div>

        {/* CTA Buttons */}
        <div className="flex items-center gap-3">
          <Link 
            to="/login" 
            className="px-5 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 bg-white transition-colors shadow-sm"
          >
            Login
          </Link>
          <Link 
            to="/login" 
            className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm flex items-center gap-2 transition-all shadow-lg shadow-emerald-900/10 hover:shadow-emerald-900/20"
          >
            Get Started <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </nav>

      {/* ------------------- SECTION 1: HOME (HERO) ------------------- */}
      <section id="home" className="relative min-h-[calc(100vh-73px)] flex flex-col justify-between overflow-hidden">
        {/* Hero Background Image with Gradient Overlay */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <img 
            src="/landing_bg.jpg" 
            alt="Solar and Wind Farm Sunrise" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/95 lg:via-white/90 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-50"></div>
        </div>

        {/* Main Hero Content */}
        <div className="relative z-10 flex-1 flex flex-col lg:flex-row items-center w-full max-w-[1500px] mx-auto px-6 lg:px-12 pt-10 pb-16">
          
          {/* Left Hero Content */}
          <div className="w-full lg:w-[54%] lg:pr-12 mb-12 lg:mb-0">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold mb-6 shadow-sm">
              <Cpu className="w-3.5 h-3.5 text-emerald-600" />
              AI-Powered | Solar & Wind Assets
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 leading-[1.1] mb-6 tracking-tight">
              Predictive Maintenance <br/>
              for <span className="text-emerald-700">Solar & Wind Assets</span>
            </h1>
            
            <p className="text-base sm:text-lg text-slate-600 mb-8 max-w-2xl font-medium leading-relaxed">
              Turn raw IoT sensor telemetry into actionable operational intelligence. RenewGuard AI uses multivariate machine learning and grounded physics to detect anomalies early, quantify revenue risk, and dispatch field technicians before failure.
            </p>

            {/* 4 Feature Highlights */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8 border-y border-slate-200/80 py-6 bg-white/40 backdrop-blur-xs rounded-xl px-2">
              <div>
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center mb-2">
                  <Activity className="w-4 h-4 text-emerald-700" />
                </div>
                <h4 className="text-xs font-bold text-slate-900 mb-0.5">Fault Detection</h4>
                <p className="text-[11px] text-slate-500 font-medium">Detect anomalies early from sensor data</p>
              </div>
              <div>
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center mb-2">
                  <TrendingUp className="w-4 h-4 text-emerald-700" />
                </div>
                <h4 className="text-xs font-bold text-slate-900 mb-0.5">Predictive Insights</h4>
                <p className="text-[11px] text-slate-500 font-medium">Forecast failures & reduce downtime</p>
              </div>
              <div>
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center mb-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                </div>
                <h4 className="text-xs font-bold text-slate-900 mb-0.5">Smart Maintenance</h4>
                <p className="text-[11px] text-slate-500 font-medium">Get actionable recommendations</p>
              </div>
              <div>
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center mb-2">
                  <Zap className="w-4 h-4 text-emerald-700" />
                </div>
                <h4 className="text-xs font-bold text-slate-900 mb-0.5">Higher Efficiency</h4>
                <p className="text-[11px] text-slate-500 font-medium">Maximize energy production</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-4">
              <Link 
                to="/login" 
                className="px-6 py-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm flex items-center gap-2 transition-all shadow-xl shadow-emerald-900/20 hover:scale-[1.02]"
              >
                Get Started Free <ArrowRight className="w-4 h-4" />
              </Link>
              <button 
                onClick={() => scrollToSection('features')}
                className="px-6 py-3.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 font-bold text-sm flex items-center gap-2 transition-colors shadow-sm"
              >
                <Layers className="w-4 h-4 text-emerald-600" /> Explore Features
              </button>
            </div>
          </div>

          {/* Right Floating Dashboard Preview Widgets */}
          <div className="w-full lg:w-[46%] relative h-[480px] sm:h-[500px]">
            {/* Asset Health Overview Widget */}
            <div className="absolute top-0 left-0 bg-white/95 backdrop-blur-md border border-white p-5 rounded-2xl shadow-xl w-[290px] sm:w-[320px] transition-transform hover:-translate-y-1 duration-300">
              <h4 className="text-xs font-bold text-slate-800 mb-4 flex items-center justify-between">
                <span>Asset Health Overview</span>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Live Edge</span>
              </h4>
              <div className="flex items-center gap-5">
                <div className="relative w-20 h-20 rounded-full border-8 border-emerald-500 flex items-center justify-center shrink-0">
                  <div className="absolute inset-[-8px] rounded-full border-8 border-amber-400 border-t-transparent border-r-transparent border-b-transparent transform -rotate-45"></div>
                  <div className="absolute inset-[-8px] rounded-full border-8 border-rose-500 border-t-transparent border-r-transparent border-l-transparent transform rotate-45" style={{clipPath: 'polygon(50% 50%, 100% 100%, 0% 100%)'}}></div>
                  <div className="text-center">
                    <div className="text-lg font-black text-slate-900 leading-none">248</div>
                    <div className="text-[7px] text-slate-500 font-bold uppercase mt-0.5">Total Assets</div>
                  </div>
                </div>
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500"></div><span className="text-slate-600 font-medium">Healthy</span></div>
                    <div className="font-bold text-slate-900">196 <span className="text-slate-400 font-normal text-[10px]">(79%)</span></div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-400"></div><span className="text-slate-600 font-medium">Warning</span></div>
                    <div className="font-bold text-slate-900">34 <span className="text-slate-400 font-normal text-[10px]">(14%)</span></div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-rose-500"></div><span className="text-slate-600 font-medium">Critical</span></div>
                    <div className="font-bold text-slate-900">18 <span className="text-slate-400 font-normal text-[10px]">(7%)</span></div>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Detection Summary Widget */}
            <div className="absolute top-4 right-0 bg-white/95 backdrop-blur-md border border-white p-5 rounded-2xl shadow-xl w-[240px] sm:w-[260px] transition-transform hover:-translate-y-1 duration-300">
              <h4 className="text-xs font-bold text-slate-800 mb-3.5 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> AI Detection Summary
              </h4>
              <div className="space-y-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">
                    <Activity className="w-4 h-4 text-slate-700" />
                  </div>
                  <div>
                    <div className="text-xl font-black text-slate-900 leading-none">27</div>
                    <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wide mt-0.5">Anomalies Detected</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center">
                    <ShieldAlert className="w-4 h-4 text-rose-500" />
                  </div>
                  <div>
                    <div className="text-xl font-black text-slate-900 leading-none">11</div>
                    <div className="text-[9px] font-bold text-rose-500 uppercase tracking-wide mt-0.5">High-Risk Assets</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Predicted Failures Widget */}
            <div className="absolute bottom-8 left-4 sm:left-8 bg-white/95 backdrop-blur-md border border-white p-4 sm:p-5 rounded-2xl shadow-xl w-[260px] sm:w-[280px] transition-transform hover:-translate-y-1 duration-300">
              <h4 className="text-xs font-bold text-slate-800 mb-2.5">Predicted Failures (7-Day)</h4>
              <div className="space-y-1.5">
                {[
                  { label: 'Inverter Overheating', count: 5, color: 'bg-rose-500', icon: AlertCircle },
                  { label: 'Bearing Vibration Anomaly', count: 3, color: 'bg-orange-500', icon: Activity },
                  { label: 'Output Degradation', count: 2, color: 'bg-amber-400', icon: Zap },
                  { label: 'Thermal Sensor Spike', count: 1, color: 'bg-purple-500', icon: Activity },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-xs py-0.5">
                    <div className="flex items-center gap-2 truncate pr-2">
                      <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-white shrink-0 ${item.color}`}>
                        <item.icon className="w-2 h-2" />
                      </div>
                      <span className="font-medium text-slate-700 truncate">{item.label}</span>
                    </div>
                    <span className="font-bold text-slate-900">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Trend Chart Widget */}
            <div className="absolute bottom-2 right-[-10px] sm:right-0 bg-white/95 backdrop-blur-md border border-white p-4 rounded-2xl shadow-xl w-[280px] sm:w-[310px] transition-transform hover:-translate-y-1 duration-300">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-slate-800">Power Generation Trend</h4>
                <div className="flex gap-2 text-[8px] font-bold">
                  <span className="text-amber-500 flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div> Solar</span>
                  <span className="text-sky-500 flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-sky-500"></div> Wind</span>
                </div>
              </div>
              <div className="h-20 w-full relative">
                <svg viewBox="0 0 100 40" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                  <path d="M0 30 Q 10 25, 20 28 T 40 20 T 60 25 T 80 15 T 100 20 L 100 40 L 0 40 Z" fill="#fef3c7" opacity="0.6"/>
                  <path d="M0 30 Q 10 25, 20 28 T 40 20 T 60 25 T 80 15 T 100 20" fill="none" stroke="#f59e0b" strokeWidth="1.5"/>
                  <path d="M0 20 Q 15 15, 30 25 T 50 15 T 70 20 T 90 10 T 100 15 L 100 40 L 0 40 Z" fill="#e0f2fe" opacity="0.6"/>
                  <path d="M0 20 Q 15 15, 30 25 T 50 15 T 70 20 T 90 10 T 100 15" fill="none" stroke="#0ea5e9" strokeWidth="1.5"/>
                </svg>
                <div className="absolute bottom-[-6px] w-full flex justify-between text-[7px] text-slate-400 font-mono">
                  <span>Day 1</span><span>Day 2</span><span>Day 3</span><span>Day 4</span><span>Day 5</span><span>Day 6</span><span>Live</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Banner */}
        <div className="relative z-10 w-full bg-white/80 backdrop-blur-md border-t border-slate-200">
          <div className="max-w-[1500px] mx-auto px-6 lg:px-12 py-4 flex flex-wrap items-center justify-between gap-4 text-xs font-bold text-slate-700">
            <div className="flex items-center gap-3">
              <Leaf className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <span>Cleaner Energy. Smarter Maintenance. </span>
                <span className="text-emerald-700 font-extrabold">Zero Hallucinations.</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Sun className="w-4 h-4 text-emerald-600" /> Solar Farms & Panels
            </div>
            <div className="flex items-center gap-2">
              <Wind className="w-4 h-4 text-emerald-600" /> Wind Turbines
            </div>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-600" /> Real-time Anomaly Engine
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> 99.4% Uptime Target
            </div>
          </div>
        </div>
      </section>

      {/* ------------------- SECTION 2: FEATURES ------------------- */}
      <section id="features" className="py-24 bg-white border-t border-slate-200 scroll-mt-16">
        <div className="max-w-[1500px] mx-auto px-6 lg:px-12">
          
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-bold mb-4">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              Comprehensive Platform Capabilities
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-4">
              Engineered for Zero-Hallucination <br className="hidden sm:inline" />
              <span className="text-emerald-700">Predictive Intelligence</span>
            </h2>
            <p className="text-slate-600 text-base font-medium leading-relaxed">
              Unlike generic ML dashboards or hallucinating LLMs, RenewGuard AI pairs unsupervised multivariate algorithms with grounded physics to deliver verifiable, auditable maintenance intelligence.
            </p>
          </div>

          {/* 6 Grid Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
            
            {/* Feature 1 */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-7 hover:bg-white hover:shadow-xl hover:border-emerald-200 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-emerald-100/80 text-emerald-700 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-slate-900 mb-2">Multivariate Isolation Forest ML</h3>
              <p className="text-sm text-slate-600 font-medium leading-relaxed mb-4">
                Simultaneously evaluates operating temperature, vibration harmonics, output current, and expected power against dynamic environmental baselines.
              </p>
              <div className="flex flex-wrap gap-1.5 text-[11px] font-bold">
                <span className="px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-600">Coupled Vectors</span>
                <span className="px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-600">Unsupervised</span>
                <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">Pre-failure Warning</span>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-7 hover:bg-white hover:shadow-xl hover:border-emerald-200 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-sky-100/80 text-sky-700 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-slate-900 mb-2">Deterministic Root-Cause Evidence</h3>
              <p className="text-sm text-slate-600 font-medium leading-relaxed mb-4">
                Zero hallucinated diagnoses. Every flagged asset produces transparent, quantitative evidence cards showing exact delta percentage vs rolling 24-hour baselines.
              </p>
              <div className="flex flex-wrap gap-1.5 text-[11px] font-bold">
                <span className="px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-600">Auditable Proof</span>
                <span className="px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-600">Delta Metrics</span>
                <span className="px-2.5 py-1 rounded-md bg-sky-50 text-sky-700 border border-sky-200">Zero Fabrications</span>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-7 hover:bg-white hover:shadow-xl hover:border-emerald-200 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-amber-100/80 text-amber-700 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Sliders className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-slate-900 mb-2">Configurable Financial Risk Engine</h3>
              <p className="text-sm text-slate-600 font-medium leading-relaxed mb-4">
                Operators can dynamically adjust local power tariffs ($/kWh) to instantly view projected hourly and daily generation revenue loss from degradation.
              </p>
              <div className="flex flex-wrap gap-1.5 text-[11px] font-bold">
                <span className="px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-600">Dynamic Tariff Slider</span>
                <span className="px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-600">Deficit kW</span>
                <span className="px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 border border-amber-200">ROI-Driven</span>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-7 hover:bg-white hover:shadow-xl hover:border-emerald-200 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-rose-100/80 text-rose-700 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-slate-900 mb-2">Automated Priority Queue</h3>
              <p className="text-sm text-slate-600 font-medium leading-relaxed mb-4">
                Ranks all maintenance requests with multi-factor scoring factoring in risk score, anomaly persistence count, and megawatt capacity.
              </p>
              <div className="flex flex-wrap gap-1.5 text-[11px] font-bold">
                <span className="px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-600">Ranked Escalation</span>
                <span className="px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-600">Persistence Gate</span>
                <span className="px-2.5 py-1 rounded-md bg-rose-50 text-rose-700 border border-rose-200">Noisy-Spike Filter</span>
              </div>
            </div>

            {/* Feature 5 */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-7 hover:bg-white hover:shadow-xl hover:border-emerald-200 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-purple-100/80 text-purple-700 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Wrench className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-slate-900 mb-2">Field Technician Workspace</h3>
              <p className="text-sm text-slate-600 font-medium leading-relaxed mb-4">
                Mobile-optimized task management for field engineers to review work orders, start on-site inspections, log remediation actions, and close tickets.
              </p>
              <div className="flex flex-wrap gap-1.5 text-[11px] font-bold">
                <span className="px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-600">Mobile-First</span>
                <span className="px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-600">Remediation Logs</span>
                <span className="px-2.5 py-1 rounded-md bg-purple-50 text-purple-700 border border-purple-200">1-Click Closeout</span>
              </div>
            </div>

            {/* Feature 6 */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-7 hover:bg-white hover:shadow-xl hover:border-emerald-200 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-teal-100/80 text-teal-700 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-slate-900 mb-2">Live IoT & Batch CSV Telemetry</h3>
              <p className="text-sm text-slate-600 font-medium leading-relaxed mb-4">
                Ingest continuous real-time sensor streams via REST API or drop in large historical CSV telemetry files with instant parsing, validation, and diagnostics.
              </p>
              <div className="flex flex-wrap gap-1.5 text-[11px] font-bold">
                <span className="px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-600">REST Ingestion</span>
                <span className="px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-600">CSV Drag & Drop</span>
                <span className="px-2.5 py-1 rounded-md bg-teal-50 text-teal-700 border border-teal-200">Schema Validation</span>
              </div>
            </div>

          </div>

          {/* Workflow Pipeline Callout */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden">
            <div className="relative z-10 max-w-4xl">
              <div className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-2">End-to-End Operational Pipeline</div>
              <h3 className="text-2xl sm:text-3xl font-black mb-6">How RenewGuard AI Detects and Resolves Failures</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/10">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 font-black text-sm flex items-center justify-center mb-3">1</div>
                  <h4 className="font-bold text-sm text-white mb-1">Telemetry Ingestion</h4>
                  <p className="text-xs text-slate-300 font-medium">Sensors stream vibration, temp, soiling, and power data into FastAPI.</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/10">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 font-black text-sm flex items-center justify-center mb-3">2</div>
                  <h4 className="font-bold text-sm text-white mb-1">Coupled ML Inference</h4>
                  <p className="text-xs text-slate-300 font-medium">Isolation Forest flags multi-sensor anomalies against dynamic baselines.</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/10">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 font-black text-sm flex items-center justify-center mb-3">3</div>
                  <h4 className="font-bold text-sm text-white mb-1">Financial Impact Assessment</h4>
                  <p className="text-xs text-slate-300 font-medium">Deficit kW multiplied by custom power tariff to quantify revenue at risk.</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/10">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 font-black text-sm flex items-center justify-center mb-3">4</div>
                  <h4 className="font-bold text-sm text-white mb-1">Technician Remediation</h4>
                  <p className="text-xs text-slate-300 font-medium">Prioritized work orders dispatched to technician workspace for rapid field fix.</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ------------------- SECTION 3: ABOUT ------------------- */}
      <section id="about" className="py-24 bg-slate-50 border-t border-slate-200 scroll-mt-16">
        <div className="max-w-[1500px] mx-auto px-6 lg:px-12">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column: Story & Philosophy */}
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-bold mb-4">
                <Leaf className="w-3.5 h-3.5 text-emerald-600" />
                About RenewGuard AI
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-6">
                Protecting Clean Energy Infrastructure with <span className="text-emerald-700">Verifiable Physics</span>
              </h2>
              <p className="text-slate-600 text-base font-medium leading-relaxed mb-6">
                Renewable power generation is inherently variable. Solar inverters throttle under thermal strain, wind turbine bearings wear down in harsh gusts, and dusty solar panels quietly suffer soiling losses. Traditional SCADA alarms only sound when a component has already failed—costing millions in emergency replacements and lost clean megawatts.
              </p>
              <p className="text-slate-600 text-base font-medium leading-relaxed mb-8">
                RenewGuard AI was built for HackOut'26 to solve this exact problem: bridging the gap between raw IoT sensor data and operational decision-making with zero hallucinations, dynamic financial assessments, and closed-loop technician dispatch.
              </p>

              {/* 3 Core Pillars */}
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 mb-1">Grounded Zero-Hallucination AI</h4>
                    <p className="text-xs text-slate-600 font-medium leading-relaxed">
                      We never fabricate unverifiable component diagnoses. Every alert is paired with measurable delta readings against rolling statistical baselines.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
                  <div className="w-10 h-10 rounded-lg bg-sky-50 border border-sky-100 flex items-center justify-center shrink-0">
                    <Target className="w-5 h-5 text-sky-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 mb-1">Real-World Economic Transparency</h4>
                    <p className="text-xs text-slate-600 font-medium leading-relaxed">
                      Maintenance prioritization is tied directly to plant economics. Plant managers can configure active energy tariffs to evaluate revenue saved by preventative action.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
                  <div className="w-10 h-10 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 mb-1">Unified Fleet & Field Collaboration</h4>
                    <p className="text-xs text-slate-600 font-medium leading-relaxed">
                      Provides instant role-switching between Central Control Room Operators and Field Technicians, ensuring accountability from first alert to final work-order sign-off.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Key Stats & Metric Highlights */}
            <div className="lg:col-span-5 space-y-6">
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <div className="text-3xl sm:text-4xl font-black text-emerald-600 mb-1">99.4%</div>
                  <div className="text-xs font-bold text-slate-900 mb-1">Target Availability</div>
                  <div className="text-[11px] text-slate-500 font-medium">Maximizing green power output year-round.</div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <div className="text-3xl sm:text-4xl font-black text-emerald-600 mb-1">35%</div>
                  <div className="text-xs font-bold text-slate-900 mb-1">O&M Cost Reduction</div>
                  <div className="text-[11px] text-slate-500 font-medium">Slashing unplanned catastrophic repairs.</div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <div className="text-3xl sm:text-4xl font-black text-emerald-600 mb-1">&lt; 15s</div>
                  <div className="text-xs font-bold text-slate-900 mb-1">Edge Inference Latency</div>
                  <div className="text-[11px] text-slate-500 font-medium">Instant anomaly detection on new telemetry.</div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <div className="text-3xl sm:text-4xl font-black text-emerald-600 mb-1">100%</div>
                  <div className="text-xs font-bold text-slate-900 mb-1">Verifiable Evidence</div>
                  <div className="text-[11px] text-slate-500 font-medium">Auditable math behind every flagged asset.</div>
                </div>
              </div>

              {/* Quote Card */}
              <div className="bg-emerald-900 text-white rounded-2xl p-6 shadow-lg border border-emerald-800 relative">
                <div className="text-emerald-400 font-serif text-3xl leading-none mb-2">“</div>
                <p className="text-sm font-medium text-emerald-100 italic leading-relaxed mb-4">
                  Our mission is to guarantee that every kilowatt produced by solar panels and wind turbines safely reaches the grid without avoidable equipment downtime.
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-700 flex items-center justify-center font-bold text-xs text-white">
                    RG
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">RenewGuard Engineering Team</div>
                    <div className="text-[10px] text-emerald-300 font-medium">Built for HackOut '26</div>
                  </div>
                </div>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* ------------------- SECTION 4: CONTACT ------------------- */}
      <section id="contact" className="py-24 bg-white border-t border-slate-200 scroll-mt-16">
        <div className="max-w-[1500px] mx-auto px-6 lg:px-12">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-bold mb-4">
              <Mail className="w-3.5 h-3.5 text-emerald-600" />
              Get in Touch with Our Team
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-4">
              Connect with RenewGuard <span className="text-emerald-700">Specialists</span>
            </h2>
            <p className="text-slate-600 text-base font-medium leading-relaxed">
              Have questions about integrating RenewGuard AI with your SCADA system, scheduling a live demo, or requesting custom enterprise telemetry support? We’re here to help.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* Contact Details Cards (Left Column) */}
            <div className="lg:col-span-5 space-y-4">
              
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 mb-1">Email Support & Sales</h4>
                  <p className="text-xs text-slate-500 font-medium mb-2">Our technical team responds in under 2 hours.</p>
                  <a href="mailto:support@renewguard.io" className="text-sm font-bold text-emerald-700 hover:underline block">
                    support@renewguard.io
                  </a>
                  <a href="mailto:partnerships@renewguard.io" className="text-xs font-semibold text-slate-600 hover:underline block mt-0.5">
                    partnerships@renewguard.io
                  </a>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 mb-1">Operations & Dispatch Hotline</h4>
                  <p className="text-xs text-slate-500 font-medium mb-2">24/7 dedicated support for critical plant alerts.</p>
                  <span className="text-sm font-bold text-slate-900 block font-mono">
                    +1 (800) 555-RNWG <span className="text-xs font-normal text-slate-500">(7694)</span>
                  </span>
                  <span className="text-xs font-semibold text-slate-500 block mt-0.5">
                    Toll-Free | Global Operation Centers
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 mb-1">Engineering Headquarters</h4>
                  <p className="text-xs text-slate-500 font-medium mb-1">RenewGuard Energy Intelligence Labs</p>
                  <p className="text-xs font-semibold text-slate-700">
                    CleanTech Innovation Park, Suite 400<br />
                    100 Sustainable Way, San Francisco, CA
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 mb-1">System Status & Hours</h4>
                  <p className="text-xs text-slate-500 font-medium mb-2">Predictive analytics engine is active 24/7/365.</p>
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    All Edge Systems Operational
                  </div>
                </div>
              </div>

            </div>

            {/* Interactive Contact Form (Right Column) */}
            <div className="lg:col-span-7">
              <div className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-10 shadow-lg relative">
                
                {contactSubmitted ? (
                  <div className="py-16 text-center">
                    <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4 animate-bounce">
                      <Check className="w-8 h-8" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 mb-2">Message Received!</h3>
                    <p className="text-sm font-medium text-slate-600 max-w-md mx-auto mb-6">
                      Thank you for reaching out. A RenewGuard technical specialist has been notified and will respond to your inquiry shortly.
                    </p>
                    <button
                      onClick={() => setContactSubmitted(false)}
                      className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm transition-colors"
                    >
                      Send Another Message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleContactSubmit} className="space-y-5">
                    <div className="mb-2">
                      <h3 className="text-xl font-black text-slate-900 tracking-tight">Send Us a Direct Message</h3>
                      <p className="text-xs text-slate-500 font-medium mt-1">
                        Fill out the details below and we will tailor our response to your specific fleet requirements.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          Your Name <span className="text-rose-500">*</span>
                        </label>
                        <input 
                          type="text" 
                          required
                          placeholder="Jane Doe"
                          value={contactForm.name}
                          onChange={e => setContactForm({ ...contactForm, name: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm font-medium transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          Work Email <span className="text-rose-500">*</span>
                        </label>
                        <input 
                          type="email" 
                          required
                          placeholder="jane@cleanenergy.com"
                          value={contactForm.email}
                          onChange={e => setContactForm({ ...contactForm, email: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm font-medium transition-all"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          Organization / Plant
                        </label>
                        <input 
                          type="text" 
                          placeholder="Solaria Energy Corp"
                          value={contactForm.company}
                          onChange={e => setContactForm({ ...contactForm, company: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm font-medium transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          Asset Fleet Focus
                        </label>
                        <select 
                          value={contactForm.assetType}
                          onChange={e => setContactForm({ ...contactForm, assetType: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm font-medium text-slate-700 transition-all cursor-pointer"
                        >
                          <option value="all">Solar & Wind Hybrid Fleet</option>
                          <option value="wind">Wind Turbines Exclusively</option>
                          <option value="solar">Solar Inverters & Panels Exclusively</option>
                          <option value="battery">Energy Storage (BESS)</option>
                          <option value="other">Other Renewable Assets</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Your Message or Inquiry <span className="text-rose-500">*</span>
                      </label>
                      <textarea 
                        rows={4}
                        required
                        placeholder="Tell us about your monitoring requirements, fleet capacity, or question..."
                        value={contactForm.message}
                        onChange={e => setContactForm({ ...contactForm, message: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm font-medium transition-all resize-none"
                      />
                    </div>

                    <button 
                      type="submit"
                      className="w-full py-3.5 px-6 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-900/10 hover:shadow-emerald-900/20 cursor-pointer"
                    >
                      <Send className="w-4 h-4" /> Send Message
                    </button>
                    <p className="text-[11px] text-slate-400 text-center font-medium">
                      🔒 Your information is private and will only be used to answer your inquiry.
                    </p>
                  </form>
                )}

              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ------------------- FOOTER ------------------- */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-[1500px] mx-auto px-6 lg:px-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-800 flex items-center justify-center">
                <Leaf className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <div className="text-lg font-black text-white leading-tight">
                  RenewGuard <span className="text-emerald-400">AI</span>
                </div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Predictive Maintenance for Solar & Wind Assets
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-sm font-bold text-slate-300">
              <button onClick={() => scrollToSection('home')} className="hover:text-emerald-400 transition-colors">Home</button>
              <button onClick={() => scrollToSection('features')} className="hover:text-emerald-400 transition-colors">Features</button>
              <button onClick={() => scrollToSection('about')} className="hover:text-emerald-400 transition-colors">About</button>
              <button onClick={() => scrollToSection('contact')} className="hover:text-emerald-400 transition-colors">Contact</button>
              <Link to="/login" className="text-emerald-400 hover:text-emerald-300 transition-colors">Portal Login</Link>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-medium">
            <div>
              © 2026 RenewGuard AI. Built for HackOut'26. All rights reserved.
            </div>
            <div className="flex items-center gap-4">
              <span>Zero-Hallucination Machine Learning</span>
              <span>•</span>
              <span className="text-emerald-400">System Online</span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
};
