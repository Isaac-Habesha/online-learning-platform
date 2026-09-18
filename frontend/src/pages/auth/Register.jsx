import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { Mail, Lock, User, UserCheck, ArrowRight, CheckCircle2, ShieldAlert } from 'lucide-react';

export const Register = () => {
  const { register, googleLogin } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    role: 'LEARNER',
    password: '',
    password_confirm: '',
  });

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

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
      await register(formData);
      setRegisteredEmail(formData.email);
      setSuccess(true);
      toast.success('Registration successful! Please verify your email.', 'Account Created');
    } catch (err) {
      let detail = 'Registration failed. Please check the provided information.';

      // Extract detailed error message from response
      if (err.response?.data) {
        const errors = err.response.data;

        // Check for specific field errors
        if (errors.email) {
          detail = Array.isArray(errors.email) ? errors.email[0] : errors.email;
        } else if (errors.password) {
          detail = Array.isArray(errors.password) ? errors.password[0] : errors.password;
        } else if (errors.password_confirm) {
          detail = Array.isArray(errors.password_confirm) ? errors.password_confirm[0] : errors.password_confirm;
        } else if (errors.role) {
          detail = Array.isArray(errors.role) ? errors.role[0] : errors.role;
        } else if (errors.first_name) {
          detail = Array.isArray(errors.first_name) ? errors.first_name[0] : errors.first_name;
        } else if (errors.last_name) {
          detail = Array.isArray(errors.last_name) ? errors.last_name[0] : errors.last_name;
        } else if (errors.detail) {
          detail = errors.detail;
        }
      }

      setError(detail);
      toast.error(detail, 'Registration Error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async (credentialResponse) => {
    if (!credentialResponse?.credential) {
      const detail = 'Google did not return a valid sign-up credential.';
      setError(detail);
      toast.error(detail, 'Google Registration Failed');
      return;
    }
    setGoogleLoading(true);
    setError('');

    try {
      const response = await googleLogin(credentialResponse.credential, formData.role);
      toast.success(`Account created successfully! Welcome, ${response.user.first_name || response.user.email}!`, 'Google Registration Successful');

      // Navigate to role dashboard
      if (response.user.role === 'INSTRUCTOR') {
        navigate('/instructor/dashboard', { replace: true });
      } else {
        navigate('/learner/dashboard', { replace: true });
      }
    } catch (err) {
      const detail =
        err.response?.data?.detail ||
        'Google registration failed. Please try again.';
      setError(detail);
      toast.error(detail, 'Google Registration Failed');
    } finally {
      setGoogleLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white">Verification Email Sent</h2>
          <p className="text-sm text-slate-300">
            We've sent a verification link to <span className="font-semibold text-sky-400">{registeredEmail}</span>.
          </p>
          <p className="text-xs text-slate-400">
            Please check your inbox (and console/spam) and follow the link to activate your account.
          </p>
        </div>

        <div className="pt-2 space-y-3">
          <Link to="/verify-email" className="block w-full">
            <Button variant="primary" size="lg" className="w-full">
              Enter Verification Token
            </Button>
          </Link>
          <Link to="/login" className="block w-full">
            <Button variant="ghost" size="md" className="w-full">
              Back to Sign In
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-black tracking-tight text-white">Create an Account</h2>
        <p className="text-sm text-slate-400">
          Start your learning journey or publish your courses on LearnPulse.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <p className="text-sm text-rose-300">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Role Selector Tabs */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
            I am joining as a:
          </label>
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setFormData((prev) => ({ ...prev, role: 'LEARNER' }))}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                formData.role === 'LEARNER'
                  ? 'bg-sky-600 text-white shadow-glow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Learner / Student
            </button>
            <button
              type="button"
              onClick={() => setFormData((prev) => ({ ...prev, role: 'INSTRUCTOR' }))}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                formData.role === 'INSTRUCTOR'
                  ? 'bg-sky-600 text-white shadow-glow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Instructor / Teacher
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="First Name"
            name="first_name"
            required
            placeholder="Jane"
            leftIcon={<User className="w-4 h-4" />}
            value={formData.first_name}
            onChange={handleChange}
          />
          <Input
            label="Last Name"
            name="last_name"
            required
            placeholder="Doe"
            value={formData.last_name}
            onChange={handleChange}
          />
        </div>

        <Input
          label="Email Address"
          type="email"
          name="email"
          required
          autoComplete="email"
          placeholder="jane.doe@example.com"
          leftIcon={<Mail className="w-4 h-4" />}
          value={formData.email}
          onChange={handleChange}
        />

        <Input
          label="Password"
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
          label="Confirm Password"
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
          rightIcon={<UserCheck className="w-4 h-4" />}
        >
          Create Account
        </Button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-700"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-slate-900 text-slate-400">Or sign up with</span>
        </div>
      </div>

      <div className="flex justify-center">
        <GoogleLogin
          onSuccess={handleGoogleRegister}
          onError={() => {
            setError('Google registration failed. Please try again.');
            toast.error('Google registration failed', 'Registration Error');
          }}
          disabled={googleLoading}
        />
      </div>

      <div className="text-center pt-2">
        <p className="text-sm text-slate-400">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-semibold text-sky-400 hover:text-sky-300 transition-colors inline-flex items-center gap-1"
          >
            Sign in
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
