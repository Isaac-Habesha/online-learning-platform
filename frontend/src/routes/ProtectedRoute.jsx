import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Loader from '../components/common/Loader';

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading, role } = useAuth();
  const location = useLocation();

  if (loading) {
    return <Loader fullPage message="Authenticating session..." />;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(role)) {
      // Wrong role: redirect to their respective dashboard
      if (role === 'INSTRUCTOR') {
        return <Navigate to="/instructor/dashboard" replace />;
      }
      return <Navigate to="/learner/dashboard" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
