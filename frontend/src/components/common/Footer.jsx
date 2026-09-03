import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Github, Twitter, Linkedin, Heart } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="w-full bg-slate-950 border-t border-slate-900 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Col */}
          <div className="space-y-4 md:col-span-1">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-cyan-400 p-0.5 shadow-glow-sm">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-sky-400" />
                </div>
              </div>
              <span className="text-xl font-black tracking-tight text-white">
                Learn<span className="text-sky-400">Pulse</span>
              </span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed">
              Empowering learners and industry professionals with high-impact, project-driven technology courses.
            </p>
            <div className="flex items-center gap-3 text-slate-400">
              <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-sky-400 transition-colors">
                <Github className="w-5 h-5" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noreferrer" className="hover:text-sky-400 transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="hover:text-sky-400 transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Explore */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Explore</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <Link to="/courses" className="hover:text-sky-400 transition-colors">
                  All Courses
                </Link>
              </li>
              <li>
                <Link to="/courses?level=BEGINNER" className="hover:text-sky-400 transition-colors">
                  Beginner Programs
                </Link>
              </li>
              <li>
                <Link to="/courses?is_free=true" className="hover:text-sky-400 transition-colors">
                  Free Starter Courses
                </Link>
              </li>
            </ul>
          </div>

          {/* Roles */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Portals</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <Link to="/learner/dashboard" className="hover:text-sky-400 transition-colors">
                  Learner Dashboard
                </Link>
              </li>
              <li>
                <Link to="/instructor/dashboard" className="hover:text-sky-400 transition-colors">
                  Instructor Studio
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-sky-400 transition-colors">
                  Become an Instructor
                </Link>
              </li>
            </ul>
          </div>

          {/* Platform Status & Security */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Platform</h4>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-xs font-medium text-slate-300">All Systems Operational</span>
              </div>
              <p className="text-xs text-slate-400 leading-snug">
                Backend API online with automated token renewal and secure role verification.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} LearnPulse. Built with precision and care.</p>
          <p className="flex items-center gap-1">
            Inspired by modern tech academies <Heart className="w-3 h-3 text-rose-500 fill-rose-500 inline" />
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
