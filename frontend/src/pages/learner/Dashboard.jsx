import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import enrollmentService from '../../services/enrollmentService';
import courseService from '../../services/courseService';
import progressService from '../../services/progressService';
import CourseCard from '../../components/courses/CourseCard';
import Loader from '../../components/common/Loader';
import Button from '../../components/common/Button';
import { BookOpen, Award, CheckCircle, Clock, Sparkles, Compass } from 'lucide-react';

export const LearnerDashboard = () => {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState([]);
  const [coursesWithProgress, setCoursesWithProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError('');
      try {
        const enrollData = await enrollmentService.getMyEnrollments();
        const enrollList = Array.isArray(enrollData) ? enrollData : enrollData.results || [];
        setEnrollments(enrollList);

        // Fetch course details & progress for each enrolled course
        const coursePromises = enrollList.map(async (item) => {
          try {
            const courseDetails = await courseService.getCourse(item.course);
            let progressData = null;
            try {
              progressData = await progressService.getCourseProgress(item.course);
            } catch {
              progressData = { progress_percentage: 0, completed_lessons: 0, total_lessons: 0 };
            }
            return {
              ...courseDetails,
              enrollmentId: item.id,
              status: item.status,
              progressPercentage: progressData?.progress_percentage || 0,
              completedLessons: progressData?.completed_lessons || 0,
              totalLessons: progressData?.total_lessons || 0,
            };
          } catch {
            return null;
          }
        });

        const resolvedCourses = (await Promise.all(coursePromises)).filter(Boolean);
        setCoursesWithProgress(resolvedCourses);
      } catch (err) {
        setError('Failed to load your enrolled courses.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <Loader fullPage message="Loading your classroom dashboard..." />;
  }

  const completedCount = coursesWithProgress.filter((c) => c.progressPercentage >= 100).length;
  const inProgressCount = coursesWithProgress.length - completedCount;

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-slate-900 via-sky-950/60 to-slate-900 border border-slate-800 p-8 sm:p-10 overflow-hidden shadow-xl">
        <div className="absolute right-0 top-0 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            Classroom Dashboard
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
            Welcome back, {user?.first_name || user?.email?.split('@')[0]}!
          </h1>
          <p className="text-sm text-slate-300 max-w-xl">
            Pick up where you left off and keep building your tech skills.
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Enrolled Courses</p>
            <h3 className="text-2xl font-black text-white">{coursesWithProgress.length}</h3>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">In Progress</p>
            <h3 className="text-2xl font-black text-white">{inProgressCount}</h3>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Completed Courses</p>
            <h3 className="text-2xl font-black text-white">{completedCount}</h3>
          </div>
        </div>
      </div>

      {/* Enrolled Courses Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-sky-400" />
            My Enrolled Courses ({coursesWithProgress.length})
          </h2>
          <Link to="/courses">
            <Button variant="ghost" size="sm" rightIcon={<Compass className="w-4 h-4" />}>
              Explore More Courses
            </Button>
          </Link>
        </div>

        {coursesWithProgress.length === 0 ? (
          <div className="text-center py-16 space-y-4 glass-panel rounded-2xl border border-slate-800">
            <div className="w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center mx-auto text-sky-400">
              <Compass className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h4 className="text-lg font-bold text-white">No courses enrolled yet</h4>
              <p className="text-xs text-slate-400">
                Browse our catalog of industry-ready tech courses and start learning today!
              </p>
            </div>
            <Link to="/courses" className="inline-block">
              <Button variant="primary" size="md">
                Browse Course Catalog
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coursesWithProgress.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                isEnrolled={true}
                progressPercentage={course.progressPercentage}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LearnerDashboard;
