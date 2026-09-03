import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import { useToast } from '../../contexts/ToastContext';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { KeyRound, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

export const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const toast = useToast();
  const navigate = useNavigate();

  const [token, setToken] = useState(searchParams.get('token') || '');
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState('');

  // Auto-verify if token is present in URL
  useEffect(() => {
    const urlToken = searchParams.get('token');
    if (urlToken) {
      handleVerification(urlToken);
    }
  }, [searchParams]);

  const handleVerification = async (verificationToken) => {
    if (!verificationToken.trim()) {
      setError('Please provide a verification token.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await authService.verifyEmail(verificationToken.trim());
      setVerified(true);
      toast.success('Your email address has been verified successfully!', 'Verified');
    } catch (err) {
      const detail =
        err.response?.data?.detail ||
        err.response?.data?.token?.[0] ||
        'Verification token is invalid or expired.';
      setError(detail);
      toast.error(detail, 'Verification Failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleVerification(token);
  };

  if (verified) {
    return (
      <div className="text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 shadow-glow-sm">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white">Email Verified!</h2>
          <p className="text-sm text-slate-300">
            Your account is now fully active. You can log in and start learning right away.
          </p>
        </div>

        <div className="pt-2">
          <Link to="/login" className="block w-full">
            <Button variant="primary" size="lg" className="w-full" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Proceed to Sign In
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-black tracking-tight text-white">Verify Your Email</h2>
        <p className="text-sm text-slate-400">
          Paste the verification token received in your email inbox to activate your account.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="text-sm text-rose-300">
            <p>{error}</p>
            <Link
              to="/resend-verification"
              className="mt-1 inline-block text-xs font-semibold text-sky-400 hover:text-sky-300 underline"
            >
              Request a new token &rarr;
            </Link>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Verification Token"
          name="token"
          required
          placeholder="Paste verification token here"
          leftIcon={<KeyRound className="w-4 h-4" />}
          value={token}
          onChange={(e) => setToken(e.target.value)}
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full mt-2"
          isLoading={loading}
        >
          Verify Email Address
        </Button>
      </form>

      <div className="text-center pt-2 flex flex-col gap-2">
        <Link
          to="/resend-verification"
          className="text-xs font-semibold text-sky-400 hover:text-sky-300 transition-colors"
        >
          Didn't receive an email? Resend verification
        </Link>
        <Link
          to="/login"
          className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
        >
          Back to Login
        </Link>
      </div>
    </div>
  );
};

export default VerifyEmail;
