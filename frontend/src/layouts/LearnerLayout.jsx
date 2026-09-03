import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import { BookOpen, Award, Compass } from 'lucide-react';

export const LearnerLayout = () => {
  const location = useLocation();

  const tabs = [
    { name: 'My Enrolled Courses', path: '/learner/dashboard', icon: BookOpen },
    { name: 'My Progress & Metrics', path: '/learner/progress', icon: Award },
    { name: 'Explore Catalog', path: '/courses', icon: Compass },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#0b1120]">
      <Navbar />

      {/* Classroom Sub-Header */}
      <div className="bg-slate-900/90 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex overflow-x-auto space-x-8 py-3 no-scrollbar">
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

export default LearnerLayout;
