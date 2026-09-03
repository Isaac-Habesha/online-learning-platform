import React from 'react';
import CourseList from '../../components/courses/CourseList';
import { Compass, Sparkles, BookOpen, Layers, CheckCircle } from 'lucide-react';

export const CourseCatalog = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Hero Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-slate-900 via-sky-950/70 to-slate-900 border border-slate-800 p-8 sm:p-12 overflow-hidden shadow-2xl">
        {/* Glow ambient circle */}
        <div className="absolute right-0 top-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-bold tracking-wide">
            <Sparkles className="w-3.5 h-3.5" />
            Industry-Ready Curriculums
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
            Level Up Your Skills With Real-World Tech Courses
          </h1>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Learn from verified industry instructors with bite-sized video lessons, comprehensive articles, downloadable resources, hands-on quizzes, and project reviews.
          </p>

          <div className="pt-2 flex flex-wrap gap-6 text-xs font-semibold text-slate-300">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>Project Submissions</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>Interactive Quizzes</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>Verified Progress</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Course Catalog */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <Compass className="w-6 h-6 text-sky-400" />
            Explore All Courses
          </h2>
        </div>

        <CourseList />
      </div>
    </div>
  );
};

export default CourseCatalog;
