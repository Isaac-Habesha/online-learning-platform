import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, BookOpen, ExternalLink, Megaphone } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import courseService from '../../services/courseService';
import Loader from '../../components/common/Loader';
import Button from '../../components/common/Button';

const CourseAnnouncements = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [course, setCourse] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [courseData, announcementData] = await Promise.all([
          courseService.getCourse(courseId),
          courseService.getAnnouncements(courseId),
        ]);
        setCourse(courseData);
        setAnnouncements(Array.isArray(announcementData) ? announcementData : announcementData.results || []);
      } catch (err) {
        setError(err.response?.data?.detail || 'This course announcement page is unavailable.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [courseId]);

  const continueToLessons = () => {
    if (user?.role === 'LEARNER') sessionStorage.setItem(`course-announcements-visited-${courseId}`, 'true');
    navigate(`/learner/courses/${courseId}/player`);
  };

  if (loading) return <Loader fullPage message="Loading course announcements..." />;
  if (error || !course) return <div className="py-16 text-center text-slate-300">{error || 'Course not found.'}</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="space-y-3">
        <Link to="/learner/dashboard" className="text-sm text-sky-400 hover:text-sky-300">Back to My Courses</Link>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-sky-400">Course Welcome</p>
            <h1 className="text-3xl font-black text-white">{course.title}</h1>
            <p className="mt-2 text-slate-400">Instructor: {course.instructor_name || 'Course Instructor'}</p>
          </div>
          <Button variant="primary" onClick={continueToLessons} rightIcon={<ArrowRight className="w-4 h-4" />}>
            Continue to Lessons
          </Button>
        </div>
      </div>

      <section className="space-y-4">
        {announcements.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-10 text-center">
            <Megaphone className="mx-auto mb-3 h-8 w-8 text-sky-400" />
            <p className="text-slate-300">No announcements have been posted yet.</p>
          </div>
        ) : announcements.map((announcement) => (
          <article key={announcement.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-xl font-bold text-white">{announcement.title}</h2>
              <Megaphone className="h-5 w-5 shrink-0 text-sky-400" />
            </div>
            <p className="whitespace-pre-line text-slate-300 leading-relaxed">{announcement.message}</p>
            {announcement.live_stream_url && (
              <a href={announcement.live_stream_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold text-sky-400 hover:text-sky-300">
                <ExternalLink className="h-4 w-4" /> Join Live Stream
              </a>
            )}
            <p className="text-xs text-slate-500">
              Posted {new Date(announcement.created_at).toLocaleString()}
              {announcement.updated_at !== announcement.created_at && ` · Updated ${new Date(announcement.updated_at).toLocaleString()}`}
            </p>
          </article>
        ))}
      </section>

      <div className="flex justify-end border-t border-slate-800 pt-6">
        <Button variant="success" onClick={continueToLessons} rightIcon={<BookOpen className="w-4 h-4" />}>
          Open Classroom
        </Button>
      </div>
    </div>
  );
};

export default CourseAnnouncements;
