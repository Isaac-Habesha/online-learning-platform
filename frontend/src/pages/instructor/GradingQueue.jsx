import React, { useState, useEffect } from 'react';
import assignmentService from '../../services/assignmentService';
import quizService from '../../services/quizService';
import { useToast } from '../../contexts/ToastContext';
import Loader from '../../components/common/Loader';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import {
  ClipboardList,
  CheckCircle,
  Clock,
  User,
  Download,
  FileText,
  Calendar,
  ExternalLink,
  Award,
  Send,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  XCircle,
  Eye,
  BookOpen,
} from 'lucide-react';

export const GradingQueue = () => {
  const toast = useToast();

  // Tab State: 'assignments' | 'quizzes'
  const [activeTab, setActiveTab] = useState('assignments');

  // Assignment Submissions State
  const [submissions, setSubmissions] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(true);
  const [gradingModalOpen, setGradingModalOpen] = useState(false);
  const [activeSubmission, setActiveSubmission] = useState(null);
  const [gradeForm, setGradeForm] = useState({ grade: 100, feedback: '' });
  const [submittingGrade, setSubmittingGrade] = useState(false);

  // Quiz Attempts State
  const [quizAttempts, setQuizAttempts] = useState([]);
  const [loadingQuizAttempts, setLoadingQuizAttempts] = useState(false);
  const [selectedAttemptForModal, setSelectedAttemptForModal] = useState(null);
  const [attemptModalOpen, setAttemptModalOpen] = useState(false);

  const fetchSubmissions = async () => {
    setLoadingSubmissions(true);
    try {
      const data = await assignmentService.getAllSubmissions();
      setSubmissions(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      toast.error('Failed to load project assignments queue.', 'Error');
    } finally {
      setLoadingSubmissions(false);
    }
  };

  const fetchQuizAttempts = async () => {
    setLoadingQuizAttempts(true);
    try {
      const data = await quizService.getInstructorQuizAttempts();
      setQuizAttempts(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      toast.error('Failed to load student quiz gradebook.', 'Error');
    } finally {
      setLoadingQuizAttempts(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
    fetchQuizAttempts();
  }, []);

  const handleOpenGradeModal = (sub) => {
    setActiveSubmission(sub);
    setGradeForm({
      grade: sub.grade !== null ? sub.grade : 100,
      feedback: sub.feedback || '',
    });
    setGradingModalOpen(true);
  };

  const handleGradeSubmit = async (e) => {
    e.preventDefault();
    if (!activeSubmission) return;

    setSubmittingGrade(true);
    try {
      await assignmentService.gradeSubmission(activeSubmission.id, {
        grade: Number(gradeForm.grade),
        feedback: gradeForm.feedback.trim(),
      });
      toast.success('Grade & feedback successfully submitted!', 'Graded');
      setGradingModalOpen(false);
      fetchSubmissions();
    } catch (err) {
      const detail = err.response?.data?.detail || err.response?.data?.grade?.[0] || 'Failed to submit grade.';
      toast.error(detail, 'Error');
    } finally {
      setSubmittingGrade(false);
    }
  };

  const handleViewAttemptDetails = (attempt) => {
    setSelectedAttemptForModal(attempt);
    setAttemptModalOpen(true);
  };

  // Metrics
  const pendingSubmissionsCount = submissions.filter((s) => s.status === 'SUBMITTED').length;
  const gradedSubmissionsCount = submissions.filter((s) => s.status === 'GRADED').length;

  const totalQuizAttempts = quizAttempts.length;
  const passedQuizAttempts = quizAttempts.filter((a) => a.passed).length;
  const avgQuizScore =
    totalQuizAttempts > 0
      ? Math.round(
          quizAttempts.reduce((acc, curr) => acc + (Number(curr.score) || 0), 0) / totalQuizAttempts
        )
      : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
          <Award className="w-8 h-8 text-sky-400" />
          Assessment Gradebook & Grading Center
        </h1>
        <p className="text-sm text-slate-400">
          Review and grade student project deliverables, monitor quiz scores, and inspect learner attempt answers.
        </p>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('assignments')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'assignments'
              ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          Project Assignments
          {pendingSubmissionsCount > 0 && (
            <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-amber-400 text-slate-950 font-black">
              {pendingSubmissionsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('quizzes')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'quizzes'
              ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          Quiz Gradebook
          <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-slate-800 text-slate-300 font-black">
            {totalQuizAttempts}
          </span>
        </button>
      </div>

      {/* TAB 1: PROJECT ASSIGNMENTS */}
      {activeTab === 'assignments' && (
        <div className="space-y-6">
          {/* Metrics Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Submissions</p>
              <span className="text-2xl font-black text-white">{submissions.length}</span>
            </div>
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Pending Review</p>
              <span className="text-2xl font-black text-amber-400">{pendingSubmissionsCount}</span>
            </div>
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Graded Deliverables</p>
              <span className="text-2xl font-black text-emerald-400">{gradedSubmissionsCount}</span>
            </div>
          </div>

          {/* Submissions List */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white">Student Project Deliverables</h3>

            {loadingSubmissions ? (
              <div className="py-16 flex justify-center">
                <Loader message="Loading assignment deliverables..." />
              </div>
            ) : submissions.length === 0 ? (
              <div className="text-center py-16 space-y-3 glass-panel rounded-2xl border border-slate-800">
                <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto" />
                <h4 className="text-base font-bold text-white">Grading Queue is Clean</h4>
                <p className="text-xs text-slate-400">No student assignment submissions are waiting for review.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {submissions.map((sub) => (
                  <div
                    key={sub.id}
                    className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <Badge variant={sub.status === 'GRADED' ? 'success' : 'warning'}>
                          {sub.status}
                        </Badge>
                        {sub.is_late && <Badge variant="danger">Late Submission</Badge>}
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(sub.submitted_at).toLocaleDateString()}
                        </span>
                        {sub.course_title && (
                          <span className="text-xs text-sky-400 font-semibold bg-sky-500/10 px-2.5 py-0.5 rounded-lg border border-sky-500/20">
                            Course: {sub.course_title}
                          </span>
                        )}
                        {sub.assignment_title && (
                          <span className="text-xs text-slate-300 font-semibold bg-slate-900 px-2.5 py-0.5 rounded-lg border border-slate-800">
                            Assignment: {sub.assignment_title}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-300">
                        <User className="w-4 h-4 text-slate-400" />
                        <span className="font-bold text-white">{sub.user_full_name || sub.user_email}</span>
                        <span className="text-slate-500">({sub.user_email})</span>
                      </div>

                      {/* Submission Deliverables */}
                      <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
                        {sub.text_submission && (
                          <div>
                            <span className="text-slate-400 font-semibold block">Notes / Link:</span>
                            <p className="text-slate-200 break-all">{sub.text_submission}</p>
                          </div>
                        )}

                        {sub.file_submission && (
                          <div className="flex items-center gap-2 pt-1">
                            <a
                              href={sub.file_submission}
                              target="_blank"
                              rel="noreferrer"
                              download
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20 text-xs font-semibold hover:bg-sky-500 hover:text-white transition-colors"
                            >
                              <Download className="w-3.5 h-3.5" />
                              Download Student Project File
                            </a>
                          </div>
                        )}
                      </div>

                      {sub.grade !== null && (
                        <div className="text-xs font-semibold text-emerald-400 flex items-center gap-2">
                          <Award className="w-4 h-4" />
                          <span>
                            Graded: {sub.grade} {sub.max_marks ? `/ ${sub.max_marks}` : 'Points'}
                          </span>
                          {sub.feedback && <span className="text-slate-400 font-normal">("{sub.feedback}")</span>}
                        </div>
                      )}
                    </div>

                    {/* Grade Action Button */}
                    <div className="shrink-0 self-stretch sm:self-auto flex justify-end">
                      <Button
                        variant={sub.status === 'GRADED' ? 'secondary' : 'primary'}
                        size="sm"
                        onClick={() => handleOpenGradeModal(sub)}
                        leftIcon={<Award className="w-4 h-4" />}
                      >
                        {sub.status === 'GRADED' ? 'Update Grade' : 'Grade Deliverable'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: QUIZ GRADEBOOK */}
      {activeTab === 'quizzes' && (
        <div className="space-y-6">
          {/* Metrics Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Quiz Attempts</p>
              <span className="text-2xl font-black text-white">{totalQuizAttempts}</span>
            </div>
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Passed Attempts</p>
              <span className="text-2xl font-black text-emerald-400">
                {passedQuizAttempts}
                <span className="text-xs font-normal text-slate-500 ml-1.5">
                  ({totalQuizAttempts > 0 ? Math.round((passedQuizAttempts / totalQuizAttempts) * 100) : 0}%)
                </span>
              </span>
            </div>
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Average Student Score</p>
              <span className="text-2xl font-black text-sky-400">{avgQuizScore}%</span>
            </div>
          </div>

          {/* Quiz Attempts Table / List */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white">Learner Quiz Attempt Results</h3>

            {loadingQuizAttempts ? (
              <div className="py-16 flex justify-center">
                <Loader message="Loading quiz attempts..." />
              </div>
            ) : quizAttempts.length === 0 ? (
              <div className="text-center py-16 space-y-3 glass-panel rounded-2xl border border-slate-800">
                <HelpCircle className="w-12 h-12 text-slate-600 mx-auto" />
                <h4 className="text-base font-bold text-white">No Quiz Attempts Found</h4>
                <p className="text-xs text-slate-400">When enrolled learners submit quizzes in your courses, their scores will appear here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {quizAttempts.map((attempt) => (
                  <div
                    key={attempt.id}
                    className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={attempt.passed ? 'success' : 'danger'}>
                          {attempt.passed ? 'PASSED' : 'FAILED'}
                        </Badge>
                        <span className="text-xs font-black text-white px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800">
                          Score: {attempt.score}%
                        </span>
                        {attempt.passing_score && (
                          <span className="text-[11px] text-slate-400">
                            (Passing: {attempt.passing_score}%)
                          </span>
                        )}
                        <span className="text-xs text-slate-500">
                          Attempt #{attempt.attempt_number} •{' '}
                          {attempt.submitted_at
                            ? new Date(attempt.submitted_at).toLocaleString()
                            : 'Submitted'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs">
                        <div className="flex items-center gap-1.5 text-slate-200">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-bold">{attempt.user_full_name || attempt.user_email}</span>
                          <span className="text-slate-500">({attempt.user_email})</span>
                        </div>
                        {attempt.course_title && (
                          <span className="text-sky-400 font-semibold">
                            • {attempt.course_title}
                          </span>
                        )}
                        {attempt.quiz_title && (
                          <span className="text-slate-400 font-medium">
                            • Quiz: {attempt.quiz_title}
                          </span>
                        )}
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewAttemptDetails(attempt)}
                      leftIcon={<Eye className="w-4 h-4 text-sky-400" />}
                      className="border border-slate-700/80 hover:border-sky-500/50"
                    >
                      View Answers
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* GRADING MODAL (PROJECT ASSIGNMENT) */}
      <Modal
        isOpen={gradingModalOpen}
        onClose={() => setGradingModalOpen(false)}
        title="Grade Assignment Submission"
      >
        <form onSubmit={handleGradeSubmit} className="space-y-4">
          <div className="p-3.5 rounded-xl bg-slate-950 text-xs text-slate-300 space-y-1">
            <p>
              <span className="font-semibold text-slate-400">Student:</span>{' '}
              {activeSubmission?.user_full_name || activeSubmission?.user_email}
            </p>
            {activeSubmission?.course_title && (
              <p>
                <span className="font-semibold text-slate-400">Course:</span>{' '}
                {activeSubmission.course_title}
              </p>
            )}
            {activeSubmission?.assignment_title && (
              <p>
                <span className="font-semibold text-slate-400">Assignment:</span>{' '}
                {activeSubmission.assignment_title} (Max: {activeSubmission.max_marks || 100})
              </p>
            )}
            {activeSubmission?.text_submission && (
              <p>
                <span className="font-semibold text-slate-400">Text Content:</span>{' '}
                {activeSubmission.text_submission}
              </p>
            )}
          </div>

          <Input
            label="Score / Grade"
            type="number"
            min="0"
            required
            placeholder="Score (e.g. 95)"
            value={gradeForm.grade}
            onChange={(e) => setGradeForm((prev) => ({ ...prev, grade: e.target.value }))}
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Instructor Feedback & Rubric Notes
            </label>
            <textarea
              rows={4}
              placeholder="Excellent work on the state management logic..."
              value={gradeForm.feedback}
              onChange={(e) => setGradeForm((prev) => ({ ...prev, feedback: e.target.value }))}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            isLoading={submittingGrade}
            rightIcon={<Send className="w-4 h-4" />}
          >
            Submit Grade & Feedback
          </Button>
        </form>
      </Modal>

      {/* QUIZ ATTEMPT ANSWERS MODAL */}
      <Modal
        isOpen={attemptModalOpen}
        onClose={() => setAttemptModalOpen(false)}
        title={`Quiz Details: ${selectedAttemptForModal?.quiz_title || 'Quiz Attempt'}`}
        maxWidth="max-w-3xl"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div>
              <span className="text-slate-400">Student: </span>
              <strong className="text-white">
                {selectedAttemptForModal?.user_full_name || selectedAttemptForModal?.user_email}
              </strong>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={selectedAttemptForModal?.passed ? 'success' : 'danger'}>
                {selectedAttemptForModal?.passed ? 'PASSED' : 'FAILED'}
              </Badge>
              <span className="font-bold text-sky-400">Score: {selectedAttemptForModal?.score}%</span>
            </div>
          </div>

          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {selectedAttemptForModal?.answers?.map((ans, idx) => (
              <div
                key={ans.id || idx}
                className={`p-4 rounded-xl border space-y-2 text-xs ${
                  ans.is_correct
                    ? 'bg-emerald-950/20 border-emerald-500/30'
                    : 'bg-rose-950/20 border-rose-500/30'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 font-bold text-white">
                    {ans.is_correct ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    )}
                    <span>Question {idx + 1}: {ans.question_text || 'Question'}</span>
                  </div>
                  <span className={`text-[11px] font-bold ${ans.is_correct ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {ans.is_correct ? 'Correct' : 'Incorrect'}
                  </span>
                </div>

                <div className="space-y-1 pl-6 text-slate-300">
                  <p>
                    <span className="text-slate-400">Student's Selected Option: </span>
                    <strong className={ans.is_correct ? 'text-emerald-300' : 'text-rose-300'}>
                      {ans.selected_option_text || 'No option selected'}
                    </strong>
                  </p>
                  {!ans.is_correct && ans.correct_option_text && (
                    <p>
                      <span className="text-slate-400">Correct Answer: </span>
                      <strong className="text-emerald-400">{ans.correct_option_text}</strong>
                    </p>
                  )}
                  {ans.explanation && (
                    <p className="text-slate-400 text-[11px] italic pt-1">
                      Explanation: {ans.explanation}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default GradingQueue;
