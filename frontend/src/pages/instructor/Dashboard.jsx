import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import courseService from '../../services/courseService';
import assignmentService from '../../services/assignmentService';
import Loader from '../../components/common/Loader';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import {
  LayoutDashboard,
  PlusCircle,
  BookOpen,
  Edit,
  Globe,
  Archive,
  Trash2,
  ClipboardList,
  Sparkles,
  ExternalLink,
  Layers,
  Clock,
  AlertTriangle,
  PlayCircle,
  Users,
  CheckCircle2,
  Award,
  Megaphone,
  MessageSquare,
} from 'lucide-react';
import CreateAnnouncementModal from '../../components/notifications/CreateAnnouncementModal';

export const InstructorDashboard = () => {
  const { user } = useAuth();
  const toast = useToast();

  const [courses, setCourses] = useState([]);
  const [submissionsCount, setSubmissionsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState(null);

  // Announcement Modal State
  const [announcementModalOpen, setAnnouncementModalOpen] = useState(false);
  const [selectedCourseForAnnouncement, setSelectedCourseForAnnouncement] = useState(null);
  const [selectedStudentForAnnouncement, setSelectedStudentForAnnouncement] = useState(null);

  // Enrolled Students Modal State
  const [studentsModalOpen, setStudentsModalOpen] = useState(false);
  const [selectedCourseForStudents, setSelectedCourseForStudents] = useState(null);
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  const handleOpenStudentsModal = async (course) => {
    setSelectedCourseForStudents(course);
    setStudentsModalOpen(true);
    setLoadingStudents(true);
    try {
      const data = await courseService.getCourseStudents(course.id);
      setEnrolledStudents(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      const detail = err.response?.data?.detail || 'Failed to load enrolled students.';
      toast.error(detail, 'Error');
      setEnrolledStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  const fetchInstructorData = async () => {
    setLoading(true);
    try {
      // Backend /api/courses/ with no filter for instructors returns their courses or public list
      const [coursesData, subsData] = await Promise.all([
        courseService.getCourses(),
        assignmentService.getAllSubmissions().catch(() => []),
      ]);

      const courseList = Array.isArray(coursesData) ? coursesData : coursesData.results || [];
      // Filter instructor's own courses
      const myCourses = courseList.filter((c) => c.instructor === user?.id || !c.instructor || c.instructor_name === user?.full_name);
      setCourses(myCourses.length > 0 ? myCourses : courseList);

      const subsList = Array.isArray(subsData) ? subsData : subsData.results || [];
      const pendingGrading = subsList.filter((s) => s.status === 'SUBMITTED').length;
      setSubmissionsCount(pendingGrading);
    } catch (err) {
      toast.error('Failed to load instructor studio data.', 'Error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstructorData();
  }, [user]);

  const handlePublish = async (courseId) => {
    setActionInProgress(courseId);
    try {
      await courseService.publishCourse(courseId);
      toast.success('Course published successfully! It is now live in the catalog.', 'Published');
      fetchInstructorData();
    } catch (err) {
      const detail = err.response?.data?.detail || 'Unable to publish course. Ensure all required information is filled.';
      toast.error(detail, 'Publishing Failed');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleArchive = async (courseId) => {
    setActionInProgress(courseId);
    try {
      await courseService.archiveCourse(courseId);
      toast.success('Course archived.', 'Archived');
      fetchInstructorData();
    } catch (err) {
      const detail = err.response?.data?.detail || 'Unable to archive course.';
      toast.error(detail, 'Error');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleDelete = async (courseId) => {
    if (!window.confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      return;
    }
    setActionInProgress(courseId);
    try {
      await courseService.deleteCourse(courseId);
      toast.success('Course removed.', 'Deleted');
      setCourses((prev) => prev.filter((c) => c.id !== courseId));
    } catch (err) {
      const detail = err.response?.data?.detail || 'Failed to delete course.';
      toast.error(detail, 'Error');
    } finally {
      setActionInProgress(null);
    }
  };

  if (loading) {
    return <Loader fullPage message="Loading Instructor Studio..." />;
  }

  const publishedCount = courses.filter((c) => c.status === 'PUBLISHED').length;
  const draftCount = courses.filter((c) => c.status === 'DRAFT').length;

  return (
    <div className="space-y-8">
      {/* Studio Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-400 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            Instructor Studio
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Course Management</h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="secondary"
            size="md"
            onClick={() => {
              setSelectedCourseForAnnouncement(null);
              setSelectedStudentForAnnouncement(null);
              setAnnouncementModalOpen(true);
            }}
            leftIcon={<Megaphone className="w-4 h-4 text-amber-400" />}
          >
            Post Announcement
          </Button>
          <Link to="/instructor/messages">
            <Button variant="secondary" size="md" leftIcon={<MessageSquare className="w-4 h-4 text-sky-400" />}>
              Student Messages
            </Button>
          </Link>
          <Link to="/instructor/grading">
            <Button variant="secondary" size="md" leftIcon={<ClipboardList className="w-4 h-4 text-sky-400" />}>
              Gradebook
            </Button>
          </Link>
          <Link to="/instructor/courses/new">
            <Button variant="primary" size="md" rightIcon={<PlusCircle className="w-4 h-4" />}>
              Create New Course
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Courses</p>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-white">{courses.length}</span>
            <BookOpen className="w-5 h-5 text-sky-400" />
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Published Live</p>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-400">{publishedCount}</span>
            <Globe className="w-5 h-5 text-emerald-400" />
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Drafts</p>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-amber-400">{draftCount}</span>
            <Clock className="w-5 h-5 text-amber-400" />
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Pending Grading</p>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-rose-400">{submissionsCount}</span>
            <ClipboardList className="w-5 h-5 text-rose-400" />
          </div>
        </div>
      </div>

      {/* Course List Table / Cards */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white">Your Courses</h3>

        {courses.length === 0 ? (
          <div className="text-center py-16 space-y-4 glass-panel rounded-2xl border border-slate-800">
            <div className="w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center mx-auto text-sky-400">
              <BookOpen className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h4 className="text-lg font-bold text-white">No courses created yet</h4>
              <p className="text-xs text-slate-400">
                Start designing your first course curriculum with sections, lessons, and project assignments!
              </p>
            </div>
            <Link to="/instructor/courses/new" className="inline-block">
              <Button variant="primary" size="md">
                Launch Course Studio Builder
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {courses.map((course) => {
              const isWorking = actionInProgress === course.id;
              const statusVariant =
                course.status === 'PUBLISHED' ? 'success' : course.status === 'ARCHIVED' ? 'danger' : 'warning';

              return (
                <div
                  key={course.id}
                  className="glass-panel p-5 sm:p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:border-slate-700 transition-colors"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <Badge variant={statusVariant}>{course.status}</Badge>
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        {course.category_name || 'Category'}
                      </span>
                      <span className="text-xs text-slate-500">•</span>
                      <span className="text-xs text-slate-400 font-semibold">{course.level}</span>
                      <span className="text-xs text-slate-500">•</span>
                      <button
                        type="button"
                        onClick={() => handleOpenStudentsModal(course)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-sky-500/15 text-sky-300 border border-sky-500/30 hover:bg-sky-500/25 transition-all cursor-pointer"
                      >
                        <Users className="w-3.5 h-3.5 text-sky-400" />
                        <span>View Enrolled Students</span>
                      </button>
                    </div>

                    <h4 className="text-base font-bold text-white hover:text-sky-400 transition-colors">
                      <Link to={`/instructor/courses/${course.id}/edit`}>{course.title}</Link>
                    </h4>

                    <p className="text-xs text-slate-400 line-clamp-1">
                      {course.short_description || 'No short description provided.'}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-800">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedCourseForAnnouncement(course);
                        setSelectedStudentForAnnouncement(null);
                        setAnnouncementModalOpen(true);
                      }}
                      leftIcon={<Megaphone className="w-3.5 h-3.5 text-amber-400" />}
                      title="Post announcement to students enrolled in this course"
                      className="bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20 font-semibold"
                    >
                      Announce
                    </Button>

                    <Link to={`/instructor/courses/${course.id}/announcements`}>
                      <Button variant="secondary" size="sm" leftIcon={<Edit className="w-3.5 h-3.5" />}>
                        Manage Announcements
                      </Button>
                    </Link>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenStudentsModal(course)}
                      leftIcon={<Users className="w-4 h-4 text-sky-400" />}
                      className="bg-sky-500/15 border-sky-500/50 text-sky-200 hover:bg-sky-500/25 font-bold shadow-sm"
                    >
                      Enrolled Students
                    </Button>

                    <Link to={`/learner/courses/${course.id}/player`}>
                      <Button variant="primary" size="sm" leftIcon={<PlayCircle className="w-3.5 h-3.5" />}>
                        View Classroom
                      </Button>
                    </Link>

                    <Link to={`/instructor/courses/${course.id}/edit`}>
                      <Button variant="secondary" size="sm" leftIcon={<Edit className="w-3.5 h-3.5" />}>
                        Edit Curriculum
                      </Button>
                    </Link>

                    {course.status === 'DRAFT' && (
                      <Button
                        variant="success"
                        size="sm"
                        isLoading={isWorking}
                        onClick={() => handlePublish(course.id)}
                        leftIcon={<Globe className="w-3.5 h-3.5" />}
                      >
                        Publish
                      </Button>
                    )}

                    {course.status === 'PUBLISHED' && (
                      <Button
                        variant="outline"
                        size="sm"
                        isLoading={isWorking}
                        onClick={() => handleArchive(course.id)}
                        leftIcon={<Archive className="w-3.5 h-3.5" />}
                      >
                        Archive
                      </Button>
                    )}

                    <Link to={`/courses/${course.id}`} target="_blank">
                      <Button variant="ghost" size="sm" title="Preview Public Detail Page">
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </Link>

                    <Button
                      variant="danger"
                      size="sm"
                      isLoading={isWorking}
                      onClick={() => handleDelete(course.id)}
                      title="Delete Course"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ENROLLED STUDENTS MODAL */}
      <Modal
        isOpen={studentsModalOpen}
        onClose={() => setStudentsModalOpen(false)}
        title={`Enrolled Students: ${selectedCourseForStudents?.title || 'Course'}`}
        maxWidth="max-w-3xl"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs text-slate-400">
            <span>Registered learners in this course</span>
            <span className="font-bold text-sky-400">{enrolledStudents.length} Students Total</span>
          </div>

          {loadingStudents ? (
            <div className="py-12 flex justify-center">
              <Loader message="Loading enrolled student roster..." />
            </div>
          ) : enrolledStudents.length === 0 ? (
            <div className="p-8 text-center bg-slate-950/60 rounded-2xl border border-slate-800 space-y-2">
              <Users className="w-10 h-10 text-slate-600 mx-auto" />
              <h4 className="text-sm font-bold text-white">No Students Enrolled Yet</h4>
              <p className="text-xs text-slate-400">When learners enroll in this course, their details and progress will appear here.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {enrolledStudents.map((student) => (
                <div
                  key={student.id}
                  className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-400 font-bold flex items-center justify-center text-sm border border-sky-500/20">
                        {student.full_name?.charAt(0)?.toUpperCase() || 'S'}
                      </div>
                      <div>
                        <h5 className="text-sm font-bold text-white">{student.full_name}</h5>
                        <span className="text-xs text-slate-400">{student.email}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant={student.is_completed || student.status === 'COMPLETED' ? 'success' : 'info'}>
                        {student.is_completed || student.status === 'COMPLETED' ? 'Course Completed' : student.status}
                      </Badge>
                      <span className="text-[11px] text-slate-500">
                        Enrolled: {new Date(student.enrolled_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar & Breakdown */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-400">Classroom Progress</span>
                      <span className="text-sky-400 font-bold">{Math.round(student.progress_percentage)}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(0, student.progress_percentage))}%` }}
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 pt-0.5">
                      <span>Lessons: {student.completed_lessons} / {student.total_lessons}</span>
                      <span>• Quizzes: {student.passed_quizzes} / {student.total_quizzes} passed</span>
                      <span>• Projects: {student.submitted_assignments} / {student.total_assignments} submitted</span>
                    </div>

                    {/* Student Actions */}
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-900">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-amber-400 hover:text-amber-300"
                        leftIcon={<Megaphone className="w-3.5 h-3.5" />}
                        onClick={() => {
                          setSelectedCourseForAnnouncement(selectedCourseForStudents);
                          setSelectedStudentForAnnouncement({
                            id: student.learner_id || student.id,
                            first_name: student.full_name,
                          });
                          setAnnouncementModalOpen(true);
                        }}
                      >
                        Send Notice
                      </Button>
                      <Link
                        to={`/instructor/messages?courseId=${selectedCourseForStudents?.id}&studentId=${student.learner_id || student.id}`}
                      >
                        <Button
                          variant="primary"
                          size="sm"
                          className="text-xs"
                          leftIcon={<MessageSquare className="w-3.5 h-3.5" />}
                        >
                          Message Student
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* ANNOUNCEMENT MODAL */}
      <CreateAnnouncementModal
        isOpen={announcementModalOpen}
        onClose={() => {
          setAnnouncementModalOpen(false);
          setSelectedCourseForAnnouncement(null);
          setSelectedStudentForAnnouncement(null);
        }}
        preselectedCourse={selectedCourseForAnnouncement}
        preselectedStudent={selectedStudentForAnnouncement}
      />
    </div>
  );
};

export default InstructorDashboard;
