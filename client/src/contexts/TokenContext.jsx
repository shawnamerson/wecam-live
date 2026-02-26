import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';

const TokenContext = createContext({ balance: 0, refreshBalance: () => {} });

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

export function TokenProvider({ children }) {
  const { session, user } = useAuth();
  const [balance, setBalance] = useState(0);

  const refreshBalance = useCallback(async () => {
    if (!session?.access_token) {
      setBalance(0);
      return;
    }
    try {
      const res = await fetch(`${SERVER_URL}/api/token-balance`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setBalance(data.balance);
      }
    } catch (err) {
      console.error('Failed to fetch token balance:', err);
    }
  }, [session?.access_token]);

  useEffect(() => {
    if (user) refreshBalance();
    else setBalance(0);
  }, [user, refreshBalance]);

  return (
    <TokenContext.Provider value={{ balance, refreshBalance }}>
      {children}
    </TokenContext.Provider>
  );
}

export function useTokens() {
  return useContext(TokenContext);
}
