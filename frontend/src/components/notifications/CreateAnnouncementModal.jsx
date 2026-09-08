import React, { useState, useEffect } from 'react';
import { Megaphone, Send, X, BookOpen, User, AlertCircle, Loader2 } from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { useToast } from '../../contexts/ToastContext';
import notificationService from '../../services/notificationService';
import courseService from '../../services/courseService';

export const CreateAnnouncementModal = ({
  isOpen,
  onClose,
  preselectedCourse = null,
  preselectedStudent = null,
  onSuccess = () => {},
}) => {
  const toast = useToast();
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(false);

  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (preselectedCourse) {
        setSelectedCourseId(preselectedCourse.id);
      } else {
        // Fetch instructor's courses
        setLoadingCourses(true);
        courseService
          .getCourses({ instructor_only: true })
          .then((data) => {
            const list = Array.isArray(data) ? data : data.results || [];
            setCourses(list);
            if (list.length > 0) setSelectedCourseId(list[0].id);
          })
          .catch(() => {})
          .finally(() => setLoadingCourses(false));
      }
      setTitle('');
      setBody('');
    }
  }, [isOpen, preselectedCourse]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !body.trim() || !selectedCourseId) {
      toast.warning('Please fill in both title and announcement body.', 'Missing Information');
      return;
    }

    setSubmitting(true);
    try {
      await notificationService.createNotification({
        courseId: Number(selectedCourseId),
        recipientId: preselectedStudent ? preselectedStudent.id : null,
        title: title.trim(),
        body: body.trim(),
        type: preselectedStudent ? 'INSTRUCTOR_MESSAGE' : 'COURSE_ANNOUNCEMENT',
      });

      toast.success(
        preselectedStudent
          ? `Direct notice sent to ${preselectedStudent.first_name || 'student'}!`
          : 'Announcement successfully broadcast to all enrolled students!',
        'Announcement Published'
      );
      onSuccess();
      onClose();
    } catch (err) {
      const detail = err.response?.data?.detail || 'Failed to publish announcement.';
      toast.error(detail, 'Error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        preselectedStudent
          ? `Send Learning Notice to ${preselectedStudent.first_name || 'Student'}`
          : 'Broadcast Course Announcement'
      }
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        {/* Course info banner / selection */}
        {preselectedCourse ? (
          <div className="p-3 bg-sky-500/10 border border-sky-500/20 rounded-xl flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-sky-400 shrink-0" />
            <div>
              <span className="text-[10px] uppercase font-bold text-sky-400">Target Course</span>
              <p className="text-xs font-semibold text-white truncate">{preselectedCourse.title}</p>
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Select Course
            </label>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              disabled={loadingCourses}
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Optional Student Target banner */}
        {preselectedStudent && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-3">
            <User className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <span className="text-[10px] uppercase font-bold text-amber-400">Direct Recipient</span>
              <p className="text-xs font-semibold text-white">
                {preselectedStudent.first_name} {preselectedStudent.last_name} ({preselectedStudent.email})
              </p>
            </div>
          </div>
        )}

        {/* Title Input */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Announcement Title
          </label>
          <input
            type="text"
            placeholder="e.g. Important Update: New Quiz Added & Live Q&A on Friday"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
        </div>

        {/* Body Textarea */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Announcement Message
          </label>
          <textarea
            rows={5}
            placeholder="Write your announcement or notice for students enrolled in this course..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500 leading-relaxed"
          />
          <span className="text-[11px] text-slate-500 block mt-1">
            Enrolled learners will receive this notification instantly in their in-app notification bell.
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
          <Button variant="ghost" size="md" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={submitting}
            leftIcon={<Megaphone className="w-4 h-4" />}
          >
            {preselectedStudent ? 'Send Direct Notice' : 'Broadcast Announcement'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateAnnouncementModal;
