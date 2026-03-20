import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const BACKEND_URL = import.meta.env.REACT_APP_BACKEND_URL;

export default function ProtectedRoute({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(
    location.state?.user ? true : null
  );
  const [user, setUser] = useState(location.state?.user || null);

  useEffect(() => {
    if (location.state?.user) return;

    const checkAuth = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
          credentials: 'include'
        });
        if (!response.ok) throw new Error('Not authenticated');
        const userData = await response.json();
        setIsAuthenticated(true);
        setUser(userData);
      } catch (error) {
        setIsAuthenticated(false);
        navigate('/');
      }
    };

    checkAuth();
  }, [location.state, navigate]);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return children;
}
