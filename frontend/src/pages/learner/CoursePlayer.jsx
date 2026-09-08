import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import courseService from '../../services/courseService';
import progressService from '../../services/progressService';
import quizService from '../../services/quizService';
import assignmentService from '../../services/assignmentService';
import reviewService from '../../services/reviewService';
import Loader from '../../components/common/Loader';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import CertificateDownloadButton from '../../components/certificates/CertificateDownloadButton';
import SupportChatDrawer from '../../components/chat/SupportChatDrawer';
import {
  PlayCircle,
  FileText,
  FileCode,
  ExternalLink,
  CheckCircle2,
  Circle,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Clock,
  HelpCircle,
  ClipboardList,
  Star,
  Download,
  Send,
  UploadCloud,
  Check,
  Sparkles,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';

export const CoursePlayer = () => {
  const { courseId, lessonId } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [curriculum, setCurriculum] = useState(null);
  const [courseProgress, setCourseProgress] = useState(null);
  const [completedLessonIds, setCompletedLessonIds] = useState(new Set());
  const [currentLesson, setCurrentLesson] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('notes'); // 'notes' | 'quizzes' | 'assignments' | 'reviews'

  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);

  // Sub-features state (Quizzes, Assignments, Reviews)
  const [lessonQuizzes, setLessonQuizzes] = useState([]);
  const [lessonAssignments, setLessonAssignments] = useState([]);
  const [courseReviews, setCourseReviews] = useState([]);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  // Active Quiz taking modal state
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [quizAttempt, setQuizAttempt] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);
  const [submittingQuiz, setSubmittingQuiz] = useState(false);

  // Active Assignment submission modal state
  const [activeAssignment, setActiveAssignment] = useState(null);
  const [assignmentText, setAssignmentText] = useState('');
  const [assignmentFile, setAssignmentFile] = useState(null);
  const [mySubmissions, setMySubmissions] = useState([]);
  const [submittingAssignment, setSubmittingAssignment] = useState(false);

  // Fetch Course, Curriculum & Progress
  useEffect(() => {
    const initClassroom = async () => {
      setLoading(true);
      try {
        const [courseData, curriculumData, progData, myProgData] = await Promise.all([
          courseService.getCourse(courseId),
          courseService.getCourseCurriculum(courseId),
          progressService.getCourseProgress(courseId).catch(() => null),
          progressService.getMyProgress().catch(() => []),
        ]);

        setCourse(courseData);
        setCurriculum(curriculumData);
        setCourseProgress(progData);

        const myProgList = Array.isArray(myProgData) ? myProgData : myProgData.results || [];
        const completedIds = new Set(
          myProgList.filter((p) => p.completed).map((p) => p.lesson)
        );
        setCompletedLessonIds(completedIds);

        // Find initial lesson
        const sections = curriculumData?.sections || [];
        const allLessons = sections.flatMap((sec) => sec.lessons || []);

        let targetLesson = null;
        if (lessonId) {
          targetLesson = allLessons.find((l) => l.id === Number(lessonId));
        }
        if (!targetLesson && allLessons.length > 0) {
          targetLesson = allLessons[0];
        }

        if (targetLesson) {
          setCurrentLesson(targetLesson);
          progressService.startLesson(targetLesson.id).catch(() => { });
        }
      } catch (err) {
        toast.error('Unable to load classroom session.', 'Error');
      } finally {
        setLoading(false);
      }
    };

    initClassroom();
  }, [courseId, lessonId]);

  // Load quizzes and assignments whenever active lesson changes
  useEffect(() => {
    if (!currentLesson) return;

    const fetchLessonResources = async () => {
      try {
        const [quizzesData, assignmentsData] = await Promise.all([
          quizService.getQuizzes({ lesson: currentLesson.id }).catch(() => []),
          assignmentService.getAssignments({ lesson: currentLesson.id }).catch(() => []),
        ]);

        setLessonQuizzes(Array.isArray(quizzesData) ? quizzesData : quizzesData.results || []);
        setLessonAssignments(Array.isArray(assignmentsData) ? assignmentsData : assignmentsData.results || []);
      } catch (err) {
        console.warn('Failed to load lesson quizzes/assignments:', err);
      }
    };

    fetchLessonResources();
  }, [currentLesson]);

  // Fetch course reviews
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const revData = await reviewService.getReviewsForCourse(courseId);
        setCourseReviews(Array.isArray(revData) ? revData : revData.results || []);
      } catch {
        // Non-blocking
      }
    };
    fetchReviews();
  }, [courseId]);

  const allLessons = useMemo(() => {
    return curriculum?.sections?.flatMap((sec) => sec.lessons || []) || [];
  }, [curriculum]);

  const currentLessonIndex = useMemo(() => {
    return allLessons.findIndex((l) => l.id === currentLesson?.id);
  }, [allLessons, currentLesson]);

  const prevLesson = currentLessonIndex > 0 ? allLessons[currentLessonIndex - 1] : null;
  const nextLesson = currentLessonIndex < allLessons.length - 1 ? allLessons[currentLessonIndex + 1] : null;

  const selectLesson = (lesson) => {
    setCurrentLesson(lesson);
    progressService.startLesson(lesson.id).catch(() => { });
  };

  const handleMarkComplete = async () => {
    if (!currentLesson || completing) return;
    setCompleting(true);
    try {
      await progressService.completeLesson(currentLesson.id);
      setCompletedLessonIds((prev) => new Set([...prev, currentLesson.id]));

      // Update progress metrics
      const updatedProgress = await progressService.getCourseProgress(courseId).catch(() => null);
      if (updatedProgress) setCourseProgress(updatedProgress);

      toast.success(`Lesson "${currentLesson.title}" marked as complete!`, 'Good Job!');

      // Auto-advance to next lesson if available
      if (nextLesson) {
        selectLesson(nextLesson);
      }
    } catch (err) {
      toast.error('Could not mark lesson as complete.', 'Error');
    } finally {
      setCompleting(false);
    }
  };

  // Helper to safely format video URLs into YouTube / Vimeo Embed URLs
  const getEmbedVideoUrl = (url) => {
    if (!url) return null;
    try {
      // YouTube patterns
      if (url.includes('youtube.com/watch')) {
        const urlObj = new URL(url);
        const v = urlObj.searchParams.get('v');
        return `https://www.youtube.com/embed/${v}?autoplay=0&rel=0`;
      }
      if (url.includes('youtu.be/')) {
        const id = url.split('youtu.be/')[1]?.split('?')[0];
        return `https://www.youtube.com/embed/${id}?autoplay=0&rel=0`;
      }
      if (url.includes('youtube.com/embed/')) {
        return url;
      }
      // Vimeo patterns
      if (url.includes('vimeo.com/')) {
        const vimeoId = url.split('vimeo.com/')[1]?.split('?')[0];
        return `https://player.vimeo.com/video/${vimeoId}`;
      }
      return url;
    } catch {
      return url;
    }
  };

  // --- QUIZ TAKING FLOW ---
  const handleStartQuiz = async (quiz) => {
    try {
      const fullQuiz = await quizService.getQuiz(quiz.id);
      if (!fullQuiz.questions || fullQuiz.questions.length === 0) {
        toast.warning('This quiz does not have any questions configured yet.', 'Empty Quiz');
        setActiveQuiz(fullQuiz);
        setQuizAttempt(null);
        setQuizAnswers({});
        setQuizResult(null);
        return;
      }
      const startData = await quizService.startAttempt(quiz.id);
      setActiveQuiz(fullQuiz);
      setQuizAttempt(startData);
      setQuizAnswers({});
      setQuizResult(null);
    } catch (err) {
      const detail = err.response?.data?.detail || 'Unable to start quiz attempt.';
      toast.error(detail, 'Quiz Error');
    }
  };

  const handleSelectQuizOption = (questionId, optionId) => {
    setQuizAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  const handleSubmitQuiz = async () => {
    if (!activeQuiz || submittingQuiz) return;
    if (!activeQuiz.questions || activeQuiz.questions.length === 0) {
      toast.error('Cannot submit a quiz with no questions.', 'Quiz Error');
      return;
    }

    const answeredCount = Object.keys(quizAnswers).length;
    const totalQuestions = activeQuiz.questions.length;
    if (answeredCount < totalQuestions) {
      if (!window.confirm(`You have answered ${answeredCount} of ${totalQuestions} questions. Submit quiz attempt now?`)) {
        return;
      }
    }

    setSubmittingQuiz(true);
    try {
      const answersPayload = Object.entries(quizAnswers).map(([qId, optId]) => ({
        question_id: Number(qId),
        selected_option_id: optId,
      }));

      const resultData = await quizService.submitAttempt(activeQuiz.id, answersPayload);
      setQuizResult(resultData);
      if (resultData.passed) {
        toast.success(`Score: ${resultData.score}%. Quiz Passed!`, 'Congratulations!');
      } else {
        toast.warning(`Score: ${resultData.score}%. Passing score is ${activeQuiz.passing_score}%.`, 'Attempt Completed');
      }

      // Refresh course progress immediately so syllabus updates
      try {
        const prog = await progressService.getCourseProgress(courseId);
        setCourseProgress(prog);
      } catch { }
    } catch (err) {
      const detail = err.response?.data?.detail || err.response?.data?.non_field_errors?.[0] || 'Failed to submit quiz attempt.';
      toast.error(detail, 'Error');
    } finally {
      setSubmittingQuiz(false);
    }
  };

  // --- ASSIGNMENT SUBMISSION FLOW ---
  const handleOpenAssignment = async (assignment) => {
    setActiveAssignment(assignment);
    setAssignmentText('');
    setAssignmentFile(null);
    try {
      const subs = await assignmentService.getMySubmissionsForAssignment(assignment.id);
      setMySubmissions(Array.isArray(subs) ? subs : subs.results || []);
    } catch {
      setMySubmissions([]);
    }
  };

  const handleSubmitAssignment = async (e) => {
    e.preventDefault();
    if (!activeAssignment || submittingAssignment) return;

    if (!assignmentText.trim() && !assignmentFile) {
      toast.warning('Please provide a text submission (URL / notes) or upload a project file.', 'Input Required');
      return;
    }

    setSubmittingAssignment(true);
    try {
      const formData = new FormData();
      formData.append('assignment', activeAssignment.id);
      if (assignmentText.trim()) {
        formData.append('text_submission', assignmentText.trim());
      }
      if (assignmentFile) {
        formData.append('file_submission', assignmentFile);
      }

      await assignmentService.submitAssignment(activeAssignment.id, formData);
      toast.success('Assignment submitted for instructor review!', 'Project Submitted');

      // Refresh submissions
      const subs = await assignmentService.getMySubmissionsForAssignment(activeAssignment.id);
      setMySubmissions(Array.isArray(subs) ? subs : subs.results || []);
      setAssignmentText('');
      setAssignmentFile(null);

      // Refresh course progress immediately
      try {
        const prog = await progressService.getCourseProgress(courseId);
        setCourseProgress(prog);
      } catch { }
    } catch (err) {
      const errData = err.response?.data;
      let detail = 'Failed to submit assignment.';
      if (typeof errData === 'string') {
        detail = errData;
      } else if (errData?.detail) {
        detail = errData.detail;
      } else if (errData?.file_submission) {
        detail = Array.isArray(errData.file_submission) ? errData.file_submission[0] : String(errData.file_submission);
      } else if (errData?.text_submission) {
        detail = Array.isArray(errData.text_submission) ? errData.text_submission[0] : String(errData.text_submission);
      } else if (errData?.non_field_errors) {
        detail = errData.non_field_errors[0];
      } else if (errData && typeof errData === 'object') {
        const firstKey = Object.keys(errData)[0];
        detail = `${firstKey}: ${Array.isArray(errData[firstKey]) ? errData[firstKey][0] : errData[firstKey]}`;
      }
      toast.error(detail, 'Submission Failed');
    } finally {
      setSubmittingAssignment(false);
    }
  };

  // --- REVIEW SUBMISSION ---
  const handleCreateReview = async (e) => {
    e.preventDefault();
    if (!newReview.comment.trim()) return;

    setSubmittingReview(true);
    try {
      const created = await reviewService.createReview({
        course: Number(courseId),
        rating: newReview.rating,
        comment: newReview.comment.trim(),
      });
      setCourseReviews((prev) => [created, ...prev]);
      setNewReview({ rating: 5, comment: '' });
      toast.success('Thank you for your valuable feedback!', 'Review Submitted');
    } catch (err) {
      const detail = err.response?.data?.detail || 'Unable to submit review.';
      toast.error(detail, 'Review Error');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return <Loader fullPage message="Entering classroom session..." />;
  }

  const isCurrentCompleted = currentLesson && completedLessonIds.has(currentLesson.id);
  const isInstructor = user?.role === 'INSTRUCTOR' || (course && (course.instructor === user?.id || course.instructor_name === user?.full_name));

  return (
    <div className="flex h-[calc(100vh-64px)] bg-[#070b14] text-slate-100 overflow-hidden relative">
      {/* LEFT SYLLABUS DRAWER */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-80 sm:w-96 bg-slate-950 border-r border-slate-800 flex flex-col transition-transform duration-300 top-16 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:relative lg:top-0 lg:translate-x-0`}
      >
        {/* Course Progress Header */}
        <div className="p-5 border-b border-slate-800/80 bg-slate-900/60 space-y-3 shrink-0">
          <div className="flex items-center justify-between">
            <Link
              to={isInstructor ? "/instructor/dashboard" : "/learner/dashboard"}
              className="text-xs font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              {isInstructor ? "Instructor Dashboard" : "My Classroom"}
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-slate-400 hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <h2 className="text-sm font-bold text-white line-clamp-1">{course?.title}</h2>

          {/* Progress bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px] font-semibold text-slate-400">
              <span>Classroom Completion</span>
              <span className="text-sky-400 font-bold">
                {courseProgress ? Math.round(courseProgress.progress_percentage) : 0}%
              </span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 to-sky-500 rounded-full transition-all duration-300"
                style={{ width: `${courseProgress?.progress_percentage || 0}%` }}
              />
            </div>
            {courseProgress && (
              <div className="text-[10px] text-slate-400 flex flex-wrap gap-x-2 gap-y-0.5 pt-0.5">
                <span>Lessons: {courseProgress.completed_lessons}/{courseProgress.total_lessons}</span>
                {courseProgress.total_quizzes > 0 && (
                  <span>• Quizzes: {courseProgress.passed_quizzes}/{courseProgress.total_quizzes} passed</span>
                )}
                {courseProgress.total_assignments > 0 && (
                  <span>• Projects: {courseProgress.submitted_assignments}/{courseProgress.total_assignments}</span>
                )}
              </div>
            )}

            {courseProgress?.is_completed && (
              <div className="pt-2">
                <CertificateDownloadButton courseId={Number(courseId)} isCompleted={true} />
              </div>
            )}
          </div>
        </div>

        {/* Sections and Lessons Accordion */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
          {curriculum?.sections?.map((section, secIdx) => (
            <div key={section.id} className="py-2">
              <div className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-950 flex items-center justify-between">
                <span>
                  Section {secIdx + 1}: {section.title}
                </span>
                <span className="text-[10px] font-semibold text-slate-500">
                  {section.lessons?.length || 0} Lessons
                </span>
              </div>

              <div className="space-y-0.5 mt-1 px-2">
                {section.lessons?.map((lesson) => {
                  const isActive = currentLesson?.id === lesson.id;
                  const isCompleted = completedLessonIds.has(lesson.id);

                  return (
                    <button
                      key={lesson.id}
                      onClick={() => {
                        selectLesson(lesson);
                        if (window.innerWidth < 1024) setSidebarOpen(false);
                      }}
                      className={`w-full px-3 py-2.5 rounded-xl flex items-center gap-3 text-left transition-all text-xs font-medium ${isActive
                        ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30 font-bold'
                        : isCompleted
                          ? 'text-slate-300 hover:bg-slate-900 hover:text-white'
                          : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                        }`}
                    >
                      {/* Checkmark indicator */}
                      <span className="shrink-0">
                        {isCompleted ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 fill-emerald-500/20" />
                        ) : isActive ? (
                          <Circle className="w-4 h-4 text-sky-400 fill-sky-400/20 animate-pulse" />
                        ) : (
                          <Circle className="w-4 h-4 text-slate-600" />
                        )}
                      </span>

                      <span className="flex-1 truncate">{lesson.title}</span>

                      {lesson.duration_minutes > 0 && (
                        <span className="text-[10px] text-slate-500 shrink-0">
                          {lesson.duration_minutes}m
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* MAIN VIEWPORT */}
      <main className="flex-1 flex flex-col overflow-y-auto min-w-0">
        {/* Instructor Preview Banner */}
        {isInstructor && (
          <div className="bg-sky-950/80 border-b border-sky-500/30 px-4 sm:px-6 py-2 flex items-center justify-between text-xs text-sky-200 shrink-0">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-sky-400 shrink-0" />
              <span>
                <strong className="text-white">Instructor Preview Mode:</strong> Reviewing published lessons, interactive quizzes, and course projects.
              </span>
            </div>
            <Link to={`/instructor/courses/${courseId}/edit`}>
              <Button variant="ghost" size="sm" className="text-xs text-sky-300 hover:text-white py-0.5 h-auto">
                Back to Studio
              </Button>
            </Link>
          </div>
        )}

        {/* Top Control Bar */}
        <div className="h-14 px-4 sm:px-6 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white lg:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>

            <h3 className="text-sm sm:text-base font-bold text-white truncate max-w-md">
              {currentLesson ? currentLesson.title : 'Select a lesson'}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {isInstructor ? (
              <Badge variant="info">Instructor Preview</Badge>
            ) : (
              <Button
                variant={isCurrentCompleted ? 'secondary' : 'success'}
                size="sm"
                isLoading={completing}
                onClick={handleMarkComplete}
                leftIcon={<Check className="w-4 h-4" />}
              >
                {isCurrentCompleted ? 'Completed' : 'Mark as Complete'}
              </Button>
            )}
          </div>
        </div>

        {/* Content Viewer */}
        <div className="p-4 sm:p-8 space-y-8 flex-1 max-w-5xl w-full mx-auto">
          {/* Course Completion Banner */}
          {courseProgress?.is_completed && (
            <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-sky-950/80 border border-emerald-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                    Course Requirements Completed!
                    <Badge variant="success">100% Finished</Badge>
                  </h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    You have finished all lessons, passed all quizzes, and submitted all project deliverables. You can now leave a course review!
                  </p>
                </div>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setActiveTab('reviews')}
                leftIcon={<Star className="w-4 h-4 text-amber-400 fill-amber-400" />}
                className="shrink-0"
              >
                Write Review
              </Button>
            </div>
          )}

          {currentLesson ? (
            <div className="space-y-6">
              {/* Media Player Container */}
              {currentLesson.video_url && (
                <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl">
                  <iframe
                    src={getEmbedVideoUrl(currentLesson.video_url)}
                    title={currentLesson.title}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              )}

              {/* ARTICLE Content */}
              {currentLesson.article_content && (
                <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-4">
                  <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                    <FileText className="w-4 h-4" />
                    Interactive Article Reading
                  </div>
                  <div className="prose prose-invert max-w-none text-sm sm:text-base text-slate-200 leading-relaxed whitespace-pre-line">
                    {currentLesson.article_content}
                  </div>
                </div>
              )}
              {/* DOCUMENT Resource */}
              {currentLesson.content_type === 'DOCUMENT' && (
                <div className="glass-panel p-8 rounded-3xl border border-slate-800 text-center space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
                    <FileCode className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-lg font-bold text-white">Downloadable Lesson Document</h4>
                    <p className="text-xs text-slate-400">Access supplementary slides, cheat sheets, or datasets.</p>
                  </div>
                  {currentLesson.document ? (
                    <a
                      href={currentLesson.document}
                      target="_blank"
                      rel="noreferrer"
                      download
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold shadow-glow-sm"
                    >
                      <Download className="w-4 h-4" />
                      Download Resource
                    </a>
                  ) : (
                    <p className="text-xs text-slate-500 italic">No document file attached.</p>
                  )}
                </div>
              )}

              {/* EXTERNAL Resource */}
              {currentLesson.content_type === 'EXTERNAL' && (
                <div className="glass-panel p-8 rounded-3xl border border-slate-800 text-center space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center mx-auto text-purple-400">
                    <ExternalLink className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-lg font-bold text-white">External Interactive Sandbox</h4>
                    <p className="text-xs text-slate-400">Open external lab, GitHub repository, or documentation.</p>
                  </div>
                  {currentLesson.external_url ? (
                    <a
                      href={currentLesson.external_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold shadow-glow-sm"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Launch External Resource
                    </a>
                  ) : (
                    <p className="text-xs text-slate-500 italic">No external link provided.</p>
                  )}
                </div>
              )}

              {/* Lesson Navigation Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                {prevLesson ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => selectLesson(prevLesson)}
                    leftIcon={<ChevronLeft className="w-4 h-4" />}
                  >
                    Previous: {prevLesson.title}
                  </Button>
                ) : (
                  <div />
                )}

                {nextLesson && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => selectLesson(nextLesson)}
                    rightIcon={<ChevronRight className="w-4 h-4" />}
                  >
                    Next: {nextLesson.title}
                  </Button>
                )}
              </div>

              {/* TABS (Notes, Quizzes, Assignments, Reviews) */}
              <div className="pt-6 space-y-6">
                <div className="flex border-b border-slate-800 space-x-6 text-sm font-semibold">
                  <button
                    onClick={() => setActiveTab('notes')}
                    className={`pb-3 transition-colors border-b-2 flex items-center gap-2 ${activeTab === 'notes'
                      ? 'border-sky-400 text-sky-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                      }`}
                  >
                    <FileText className="w-4 h-4" />
                    Lesson Notes
                  </button>

                  <button
                    onClick={() => setActiveTab('quizzes')}
                    className={`pb-3 transition-colors border-b-2 flex items-center gap-2 ${activeTab === 'quizzes'
                      ? 'border-sky-400 text-sky-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                      }`}
                  >
                    <HelpCircle className="w-4 h-4" />
                    Quizzes ({lessonQuizzes.length})
                  </button>

                  <button
                    onClick={() => setActiveTab('assignments')}
                    className={`pb-3 transition-colors border-b-2 flex items-center gap-2 ${activeTab === 'assignments'
                      ? 'border-sky-400 text-sky-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                      }`}
                  >
                    <ClipboardList className="w-4 h-4" />
                    Assignments ({lessonAssignments.length})
                  </button>

                  <button
                    onClick={() => setActiveTab('reviews')}
                    className={`pb-3 transition-colors border-b-2 flex items-center gap-2 ${activeTab === 'reviews'
                      ? 'border-sky-400 text-sky-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                      }`}
                  >
                    <Star className="w-4 h-4" />
                    Course Reviews ({courseReviews.length})
                  </button>
                </div>

                {/* Tab: Lesson Notes */}
                {activeTab === 'notes' && (
                  <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3 text-sm text-slate-300">
                    <h4 className="font-bold text-white">Lesson Summary & Objectives</h4>
                    <p className="leading-relaxed">
                      {currentLesson.description || 'No specific description provided for this lesson.'}
                    </p>
                  </div>
                )}

                {/* Tab: Quizzes */}
                {activeTab === 'quizzes' && (
                  <div className="space-y-4">
                    {lessonQuizzes.length === 0 ? (
                      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-center text-xs text-slate-400">
                        No quizzes attached to this lesson.
                      </div>
                    ) : (
                      lessonQuizzes.map((quiz) => (
                        <div
                          key={quiz.id}
                          className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center justify-between"
                        >
                          <div className="space-y-1">
                            <h5 className="text-sm font-bold text-white">{quiz.title}</h5>
                            <p className="text-xs text-slate-400">
                              Passing Score: {quiz.passing_score}% • Time Limit: {quiz.time_limit_minutes}m
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStartQuiz(quiz)}
                            rightIcon={<PlayCircle className="w-4 h-4" />}
                          >
                            Take Quiz
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Tab: Assignments */}
                {activeTab === 'assignments' && (
                  <div className="space-y-4">
                    {lessonAssignments.length === 0 ? (
                      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-center text-xs text-slate-400">
                        No assignments attached to this lesson.
                      </div>
                    ) : (
                      lessonAssignments.map((assignment) => (
                        <div
                          key={assignment.id}
                          className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center justify-between"
                        >
                          <div className="space-y-1">
                            <h5 className="text-sm font-bold text-white">{assignment.title}</h5>
                            <p className="text-xs text-slate-400">
                              Max Marks: {assignment.max_marks} • Allowed: {assignment.allowed_extensions}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenAssignment(assignment)}
                            rightIcon={<UploadCloud className="w-4 h-4" />}
                          >
                            Submit Project
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Tab: Reviews */}
                {activeTab === 'reviews' && (
                  <div className="space-y-6">
                    {/* Completion Requirement Notice or Review Form */}
                    {!courseProgress?.is_completed ? (
                      <div className="glass-panel p-6 rounded-2xl border border-amber-500/30 bg-amber-500/5 space-y-3">
                        <div className="flex items-center gap-2.5 text-amber-400 font-bold text-sm">
                          <AlertCircle className="w-5 h-5 shrink-0" />
                          <span>Course Completion Required to Post a Review</span>
                        </div>
                        <p className="text-xs text-slate-300">
                          Course reviews and star ratings are unlocked once you complete all lessons, pass all quizzes, and submit all project assignments.
                        </p>
                        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                          <div className="flex justify-between font-semibold">
                            <span className="text-slate-400">Your Current Progress:</span>
                            <span className="text-sky-400 font-bold">{Math.round(courseProgress?.progress_percentage || 0)}%</span>
                          </div>
                          {courseProgress && (
                            <p className="text-[11px] text-slate-400">
                              Completed {courseProgress.completed_lessons} of {courseProgress.total_lessons} lessons • Passed {courseProgress.passed_quizzes} of {courseProgress.total_quizzes} quizzes • Submitted {courseProgress.submitted_assignments} of {courseProgress.total_assignments} projects
                            </p>
                          )}
                        </div>
                      </div>
                    ) : (
                      /* Add Review Form */
                      <form onSubmit={handleCreateReview} className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                          Rate & Review this Course
                        </h4>
                        <div className="flex items-center gap-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              type="button"
                              key={star}
                              onClick={() => setNewReview((prev) => ({ ...prev, rating: star }))}
                              className="p-1 text-amber-400 hover:scale-110 transition-transform"
                            >
                              <Star
                                className={`w-5 h-5 ${star <= newReview.rating ? 'fill-amber-400' : 'text-slate-600'
                                  }`}
                              />
                            </button>
                          ))}
                          <span className="text-xs font-semibold text-slate-300 ml-2">
                            {newReview.rating} of 5 Stars
                          </span>
                        </div>
                        <textarea
                          required
                          rows={3}
                          placeholder="Write your review and thoughts about the lessons..."
                          value={newReview.comment}
                          onChange={(e) => setNewReview((prev) => ({ ...prev, comment: e.target.value }))}
                          className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
                        />
                        <Button
                          type="submit"
                          variant="primary"
                          size="sm"
                          isLoading={submittingReview}
                          rightIcon={<Send className="w-3.5 h-3.5" />}
                        >
                          Post Review
                        </Button>
                      </form>
                    )}

                    {/* Review List */}
                    <div className="space-y-3">
                      {courseReviews.map((rev) => (
                        <div key={rev.id} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-200">{rev.user_name || 'Student'}</span>
                            <div className="flex items-center text-amber-400">
                              {Array.from({ length: rev.rating }).map((_, idx) => (
                                <Star key={idx} className="w-3 h-3 fill-amber-400" />
                              ))}
                            </div>
                          </div>
                          <p className="text-slate-300">{rev.comment}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-20 text-slate-400">Select a lesson to begin.</div>
          )}
        </div>
      </main>

      {/* QUIZ MODAL */}
      <Modal
        isOpen={Boolean(activeQuiz)}
        onClose={() => setActiveQuiz(null)}
        title={activeQuiz?.title || 'Take Quiz'}
        maxWidth="max-w-2xl"
      >
        {quizResult ? (
          <div className="space-y-6 text-center py-4">
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto ${quizResult.passed
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-glow-sm'
                : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                }`}
            >
              {quizResult.passed ? <CheckCircle2 className="w-8 h-8" /> : <AlertCircle className="w-8 h-8" />}
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-white">
                {quizResult.passed ? 'Quiz Passed!' : 'Attempt Completed'}
              </h3>
              <p className="text-base text-slate-300">
                Your Score: <span className="font-black text-2xl text-sky-400">{quizResult.score}%</span>
                <span className="text-xs text-slate-400 ml-2">(Passing Score: {activeQuiz?.passing_score}%)</span>
              </p>
              <div className="flex items-center justify-center gap-2 pt-1">
                <Badge variant={quizResult.passed ? 'success' : 'danger'}>
                  {quizResult.passed ? 'PASSED' : 'FAILED'}
                </Badge>
              </div>
            </div>

            {/* Answer Explanations List */}
            {quizResult.answers && quizResult.answers.length > 0 && (
              <div className="text-left space-y-3 pt-4 border-t border-slate-800 max-h-64 overflow-y-auto">
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">Review Questions & Explanations:</h5>
                {quizResult.answers.map((ans, i) => (
                  <div
                    key={i}
                    className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${ans.is_correct
                      ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200'
                      : 'bg-rose-950/40 border-rose-500/30 text-rose-200'
                      }`}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span>Question #{i + 1}: {ans.question?.prompt}</span>
                      <Badge variant={ans.is_correct ? 'success' : 'danger'}>
                        {ans.is_correct ? 'Correct' : 'Incorrect'}
                      </Badge>
                    </div>
                    {ans.selected_option && (
                      <p className="text-[11px] text-slate-300">
                        Your Selected Answer: {ans.question?.options?.find((o) => o.id === ans.selected_option)?.text || 'Option selected'}
                      </p>
                    )}
                    {!ans.is_correct && ans.correct_option_id && (
                      <p className="text-[11px] text-emerald-400 font-semibold">
                        Correct Answer: {ans.question?.options?.find((o) => o.id === ans.correct_option_id)?.text || 'Correct Option'}
                      </p>
                    )}
                    {ans.explanation && (
                      <p className="text-[11px] text-slate-300 italic font-normal bg-slate-900/60 p-2 rounded border border-slate-800">
                        Explanation: {ans.explanation}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              {!quizResult.passed && (
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => {
                    setQuizResult(null);
                    setQuizAnswers({});
                    handleStartQuiz(activeQuiz);
                  }}
                  className="flex-1"
                >
                  Retake Quiz
                </Button>
              )}
              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  setActiveQuiz(null);
                  setQuizResult(null);
                  setQuizAnswers({});
                }}
                className="flex-1"
              >
                Close Results
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-1 text-xs text-slate-400">
              <p>{activeQuiz?.description || 'Test your knowledge on this lesson.'}</p>
              <div className="flex items-center justify-between font-semibold pt-1">
                <span className="text-sky-400">
                  Passing Score: {activeQuiz?.passing_score}% {activeQuiz?.time_limit_minutes > 0 ? `• Time Limit: ${activeQuiz.time_limit_minutes}m` : ''}
                </span>
                <span className="text-slate-400">
                  {Object.keys(quizAnswers).length} / {activeQuiz?.questions?.length || 0} Answered
                </span>
              </div>
            </div>

            {/* Questions List */}
            {(!activeQuiz?.questions || activeQuiz.questions.length === 0) ? (
              <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-2">
                <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
                <h4 className="text-sm font-bold text-white">No questions available</h4>
                <p className="text-xs text-slate-400">This quiz has not been configured with questions yet. Please check back later or add questions in the Course Studio.</p>
              </div>
            ) : (
              <>
                <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-1">
                  {activeQuiz.questions.map((q, qIndex) => (
                    <div key={q.id} className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                      <h5 className="text-sm font-bold text-slate-100 flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2">
                          <span className="w-5 h-5 rounded-md bg-sky-500/10 text-sky-400 text-xs flex items-center justify-center shrink-0">
                            {qIndex + 1}
                          </span>
                          <span>{q.prompt}</span>
                        </div>
                        <span className="text-[11px] font-semibold text-sky-400/80 shrink-0">{q.points || 1} pt</span>
                      </h5>

                      {/* Options */}
                      <div className="space-y-2">
                        {q.options?.map((opt) => {
                          const isSelected = quizAnswers[q.id] === opt.id;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => handleSelectQuizOption(q.id, opt.id)}
                              className={`w-full p-3 rounded-xl border text-xs text-left transition-all flex items-center gap-3 ${isSelected
                                ? 'bg-sky-500/20 border-sky-500 text-sky-200 font-semibold'
                                : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                                }`}
                            >
                              <span
                                className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${isSelected ? 'border-sky-400 bg-sky-400' : 'border-slate-600'
                                  }`}
                              >
                                {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                              </span>
                              <span>{opt.text}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                <Button
                  variant="primary"
                  size="lg"
                  className="w-full"
                  isLoading={submittingQuiz}
                  onClick={handleSubmitQuiz}
                  rightIcon={<Send className="w-4 h-4" />}
                >
                  Submit Quiz Attempt ({Object.keys(quizAnswers).length} / {activeQuiz.questions.length} answered)
                </Button>
              </>
            )}
          </div>
        )}
      </Modal>

      {/* ASSIGNMENT SUBMISSION MODAL */}
      <Modal
        isOpen={Boolean(activeAssignment)}
        onClose={() => setActiveAssignment(null)}
        title={activeAssignment?.title || 'Assignment Submission'}
        maxWidth="max-w-2xl"
      >
        <div className="space-y-6">
          <div className="space-y-2 text-xs text-slate-300 bg-slate-950/80 p-4 rounded-xl border border-slate-800">
            <h5 className="font-bold text-white">Instructions:</h5>
            <p className="leading-relaxed whitespace-pre-line">{activeAssignment?.instructions}</p>
            <div className="pt-2 flex justify-between text-[11px] text-slate-400 border-t border-slate-800/80">
              <span>Max Marks: {activeAssignment?.max_marks}</span>
              <span>Allowed files: {activeAssignment?.allowed_extensions}</span>
            </div>
          </div>

          {/* Past Submissions list if any */}
          {mySubmissions.length > 0 && (
            <div className="space-y-2">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">Previous Submissions:</h5>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {mySubmissions.map((sub) => (
                  <div
                    key={sub.id}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between font-semibold">
                      <span className="text-slate-200">
                        Status: <Badge variant={sub.status === 'GRADED' ? 'success' : 'warning'}>{sub.status}</Badge>
                      </span>
                      {sub.grade !== null && (
                        <span className="text-sky-400 font-bold">
                          Grade: {sub.grade} / {activeAssignment?.max_marks}
                        </span>
                      )}
                    </div>
                    {sub.feedback && (
                      <p className="text-slate-400 italic text-[11px]">Instructor Feedback: {sub.feedback}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Submission Form */}
          <form onSubmit={handleSubmitAssignment} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Text Submission (GitHub URL / Code Notes)
              </label>
              <textarea
                rows={3}
                placeholder="Paste your GitHub repo URL or notes here..."
                value={assignmentText}
                onChange={(e) => setAssignmentText(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                File Submission (Optional)
              </label>
              <input
                type="file"
                onChange={(e) => setAssignmentFile(e.target.files?.[0] || null)}
                className="block w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-sky-500/10 file:text-sky-400 hover:file:bg-sky-500/20"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              isLoading={submittingAssignment}
              rightIcon={<UploadCloud className="w-4 h-4" />}
            >
              Upload & Submit Project
            </Button>
          </form>
        </div>
      </Modal>

      {/* Realtime Support Chat Drawer */}
      <SupportChatDrawer courseId={Number(courseId)} courseTitle={course?.title} />
    </div>
  );
};

export default CoursePlayer;
