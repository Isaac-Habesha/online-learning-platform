import React from 'react';
import { Link } from 'react-router-dom';
import Badge from '../common/Badge';
import { BookOpen, User, ArrowUpRight, Clock, Star, Sparkles } from 'lucide-react';

export const CourseCard = ({ course, isEnrolled = false, progressPercentage = null }) => {
  const {
    id,
    title,
    short_description,
    thumbnail,
    category_name,
    level,
    price,
    is_free,
    instructor_name,
  } = course;

  const levelVariant = {
    BEGINNER: 'success',
    INTERMEDIATE: 'warning',
    ADVANCED: 'danger',
  }[level] || 'default';

  return (
    <div className="group glass-panel rounded-2xl border border-slate-800 overflow-hidden flex flex-col hover:border-sky-500/40 transition-all duration-300 hover:shadow-glow-sm hover:-translate-y-1">
      {/* Thumbnail Header */}
      <div className="relative aspect-video w-full bg-slate-900 overflow-hidden">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-900 via-sky-950 to-indigo-950 flex items-center justify-center p-6 text-center">
            <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 group-hover:scale-110 transition-transform">
              <BookOpen className="w-6 h-6" />
            </div>
          </div>
        )}

        {/* Floating Category Badge */}
        {category_name && (
          <div className="absolute top-3 left-3">
            <span className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider bg-slate-950/80 backdrop-blur-md text-sky-400 rounded-lg border border-sky-500/30">
              {category_name}
            </span>
          </div>
        )}

        {/* Floating Level Badge */}
        <div className="absolute top-3 right-3">
          <Badge variant={levelVariant} size="sm">
            {level}
          </Badge>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          <h3 className="text-base font-bold text-slate-100 group-hover:text-sky-400 transition-colors line-clamp-2 leading-snug">
            {title}
          </h3>
          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
            {short_description || 'Master key concepts with structured lessons and practical assessments.'}
          </p>
        </div>

        {/* Progress Bar for Enrolled Courses */}
        {isEnrolled && progressPercentage !== null && (
          <div className="space-y-1 pt-1">
            <div className="flex justify-between text-[11px] font-semibold text-slate-300">
              <span>Classroom Progress</span>
              <span className="text-sky-400">{Math.round(progressPercentage)}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 to-sky-500 rounded-full"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Footer info */}
        <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-400 truncate max-w-[150px]">
            <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="truncate">{instructor_name || 'Instructor'}</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="font-extrabold text-sm text-slate-100">
              {is_free || price === 0 || price === '0.00' ? (
                <span className="text-emerald-400">FREE</span>
              ) : (
                `$${price}`
              )}
            </span>

            <Link
              to={isEnrolled ? `/learner/courses/${id}/player` : `/courses/${id}`}
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-sky-500/10 hover:bg-sky-500 text-sky-400 hover:text-white border border-sky-500/30 hover:border-transparent transition-all"
              title="View Course"
            >
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseCard;
