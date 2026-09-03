import React, { useState, useRef } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import Button from '../common/Button';
import { useToast } from '../../contexts/ToastContext';
import assignmentService from '../../services/assignmentService';

export const AssignmentSubmitter = ({ assignment, onSubmit, onCancel }) => {
  const toast = useToast();
  const [textSubmission, setTextSubmission] = useState('');
  const [fileSubmission, setFileSubmission] = useState(null);
  const [fileName, setFileName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const allowedExtensions = assignment.allowed_extensions.split(',').map(e => e.trim().toLowerCase());

  const handleFileSelect = (file) => {
    if (!file) return;

    const ext = file.name.split('.').pop().toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      toast.error(
        `File type .${ext} not allowed. Allowed: ${allowedExtensions.join(', ')}`,
        'Invalid File'
      );
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size exceeds 10MB limit', 'File Too Large');
      return;
    }

    setFileSubmission(file);
    setFileName(file.name);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!textSubmission.trim() && !fileSubmission) {
      toast.error('Please provide either text content or a file', 'Submission Required');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      
      if (textSubmission.trim()) {
        formData.append('text_submission', textSubmission);
      }
      if (fileSubmission) {
        formData.append('file_submission', fileSubmission);
      }

      await assignmentService.submitAssignment(assignment.id, formData);
      toast.success('Assignment submitted successfully!', 'Submitted');
      onSubmit();
    } catch (err) {
      const detail =
        err.response?.data?.detail ||
        err.response?.data?.file_submission?.[0] ||
        'Failed to submit assignment';
      toast.error(detail, 'Error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Assignment Info */}
      <div className="bg-slate-900/50 rounded-xl border border-slate-700/50 p-6">
        <h2 className="text-xl font-bold text-white mb-2">{assignment.title}</h2>
        <p className="text-slate-400 text-sm mb-4">{assignment.instructions}</p>
        <div className="flex items-center justify-between text-xs">
          <span className="bg-emerald-500/20 text-emerald-300 px-3 py-1.5 rounded-lg">
            Max Marks: {assignment.max_marks}
          </span>
          <span className="text-slate-400">
            Allowed: {allowedExtensions.join(', ')}
          </span>
        </div>
      </div>

      {/* Submission Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Text Submission */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-200">
            Text Submission (Optional)
          </label>
          <textarea
            rows={6}
            placeholder="Write your submission here... (optional if you're uploading a file)"
            value={textSubmission}
            onChange={(e) => setTextSubmission(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
          <p className="text-xs text-slate-500">
            {textSubmission.length} characters
          </p>
        </div>

        {/* File Upload */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-200">
            File Upload (Optional)
          </label>
          
          <div
            onClick={() => fileInputRef.current?.click()}
            className="relative border-2 border-dashed border-slate-700 rounded-xl p-8 text-center cursor-pointer hover:border-sky-500/50 hover:bg-slate-900/30 transition-all"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={allowedExtensions.map(e => `.${e}`).join(',')}
              onChange={(e) => handleFileSelect(e.target.files?.[0])}
              className="hidden"
            />
            
            {fileSubmission ? (
              <div className="space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <p className="text-sm font-semibold text-emerald-300">{fileName}</p>
                <p className="text-xs text-slate-400">
                  {(fileSubmission.size / 1024).toFixed(2)} KB
                </p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFileSubmission(null);
                    setFileName('');
                  }}
                  className="text-xs text-rose-400 hover:text-rose-300 underline mt-2"
                >
                  Remove file
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="w-8 h-8 text-slate-500 mx-auto" />
                <p className="text-sm font-semibold text-slate-200">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-slate-500">
                  Max 10MB • Allowed: {allowedExtensions.join(', ')}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Info Alert */}
        <div className="bg-sky-500/10 border border-sky-500/30 rounded-lg p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
          <div className="text-sm text-sky-300">
            <p className="font-semibold mb-1">Submission Guide</p>
            <ul className="text-xs space-y-1 list-disc list-inside">
              <li>Provide either text content or a file (or both)</li>
              <li>File uploads limited to 10MB</li>
              <li>Once submitted, you can resubmit until graded</li>
              <li>Your submission will be graded by the instructor</li>
            </ul>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-slate-700">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="flex-1"
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : 'Submit Assignment'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="lg"
            onClick={onCancel}
            className="flex-1"
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AssignmentSubmitter;
