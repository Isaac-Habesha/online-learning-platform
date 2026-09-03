import React, { useState, useEffect } from 'react';
import CourseCard from './CourseCard';
import Loader from '../common/Loader';
import { Search, Filter, BookX, Sparkles } from 'lucide-react';
import courseService from '../../services/courseService';
import categoryService from '../../services/categoryService';

export const CourseList = ({ initialCategory = '' }) => {
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [filters, setFilters] = useState({
    search: '',
    category: initialCategory,
    level: '',
    is_free: '',
  });

  // Fetch categories on mount
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const data = await categoryService.getCategories();
        setCategories(Array.isArray(data) ? data : data.results || []);
      } catch (err) {
        console.warn('Failed to load categories:', err);
      }
    };
    fetchCats();
  }, []);

  // Fetch courses on filter change
  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      setError('');
      try {
        const params = {};
        if (filters.search.trim()) params.search = filters.search.trim();
        if (filters.category) params.category = filters.category;
        if (filters.level) params.level = filters.level;
        if (filters.is_free !== '') params.is_free = filters.is_free;

        const data = await courseService.getCourses(params);
        setCourses(Array.isArray(data) ? data : data.results || []);
      } catch (err) {
        setError('Unable to load courses. Please check your connection.');
      } finally {
        setLoading(false);
      }
    };

    const timeout = setTimeout(() => {
      fetchCourses();
    }, 300);

    return () => clearTimeout(timeout);
  }, [filters]);

  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      category: '',
      level: '',
      is_free: '',
    });
  };

  return (
    <div className="space-y-8">
      {/* Search and Filters Bar */}
      <div className="glass-panel p-4 sm:p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search courses..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Level Filter */}
          <div>
            <select
              value={filters.level}
              onChange={(e) => handleFilterChange('level', e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            >
              <option value="">All Skill Levels</option>
              <option value="BEGINNER">Beginner</option>
              <option value="INTERMEDIATE">Intermediate</option>
              <option value="ADVANCED">Advanced</option>
            </select>
          </div>

          {/* Pricing Filter */}
          <div>
            <select
              value={filters.is_free}
              onChange={(e) => handleFilterChange('is_free', e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            >
              <option value="">All Pricing</option>
              <option value="true">Free Only</option>
              <option value="false">Paid Only</option>
            </select>
          </div>
        </div>

        {/* Active filter pills */}
        {(filters.search || filters.category || filters.level || filters.is_free !== '') && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
            <span className="text-slate-400">
              Showing filtered results ({courses.length} courses found)
            </span>
            <button
              onClick={resetFilters}
              className="text-sky-400 hover:text-sky-300 font-semibold transition-colors"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Course Grid / Loading / Empty State */}
      {loading ? (
        <Loader message="Loading courses..." />
      ) : error ? (
        <div className="p-8 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-center space-y-3">
          <p className="text-sm font-semibold text-rose-300">{error}</p>
          <button
            onClick={() => handleFilterChange('search', '')}
            className="text-xs text-sky-400 underline font-semibold"
          >
            Retry
          </button>
        </div>
      ) : courses.length === 0 ? (
        <div className="text-center py-16 space-y-4 glass-panel rounded-2xl border border-slate-800">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/60 flex items-center justify-center mx-auto text-slate-500">
            <BookX className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h4 className="text-lg font-bold text-slate-200">No courses match your criteria</h4>
            <p className="text-xs text-slate-400">Try adjusting your filters or search keywords.</p>
          </div>
          <button
            onClick={resetFilters}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/30 text-xs font-semibold hover:bg-sky-500 hover:text-white transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </div>
  );
};

export default CourseList;
