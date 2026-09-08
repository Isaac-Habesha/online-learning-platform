import React from 'react';
import { Award, Download, ExternalLink, Loader2 } from 'lucide-react';
import { useCourseCertificate } from '../../hooks/useCertificate';
import certificateService from '../../services/certificateService';

export const CertificateDownloadButton = ({ courseId, isCompleted = false }) => {
  const { data, isLoading, isError } = useCourseCertificate(courseId, {
    enabled: isCompleted,
  });

  if (!isCompleted) return null;

  if (isLoading) {
    return (
      <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-400 rounded-lg text-sm border border-slate-700">
        <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
        <span>Generating certificate...</span>
      </div>
    );
  }

  if (isError || !data?.certificate) {
    return null;
  }

  const cert = data.certificate;
  const downloadUrl = certificateService.getDownloadUrl(cert.certificate_code);

  return (
    <div className="inline-flex flex-wrap items-center gap-3">
      <a
        href={downloadUrl}
        download
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold text-sm rounded-xl shadow-lg shadow-amber-500/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
      >
        <Award className="w-5 h-5 text-amber-100" />
        <span>Download Certificate</span>
        <Download className="w-4 h-4 ml-1 opacity-80" />
      </a>

      <a
        href={`/verify/${cert.certificate_code}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-300 hover:text-amber-400 bg-slate-800/80 hover:bg-slate-800 rounded-lg border border-slate-700/60 transition-colors"
      >
        <span>Verify Online</span>
        <ExternalLink className="w-3.5 h-3.5" />
      </a>
    </div>
  );
};

export default CertificateDownloadButton;
