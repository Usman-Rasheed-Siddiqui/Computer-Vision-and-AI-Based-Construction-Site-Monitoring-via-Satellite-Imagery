import { Navigate, Outlet } from 'react-router-dom';
import { isAuthenticated } from '../api/auth';
import useIdleLogout from '../hooks/useIdleLogout';

/**
 * Renders child routes only when the user is authenticated.
 * Otherwise redirects to /signin, preserving the attempted URL via `replace`.
 * Usage in App.tsx:
 *   <Route element={<PrivateRoute />}>
 *     <Route path="/dashboard" element={<Hero />} />
 *   </Route>
 */
export default function PrivateRoute() {
  useIdleLogout(); // ends the session after 1 hour of inactivity
  if (!isAuthenticated()) {
    return <Navigate to="/signin" replace />;
  }
  return <Outlet />;
}