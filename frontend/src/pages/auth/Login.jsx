import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { Mail, Lock, LogIn, ArrowRight, AlertCircle } from 'lucide-react';

export const Login = () => {
  const { login, googleLogin } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [isUnverified, setIsUnverified] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setIsUnverified(false);

    try {
      const response = await login(formData);
      toast.success(`Welcome back, ${response.user.first_name || response.user.email}!`, 'Login Successful');

      // Navigate to previous location or role dashboard
      const from = location.state?.from?.pathname;
      if (from) {
        navigate(from, { replace: true });
      } else if (response.user.role === 'INSTRUCTOR') {
        navigate('/instructor/dashboard', { replace: true });
      } else {
        navigate('/learner/dashboard', { replace: true });
      }
    } catch (err) {
      const detail =
        err.response?.data?.detail ||
        err.response?.data?.non_field_errors?.[0] ||
        'Unable to log in. Please check your credentials.';

      setError(detail);

      if (detail.toLowerCase().includes('verify') || detail.toLowerCase().includes('verification')) {
        setIsUnverified(true);
      }

      toast.error(detail, 'Login Failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async (credentialResponse) => {
    if (!credentialResponse?.credential) {
      const detail = 'Google did not return a valid sign-in credential.';
      setError(detail);
      toast.error(detail, 'Google Login Failed');
      return;
    }
    setGoogleLoading(true);
    setError('');

    try {
      const response = await googleLogin(credentialResponse.credential);
      toast.success(`Welcome back, ${response.user.first_name || response.user.email}!`, 'Google Login Successful');

      // Navigate to previous location or role dashboard
      const from = location.state?.from?.pathname;
      if (from) {
        navigate(from, { replace: true });
      } else if (response.user.role === 'INSTRUCTOR') {
        navigate('/instructor/dashboard', { replace: true });
      } else {
        navigate('/learner/dashboard', { replace: true });
      }
    } catch (err) {
      const detail =
        err.response?.data?.detail ||
        'Google login failed. Please try again.';
      setError(detail);
      toast.error(detail, 'Google Login Failed');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-black tracking-tight text-white">Welcome Back</h2>
        <p className="text-sm text-slate-400">
          Sign in to your LearnPulse account to continue learning.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="text-sm text-rose-300 flex-1">
            <p>{error}</p>
            {isUnverified && (
              <Link
                to="/resend-verification"
                className="mt-2 inline-flex items-center text-xs font-semibold text-sky-400 hover:text-sky-300 underline"
              >
                Resend verification email &rarr;
              </Link>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email Address"
          type="email"
          name="email"
          required
          autoComplete="email"
          placeholder="learner@example.com"
          leftIcon={<Mail className="w-4 h-4" />}
          value={formData.email}
          onChange={handleChange}
        />

        <div className="space-y-1">
          <Input
            label="Password"
            type="password"
            name="password"
            required
            autoComplete="current-password"
            placeholder="••••••••"
            leftIcon={<Lock className="w-4 h-4" />}
            value={formData.password}
            onChange={handleChange}
          />
          <div className="flex justify-end">
            <Link
              to="/forgot-password"
              className="text-xs font-medium text-sky-400 hover:text-sky-300 transition-colors"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full mt-2"
          isLoading={loading}
          rightIcon={<LogIn className="w-4 h-4" />}
        >
          Sign In
        </Button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-700"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-slate-900 text-slate-400">Or continue with</span>
        </div>
      </div>

      <div className="flex justify-center">
        <GoogleLogin
          onSuccess={handleGoogleLogin}
          onError={() => {
            setError('Google login failed. Please try again.');
            toast.error('Google login failed', 'Login Error');
          }}
          disabled={googleLoading}
        />
      </div>

      <div className="text-center pt-2">
        <p className="text-sm text-slate-400">
          Don't have an account?{' '}
          <Link
            to="/register"
            className="font-semibold text-sky-400 hover:text-sky-300 transition-colors inline-flex items-center gap-1"
          >
            Create an account
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
