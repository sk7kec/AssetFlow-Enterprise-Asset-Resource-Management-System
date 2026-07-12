import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Home, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100 px-4 select-none">
      {/* Background orb */}
      <div className="absolute w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="text-center space-y-6 max-w-md z-10"
      >
        {/* Floating Logo Icon */}
        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-cyan-500 shadow-xl shadow-indigo-500/20 mx-auto animate-bounce">
          <Box className="w-8 h-8 text-white" />
        </div>

        <div className="space-y-2">
          <h1 className="text-6xl font-display font-extrabold tracking-tight text-indigo-400">404</h1>
          <h2 className="text-xl font-bold font-display text-white">Resource File Not Found</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            The page you are trying to locate does not exist, or has been moved to another division route.
          </p>
        </div>

        {/* Action button redirects */}
        <div className="flex justify-center gap-3 pt-4">
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 rounded-xl border border-slate-800 hover:border-slate-600 font-semibold text-xs text-slate-300 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer bg-slate-900/40"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Go Back</span>
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 font-semibold text-xs text-white shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
