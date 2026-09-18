import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Edit3, Megaphone, Plus, X } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import courseService from '../../services/courseService';
import Loader from '../../components/common/Loader';
import Button from '../../components/common/Button';

const emptyForm = { title: '', message: '', live_stream_url: '' };

const Announcements = () => {
  const { id } = useParams();
  const toast = useToast();
  const [course, setCourse] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const [courseData, announcementData] = await Promise.all([
      courseService.getCourse(id),
      courseService.getAnnouncements(id),
    ]);
    setCourse(courseData);
    setAnnouncements(Array.isArray(announcementData) ? announcementData : announcementData.results || []);
  };

  useEffect(() => {
    load().catch((err) => toast.error(err.response?.data?.detail || 'Unable to load announcements.', 'Error')).finally(() => setLoading(false));
  }, [id]);

  const startEdit = (announcement) => {
    setEditing(announcement);
    setForm({ title: announcement.title, message: announcement.message, live_stream_url: announcement.live_stream_url || '' });
  };

  const reset = () => { setEditing(null); setForm(emptyForm); };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      if (editing) await courseService.updateAnnouncement(editing.id, form);
      else await courseService.createAnnouncement(id, form);
      await load();
      reset();
      toast.success(editing ? 'Announcement updated.' : 'Announcement published.', 'Saved');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Unable to save announcement.', 'Error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader fullPage message="Loading announcements..." />;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-sky-400">Course Announcements</p>
          <h1 className="text-3xl font-black text-white">{course?.title}</h1>
        </div>
        {editing && <Button variant="ghost" onClick={reset} leftIcon={<X className="w-4 h-4" />}>Cancel Edit</Button>}
      </div>

      <form onSubmit={submit} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
        <h2 className="flex items-center gap-2 text-lg font-bold text-white"><Megaphone className="h-5 w-5 text-sky-400" /> {editing ? 'Edit Announcement' : 'New Announcement'}</h2>
        <input required maxLength={255} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Announcement title" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white" />
        <textarea required value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Write the course message" rows={5} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white" />
        <input type="url" value={form.live_stream_url} onChange={(e) => setForm({ ...form, live_stream_url: e.target.value })} placeholder="Live stream URL (optional)" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white" />
        <Button type="submit" isLoading={saving} leftIcon={editing ? <Edit3 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}>{editing ? 'Save Changes' : 'Publish Announcement'}</Button>
      </form>

      <section className="space-y-4">
        {announcements.map((announcement) => (
          <article key={announcement.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <div className="flex items-start justify-between gap-4">
              <div><h2 className="text-xl font-bold text-white">{announcement.title}</h2><p className="mt-2 whitespace-pre-line text-slate-300">{announcement.message}</p></div>
              <Button variant="outline" size="sm" onClick={() => startEdit(announcement)} leftIcon={<Edit3 className="w-4 h-4" />}>Edit</Button>
            </div>
            {announcement.live_stream_url && <a href={announcement.live_stream_url} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm text-sky-400">{announcement.live_stream_url}</a>}
            <p className="mt-3 text-xs text-slate-500">Posted {new Date(announcement.created_at).toLocaleString()} {announcement.updated_at !== announcement.created_at && `· Updated ${new Date(announcement.updated_at).toLocaleString()}`}</p>
          </article>
        ))}
      </section>
    </div>
  );
};

export default Announcements;
