import React from 'react';
import Button from '../common/Button';
import Input from '../common/Input';

export const AssignmentBuilder = ({
  assignmentForm,
  setAssignmentForm,
  onSubmit,
  onCancel,
  sections = [],
  editing = false,
}) => {
  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate
    if (!assignmentForm.lesson) {
      alert('Please select a lesson');
      return;
    }
    if (!assignmentForm.title.trim()) {
      alert('Please enter an assignment title');
      return;
    }
    if (!assignmentForm.instructions.trim()) {
      alert('Please enter assignment instructions');
      return;
    }

    onSubmit(e);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
          Attach to Lesson <span className="text-rose-400">*</span>
        </label>
        <select
          required
          value={assignmentForm.lesson}
          onChange={(e) =>
            setAssignmentForm((prev) => ({ ...prev, lesson: e.target.value }))
          }
          className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
        >
          <option value="">Select Lesson</option>
          {sections.flatMap((sec) =>
            sec.lessons?.map((l) => (
              <option key={l.id} value={l.id}>
                {sec.title} → {l.title}
              </option>
            ))
          )}
        </select>
      </div>

      <Input
        label="Assignment Title"
        required
        placeholder="e.g. Build an E-Commerce Cart Component"
        value={assignmentForm.title}
        onChange={(e) =>
          setAssignmentForm((prev) => ({ ...prev, title: e.target.value }))
        }
      />

      <div className="space-y-1.5">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
          Detailed Instructions <span className="text-rose-400">*</span>
        </label>
        <textarea
          rows={4}
          required
          placeholder="Describe deliverables, submission rubric, and requirements..."
          value={assignmentForm.instructions}
          onChange={(e) =>
            setAssignmentForm((prev) => ({
              ...prev,
              instructions: e.target.value,
            }))
          }
          className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Max Marks"
          type="number"
          min="1"
          value={assignmentForm.max_marks}
          onChange={(e) =>
            setAssignmentForm((prev) => ({
              ...prev,
              max_marks: e.target.value,
            }))
          }
        />
        <Input
          label="Allowed File Extensions"
          placeholder="pdf,zip,doc,docx,txt,png,jpg"
          value={assignmentForm.allowed_extensions}
          onChange={(e) =>
            setAssignmentForm((prev) => ({
              ...prev,
              allowed_extensions: e.target.value,
            }))
          }
        />
      </div>

      <div className="space-y-1.5">
        <label className="flex items-center gap-2 text-xs font-semibold text-slate-300">
          <input
            type="checkbox"
            checked={assignmentForm.is_published}
            onChange={(e) =>
              setAssignmentForm((prev) => ({
                ...prev,
                is_published: e.target.checked,
              }))
            }
            className="w-4 h-4 rounded accent-sky-500 cursor-pointer"
          />
          Publish immediately
        </label>
      </div>

      <div className="flex gap-3 pt-4 border-t border-slate-700">
        <Button type="submit" variant="primary" size="md" className="flex-1">
          {editing ? 'Save Assignment' : 'Create Assignment'}
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="md"
          onClick={onCancel}
          className="flex-1"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
};

export default AssignmentBuilder;
