import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTokens } from '../contexts/TokenContext';

export function GenderFilter({ value, onChange }) {
  const { user } = useAuth();
  const { balance } = useTokens();
  const navigate = useNavigate();

  const handleClick = (gender) => {
    if (!user) {
      navigate('/signup');
      return;
    }
    onChange(value === gender ? null : gender);
  };

  return (
    <div className="gender-filter">
      <span className="gender-filter-label">Match with:</span>
      <button
        className={`gender-filter-btn${value === 'male' ? ' active' : ''}`}
        onClick={() => handleClick('male')}
      >
        Male
      </button>
      <button
        className={`gender-filter-btn${value === 'female' ? ' active' : ''}`}
        onClick={() => handleClick('female')}
      >
        Female
      </button>
      {value && (
        <span className="gender-filter-cost">
          1 token/match ({balance} left)
        </span>
      )}
    </div>
  );
}
