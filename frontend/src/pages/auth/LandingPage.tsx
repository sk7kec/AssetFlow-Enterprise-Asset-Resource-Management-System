import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, ArrowRight, ShieldCheck, Zap, BarChart3, Database } from 'lucide-react';
import { motion } from 'framer-motion';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const features = [
    { title: 'Secure Audits', desc: 'Verify physical inventory logs with instant discrepancy analytics.', icon: ShieldCheck },
    { title: 'Real-time Allocations', desc: 'Track asset status, conditions, and transfer paths automatically.', icon: Zap },
    { title: 'Depreciation Valuation', desc: 'Predict asset valuation using linear or declining methods.', icon: BarChart3 },
    { title: 'MongoDB Infrastructure', desc: 'Secure document stores built on Atlas cloud clusters.', icon: Database },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-indigo-500/30 selection:text-white relative overflow-hidden select-none">
      {/* Top Banner Orb */}
      <div className="absolute top-[-30%] left-1/2 -translate-x-1/2 w-[70vw] h-[50vh] bg-indigo-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Navbar */}
      <header className="h-16 max-w-7xl mx-auto w-full flex items-center justify-between px-6 z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
            <Box className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-bold text-base text-white">AssetFlow</span>
        </div>
        <button
          onClick={() => navigate('/login')}
          className="px-4 py-1.5 rounded-xl border border-slate-800 text-xs font-semibold hover:border-slate-600 transition-all hover:bg-slate-900 cursor-pointer"
        >
          Sign In
        </button>
      </header>

      {/* Hero Body */}
      <main className="flex-1 flex flex-col justify-center max-w-7xl mx-auto px-6 py-12 z-10 w-full">
        <div className="grid lg:grid-cols-5 gap-12 items-center">
          <div className="lg:col-span-3 space-y-6">
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-400 font-display uppercase tracking-wider"
            >
              Enterprise Resource Controller v1.0
            </motion.span>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl sm:text-6xl font-display font-extrabold tracking-tight leading-[1.05] text-white"
            >
              The Modern Asset Lifecycle Manager.
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-base text-slate-400 max-w-xl leading-relaxed"
            >
              Unified asset registrations, barcodes, room calendars, employee transfers, and audit logs. Built for modern fast-growing teams.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap items-center gap-4 pt-4"
            >
              <button
                onClick={() => navigate('/login')}
                className="px-6 py-3 rounded-2xl bg-indigo-500 hover:bg-indigo-600 font-semibold text-xs text-white shadow-lg shadow-indigo-500/20 flex items-center gap-1.5 transition-all cursor-pointer hover:shadow-xl hover:shadow-indigo-500/30"
              >
                <span>Enter Portal</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => navigate('/signup')}
                className="px-6 py-3 rounded-2xl border border-slate-800 hover:border-slate-600 font-semibold text-xs text-slate-300 hover:text-white transition-all cursor-pointer"
              >
                Create Account
              </button>
            </motion.div>
          </div>

          {/* Feature highlights grid */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            {features.map((feat, idx) => {
              const FeatIcon = feat.icon;
              return (
                <div key={idx} className="p-5 border border-slate-900 bg-slate-900/40 rounded-2xl space-y-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                    <FeatIcon className="w-4 h-4" />
                  </div>
                  <h3 className="font-display font-semibold text-xs text-white">{feat.title}</h3>
                  <p className="text-[11px] text-slate-500 leading-normal">{feat.desc}</p>
                </div>
              );
            })}
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-slate-900/80 bg-slate-950 text-center text-xs text-slate-600 z-10 w-full">
        <span>&copy; {new Date().getFullYear()} AssetFlow Enterprise. Powered by React + FastAPI + MongoDB.</span>
      </footer>
    </div>
  );
};
