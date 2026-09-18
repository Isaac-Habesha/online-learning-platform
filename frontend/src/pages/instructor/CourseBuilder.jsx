import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import courseService from '../../services/courseService';
import categoryService from '../../services/categoryService';
import quizService from '../../services/quizService';
import assignmentService from '../../services/assignmentService';
import videoService from '../../services/videoService';
import Loader from '../../components/common/Loader';
import Button from '../../components/common/Button';
import QuizBuilder from '../../components/instructor/QuizBuilder';
import AssignmentBuilder from '../../components/instructor/AssignmentBuilder';
import VideoUpload from '../../components/instructor/VideoUpload';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import Badge from '../../components/common/Badge';
import {
  BookOpen,
  Layers,
  PlusCircle,
  Trash2,
  Edit,
  Save,
  Globe,
  UploadCloud,
  PlayCircle,
  FileText,
  FileCode,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ClipboardList,
  Sparkles,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  Eye,
  Users,
} from 'lucide-react';

export const CourseBuilder = () => {
  const { id } = useParams(); // If id exists -> Edit Mode; If no id -> Create Mode
  const isEditing = Boolean(id);

  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('info'); // 'info' | 'curriculum' | 'assessments' | 'publish'
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);

  // Course Details Form State
  const [courseForm, setCourseForm] = useState({
    title: '',
    short_description: '',
    description: '',
    category: '',
    level: 'BEGINNER',
    language: 'English',
    is_free: true,
    price: 0,
    requirements: '',
    learning_objectives: '',
    status: 'DRAFT',
  });
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState('');

  // Curriculum State
  const [sections, setSections] = useState([]);

  // Section Modal State
  const [sectionModalOpen, setSectionModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [sectionForm, setSectionForm] = useState({ title: '', description: '', order: 0 });

  // Lesson Modal State
  const [lessonModalOpen, setLessonModalOpen] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState(null);
  const [editingLesson, setEditingLesson] = useState(null);
  const [lessonForm, setLessonForm] = useState({
    title: '',
    description: '',
    content_type: 'VIDEO',
    video_type: 'EXTERNAL',
    video_url: '',
    article_content: '',
    external_url: '',
    duration_minutes: 10,
    order: 0,
    is_free_preview: false,
    is_published: true,
  });
  const [lessonDocumentFile, setLessonDocumentFile] = useState(null);
  const [lessonVideoFile, setLessonVideoFile] = useState(null);
  const [videoUploadModalOpen, setVideoUploadModalOpen] = useState(false);

  // Quiz Modal State
  const [quizModalOpen, setQuizModalOpen] = useState(false);
  const [quizForm, setQuizForm] = useState({
    lesson: '',
    title: '',
    description: '',
    passing_score: 75,
    time_limit_minutes: 15,
    max_attempts: 3,
    is_published: true,
    questions: [],
  });
  const [editingQuiz, setEditingQuiz] = useState(null);

  // Assignment Modal State
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
  const [assignmentForm, setAssignmentForm] = useState({
    lesson: '',
    section: '',
    title: '',
    instructions: '',
    max_marks: 100,
    allowed_extensions: 'pdf,zip,doc,docx,txt,png,jpg',
    is_published: true,
  });
  const [editingAssignment, setEditingAssignment] = useState(null);

  // Enrolled Students Modal State
  const [studentsModalOpen, setStudentsModalOpen] = useState(false);
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  const handleOpenStudentsModal = async () => {
    if (!id) return;
    setStudentsModalOpen(true);
    setLoadingStudents(true);
    try {
      const data = await courseService.getCourseStudents(id);
      setEnrolledStudents(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      const detail = err.response?.data?.detail || 'Failed to load enrolled students.';
      toast.error(detail, 'Error');
      setEnrolledStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  // Fetch Categories and Course Data
  useEffect(() => {
    const initData = async () => {
      try {
        const catData = await categoryService.getCategories();
        setCategories(Array.isArray(catData) ? catData : catData.results || []);

        if (isEditing) {
          const courseData = await courseService.getCourse(id);
          setCourseForm({
            title: courseData.title || '',
            short_description: courseData.short_description || '',
            description: courseData.description || '',
            category: courseData.category || '',
            level: courseData.level || 'BEGINNER',
            language: courseData.language || 'English',
            is_free: courseData.is_free ?? true,
            price: courseData.price || 0,
            requirements: courseData.requirements || '',
            learning_objectives: courseData.learning_objectives || '',
            status: courseData.status || 'DRAFT',
          });
          if (courseData.thumbnail) {
            setThumbnailPreview(courseData.thumbnail);
          }

          // Fetch Sections & Lessons
          await refreshCurriculum(id);
        }
      } catch (err) {
        toast.error('Failed to initialize Course Studio.', 'Error');
      } finally {
        setLoading(false);
      }
    };

    initData();
  }, [id, isEditing]);

  const refreshCurriculum = async (courseId) => {
    try {
      const secData = await courseService.getSections(courseId);
      const secList = Array.isArray(secData) ? secData : secData.results || [];

      // Load lessons and their assessments together so instructors can manage them.
      const sectionsWithLessons = await Promise.all(
        secList.map(async (sec) => {
          try {
            const lessonsData = await courseService.getLessons(sec.id);
            const lessons = Array.isArray(lessonsData) ? lessonsData : lessonsData.results || [];
            const lessonsWithAssessments = await Promise.all(lessons.map(async (lesson) => {
              const [quizData, assignmentData] = await Promise.all([
                quizService.getQuizzes({ lesson: lesson.id }).catch(() => []),
                assignmentService.getAssignments({ lesson: lesson.id }).catch(() => []),
              ]);
              const quizzes = Array.isArray(quizData) ? quizData : quizData.results || [];
              const assignments = Array.isArray(assignmentData) ? assignmentData : assignmentData.results || [];
              return { ...lesson, quiz: quizzes[0] || null, assignments };
            }));
            return {
              ...sec,
              lessons: lessonsWithAssessments,
            };
          } catch {
            return { ...sec, lessons: [] };
          }
        })
      );
      setSections(sectionsWithLessons);
    } catch (err) {
      console.warn('Failed to load curriculum sections:', err);
    }
  };

  const handleCourseFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCourseForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleThumbnailChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnailFile(file);
      setThumbnailPreview(URL.createObjectURL(file));
    }
  };

  // --- SAVE COURSE DETAILS (Step 1) ---
  const handleSaveCourseInfo = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('title', courseForm.title);
      formData.append('short_description', courseForm.short_description);
      formData.append('description', courseForm.description);
      if (courseForm.category) formData.append('category', courseForm.category);
      formData.append('level', courseForm.level);
      formData.append('language', courseForm.language);
      formData.append('is_free', courseForm.is_free);
      formData.append('price', courseForm.is_free ? 0 : courseForm.price);
      formData.append('requirements', courseForm.requirements);
      formData.append('learning_objectives', courseForm.learning_objectives);

      if (thumbnailFile) {
        formData.append('thumbnail', thumbnailFile);
      }

      if (isEditing) {
        const updated = await courseService.updateCourse(id, formData);
        setCourseForm((prev) => ({ ...prev, ...updated }));
        toast.success('Course information updated!', 'Saved');
      } else {
        const created = await courseService.createCourse(formData);
        toast.success('Course created! Now you can structure sections and lessons.', 'Created');
        navigate(`/instructor/courses/${created.id}/edit`, { replace: true });
        setActiveTab('curriculum');
      }
    } catch (err) {
      const detail = err.response?.data?.detail || JSON.stringify(err.response?.data) || 'Failed to save course.';
      toast.error(detail, 'Save Error');
    } finally {
      setSaving(false);
    }
  };

  // --- SECTION ACTIONS ---
  const handleOpenSectionModal = (section = null) => {
    if (section) {
      setEditingSection(section);
      setSectionForm({
        title: section.title,
        description: section.description || '',
        order: section.order || 0,
      });
    } else {
      setEditingSection(null);
      setSectionForm({
        title: '',
        description: '',
        order: sections.length,
      });
    }
    setSectionModalOpen(true);
  };

  const handleSaveSection = async (e) => {
    e.preventDefault();
    if (!id) return;
    try {
      if (editingSection) {
        await courseService.updateSection(editingSection.id, sectionForm);
        toast.success('Section updated!', 'Saved');
      } else {
        await courseService.createSection(id, sectionForm);
        toast.success('New section added to curriculum!', 'Added');
      }
      setSectionModalOpen(false);
      refreshCurriculum(id);
    } catch (err) {
      const detail = err.response?.data?.detail || 'Failed to save section.';
      toast.error(detail, 'Error');
    }
  };

  const handleDeleteSection = async (sectionId) => {
    if (!window.confirm('Delete this section and all of its lessons?')) return;
    try {
      await courseService.deleteSection(sectionId);
      toast.success('Section deleted.', 'Removed');
      refreshCurriculum(id);
    } catch (err) {
      toast.error('Failed to delete section.', 'Error');
    }
  };

  // --- LESSON ACTIONS ---
  const handleOpenLessonModal = (sectionId, lesson = null) => {
    setActiveSectionId(sectionId);
    if (lesson) {
      setEditingLesson(lesson);
      setLessonForm({
        title: lesson.title,
        description: lesson.description || '',
        content_type: lesson.content_type || 'VIDEO',
        video_type: lesson.video_type || 'EXTERNAL',
        video_url: lesson.video_url || '',
        article_content: lesson.article_content || '',
        external_url: lesson.external_url || '',
        duration_minutes: lesson.duration_minutes || 10,
        order: lesson.order || 0,
        is_free_preview: lesson.is_free_preview || false,
        is_published: lesson.is_published ?? true,
      });
      setLessonDocumentFile(null);
      setLessonVideoFile(null);
    } else {
      const targetSec = sections.find((s) => s.id === sectionId);
      setEditingLesson(null);
      setLessonForm({
        title: '',
        description: '',
        content_type: 'VIDEO',
        video_type: 'EXTERNAL',
        video_url: '',
        article_content: '',
        external_url: '',
        duration_minutes: 10,
        order: targetSec?.lessons?.length || 0,
        is_free_preview: false,
        is_published: true,
      });
      setLessonDocumentFile(null);
      setLessonVideoFile(null);
    }
    setLessonModalOpen(true);
  };

  const handleSaveLesson = async (e) => {
    e.preventDefault();
    if (!activeSectionId) return;

    try {
      const formData = new FormData();
      formData.append('title', lessonForm.title);
      formData.append('description', lessonForm.description);
      formData.append('content_type', lessonForm.content_type);
      formData.append('video_type', lessonForm.video_type);
      formData.append('duration_minutes', lessonForm.duration_minutes);
      formData.append('order', lessonForm.order);
      formData.append('is_free_preview', lessonForm.is_free_preview);
      formData.append('is_published', lessonForm.is_published);

      if (lessonForm.content_type === 'VIDEO') {
        if (lessonForm.video_type === 'EXTERNAL') {
          formData.append('video_url', lessonForm.video_url);
        }
        // For HOSTED video, the video will be uploaded separately
      } else if (lessonForm.content_type === 'ARTICLE') {
        formData.append('article_content', lessonForm.article_content);
      } else if (lessonForm.content_type === 'DOCUMENT') {
        if (lessonDocumentFile) {
          formData.append('document', lessonDocumentFile);
        }
      } else if (lessonForm.content_type === 'EXTERNAL') {
        formData.append('external_url', lessonForm.external_url);
      }

      let savedLesson;
      if (editingLesson) {
        savedLesson = await courseService.updateLesson(editingLesson.id, formData);
        toast.success('Lesson updated!', 'Saved');
      } else {
        savedLesson = await courseService.createLesson(activeSectionId, formData);
        toast.success('New lesson added!', 'Added');
      }

      // Handle video upload for HOSTED video type
      if (lessonForm.content_type === 'VIDEO' && lessonForm.video_type === 'HOSTED' && lessonVideoFile) {
        try {
          // Validate video file
          const validation = videoService.validateVideoFile(lessonVideoFile);
          if (!validation.isValid) {
            toast.error(validation.error, 'Video Error');
            return;
          }

          // Upload video
          console.log('Starting video upload for lesson:', savedLesson.id);
          const uploadResponse = await videoService.uploadVideo(savedLesson.id, lessonVideoFile);
          console.log('Video upload successful:', uploadResponse);
          toast.success('Video uploaded successfully!', 'Success');
          setLessonVideoFile(null);
        } catch (videoErr) {
          console.error('Video upload error:', videoErr);
          console.error('Error response:', videoErr.response);
          const errorMsg = videoErr.response?.data?.detail || videoErr.message || 'Unknown error';
          toast.error(`Video upload failed: ${errorMsg}. You can upload it later from the lesson edit.`, 'Video Upload Error');
        }
      }

      setLessonModalOpen(false);
      refreshCurriculum(id);
    } catch (err) {
      const detail =
        err.response?.data?.detail ||
        err.response?.data?.video_url?.[0] ||
        err.response?.data?.article_content?.[0] ||
        err.response?.data?.document?.[0] ||
        'Failed to save lesson.';
      toast.error(detail, 'Lesson Error');
    }
  };

  const handleDeleteLesson = async (lessonId) => {
    if (!window.confirm('Delete this lesson?')) return;
    try {
      await courseService.deleteLesson(lessonId);
      toast.success('Lesson deleted.', 'Removed');
      refreshCurriculum(id);
    } catch (err) {
      toast.error('Failed to delete lesson.', 'Error');
    }
  };

  // --- QUIZ ACTIONS ---
  // --- QUIZ ACTIONS ---
  const handleSaveQuiz = async (e) => {
    e.preventDefault();
    try {
      const sanitizedQuestions = (quizForm.questions || []).map((q, qIdx) => ({
        id: q.id,
        prompt: q.prompt,
        question_type: q.question_type || 'MCQ',
        points: Number(q.points) || 1,
        order: Number(q.order) || (qIdx + 1),
        explanation: q.explanation || '',
        options: (q.options || []).map((opt, optIdx) => ({
          id: opt.id,
          text: opt.text,
          order: Number(opt.order) || (optIdx + 1),
          is_correct: Boolean(opt.is_correct),
        })),
      }));

      const payload = {
        lesson: Number(quizForm.lesson),
        title: quizForm.title,
        description: quizForm.description,
        passing_score: Number(quizForm.passing_score),
        time_limit_minutes: Number(quizForm.time_limit_minutes),
        max_attempts: Number(quizForm.max_attempts),
        is_published: quizForm.is_published,
        questions: sanitizedQuestions,
      };

      if (editingQuiz) {
        await quizService.updateQuiz(editingQuiz.id, payload);
        toast.success('Quiz and all questions updated successfully!', 'Quiz Saved');
      } else {
        await quizService.createQuiz(payload);
        toast.success('Quiz and questions created for lesson!', 'Quiz Created');
      }
      setQuizModalOpen(false);
      setEditingQuiz(null);
      await refreshCurriculum(id);
    } catch (err) {
      const errData = err.response?.data;
      let detail = 'Failed to create quiz.';
      if (typeof errData === 'string') {
        detail = errData;
      } else if (errData?.detail) {
        detail = errData.detail;
      } else if (errData?.lesson) {
        detail = Array.isArray(errData.lesson) ? errData.lesson[0] : String(errData.lesson);
      } else if (errData?.title) {
        detail = Array.isArray(errData.title) ? `Title: ${errData.title[0]}` : `Title: ${errData.title}`;
      } else if (errData?.questions) {
        detail = Array.isArray(errData.questions) ? `Questions: ${JSON.stringify(errData.questions[0])}` : `Questions error`;
      } else if (errData && typeof errData === 'object') {
        const firstKey = Object.keys(errData)[0];
        detail = `${firstKey}: ${Array.isArray(errData[firstKey]) ? errData[firstKey][0] : errData[firstKey]}`;
      }
      toast.error(detail, 'Quiz Error');
    }
  };

  // --- ASSIGNMENT ACTIONS ---
  const handleSaveAssignment = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        title: assignmentForm.title,
        instructions: assignmentForm.instructions,
        max_marks: Number(assignmentForm.max_marks),
        allowed_extensions: assignmentForm.allowed_extensions,
        is_published: assignmentForm.is_published,
      };
      if (assignmentForm.lesson) payload.lesson = Number(assignmentForm.lesson);
      if (assignmentForm.section) payload.section = Number(assignmentForm.section);

      if (editingAssignment) {
        await assignmentService.updateAssignment(editingAssignment.id, payload);
        toast.success('Assignment updated.', 'Saved');
      } else {
        await assignmentService.createAssignment(payload);
        toast.success('Assignment project created!', 'Project Added');
      }
      setAssignmentModalOpen(false);
      setEditingAssignment(null);
      await refreshCurriculum(id);
    } catch (err) {
      const errData = err.response?.data;
      let detail = 'Failed to create assignment.';
      if (typeof errData === 'string') {
        detail = errData;
      } else if (errData?.detail) {
        detail = errData.detail;
      } else if (errData && typeof errData === 'object') {
        const firstKey = Object.keys(errData)[0];
        detail = `${firstKey}: ${Array.isArray(errData[firstKey]) ? errData[firstKey][0] : errData[firstKey]}`;
      }
      toast.error(detail, 'Assignment Error');
    }
  };

  const openQuizEditor = async (quiz) => {
    try {
      const fullQuiz = await quizService.getQuiz(quiz.id);
      setEditingQuiz(fullQuiz);
      setQuizForm({
        lesson: fullQuiz.lesson,
        title: fullQuiz.title || '',
        description: fullQuiz.description || '',
        passing_score: fullQuiz.passing_score ?? 75,
        time_limit_minutes: fullQuiz.time_limit_minutes ?? 0,
        max_attempts: fullQuiz.max_attempts ?? 3,
        is_published: fullQuiz.is_published ?? false,
        questions: fullQuiz.questions || [],
      });
      setQuizModalOpen(true);
    } catch {
      setEditingQuiz(quiz);
      setQuizForm({
        lesson: quiz.lesson,
        title: quiz.title || '',
        description: quiz.description || '',
        passing_score: quiz.passing_score ?? 75,
        time_limit_minutes: quiz.time_limit_minutes ?? 0,
        max_attempts: quiz.max_attempts ?? 3,
        is_published: quiz.is_published ?? false,
        questions: quiz.questions || [],
      });
      setQuizModalOpen(true);
    }
  };

  const handleCreateQuizForLesson = (lessonId) => {
    const allLessons = sections.flatMap((s) => s.lessons || []);
    const target = allLessons.find((l) => l.id === lessonId);
    if (target?.quiz) {
      openQuizEditor(target.quiz);
      return;
    }
    setEditingQuiz(null);
    setQuizForm({
      lesson: lessonId,
      title: '',
      description: '',
      passing_score: 75,
      time_limit_minutes: 15,
      max_attempts: 3,
      is_published: true,
      questions: [],
    });
    setQuizModalOpen(true);
  };

  const openAssignmentEditor = async (assignment) => {
    try {
      const fullAssignment = await assignmentService.getAssignment(assignment.id);
      setEditingAssignment(fullAssignment);
      setAssignmentForm({
        lesson: fullAssignment.lesson || '',
        section: fullAssignment.section || '',
        title: fullAssignment.title || '',
        instructions: fullAssignment.instructions || '',
        max_marks: fullAssignment.max_marks ?? 100,
        allowed_extensions: fullAssignment.allowed_extensions || '',
        is_published: fullAssignment.is_published ?? false,
      });
      setAssignmentModalOpen(true);
    } catch {
      setEditingAssignment(assignment);
      setAssignmentForm({
        lesson: assignment.lesson || '',
        section: assignment.section || '',
        title: assignment.title || '',
        instructions: assignment.instructions || '',
        max_marks: assignment.max_marks ?? 100,
        allowed_extensions: assignment.allowed_extensions || '',
        is_published: assignment.is_published ?? false,
      });
      setAssignmentModalOpen(true);
    }
  };

  const handleCreateAssignmentForLesson = (lessonId) => {
    const allLessons = sections.flatMap((s) => s.lessons || []);
    const target = allLessons.find((l) => l.id === lessonId);
    if (target?.assignments?.length > 0) {
      openAssignmentEditor(target.assignments[0]);
      return;
    }
    setEditingAssignment(null);
    setAssignmentForm({
      lesson: lessonId,
      section: '',
      title: '',
      instructions: '',
      max_marks: 100,
      allowed_extensions: 'pdf,zip,doc,docx,txt,png,jpg',
      is_published: true,
    });
    setAssignmentModalOpen(true);
  };

  const handleDeleteQuiz = async (quiz) => {
    if (!window.confirm(`Delete quiz "${quiz.title}"?`)) return;
    try {
      await quizService.deleteQuiz(quiz.id);
      toast.success('Quiz deleted.', 'Removed');
      await refreshCurriculum(id);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to delete quiz.', 'Error');
    }
  };

  const handleDeleteAssignment = async (assignment) => {
    if (!window.confirm(`Delete assignment "${assignment.title}"?`)) return;
    try {
      await assignmentService.deleteAssignment(assignment.id);
      toast.success('Assignment deleted.', 'Removed');
      await refreshCurriculum(id);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to delete assignment.', 'Error');
    }
  };

  // --- PUBLISH ACTION ---
  const handlePublishCourse = async () => {
    if (!id) return;
    setSaving(true);
    try {
      await courseService.publishCourse(id);
      setCourseForm((prev) => ({ ...prev, status: 'PUBLISHED' }));
      toast.success('Course published! It is now accessible to learners in the catalog.', 'Published!');
      navigate('/instructor/dashboard');
    } catch (err) {
      const detail = err.response?.data?.detail || 'Unable to publish. Verify all required curriculum items are complete.';
      toast.error(detail, 'Publishing Error');
    } finally {
      setSaving(false);
    }
  };

  // Pre-flight checklist calculations
  const hasTitle = Boolean(courseForm.title.trim());
  const hasShortDesc = Boolean(courseForm.short_description.trim());
  const hasDesc = Boolean(courseForm.description.trim());
  const hasCategory = Boolean(courseForm.category);
  const hasObjectives = Boolean(courseForm.learning_objectives.trim());
  const hasSections = sections.length > 0;
  const totalLessonsCount = sections.reduce((acc, s) => acc + (s.lessons?.length || 0), 0);
  const hasLessons = totalLessonsCount > 0;
  const readyToPublish = hasTitle && hasShortDesc && hasDesc && hasCategory && hasObjectives && hasSections && hasLessons;

  if (loading) {
    return <Loader fullPage message="Loading Course Builder Studio..." />;
  }

  return (
    <div className="space-y-8">
      {/* Studio Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-400">Course Studio Builder</span>
            <Badge variant={courseForm.status === 'PUBLISHED' ? 'success' : 'warning'}>
              {courseForm.status}
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            {isEditing ? `Editing: ${courseForm.title || 'Untitled Course'}` : 'Create New Course'}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/instructor/dashboard">
            <Button variant="ghost" size="sm">
              Back to Studio
            </Button>
          </Link>
          {isEditing && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenStudentsModal}
                leftIcon={<Users className="w-4 h-4 text-sky-400" />}
                className="bg-sky-500/15 border-sky-500/40 text-sky-200 hover:bg-sky-500/25 font-bold shadow-sm"
              >
                Enrolled Students
              </Button>
              <Link to={`/learner/courses/${id}/player`}>
                <Button variant="primary" size="sm" rightIcon={<PlayCircle className="w-3.5 h-3.5" />}>
                  View Course Content (Classroom)
                </Button>
              </Link>
              <Link to={`/courses/${id}`} target="_blank">
                <Button variant="secondary" size="sm" rightIcon={<Eye className="w-3.5 h-3.5" />}>
                  Preview Public Page
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-800 space-x-6 text-sm font-semibold overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('info')}
          className={`pb-3.5 transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'info'
              ? 'border-sky-400 text-sky-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          1. Course Information & Settings
        </button>

        <button
          disabled={!isEditing}
          onClick={() => setActiveTab('curriculum')}
          className={`pb-3.5 transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed ${
            activeTab === 'curriculum'
              ? 'border-sky-400 text-sky-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          2. Curriculum & Lessons ({totalLessonsCount})
        </button>

        <button
          disabled={!isEditing}
          onClick={() => setActiveTab('assessments')}
          className={`pb-3.5 transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed ${
            activeTab === 'assessments'
              ? 'border-sky-400 text-sky-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          3. Quizzes & Assignments
        </button>

        <button
          disabled={!isEditing}
          onClick={() => setActiveTab('publish')}
          className={`pb-3.5 transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed ${
            activeTab === 'publish'
              ? 'border-sky-400 text-sky-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          4. Publishing & Validation
        </button>
      </div>

      {/* TAB 1: COURSE INFORMATION */}
      {activeTab === 'info' && (
        <form onSubmit={handleSaveCourseInfo} className="space-y-6 max-w-4xl">
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
            <h3 className="text-lg font-bold text-white">General Information</h3>

            <Input
              label="Course Title"
              name="title"
              required
              placeholder="e.g. Modern Full-Stack Web Development with React & Django"
              value={courseForm.title}
              onChange={handleCourseFormChange}
            />

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Short Description (Card Summary) <span className="text-rose-400">*</span>
              </label>
              <textarea
                name="short_description"
                required
                rows={2}
                maxLength={500}
                placeholder="Brief summary appearing on catalog cards..."
                value={courseForm.short_description}
                onChange={handleCourseFormChange}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Full Course Description <span className="text-rose-400">*</span>
              </label>
              <textarea
                name="description"
                required
                rows={5}
                placeholder="Detailed curriculum overview and goals..."
                value={courseForm.description}
                onChange={handleCourseFormChange}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Category <span className="text-rose-400">*</span>
                </label>
                <select
                  name="category"
                  required
                  value={courseForm.category}
                  onChange={handleCourseFormChange}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Skill Level
                </label>
                <select
                  name="level"
                  value={courseForm.level}
                  onChange={handleCourseFormChange}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                >
                  <option value="BEGINNER">Beginner</option>
                  <option value="INTERMEDIATE">Intermediate</option>
                  <option value="ADVANCED">Advanced</option>
                </select>
              </div>

              <Input
                label="Language"
                name="language"
                value={courseForm.language}
                onChange={handleCourseFormChange}
              />
            </div>

            {/* Pricing Section */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_free"
                  name="is_free"
                  checked={courseForm.is_free}
                  onChange={handleCourseFormChange}
                  className="w-4 h-4 rounded text-sky-500 bg-slate-900 border-slate-700 focus:ring-sky-500"
                />
                <label htmlFor="is_free" className="text-xs font-bold text-slate-200 cursor-pointer">
                  This is a Free Course (Price = $0)
                </label>
              </div>

              {!courseForm.is_free && (
                <div className="max-w-xs">
                  <Input
                    label="Price ($ USD)"
                    type="number"
                    step="0.01"
                    min="1"
                    name="price"
                    value={courseForm.price}
                    onChange={handleCourseFormChange}
                  />
                </div>
              )}
            </div>

            {/* Learning Objectives & Requirements */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Learning Objectives (1 per line) <span className="text-rose-400">*</span>
                </label>
                <textarea
                  name="learning_objectives"
                  rows={4}
                  required
                  placeholder="• Build scalable React interfaces&#10;• Connect to REST API endpoints&#10;• Deploy with high reliability"
                  value={courseForm.learning_objectives}
                  onChange={handleCourseFormChange}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Prerequisites & Requirements (1 per line)
                </label>
                <textarea
                  name="requirements"
                  rows={4}
                  placeholder="• Basic JavaScript fundamentals&#10;• Code editor (VS Code)&#10;• Web browser"
                  value={courseForm.requirements}
                  onChange={handleCourseFormChange}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            {/* Course Thumbnail Upload */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Course Thumbnail Image
              </label>
              <div className="flex items-center gap-6">
                <div className="w-40 aspect-video rounded-xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center">
                  {thumbnailPreview ? (
                    <img src={thumbnailPreview} alt="Thumbnail preview" className="w-full h-full object-cover" />
                  ) : (
                    <UploadCloud className="w-8 h-8 text-slate-600" />
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailChange}
                  className="text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-sky-500/10 file:text-sky-400 hover:file:bg-sky-500/20"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              isLoading={saving}
              rightIcon={<Save className="w-4 h-4" />}
            >
              {isEditing ? 'Save Changes' : 'Create Course & Proceed to Curriculum'}
            </Button>
          </div>
        </form>
      )}

      {/* TAB 2: CURRICULUM & LESSONS */}
      {activeTab === 'curriculum' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">Curriculum Sections & Lessons</h3>
              <p className="text-xs text-slate-400">
                Organize your course into structured sections and rich interactive lessons.
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleOpenSectionModal()}
              leftIcon={<PlusCircle className="w-4 h-4" />}
            >
              Add Section
            </Button>
          </div>

          {sections.length === 0 ? (
            <div className="text-center py-16 space-y-4 glass-panel rounded-2xl border border-slate-800">
              <div className="w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center mx-auto text-sky-400">
                <Layers className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-white">Curriculum is currently empty</h4>
                <p className="text-xs text-slate-400">Add your first section to start adding lessons.</p>
              </div>
              <Button variant="primary" size="sm" onClick={() => handleOpenSectionModal()}>
                Create First Section
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {sections.map((section, secIndex) => (
                <div key={section.id} className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
                  {/* Section Bar */}
                  <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-lg bg-sky-500/10 text-sky-400 font-bold text-xs flex items-center justify-center">
                        {secIndex + 1}
                      </span>
                      <div>
                        <h4 className="text-sm font-bold text-white">{section.title}</h4>
                        {section.description && (
                          <p className="text-xs text-slate-400">{section.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleOpenLessonModal(section.id)}
                        leftIcon={<PlusCircle className="w-3.5 h-3.5" />}
                      >
                        Add Lesson
                      </Button>
                      <button
                        onClick={() => handleOpenSectionModal(section)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                        title="Edit Section"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteSection(section.id)}
                        className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                        title="Delete Section"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Lessons in this Section */}
                  <div className="divide-y divide-slate-800/60 p-2">
                    {section.lessons?.length === 0 ? (
                      <p className="text-xs text-slate-500 py-4 text-center italic">
                        No lessons in this section. Click "Add Lesson" above.
                      </p>
                    ) : (
                      section.lessons?.map((lesson, lessonIndex) => (
                        <div
                          key={lesson.id}
                          className="p-3 rounded-xl flex items-center justify-between hover:bg-slate-900/60 transition-colors text-xs"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-slate-500 font-mono text-[11px]">{lessonIndex + 1}.</span>
                            {lesson.content_type === 'VIDEO' && <PlayCircle className="w-4 h-4 text-sky-400" />}
                            {lesson.content_type === 'ARTICLE' && <FileText className="w-4 h-4 text-amber-400" />}
                            {lesson.content_type === 'DOCUMENT' && <FileCode className="w-4 h-4 text-emerald-400" />}
                            {lesson.content_type === 'EXTERNAL' && <ExternalLink className="w-4 h-4 text-purple-400" />}

                            <div>
                              <span className="font-semibold text-slate-200 block">{lesson.title}</span>
                              <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                                <span>Type: {lesson.content_type}</span>
                                {lesson.duration_minutes > 0 && <span>• {lesson.duration_minutes}m</span>}
                                {lesson.is_free_preview && (
                                  <span className="text-emerald-400 font-bold">• Free Preview</span>
                                )}
                              </div>

                              {/* Assessment Status Row */}
                              <div className="flex flex-wrap items-center gap-2 mt-2">
                                {lesson.quiz ? (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-950/60 border border-sky-500/30 text-sky-300 text-[11px] font-medium">
                                    <HelpCircle className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                                    <span>Quiz: {lesson.quiz.title} ({lesson.quiz.questions?.length || 0} Qs)</span>
                                    <button
                                      onClick={() => openQuizEditor(lesson.quiz)}
                                      className="text-sky-400 hover:text-white underline font-semibold ml-1"
                                      title="Edit Quiz"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => handleDeleteQuiz(lesson.quiz)}
                                      className="text-rose-400 hover:text-rose-300 ml-1"
                                      title="Delete Quiz"
                                    >
                                      <Trash2 className="w-3 h-3 inline" />
                                    </button>
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => handleCreateQuizForLesson(lesson.id)}
                                    className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-sky-400 px-2 py-0.5 rounded-lg border border-dashed border-slate-700 hover:border-sky-500/50 hover:bg-sky-500/5 transition"
                                  >
                                    <PlusCircle className="w-3 h-3" />
                                    Attach Quiz
                                  </button>
                                )}

                                {lesson.assignments && lesson.assignments.length > 0 ? (
                                  lesson.assignments.map((assignment) => (
                                    <span
                                      key={assignment.id}
                                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-[11px] font-medium"
                                    >
                                      <ClipboardList className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                      <span>Project: {assignment.title}</span>
                                      <button
                                        onClick={() => openAssignmentEditor(assignment)}
                                        className="text-emerald-400 hover:text-white underline font-semibold ml-1"
                                        title="Edit Assignment"
                                      >
                                        Edit
                                      </button>
                                      <button
                                        onClick={() => handleDeleteAssignment(assignment)}
                                        className="text-rose-400 hover:text-rose-300 ml-1"
                                        title="Delete Assignment"
                                      >
                                        <Trash2 className="w-3 h-3 inline" />
                                      </button>
                                    </span>
                                  ))
                                ) : (
                                  <button
                                    onClick={() => handleCreateAssignmentForLesson(lesson.id)}
                                    className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-emerald-400 px-2 py-0.5 rounded-lg border border-dashed border-slate-700 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition"
                                  >
                                    <PlusCircle className="w-3 h-3" />
                                    Attach Assignment
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {lesson.content_type === 'VIDEO' && (
                              <button
                                onClick={() => {
                                  setEditingLesson(lesson);
                                  setVideoUploadModalOpen(true);
                                }}
                                className="p-1.5 rounded-lg text-sky-400 hover:text-white hover:bg-sky-500/10"
                                title="Upload/Replace Video"
                              >
                                <UploadCloud className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => handleOpenLessonModal(section.id, lesson)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                              title="Edit Lesson"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteLesson(lesson.id)}
                              className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                              title="Delete Lesson"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: QUIZZES & ASSIGNMENTS */}
      {activeTab === 'assessments' && (
        <div className="space-y-8">
          {/* Quizzes Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-sky-400" />
                  Interactive Lesson Quizzes
                </h3>
                <p className="text-xs text-slate-400">
                  Attach multiple-choice tests with automated scoring to any lesson.
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setEditingQuiz(null);
                  setQuizForm((prev) => ({ ...prev, lesson: '', title: '', description: '', questions: [] }));
                  setQuizModalOpen(true);
                }}
                leftIcon={<PlusCircle className="w-4 h-4" />}
              >
                Create Quiz
              </Button>
            </div>
            <div className="space-y-3">
              {sections.flatMap((section) => section.lessons || []).flatMap((lesson) =>
                lesson.quiz ? [{ ...lesson.quiz, lessonTitle: lesson.title }] : []
              ).map((quiz) => (
                <div key={quiz.id} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-bold text-white truncate">{quiz.title}</h4>
                        <Badge variant={quiz.is_published ? 'success' : 'warning'}>
                          {quiz.is_published ? 'Published' : 'Draft'}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-400">
                        Lesson: <span className="text-slate-200 font-semibold">{quiz.lessonTitle}</span> • {quiz.questions?.length || 0} questions • Passing: {quiz.passing_score}% {quiz.time_limit_minutes > 0 ? `• Time Limit: ${quiz.time_limit_minutes}m` : ''} • Max attempts: {quiz.max_attempts}
                      </p>
                      {quiz.description && (
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">{quiz.description}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => openQuizEditor(quiz)}
                        leftIcon={<Edit className="w-3.5 h-3.5" />}
                      >
                        Edit Quiz & Questions
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDeleteQuiz(quiz)}
                        title="Delete quiz"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Question preview list */}
                  {quiz.questions && quiz.questions.length > 0 && (
                    <div className="pt-2 border-t border-slate-800/80 space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Configured Questions:</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {quiz.questions.map((q, qIdx) => (
                          <div key={q.id || qIdx} className="text-xs text-slate-300 bg-slate-900/60 px-2.5 py-1.5 rounded-lg border border-slate-800 flex items-center justify-between">
                            <span className="truncate">Q{qIdx + 1}: {q.prompt}</span>
                            <span className="text-[10px] text-sky-400 font-semibold shrink-0 ml-2">{q.points || 1} pt</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {sections.every((section) => !(section.lessons || []).some((lesson) => lesson.quiz)) && (
                <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-center text-xs text-slate-400">
                  No quizzes have been created for this course yet. Click "Create Quiz" above or attach a quiz to any lesson.
                </div>
              )}
            </div>
          </div>

          {/* Assignments Section */}
          <div className="space-y-4 pt-6 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-emerald-400" />
                  Hands-on Project Assignments
                </h3>
                <p className="text-xs text-slate-400">
                  Create project tasks with max marks, allowed file extensions, and instructions.
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setEditingAssignment(null);
                  setAssignmentForm((prev) => ({ ...prev, lesson: '', section: '', title: '', instructions: '' }));
                  setAssignmentModalOpen(true);
                }}
                leftIcon={<PlusCircle className="w-4 h-4" />}
              >
                Create Assignment
              </Button>
            </div>
            <div className="space-y-3">
              {sections.flatMap((section) => (section.lessons || []).flatMap((lesson) =>
                (lesson.assignments || []).map((assignment) => ({ ...assignment, lessonTitle: lesson.title }))
              )).map((assignment) => (
                <div key={assignment.id} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-bold text-white truncate">{assignment.title}</h4>
                      <Badge variant={assignment.is_published ? 'success' : 'warning'}>
                        {assignment.is_published ? 'Published' : 'Draft'}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-400">
                      Lesson: <span className="text-slate-200 font-semibold">{assignment.lessonTitle}</span> • Max marks: {assignment.max_marks} • Allowed files: {assignment.allowed_extensions || 'any'}
                    </p>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{assignment.instructions}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => openAssignmentEditor(assignment)}
                      leftIcon={<Edit className="w-3.5 h-3.5" />}
                    >
                      Edit Assignment
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDeleteAssignment(assignment)}
                      title="Delete assignment"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
              {sections.every((section) => !(section.lessons || []).some((lesson) => (lesson.assignments || []).length)) && (
                <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-center text-xs text-slate-400">
                  No assignments have been created for this course yet. Click "Create Assignment" above.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: PUBLISHING & VALIDATION */}
      {activeTab === 'publish' && (
        <div className="space-y-6 max-w-3xl">
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-sky-400" />
              Pre-flight Publishing Checklist
            </h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                <span className="font-semibold text-slate-200">1. Course Title Specified</span>
                {hasTitle ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                )}
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                <span className="font-semibold text-slate-200">2. Short & Full Description Added</span>
                {hasShortDesc && hasDesc ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                )}
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                <span className="font-semibold text-slate-200">3. Category Assigned</span>
                {hasCategory ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                )}
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                <span className="font-semibold text-slate-200">4. Learning Objectives Defined</span>
                {hasObjectives ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                )}
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                <span className="font-semibold text-slate-200">
                  5. Curriculum Has Sections & Lessons ({totalLessonsCount} Lessons)
                </span>
                {hasSections && hasLessons ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Current Course Status</p>
                <Badge variant={courseForm.status === 'PUBLISHED' ? 'success' : 'warning'}>
                  {courseForm.status}
                </Badge>
              </div>

              {courseForm.status === 'DRAFT' ? (
                <Button
                  variant="primary"
                  size="lg"
                  disabled={!readyToPublish}
                  isLoading={saving}
                  onClick={handlePublishCourse}
                  rightIcon={<Globe className="w-4 h-4" />}
                >
                  Publish Course to Catalog
                </Button>
              ) : (
                <div className="text-xs text-emerald-400 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Course is Live & Enrolling Students
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SECTION MODAL */}
      <Modal
        isOpen={sectionModalOpen}
        onClose={() => setSectionModalOpen(false)}
        title={editingSection ? 'Edit Curriculum Section' : 'Add New Section'}
      >
        <form onSubmit={handleSaveSection} className="space-y-4">
          <Input
            label="Section Title"
            required
            placeholder="e.g. Introduction & Environment Setup"
            value={sectionForm.title}
            onChange={(e) => setSectionForm((prev) => ({ ...prev, title: e.target.value }))}
          />
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Section Description (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="What this module covers..."
              value={sectionForm.description}
              onChange={(e) => setSectionForm((prev) => ({ ...prev, description: e.target.value }))}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>
          <Input
            label="Order Index"
            type="number"
            min="0"
            value={sectionForm.order}
            onChange={(e) => setSectionForm((prev) => ({ ...prev, order: Number(e.target.value) }))}
          />
          <Button type="submit" variant="primary" size="md" className="w-full">
            {editingSection ? 'Update Section' : 'Add Section'}
          </Button>
        </form>
      </Modal>

      {/* LESSON MODAL */}
      <Modal
        isOpen={lessonModalOpen}
        onClose={() => setLessonModalOpen(false)}
        title={editingLesson ? 'Edit Lesson' : 'Add New Lesson'}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSaveLesson} className="space-y-4">
          <Input
            label="Lesson Title"
            required
            placeholder="e.g. Setting Up Vite and Tailwind CSS"
            value={lessonForm.title}
            onChange={(e) => setLessonForm((prev) => ({ ...prev, title: e.target.value }))}
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Content Type
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { type: 'VIDEO', label: 'Video', icon: PlayCircle },
                { type: 'ARTICLE', label: 'Article', icon: FileText },
                { type: 'DOCUMENT', label: 'Document', icon: FileCode },
                { type: 'EXTERNAL', label: 'External', icon: ExternalLink },
              ].map((item) => {
                const Icon = item.icon;
                const active = lessonForm.content_type === item.type;
                return (
                  <button
                    type="button"
                    key={item.type}
                    onClick={() => setLessonForm((prev) => ({ ...prev, content_type: item.type }))}
                    className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 text-xs font-semibold transition-all ${
                      active
                        ? 'bg-sky-600 text-white border-sky-500 shadow-glow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Conditional Inputs based on Content Type */}
          {lessonForm.content_type === 'VIDEO' && (
            <div className="space-y-4">
              {/* Video Type Selection */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Video Source
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { type: 'EXTERNAL', label: 'External URL', description: 'YouTube, Vimeo, etc.' },
                    { type: 'HOSTED', label: 'Upload Video', description: 'Upload to cloud storage' },
                    { type: 'NONE', label: 'No Video', description: 'Remove video' },
                  ].map((item) => {
                    const active = lessonForm.video_type === item.type;
                    return (
                      <button
                        type="button"
                        key={item.type}
                        onClick={() => setLessonForm((prev) => ({ ...prev, video_type: item.type }))}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          active
                            ? 'bg-sky-600 text-white border-sky-500 shadow-glow-sm'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="text-xs font-semibold">{item.label}</div>
                        <div className="text-[10px] opacity-75 mt-0.5">{item.description}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* External Video URL Input */}
              {lessonForm.video_type === 'EXTERNAL' && (
                <Input
                  label="Video Embed URL (YouTube or Vimeo)"
                  type="url"
                  required
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={lessonForm.video_url}
                  onChange={(e) => setLessonForm((prev) => ({ ...prev, video_url: e.target.value }))}
                />
              )}

              {/* Hosted Video Upload */}
              {lessonForm.video_type === 'HOSTED' && (
                <div className="space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Upload Video File (MP4, WebM, MOV, AVI, MKV - Max 2GB)
                  </label>
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                    <input
                      type="file"
                      accept="video/mp4,video/webm,video/quicktime,video/x-msvideo,video/x-matroska,.mp4,.webm,.mov,.avi,.mkv"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          // Validate that it's actually a video file
                          if (!file.type.startsWith('video/')) {
                            toast.error('Only video files are allowed. Please select a valid video file.', 'Invalid File');
                            e.target.value = ''; // Clear the input
                            return;
                          }
                          setLessonVideoFile(file);
                        } else {
                          setLessonVideoFile(null);
                        }
                      }}
                      className="block w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-sky-500/10 file:text-sky-400 hover:file:bg-sky-500/20"
                    />
                    {lessonVideoFile && (
                      <div className="mt-2 text-xs text-sky-400">
                        Selected: {lessonVideoFile.name} ({(lessonVideoFile.size / (1024 * 1024)).toFixed(2)} MB)
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {lessonForm.content_type === 'ARTICLE' && (
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Article Markdown / Text Content <span className="text-rose-400">*</span>
              </label>
              <textarea
                rows={6}
                required
                placeholder="Write lesson notes, code snippets, or explanations..."
                value={lessonForm.article_content}
                onChange={(e) => setLessonForm((prev) => ({ ...prev, article_content: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>
          )}

          {lessonForm.content_type === 'DOCUMENT' && (
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Upload Document (PDF, Slides, Zip)
              </label>
              <input
                type="file"
                onChange={(e) => setLessonDocumentFile(e.target.files?.[0] || null)}
                className="block w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-sky-500/10 file:text-sky-400 hover:file:bg-sky-500/20"
              />
            </div>
          )}

          {lessonForm.content_type === 'EXTERNAL' && (
            <Input
              label="External Resource URL"
              type="url"
              required
              placeholder="https://github.com/..."
              value={lessonForm.external_url}
              onChange={(e) => setLessonForm((prev) => ({ ...prev, external_url: e.target.value }))}
            />
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Duration (Minutes)"
              type="number"
              min="1"
              value={lessonForm.duration_minutes}
              onChange={(e) =>
                setLessonForm((prev) => ({ ...prev, duration_minutes: Number(e.target.value) }))
              }
            />
            <Input
              label="Order Index"
              type="number"
              min="0"
              value={lessonForm.order}
              onChange={(e) => setLessonForm((prev) => ({ ...prev, order: Number(e.target.value) }))}
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="is_free_preview"
              checked={lessonForm.is_free_preview}
              onChange={(e) => setLessonForm((prev) => ({ ...prev, is_free_preview: e.target.checked }))}
              className="w-4 h-4 rounded text-sky-500 bg-slate-900 border-slate-700 focus:ring-sky-500"
            />
            <label htmlFor="is_free_preview" className="text-xs font-semibold text-slate-300 cursor-pointer">
              Available as Free Preview to guests
            </label>
          </div>

          <Button type="submit" variant="primary" size="md" className="w-full">
            {editingLesson ? 'Update Lesson' : 'Add Lesson'}
          </Button>
        </form>
      </Modal>

      {/* QUIZ CREATION MODAL */}
      <Modal
        isOpen={quizModalOpen}
        onClose={() => setQuizModalOpen(false)}
        title={editingQuiz ? 'Read and Edit Quiz' : 'Create New Quiz Assessment with Questions'}
        maxWidth="max-w-2xl"
      >
        <QuizBuilder
          quizForm={quizForm}
          setQuizForm={setQuizForm}
          onSubmit={handleSaveQuiz}
          onCancel={() => setQuizModalOpen(false)}
          sections={sections}
          editing={Boolean(editingQuiz)}
          onSelectExistingQuiz={openQuizEditor}
        />
      </Modal>

      {/* ASSIGNMENT CREATION MODAL */}
      <Modal
        isOpen={assignmentModalOpen}
        onClose={() => setAssignmentModalOpen(false)}
        title={editingAssignment ? 'Read and Edit Assignment' : 'Create Project Assignment'}
        maxWidth="max-w-xl"
      >
        <AssignmentBuilder
          assignmentForm={assignmentForm}
          setAssignmentForm={setAssignmentForm}
          onSubmit={handleSaveAssignment}
          onCancel={() => setAssignmentModalOpen(false)}
          sections={sections}
          editing={Boolean(editingAssignment)}
        />
      </Modal>

      {/* ENROLLED STUDENTS MODAL */}
      <Modal
        isOpen={studentsModalOpen}
        onClose={() => setStudentsModalOpen(false)}
        title={`Enrolled Students: ${courseForm.title || 'Course'}`}
        maxWidth="max-w-3xl"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs text-slate-400">
            <span>Registered learners enrolled in this course</span>
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
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* VIDEO UPLOAD MODAL */}
      <Modal
        isOpen={videoUploadModalOpen}
        onClose={() => setVideoUploadModalOpen(false)}
        title={editingLesson?.hosted_video ? 'Replace Video' : 'Upload Video'}
        maxWidth="max-w-xl"
      >
        {editingLesson && (
          <VideoUpload
            lessonId={editingLesson.id}
            existingVideo={editingLesson.hosted_video}
            onUploadSuccess={() => {
              setVideoUploadModalOpen(false);
              refreshCurriculum(id);
              toast.success('Video uploaded successfully!', 'Success');
            }}
            onCancel={() => setVideoUploadModalOpen(false)}
          />
        )}
      </Modal>
    </div>
  );
};

export default CourseBuilder;
