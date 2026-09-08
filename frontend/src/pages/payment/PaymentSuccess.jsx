import React from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2, ArrowRight, BookOpen, AlertTriangle } from 'lucide-react';
import { useVerifyPayment } from '../../hooks/usePayment';

export const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const txRef = searchParams.get('tx_ref');
  const navigate = useNavigate();

  const { data, isLoading, isError, error } = useVerifyPayment(txRef);

  if (!txRef) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6">
        <AlertTriangle className="w-16 h-16 text-amber-500 mb-4" />
        <h2 className="text-2xl font-bold text-white">Missing Transaction Reference</h2>
        <p className="text-slate-400 mt-2">No transaction reference was provided to verify.</p>
        <Link
          to="/courses"
          className="mt-6 px-6 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-medium rounded-xl transition"
        >
          Browse Courses
        </Link>
      </div>
    );
  }

  const isPending = isLoading || data?.status === 'PENDING';
  const isCompleted = data?.status === 'COMPLETED';

  if (isPending) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 max-w-lg mx-auto">
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-full bg-sky-500/10 border border-sky-500/20 flex items-center justify-center animate-pulse">
            <Loader2 className="w-10 h-10 text-sky-400 animate-spin" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-white">Verifying Your Payment</h2>
        <p className="text-slate-400 mt-3 text-sm leading-relaxed">
          We are confirming your transaction with Chapa payment gateway. Your enrollment will activate automatically in just a moment...
        </p>
        <span className="mt-4 px-3 py-1 bg-slate-800 text-slate-400 font-mono text-xs rounded-md">
          Ref: {txRef}
        </span>
      </div>
    );
  }

  if (isCompleted) {
    const courseId = data?.course_id;

    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 max-w-lg mx-auto">
        <div className="w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-6 shadow-xl shadow-emerald-500/10">
          <CheckCircle2 className="w-12 h-12" />
        </div>

        <span className="text-xs uppercase font-bold tracking-widest text-emerald-400 mb-1">
          Payment Confirmed
        </span>
        <h1 className="text-3xl font-extrabold text-white">
          Welcome to the Course!
        </h1>
        <p className="text-slate-300 mt-3 text-sm leading-relaxed">
          Your payment was verified successfully and your active enrollment is confirmed. You now have full lifetime access to all lessons, quizzes, and resources.
        </p>

        {/* Transaction Summary Card */}
        <div className="w-full mt-6 p-4 bg-slate-900 border border-slate-800 rounded-xl text-left space-y-2 text-xs">
          <div className="flex justify-between text-slate-400">
            <span>Transaction Reference</span>
            <span className="font-mono text-slate-200">{txRef}</span>
          </div>
          {data?.amount && (
            <div className="flex justify-between text-slate-400">
              <span>Amount Paid</span>
              <span className="font-semibold text-emerald-400">{data.amount} ETB</span>
            </div>
          )}
          <div className="flex justify-between text-slate-400">
            <span>Status</span>
            <span className="font-semibold text-emerald-400">Active / Enrolled</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-3 w-full">
          {courseId && (
            <button
              onClick={() => navigate(`/learner/courses/${courseId}/player`)}
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-sky-500 hover:bg-sky-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-sky-500/25 transition"
            >
              <span>Start Learning</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => navigate('/learner/dashboard')}
            className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm rounded-xl border border-slate-700 transition"
          >
            <BookOpen className="w-4 h-4" />
            <span>Go to Dashboard</span>
          </button>
        </div>
      </div>
    );
  }

  // Failed state
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 max-w-lg mx-auto">
      <div className="w-20 h-20 rounded-full bg-rose-500/10 border-2 border-rose-500/30 flex items-center justify-center text-rose-400 mb-6">
        <XCircle className="w-12 h-12" />
      </div>

      <h2 className="text-2xl font-bold text-white">Payment Unsuccessful</h2>
      <p className="text-slate-400 mt-3 text-sm leading-relaxed">
        {error?.response?.data?.detail || "The payment transaction could not be completed or was cancelled."}
      </p>

      <div className="mt-8 flex gap-3">
        <button
          onClick={() => navigate('/courses')}
          className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm rounded-xl border border-slate-700 transition"
        >
          Return to Courses
        </button>
      </div>
    </div>
  );
};

export default PaymentSuccess;
