import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import { LayoutDashboard, PlusCircle, ClipboardList, Sparkles, MessageSquare } from 'lucide-react';

export const InstructorLayout = () => {
  const location = useLocation();

  const tabs = [
    { name: 'Instructor Dashboard', path: '/instructor/dashboard', icon: LayoutDashboard },
    { name: 'Student Messages', path: '/instructor/messages', icon: MessageSquare },
    { name: 'Course Studio Builder', path: '/instructor/courses/new', icon: PlusCircle },
    { name: 'Grading Queue', path: '/instructor/grading', icon: ClipboardList },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#0b1120]">
      <Navbar />

      {/* Instructor Studio Sub-Header */}
      <div className="bg-slate-900/95 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3">
            <div className="flex overflow-x-auto space-x-8 no-scrollbar">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const active = location.pathname === tab.path;
                return (
                  <Link
                    key={tab.path}
                    to={tab.path}
                    className={`inline-flex items-center gap-2 py-2 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 -mb-[13px] ${
                      active
                        ? 'border-sky-400 text-sky-400'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.name}
                  </Link>
                );
              })}
            </div>

            <div className="hidden lg:flex items-center gap-2 text-xs font-semibold text-sky-400 bg-sky-500/10 px-3 py-1.5 rounded-full border border-sky-500/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Instructor Studio Mode</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Page Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
};

export default InstructorLayout;
