import React from 'react';
import { Outlet, Link, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { GraduationCap, ShieldCheck, Sparkles } from 'lucide-react';

export const AuthLayout = () => {
  const { isAuthenticated, isLearner, isInstructor, loading } = useAuth();

  // Redirect authenticated users to their respective dashboard
  if (!loading && isAuthenticated) {
    if (isInstructor) {
      return <Navigate to="/instructor/dashboard" replace />;
    }
    return <Navigate to="/learner/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-[#070b14] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background glowing ambient orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-sky-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Brand */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10">
        <Link to="/" className="inline-flex items-center gap-3 group">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-600 to-cyan-400 p-0.5 shadow-glow">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <GraduationCap className="w-7 h-7 text-sky-400 group-hover:scale-110 transition-transform" />
            </div>
          </div>
          <div className="text-left">
            <span className="text-2xl font-black tracking-tight text-white flex items-center">
              Learn<span className="text-sky-400">Pulse</span>
            </span>
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block -mt-1">
              Tech Academy
            </span>
          </div>
        </Link>
      </div>

      {/* Auth Card Container */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="glass-panel border border-slate-800/90 rounded-2xl p-8 shadow-2xl backdrop-blur-xl relative">
          <Outlet />
        </div>

        {/* Security assurance */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-sky-400" />
          <span>Secure JWT Authentication with Silent Refresh</span>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
