import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import authService from '../../services/authService';
import { useToast } from '../../contexts/ToastContext';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { Mail, Send, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';

export const ForgotPassword = () => {
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError('');

    try {
      await authService.forgotPassword(email.trim());
      setSubmitted(true);
      toast.success('Password reset instructions sent if email exists.', 'Request Sent');
    } catch (err) {
      const detail =
        err.response?.data?.detail ||
        err.response?.data?.email?.[0] ||
        'Unable to request password reset. Please try again.';
      setError(detail);
      toast.error(detail, 'Error');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center mx-auto text-sky-400">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white">Reset Link Dispatched</h2>
          <p className="text-sm text-slate-300">
            If an account is associated with <span className="font-semibold text-sky-400">{email}</span>, we have sent password reset instructions.
          </p>
        </div>

        <div className="pt-2 space-y-3">
          <Link to="/reset-password" className="block w-full">
            <Button variant="primary" size="lg" className="w-full">
              Enter Reset Token & Password
            </Button>
          </Link>
          <Link to="/login" className="block w-full">
            <Button variant="ghost" size="md" className="w-full">
              Return to Login
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-black tracking-tight text-white">Forgot Password?</h2>
        <p className="text-sm text-slate-400">
          Enter your email and we'll send you a token to reset your password.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <p className="text-sm text-rose-300">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email Address"
          type="email"
          name="email"
          required
          autoComplete="email"
          placeholder="your.email@example.com"
          leftIcon={<Mail className="w-4 h-4" />}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full mt-2"
          isLoading={loading}
          rightIcon={<Send className="w-4 h-4" />}
        >
          Send Reset Token
        </Button>
      </form>

      <div className="text-center pt-2">
        <Link
          to="/login"
          className="text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors inline-flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Sign In
        </Link>
      </div>
    </div>
  );
};

export default ForgotPassword;
