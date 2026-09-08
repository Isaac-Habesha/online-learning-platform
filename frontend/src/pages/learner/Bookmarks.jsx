import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, BookOpen, Compass, ArrowRight, Loader2 } from 'lucide-react';
import { useBookmarks } from '../../hooks/useBookmarks';
import CourseCard from '../../components/courses/CourseCard';
import Button from '../../components/common/Button';

export const Bookmarks = () => {
  const { data: bookmarkedCourses = [], isLoading } = useBookmarks();

  return (
    <div className="min-h-[80vh] py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-full text-xs font-semibold mb-2">
            <Heart className="w-3.5 h-3.5 fill-rose-500" />
            <span>Saved Courses</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
            My Bookmarks
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Courses you have bookmarked to study, explore, or enroll in later.
          </p>
        </div>

        <Link to="/courses">
          <Button variant="secondary" size="sm" leftIcon={<Compass className="w-4 h-4" />}>
            Explore More Courses
          </Button>
        </Link>
      </div>

      {/* Content */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-sky-500 mb-3" />
          <p className="text-sm">Loading your saved courses...</p>
        </div>
      )}

      {!isLoading && bookmarkedCourses.length === 0 && (
        <div className="text-center py-20 px-4 bg-slate-900/40 rounded-3xl border border-slate-800/80 max-w-xl mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mx-auto mb-4">
            <Heart className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No Bookmarked Courses Yet</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">
            Click the heart icon on any course card or course page to save it here for quick access.
          </p>
          <Link to="/courses">
            <Button variant="primary" size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Browse Course Catalog
            </Button>
          </Link>
        </div>
      )}

      {!isLoading && bookmarkedCourses.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {bookmarkedCourses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Bookmarks;
