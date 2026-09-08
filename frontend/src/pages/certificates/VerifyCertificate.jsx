import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, Search, Award, Calendar, User, BookOpen, ShieldCheck, Download, Loader2 } from 'lucide-react';
import { useVerifyCertificate } from '../../hooks/useCertificate';
import certificateService from '../../services/certificateService';

export const VerifyCertificate = () => {
  const { certificateCode: paramCode } = useParams();
  const [searchInput, setSearchInput] = useState(paramCode || '');
  const [activeCode, setActiveCode] = useState(paramCode || '');
  const navigate = useNavigate();

  const { data, isLoading, isError, error } = useVerifyCertificate(activeCode);

  const handleSearch = (e) => {
    e.preventDefault();
    const cleanCode = searchInput.trim();
    if (cleanCode) {
      setActiveCode(cleanCode);
      navigate(`/verify/${cleanCode}`, { replace: true });
    }
  };

  return (
    <div className="min-h-[80vh] py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mb-4">
          <ShieldCheck className="w-9 h-9" />
        </div>
        <h1 className="text-3xl font-extrabold text-white sm:text-4xl tracking-tight">
          Certificate Verification
        </h1>
        <p className="mt-3 max-w-2xl mx-auto text-base text-slate-400">
          Verify the authenticity of graduation and course completion credentials issued by Online Learning Academy.
        </p>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mt-6 max-w-md mx-auto flex gap-2">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="e.g. CERT-A1B2C3D4E5"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm rounded-xl transition shadow-md"
          >
            Verify
          </button>
        </form>
      </div>

      {/* Verification State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center p-12 bg-slate-900/60 rounded-2xl border border-slate-800 text-slate-300">
          <Loader2 className="w-10 h-10 animate-spin text-amber-500 mb-3" />
          <p className="text-sm">Querying verification ledger...</p>
        </div>
      )}

      {!isLoading && isError && (
        <div className="p-8 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-center">
          <XCircle className="w-14 h-14 text-rose-400 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-rose-300">Verification Failed</h2>
          <p className="text-slate-400 text-sm mt-2 max-w-md mx-auto">
            {error?.response?.data?.detail || `No authentic certificate was found matching code "${activeCode}".`}
          </p>
        </div>
      )}

      {!isLoading && data?.is_valid && (
        <div className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 border-2 border-amber-500/40 rounded-2xl shadow-2xl p-8 sm:p-10">
          {/* Top Stamp */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs uppercase font-bold tracking-wider text-emerald-400">Authentic & Verified</span>
                <p className="text-xs text-slate-400">Issued by Online Learning Platform</p>
              </div>
            </div>

            <span className="px-3.5 py-1.5 bg-slate-800 text-amber-400 font-mono text-sm font-semibold rounded-lg border border-slate-700">
              {data.certificate_code}
            </span>
          </div>

          {/* Details Body */}
          <div className="mt-8 space-y-6">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Learner Name</span>
              <div className="flex items-center gap-2 mt-1">
                <User className="w-5 h-5 text-sky-400" />
                <h3 className="text-2xl sm:text-3xl font-bold text-white">
                  {data.learner_full_name}
                </h3>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-800/80">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Course Completed</span>
                <div className="flex items-start gap-2 mt-1">
                  <BookOpen className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-lg font-semibold text-slate-100">
                    {data.course_title}
                  </p>
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Course Instructor</span>
                <p className="text-base font-medium text-slate-200 mt-1">
                  {data.instructor_name || 'Academic Faculty'}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-sm text-slate-400">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-500" />
                <span>Completion Date: {new Date(data.issued_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>

              <a
                href={certificateService.getDownloadUrl(data.certificate_code)}
                target="_blank"
                rel="noopener noreferrer"
                download
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs rounded-lg border border-slate-700 transition"
              >
                <Download className="w-4 h-4" />
                <span>Download Official PDF</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VerifyCertificate;
