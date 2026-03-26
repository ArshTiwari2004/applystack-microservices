import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

const BACKEND_URL = import.meta.env.VITE_API_URL;

const messages = [
  "Syncing your job applications...",
  "Preparing your dashboard...",
  "Tracking your opportunities...",
  "Organizing your career pipeline...",
  "Loading your application data...",
  "Every application counts. Stay consistent.",
  "You're closer to your next offer.",
  "Building your career system...",
  "Your journey to the next role continues...",
  "ApplyStack is setting things up for you..."
];

export default function ProtectedRoute({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [message, setMessage] = useState(messages[0]);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessage(messages[Math.floor(Math.random() * messages.length)]);
    }, 2000);

    const checkAuth = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
          credentials: 'include',
        });

        if (!response.ok) throw new Error();

        setIsAuthenticated(true);
      } catch {
        setIsAuthenticated(false);
      }
    };

    checkAuth();

    return () => clearInterval(interval);
  }, []);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-5">
        
 
        <div className="w-10 h-10 border-2 border-white/20 border-t-primary rounded-full animate-spin"></div>

  
        <h2 className="text-lg font-semibold tracking-tight">
          ApplyStack
        </h2>
        
        <p className="text-muted-foreground text-sm text-center px-6 max-w-sm">
          {message}
        </p>

      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
}