import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function AuthStatus() {
  const { user, loading, signOut } = useAuth();

  if (loading) return null;

  if (user) {
    return (
      <div className="auth-status">
        <span className="auth-email">{user.email}</span>
        <button className="btn-logout" onClick={signOut}>Logout</button>
      </div>
    );
  }

  return (
    <div className="auth-status">
      <Link to="/login" className="auth-link">Login</Link>
      <Link to="/signup" className="auth-link">Sign Up</Link>
    </div>
  );
}
