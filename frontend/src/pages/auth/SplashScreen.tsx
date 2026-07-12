import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Box, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export const SplashScreen: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => {
        if (isAuthenticated) {
          navigate('/dashboard', { replace: true });
        } else {
          navigate('/landing', { replace: true });
        }
      }, 1500); // Allow splash layout to show for aesthetic effect

      return () => clearTimeout(timer);
    }
  }, [isLoading, isAuthenticated, navigate]);

  return (
    <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center text-slate-100 select-none">
      {/* Background radial soft orb */}
      <div className="absolute w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none animate-pulse" />

      {/* Floating Logo Icon */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="flex flex-col items-center gap-4"
      >
        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-cyan-500 shadow-xl shadow-indigo-500/20">
          <Box className="w-8 h-8 text-white" />
        </div>
        
        <h1 className="text-3xl font-display font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
          AssetFlow
        </h1>
        
        <p className="text-xs text-muted-foreground tracking-widest uppercase font-display font-semibold text-slate-500">
          Enterprise Resource Portal
        </p>
      </motion.div>

      {/* Spinner footer */}
      <div className="absolute bottom-16 flex flex-col items-center gap-2">
        <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
        <span className="text-[10px] text-slate-600 font-display font-medium uppercase tracking-wide">
          Verifying Engine...
        </span>
      </div>
    </div>
  );
};
