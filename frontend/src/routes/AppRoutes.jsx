import React from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';

// Layouts
import RootLayout from '../layouts/RootLayout';
import AuthLayout from '../layouts/AuthLayout';
import LearnerLayout from '../layouts/LearnerLayout';
import InstructorLayout from '../layouts/InstructorLayout';

// Guard
import ProtectedRoute from './ProtectedRoute';

// Public Pages
import Home from '../pages/Home';
import CourseCatalog from '../pages/courses/CourseCatalog';
import CourseDetail from '../pages/courses/CourseDetail';

// Auth Pages
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import VerifyEmail from '../pages/auth/VerifyEmail';
import ResendVerification from '../pages/auth/ResendVerification';
import ForgotPassword from '../pages/auth/ForgotPassword';
import ResetPassword from '../pages/auth/ResetPassword';

// Learner Pages
import LearnerDashboard from '../pages/learner/Dashboard';
import CoursePlayer from '../pages/learner/CoursePlayer';
import MyProgress from '../pages/learner/MyProgress';

// Instructor Pages
import InstructorDashboard from '../pages/instructor/Dashboard';
import CourseBuilder from '../pages/instructor/CourseBuilder';
import GradingQueue from '../pages/instructor/GradingQueue';

// Common UI
import Button from '../components/common/Button';
import { Compass } from 'lucide-react';

const NotFound = () => (
  <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-8 space-y-4">
    <h1 className="text-6xl font-black text-sky-400">404</h1>
    <h2 className="text-2xl font-bold text-white">Page Not Found</h2>
    <p className="text-sm text-slate-400 max-w-md">
      The page or classroom you are looking for might have been moved or does not exist.
    </p>
    <Link to="/">
      <Button variant="primary" size="md" leftIcon={<Compass className="w-4 h-4" />}>
        Return Home
      </Button>
    </Link>
  </div>
);

export const AppRoutes = () => {
  return (
    <Routes>
      {/* 1. PUBLIC ROUTES */}
      <Route element={<RootLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/courses" element={<CourseCatalog />} />
        <Route path="/courses/:id" element={<CourseDetail />} />
      </Route>

      {/* 2. AUTH ROUTES */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/resend-verification" element={<ResendVerification />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Route>

      {/* 3. LEARNER PORTAL ROUTES */}
      <Route
        element={
          <ProtectedRoute allowedRoles={['LEARNER', 'ADMIN']}>
            <LearnerLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/learner/dashboard" element={<LearnerDashboard />} />
        <Route path="/learner/progress" element={<MyProgress />} />
      </Route>

      {/* Classroom Player (Learners, Instructors previewing content, and Admins) */}
      <Route
        path="/learner/courses/:courseId/player"
        element={
          <ProtectedRoute allowedRoles={['LEARNER', 'INSTRUCTOR', 'ADMIN']}>
            <CoursePlayer />
          </ProtectedRoute>
        }
      />
      <Route
        path="/learner/courses/:courseId/lessons/:lessonId"
        element={
          <ProtectedRoute allowedRoles={['LEARNER', 'INSTRUCTOR', 'ADMIN']}>
            <CoursePlayer />
          </ProtectedRoute>
        }
      />

      {/* 4. INSTRUCTOR STUDIO ROUTES */}
      <Route
        element={
          <ProtectedRoute allowedRoles={['INSTRUCTOR', 'ADMIN']}>
            <InstructorLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/instructor/dashboard" element={<InstructorDashboard />} />
        <Route path="/instructor/courses/new" element={<CourseBuilder />} />
        <Route path="/instructor/courses/:id/edit" element={<CourseBuilder />} />
        <Route path="/instructor/grading" element={<GradingQueue />} />
      </Route>

      {/* 5. CATCH-ALL 404 */}
      <Route element={<RootLayout />}>
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
