import { Navigate, Outlet } from 'react-router-dom';
import { isAuthenticated } from '../api/auth';

/**
 * Renders child routes only when the user is authenticated.
 * Otherwise redirects to /signin, preserving the attempted URL via `replace`.
 * Usage in App.tsx:
 *   <Route element={<PrivateRoute />}>
 *     <Route path="/dashboard" element={<Hero />} />
 *   </Route>
 */
export default function PrivateRoute() {
  if (!isAuthenticated()) {
    return <Navigate to="/signin" replace />;
  }
  return <Outlet />;
}
