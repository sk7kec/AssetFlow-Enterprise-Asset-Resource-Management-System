import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { motion } from 'framer-motion';
import { Box, Moon, Sun } from 'lucide-react';

export const AuthLayout: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-slate-950 overflow-hidden px-4">
      {/* Background Gradient Orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse-slow"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse-slow"></div>

      {/* Theme Toggle Button */}
      <button
        onClick={toggleTheme}
        className="absolute top-6 right-6 p-2 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-slate-100 hover:bg-slate-900 transition-all cursor-pointer"
        aria-label="Toggle Theme"
      >
        {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>

      {/* Main Container */}
      <div className="w-full max-w-[1200px] grid md:grid-cols-2 gap-8 items-center z-10">
        
        {/* Left Side: Branding / Intro Card */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="hidden md:flex flex-col text-slate-100 pr-8"
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-cyan-500 shadow-lg shadow-indigo-500/20">
              <Box className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-display font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              AssetFlow
            </span>
          </div>

          <h1 className="mt-8 text-4xl font-display font-extrabold tracking-tight leading-[1.1] text-white">
            Enterprise Resource & Asset Management
          </h1>
          
          <p className="mt-4 text-base text-slate-400 leading-relaxed max-w-md">
            Seamlessly register, audit, allocate, track, and maintain organization assets with high-end security and compliance.
          </p>

          <div className="mt-12 grid grid-cols-2 gap-6 border-t border-slate-900 pt-8">
            <div>
              <h3 className="text-2xl font-bold font-display text-indigo-400">100%</h3>
              <p className="text-sm text-slate-500 mt-1">Real-time Asset Tracking</p>
            </div>
            <div>
              <h3 className="text-2xl font-bold font-display text-cyan-400">Automated</h3>
              <p className="text-sm text-slate-500 mt-1">QR & Barcode Lifecycles</p>
            </div>
          </div>
        </motion.div>

        {/* Right Side: Auth Form Container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="w-full max-w-md mx-auto"
        >
          <div className="relative glass-panel rounded-3xl p-8 border border-slate-900 shadow-2xl shadow-slate-950/50">
            <div className="md:hidden flex items-center gap-2 mb-6 justify-center">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-500">
                <Box className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-display font-bold text-white">AssetFlow</span>
            </div>
            
            <Outlet />
          </div>
        </motion.div>

      </div>
    </div>
  );
};
