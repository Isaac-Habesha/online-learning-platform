import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import enrollmentService from '../../services/enrollmentService';
import courseService from '../../services/courseService';
import progressService from '../../services/progressService';
import Loader from '../../components/common/Loader';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { Award, BookOpen, CheckCircle, Clock, Calendar, ArrowRight } from 'lucide-react';

export const MyProgress = () => {
  const [coursesProgress, setCoursesProgress] = useState([]);
  const [recentLessonProgress, setRecentLessonProgress] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProgressData = async () => {
      setLoading(true);
      try {
        const [enrollments, allProgress] = await Promise.all([
          enrollmentService.getMyEnrollments(),
          progressService.getMyProgress().catch(() => []),
        ]);

        const enrollList = Array.isArray(enrollments) ? enrollments : enrollments.results || [];
        const progList = Array.isArray(allProgress) ? allProgress : allProgress.results || [];
        setRecentLessonProgress(progList);

        // Fetch course progress per enrollment
        const coursePromises = enrollList.map(async (item) => {
          try {
            const [courseDetails, progData] = await Promise.all([
              courseService.getCourse(item.course),
              progressService.getCourseProgress(item.course).catch(() => null),
            ]);
            return {
              ...courseDetails,
              progressPercentage: progData?.progress_percentage || 0,
              completedLessons: progData?.completed_lessons || 0,
              totalLessons: progData?.total_lessons || 0,
              enrolledAt: item.enrolled_at,
            };
          } catch {
            return null;
          }
        });

        const resolved = (await Promise.all(coursePromises)).filter(Boolean);
        setCoursesProgress(resolved);
      } catch (err) {
        console.warn('Failed to load progress:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProgressData();
  }, []);

  if (loading) {
    return <Loader fullPage message="Calculating your learning progress..." />;
  }

  const totalLessonsCompleted = recentLessonProgress.filter((p) => p.completed).length;
  const completedCourses = coursesProgress.filter((c) => c.progressPercentage >= 100).length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
          <Award className="w-7 h-7 text-sky-400" />
          My Learning Metrics & Progress
        </h1>
        <p className="text-sm text-slate-400">
          Track your course completion rate, finished lessons, and project milestones.
        </p>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Finished Lessons</p>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black text-white">{totalLessonsCompleted}</span>
            <CheckCircle className="w-5 h-5 text-emerald-400" />
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Completed Courses</p>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black text-white">{completedCourses}</span>
            <Award className="w-5 h-5 text-sky-400" />
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Enrolled Programs</p>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black text-white">{coursesProgress.length}</span>
            <BookOpen className="w-5 h-5 text-amber-400" />
          </div>
        </div>
      </div>

      {/* Course Breakdown List */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white">Course Completion Breakdown</h3>

        {coursesProgress.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center text-xs text-slate-400">
            No enrolled courses found.
          </div>
        ) : (
          <div className="space-y-4">
            {coursesProgress.map((course) => (
              <div
                key={course.id}
                className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider bg-sky-500/10 text-sky-400 px-2.5 py-0.5 rounded-lg border border-sky-500/20">
                      {course.category_name || 'Technology'}
                    </span>
                    <Badge variant={course.progressPercentage >= 100 ? 'success' : 'primary'}>
                      {course.progressPercentage >= 100 ? 'Completed' : 'In Progress'}
                    </Badge>
                  </div>
                  <h4 className="text-base font-bold text-white">{course.title}</h4>

                  {/* Progress bar */}
                  <div className="space-y-1 max-w-md">
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>{course.completedLessons} of {course.totalLessons} Lessons Done</span>
                      <span className="text-sky-400 font-bold">{Math.round(course.progressPercentage)}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-400 to-sky-500 rounded-full"
                        style={{ width: `${course.progressPercentage}%` }}
                      />
                    </div>
                  </div>
                </div>

                <Link to={`/learner/courses/${course.id}/player`}>
                  <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
                    Continue Learning
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Completed Lessons Activity Stream */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white">Recent Learning Milestones</h3>

        {recentLessonProgress.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center text-xs text-slate-400">
            Start watching lessons in your enrolled courses to record progress.
          </div>
        ) : (
          <div className="glass-panel rounded-2xl border border-slate-800 divide-y divide-slate-800/80 overflow-hidden">
            {recentLessonProgress.slice(0, 10).map((item) => (
              <div key={item.id} className="p-4 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <CheckCircle className={`w-4 h-4 ${item.completed ? 'text-emerald-400' : 'text-slate-600'}`} />
                  <div>
                    <span className="font-semibold text-slate-200 block">{item.lesson_title}</span>
                    <span className="text-[11px] text-slate-400">
                      {item.completed ? 'Completed' : 'Started / In Progress'}
                    </span>
                  </div>
                </div>

                {item.last_accessed_at && (
                  <span className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(item.last_accessed_at).toLocaleDateString()}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyProgress;
