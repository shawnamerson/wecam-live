import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTokens } from '../contexts/TokenContext';

const showAuth = import.meta.env.VITE_SHOW_AUTH === 'true';

export function AuthStatus() {
  const { user, loading, signOut } = useAuth();
  const { balance } = useTokens();

  if (!showAuth) return null;
  if (loading) return null;

  if (user) {
    return (
      <div className="auth-status">
        <Link to="/buy-tokens" className="token-badge">{balance} tokens</Link>
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
