import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import { useToast } from '../../contexts/ToastContext';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { Lock, KeyRound, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

export const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const toast = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    token: searchParams.get('token') || '',
    password: '',
    password_confirm: '',
  });

  const [loading, setLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const urlToken = searchParams.get('token');
    if (urlToken) {
      setFormData((prev) => ({ ...prev, token: urlToken }));
    }
  }, [searchParams]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.password_confirm) {
      setError('Passwords do not match.');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await authService.resetPassword({
        token: formData.token.trim(),
        password: formData.password,
        password_confirm: formData.password_confirm,
      });
      setResetSuccess(true);
      toast.success('Your password has been reset successfully.', 'Success');
    } catch (err) {
      const detail =
        err.response?.data?.detail ||
        err.response?.data?.token?.[0] ||
        err.response?.data?.password?.[0] ||
        'Password reset failed. Token may be invalid or expired.';
      setError(detail);
      toast.error(detail, 'Reset Failed');
    } finally {
      setLoading(false);
    }
  };

  if (resetSuccess) {
    return (
      <div className="text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 shadow-glow-sm">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white">Password Updated!</h2>
          <p className="text-sm text-slate-300">
            You can now log in using your newly configured password.
          </p>
        </div>

        <div className="pt-2">
          <Link to="/login" className="block w-full">
            <Button variant="primary" size="lg" className="w-full" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Sign In With New Password
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-black tracking-tight text-white">Reset Password</h2>
        <p className="text-sm text-slate-400">
          Enter your reset token and choose a new secure password.
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
          label="Reset Token"
          name="token"
          required
          placeholder="Paste reset token here"
          leftIcon={<KeyRound className="w-4 h-4" />}
          value={formData.token}
          onChange={handleChange}
        />

        <Input
          label="New Password"
          type="password"
          name="password"
          required
          autoComplete="new-password"
          placeholder="Min. 8 characters"
          leftIcon={<Lock className="w-4 h-4" />}
          value={formData.password}
          onChange={handleChange}
        />

        <Input
          label="Confirm New Password"
          type="password"
          name="password_confirm"
          required
          autoComplete="new-password"
          placeholder="••••••••"
          leftIcon={<Lock className="w-4 h-4" />}
          value={formData.password_confirm}
          onChange={handleChange}
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full mt-2"
          isLoading={loading}
        >
          Update Password
        </Button>
      </form>

      <div className="text-center pt-2">
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

export default ResetPassword;
