import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import courseService from '../../services/courseService';
import enrollmentService from '../../services/enrollmentService';
import reviewService from '../../services/reviewService';
import Loader from '../../components/common/Loader';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import {
  BookOpen,
  User,
  Clock,
  Globe,
  Award,
  CheckCircle2,
  ListOrdered,
  ChevronDown,
  ChevronRight,
  PlayCircle,
  FileText,
  FileCode,
  ExternalLink,
  Star,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export const CourseDetail = () => {
  const { id } = useParams();
  const { user, isAuthenticated, isLearner } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [curriculum, setCurriculum] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState('');
  const [expandedSections, setExpandedSections] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const [courseData, curriculumData] = await Promise.all([
          courseService.getCourse(id),
          courseService.getCourseCurriculum(id).catch(() => null),
        ]);

        setCourse(courseData);
        setCurriculum(curriculumData);

        // Auto-expand all sections initially
        if (curriculumData?.sections) {
          const initialExpanded = {};
          curriculumData.sections.forEach((sec) => {
            initialExpanded[sec.id] = true;
          });
          setExpandedSections(initialExpanded);
        }

        // Fetch reviews & stats
        try {
          const [revList, stats] = await Promise.all([
            reviewService.getReviewsForCourse(id),
            reviewService.getCourseReviewStats(id).catch(() => null),
          ]);
          setReviews(Array.isArray(revList) ? revList : revList.results || []);
          setReviewStats(stats);
        } catch {
          // Reviews may be empty
        }

        // Check enrollment if logged in as learner
        if (isAuthenticated && isLearner) {
          try {
            const enrollments = await enrollmentService.getMyEnrollments();
            const list = Array.isArray(enrollments) ? enrollments : enrollments.results || [];
            const enrolled = list.some((e) => e.course === Number(id));
            setIsEnrolled(enrolled);
          } catch {
            // Non-blocking
          }
        }
      } catch (err) {
        setError('Course not found or currently unavailable.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, isAuthenticated, isLearner]);

  const toggleSection = (secId) => {
    setExpandedSections((prev) => ({
      ...prev,
      [secId]: !prev[secId],
    }));
  };

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: `/courses/${id}` } } });
      return;
    }

    if (!isLearner) {
      toast.warning('Only learner accounts can enroll in courses.', 'Instructor Notice');
      return;
    }

    setEnrolling(true);
    try {
      await enrollmentService.enroll(Number(id));
      setIsEnrolled(true);
      toast.success(`You are now enrolled in ${course.title}!`, 'Enrollment Confirmed');
      navigate(`/learner/courses/${id}/player`);
    } catch (err) {
      const detail = err.response?.data?.detail || 'Unable to complete enrollment.';
      toast.error(detail, 'Enrollment Failed');
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return <Loader fullPage message="Loading course curriculum & syllabus..." />;
  }

  if (error || !course) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-2xl font-bold text-white">Course Not Found</h2>
        <p className="text-slate-400">{error || 'This course does not exist or has not been published yet.'}</p>
        <Link to="/courses">
          <Button variant="primary">Browse All Courses</Button>
        </Link>
      </div>
    );
  }

  const sections = curriculum?.sections || [];
  const totalLessons = sections.reduce((acc, sec) => acc + (sec.lessons?.length || 0), 0);

  const getLessonIcon = (type) => {
    switch (type) {
      case 'VIDEO':
        return <PlayCircle className="w-4 h-4 text-sky-400" />;
      case 'ARTICLE':
        return <FileText className="w-4 h-4 text-amber-400" />;
      case 'DOCUMENT':
        return <FileCode className="w-4 h-4 text-emerald-400" />;
      default:
        return <ExternalLink className="w-4 h-4 text-purple-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0b1120] text-slate-100 pb-16">
      {/* Hero Header Section */}
      <section className="relative bg-slate-950 border-b border-slate-800/80 py-12 lg:py-16 overflow-hidden">
        {/* Glow ambient background */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Info Column */}
            <div className="lg:col-span-8 space-y-6">
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2.5">
                {course.category_name && (
                  <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider bg-sky-500/10 text-sky-400 rounded-lg border border-sky-500/20">
                    {course.category_name}
                  </span>
                )}
                <Badge variant={course.level === 'BEGINNER' ? 'success' : course.level === 'INTERMEDIATE' ? 'warning' : 'danger'} size="md">
                  {course.level}
                </Badge>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5" />
                  {course.language || 'English'}
                </span>
              </div>

              {/* Title & Short Description */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                {course.title}
              </h1>

              <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-3xl">
                {course.short_description || course.description?.slice(0, 180)}
              </p>

              {/* Metadata row */}
              <div className="flex flex-wrap items-center gap-6 text-sm text-slate-300 pt-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-sky-600 flex items-center justify-center font-bold text-xs text-white">
                    {course.instructor_name?.[0]?.toUpperCase() || 'I'}
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">Created by</span>
                    <span className="font-semibold text-slate-200">{course.instructor_name || 'Instructor'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                  <Star className="w-4 h-4 fill-amber-400" />
                  <span>{reviewStats?.average_rating ? reviewStats.average_rating.toFixed(1) : '5.0'}</span>
                  <span className="text-xs text-slate-400 font-normal">
                    ({reviewStats?.total_reviews || reviews.length} reviews)
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-slate-400">
                  <BookOpen className="w-4 h-4 text-sky-400" />
                  <span>{sections.length} Sections</span>
                  <span>•</span>
                  <span>{totalLessons} Lessons</span>
                </div>
              </div>
            </div>

            {/* Right Card / Enrollment Box */}
            <div className="lg:col-span-4">
              <div className="glass-panel p-6 rounded-3xl border border-slate-800 shadow-2xl space-y-6">
                {/* Thumbnail */}
                <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-900 border border-slate-800">
                  {course.thumbnail ? (
                    <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 to-sky-950 text-sky-400">
                      <BookOpen className="w-12 h-12" />
                    </div>
                  )}
                </div>

                {/* Pricing & CTA */}
                <div className="space-y-4">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Enrollment Fee</span>
                    <span className="text-3xl font-black text-white">
                      {course.is_free || course.price === 0 || course.price === '0.00' ? (
                        <span className="text-emerald-400">Free</span>
                      ) : (
                        `$${course.price}`
                      )}
                    </span>
                  </div>

                  {isEnrolled ? (
                    <Link to={`/learner/courses/${id}/player`} className="block w-full">
                      <Button variant="success" size="lg" className="w-full" rightIcon={<ArrowRight className="w-4 h-4" />}>
                        Go to Classroom
                      </Button>
                    </Link>
                  ) : (
                    <Button
                      variant="primary"
                      size="lg"
                      className="w-full"
                      isLoading={enrolling}
                      onClick={handleEnroll}
                      rightIcon={<Sparkles className="w-4 h-4" />}
                    >
                      {isAuthenticated ? 'Enroll in Course' : 'Sign In to Enroll'}
                    </Button>
                  )}

                  <div className="text-[11px] text-slate-400 text-center flex items-center justify-center gap-1.5 pt-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
                    <span>Full lifetime access • Self-paced curriculum</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Course Body (Syllabus, Objectives, Requirements, Reviews) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Main 8-col content */}
          <div className="lg:col-span-8 space-y-12">
            {/* Learning Objectives */}
            {course.learning_objectives && (
              <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-sky-400" />
                  What You'll Learn
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {course.learning_objectives.split('\n').filter(Boolean).map((obj, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-sm text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{obj.replace(/^[-*•]\s*/, '')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Course Description */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white">Course Overview</h3>
              <div className="text-sm sm:text-base text-slate-300 leading-relaxed whitespace-pre-line bg-slate-900/40 p-6 rounded-2xl border border-slate-800/80">
                {course.description || course.short_description}
              </div>
            </div>

            {/* Curriculum Syllabus Tree */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <ListOrdered className="w-5 h-5 text-sky-400" />
                  Curriculum Syllabus
                </h3>
                <span className="text-xs text-slate-400">
                  {sections.length} sections • {totalLessons} lessons
                </span>
              </div>

              {sections.length === 0 ? (
                <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center text-slate-400 text-sm">
                  Curriculum lessons will be published soon by the instructor.
                </div>
              ) : (
                <div className="space-y-3">
                  {sections.map((section, secIdx) => {
                    const isExpanded = expandedSections[section.id];
                    const lessons = section.lessons || [];

                    return (
                      <div
                        key={section.id}
                        className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden"
                      >
                        {/* Section Header */}
                        <button
                          onClick={() => toggleSection(section.id)}
                          className="w-full px-5 py-4 flex items-center justify-between bg-slate-900/90 hover:bg-slate-800/80 transition-colors text-left"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-lg bg-sky-500/10 text-sky-400 font-bold text-xs flex items-center justify-center shrink-0">
                              {secIdx + 1}
                            </span>
                            <div>
                              <h4 className="text-sm font-bold text-slate-100">{section.title}</h4>
                              {section.description && (
                                <p className="text-xs text-slate-400 line-clamp-1">{section.description}</p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-3 text-xs text-slate-400">
                            <span>{lessons.length} lessons</span>
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-slate-400" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                        </button>

                        {/* Lessons List */}
                        {isExpanded && (
                          <div className="divide-y divide-slate-800/60 px-5 py-2 bg-slate-950/40">
                            {lessons.length === 0 ? (
                              <p className="text-xs text-slate-500 py-3 italic">No lessons in this section yet.</p>
                            ) : (
                              lessons.map((lesson) => (
                                <div
                                  key={lesson.id}
                                  className="py-3 flex items-center justify-between text-xs"
                                >
                                  <div className="flex items-center gap-2.5">
                                    {getLessonIcon(lesson.content_type)}
                                    <span className="font-medium text-slate-200">{lesson.title}</span>
                                    {lesson.is_free_preview && (
                                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                        Preview
                                      </span>
                                    )}
                                  </div>

                                  {lesson.duration_minutes > 0 && (
                                    <div className="flex items-center gap-1 text-slate-400">
                                      <Clock className="w-3 h-3" />
                                      <span>{lesson.duration_minutes}m</span>
                                    </div>
                                  )}
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Course Prerequisites / Requirements */}
            {course.requirements && (
              <div className="space-y-3">
                <h3 className="text-xl font-bold text-white">Prerequisites & Requirements</h3>
                <ul className="list-disc list-inside space-y-1.5 text-sm text-slate-300 bg-slate-900/40 p-6 rounded-2xl border border-slate-800/80">
                  {course.requirements.split('\n').filter(Boolean).map((req, i) => (
                    <li key={i}>{req.replace(/^[-*•]\s*/, '')}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Student Reviews */}
            <div className="space-y-6 pt-4 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                  Student Feedback ({reviews.length})
                </h3>
              </div>

              {reviews.length === 0 ? (
                <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center text-slate-400 text-sm">
                  Be the first student to review this course after completing lessons!
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((rev) => (
                    <div key={rev.id} className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-sky-600 flex items-center justify-center font-bold text-xs text-white">
                            {rev.user_name?.[0]?.toUpperCase() || 'S'}
                          </div>
                          <span className="text-sm font-semibold text-slate-200">{rev.user_name || 'Verified Learner'}</span>
                        </div>
                        <div className="flex items-center gap-1 text-amber-400 text-xs font-bold">
                          {Array.from({ length: 5 }).map((_, idx) => (
                            <Star
                              key={idx}
                              className={`w-3.5 h-3.5 ${
                                idx < rev.rating ? 'fill-amber-400' : 'text-slate-600'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{rev.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar 4-col */}
          <div className="lg:col-span-4 space-y-6">
            <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
              <h4 className="text-sm font-bold uppercase tracking-wider text-slate-300">Course Highlights</h4>
              <ul className="space-y-3 text-xs text-slate-300">
                <li className="flex items-center gap-3">
                  <PlayCircle className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>Interactive lesson videos & code articles</span>
                </li>
                <li className="flex items-center gap-3">
                  <Award className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Quizzes with instant grading feedback</span>
                </li>
                <li className="flex items-center gap-3">
                  <FileCode className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>Hands-on project assignments</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Verified course completion metrics</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;
