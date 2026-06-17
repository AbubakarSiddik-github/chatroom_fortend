import { Navigate } from 'react-router-dom';
import AuthService from '../services/AuthService';

/**
 * Wraps a route and redirects to /login if user is not authenticated.
 */
const ProtectedRoute = ({ children }) => {
  if (!AuthService.isLoggedIn()) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

export default ProtectedRoute;
