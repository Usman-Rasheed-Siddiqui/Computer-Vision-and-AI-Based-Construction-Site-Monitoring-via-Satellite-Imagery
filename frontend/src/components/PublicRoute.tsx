import { Navigate, Outlet } from 'react-router-dom';
import { isAuthenticated } from '../api/auth';

/**
 * Redirects already-authenticated users away from public-only pages
 * (e.g. /signin, /signup) to the dashboard.
 * Usage in App.tsx:
 *   <Route element={<PublicRoute />}>
 *     <Route path="/signin" element={<SignIn />} />
 *     <Route path="/signup" element={<SignUp />} />
 *   </Route>
 */
export default function PublicRoute() {
  if (isAuthenticated()) {
    return <Navigate to="/hero" replace />;
  }
  return <Outlet />;
}
