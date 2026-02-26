import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePageMeta } from '../hooks/usePageMeta';

export default function SignUp() {
  usePageMeta({ title: 'Sign Up - WeCam', description: 'Create a WeCam account.', path: '/signup' });

  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [gender, setGender] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!gender) {
      setError('Please select a gender.');
      return;
    }
    setError('');
    setSubmitting(true);
    const { error: err } = await signUp(email, password, gender);
    setSubmitting(false);
    if (err) {
      setError(err.message);
    } else {
      navigate('/');
    }
  }

  return (
    <main className="content-page">
      <div className="content-container">
        <h1>Sign Up</h1>
        <form className="auth-form" onSubmit={handleSubmit}>
          {error && <p className="auth-error">{error}</p>}
          <label>
            Email
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} />
          </label>
          <label>
            Password
            <input type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} />
          </label>
          <fieldset className="gender-fieldset">
            <legend>Gender</legend>
            <label>
              <input type="radio" name="gender" value="male" checked={gender === 'male'} onChange={() => setGender('male')} />
              Male
            </label>
            <label>
              <input type="radio" name="gender" value="female" checked={gender === 'female'} onChange={() => setGender('female')} />
              Female
            </label>
          </fieldset>
          <button className="btn btn-start" type="submit" disabled={submitting}>
            {submitting ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>
        <p style={{ marginTop: '1rem', textAlign: 'center' }}>
          Already have an account? <Link to="/login" className="auth-link">Log In</Link>
        </p>
      </div>
    </main>
  );
}
