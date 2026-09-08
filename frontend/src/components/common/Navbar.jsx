import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  GraduationCap,
  BookOpen,
  LayoutDashboard,
  Award,
  PlusCircle,
  ClipboardList,
  LogOut,
  User,
  ChevronDown,
  Menu,
  X,
  Compass,
  Heart,
  MessageSquare,
} from 'lucide-react';
import Button from './Button';
import NotificationBell from '../notifications/NotificationBell';

export const Navbar = () => {
  const { user, isAuthenticated, isLearner, isInstructor, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setDropdownOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-40 w-full bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-cyan-400 p-0.5 shadow-glow-sm group-hover:shadow-glow transition-all duration-300">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 text-sky-400 group-hover:scale-110 transition-transform" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black tracking-tight text-white flex items-center">
                  Learn<span className="text-sky-400">Pulse</span>
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 -mt-1">
                  Classroom
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-1">
              <Link
                to="/courses"
                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  isActive('/courses')
                    ? 'text-sky-400 bg-sky-500/10'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Compass className="w-4 h-4" />
                Explore Courses
              </Link>

              {isAuthenticated && isLearner && (
                <>
                  <Link
                    to="/learner/dashboard"
                    className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                      isActive('/learner/dashboard')
                        ? 'text-sky-400 bg-sky-500/10'
                        : 'text-slate-300 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    <BookOpen className="w-4 h-4" />
                    My Learning
                  </Link>
                  <Link
                    to="/learner/progress"
                    className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                      isActive('/learner/progress')
                        ? 'text-sky-400 bg-sky-500/10'
                        : 'text-slate-300 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    <Award className="w-4 h-4" />
                    My Progress
                  </Link>
                  <Link
                    to="/learner/bookmarks"
                    className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                      isActive('/learner/bookmarks')
                        ? 'text-sky-400 bg-sky-500/10'
                        : 'text-slate-300 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    <Heart className="w-4 h-4" />
                    Bookmarks
                  </Link>
                </>
              )}

              {isAuthenticated && isInstructor && (
                <>
                  <Link
                    to="/instructor/dashboard"
                    className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                      isActive('/instructor/dashboard')
                        ? 'text-sky-400 bg-sky-500/10'
                        : 'text-slate-300 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Studio Dashboard
                  </Link>
                  <Link
                    to="/instructor/messages"
                    className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                      isActive('/instructor/messages')
                        ? 'text-sky-400 bg-sky-500/10'
                        : 'text-slate-300 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    <MessageSquare className="w-4 h-4" />
                    Student Messages
                  </Link>
                  <Link
                    to="/instructor/courses/new"
                    className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                      isActive('/instructor/courses/new')
                        ? 'text-sky-400 bg-sky-500/10'
                        : 'text-slate-300 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    <PlusCircle className="w-4 h-4" />
                    New Course
                  </Link>
                  <Link
                    to="/instructor/grading"
                    className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                      isActive('/instructor/grading')
                        ? 'text-sky-400 bg-sky-500/10'
                        : 'text-slate-300 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    <ClipboardList className="w-4 h-4" />
                    Grading Queue
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Desktop Right Actions */}
          <div className="hidden md:flex items-center gap-3">
            {!isAuthenticated ? (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="md">
                    Log In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="md">
                    Join for Free
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <NotificationBell />
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2.5 p-1.5 pr-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all text-left"
                  >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                    {user?.first_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-slate-200 leading-tight">
                      {user?.full_name || user?.email?.split('@')[0]}
                    </span>
                    <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider">
                      {user?.role}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
                </button>

                {/* Profile Dropdown */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-4 py-2 border-b border-slate-800">
                      <p className="text-xs text-slate-400">Signed in as</p>
                      <p className="text-sm font-semibold text-slate-200 truncate">{user?.email}</p>
                    </div>

                    {isLearner && (
                      <Link
                        to="/learner/dashboard"
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
                      >
                        <BookOpen className="w-4 h-4 text-sky-400" />
                        My Courses
                      </Link>
                    )}

                    {isInstructor && (
                      <Link
                        to="/instructor/dashboard"
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
                      >
                        <LayoutDashboard className="w-4 h-4 text-sky-400" />
                        Instructor Studio
                      </Link>
                    )}

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-800 bg-slate-950 px-4 pt-2 pb-6 space-y-3">
          <Link
            to="/courses"
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-300 hover:text-white hover:bg-slate-900"
          >
            Explore Courses
          </Link>

          {isAuthenticated ? (
            <>
              {isLearner && (
                <>
                  <Link
                    to="/learner/dashboard"
                    className="block px-3 py-2 rounded-lg text-base font-medium text-slate-300 hover:text-white hover:bg-slate-900"
                  >
                    My Learning
                  </Link>
                  <Link
                    to="/learner/progress"
                    className="block px-3 py-2 rounded-lg text-base font-medium text-slate-300 hover:text-white hover:bg-slate-900"
                  >
                    My Progress
                  </Link>
                  <Link
                    to="/learner/bookmarks"
                    className="block px-3 py-2 rounded-lg text-base font-medium text-slate-300 hover:text-white hover:bg-slate-900"
                  >
                    My Bookmarks
                  </Link>
                </>
              )}
              {isInstructor && (
                <>
                  <Link
                    to="/instructor/dashboard"
                    className="block px-3 py-2 rounded-lg text-base font-medium text-slate-300 hover:text-white hover:bg-slate-900"
                  >
                    Studio Dashboard
                  </Link>
                  <Link
                    to="/instructor/messages"
                    className="block px-3 py-2 rounded-lg text-base font-medium text-slate-300 hover:text-white hover:bg-slate-900"
                  >
                    Student Messages
                  </Link>
                  <Link
                    to="/instructor/courses/new"
                    className="block px-3 py-2 rounded-lg text-base font-medium text-slate-300 hover:text-white hover:bg-slate-900"
                  >
                    Create Course
                  </Link>
                  <Link
                    to="/instructor/grading"
                    className="block px-3 py-2 rounded-lg text-base font-medium text-slate-300 hover:text-white hover:bg-slate-900"
                  >
                    Grading Queue
                  </Link>
                </>
              )}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-200">{user?.full_name}</p>
                  <p className="text-xs text-sky-400">{user?.role}</p>
                </div>
                <Button variant="danger" size="sm" onClick={handleLogout}>
                  Sign Out
                </Button>
              </div>
            </>
          ) : (
            <div className="pt-4 border-t border-slate-800 grid grid-cols-2 gap-3">
              <Link to="/login" className="w-full">
                <Button variant="secondary" size="md" className="w-full">
                  Log In
                </Button>
              </Link>
              <Link to="/register" className="w-full">
                <Button variant="primary" size="md" className="w-full">
                  Sign Up
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
