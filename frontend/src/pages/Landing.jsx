import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Target, LayoutDashboard, Building2 } from 'lucide-react';
import { Button } from '../components/ui/button';

const BACKEND_URL = import.meta.env.REACT_APP_BACKEND_URL;

export default function Landing() {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
          credentials: 'include'
        });
        if (response.ok) {
          navigate('/dashboard');
        }
      } catch (error) {
        console.log('Not authenticated');
      } finally {
        setIsChecking(false);
      }
    };
    checkAuth();
  }, [navigate]);

  const handleLogin = () => {
    navigate('/login');
  };

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="glassmorphism fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 sm:w-6 sm:h-6 text-taskManager" />
            <span className="text-lg sm:text-xl font-heading font-bold">ApplyStack</span>
          </div>
          <Button
            data-testid="nav-signin-button"
            onClick={handleLogin}
            variant="outline"
            size="sm"
            className="border-white/10 hover:border-white/20 hover:bg-white/5"
          >
            Sign In
          </Button>
        </div>
      </nav>

      <main className="flex-1 pt-16">
        <section className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 sm:px-6">
          <div className="max-w-5xl w-full text-center space-y-8 sm:space-y-12">
            <div className="space-y-4 sm:space-y-6">
              <h1 className="text-4xl sm:text-5xl md:text-7xl font-heading font-bold tracking-tight">
                Master Your Tasks.
                <br />
                <span className="text-taskManager">Track Your Journey.</span>
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed px-4">
                The only workspace you need to manage daily tasks and job applications in one beautiful, focused interface.
              </p>
            </div>

            <div className="flex items-center justify-center gap-4 px-4">
              <Button
                data-testid="hero-get-started-button"
                onClick={handleLogin}
                size="lg"
                className="h-12 px-6 sm:px-8 text-sm sm:text-base bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto"
              >
                Get Started
              </Button>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto mt-12 sm:mt-20 px-4">
              <div className="p-4 sm:p-6 rounded-lg border border-white/5 bg-card/50 backdrop-blur-sm tracing-beam" data-testid="feature-card-tasks">
                <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10 text-taskManager mb-3 sm:mb-4" />
                <h3 className="text-lg sm:text-xl font-heading font-semibold mb-2">Smart Task Management</h3>
                <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
                  Organize tasks with priorities, tags, and dates. Stay focused on what matters.
                </p>
              </div>

              <div className="p-4 sm:p-6 rounded-lg border border-white/5 bg-card/50 backdrop-blur-sm tracing-beam" data-testid="feature-card-tracker">
                <Building2 className="w-8 h-8 sm:w-10 sm:h-10 text-jobTracker mb-3 sm:mb-4" />
                <h3 className="text-lg sm:text-xl font-heading font-semibold mb-2">Job Application Tracker</h3>
                <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
                  Track every application from submission to offer. Never lose track of opportunities.
                </p>
              </div>

              <div className="p-4 sm:p-6 rounded-lg border border-white/5 bg-card/50 backdrop-blur-sm tracing-beam sm:col-span-2 lg:col-span-1" data-testid="feature-card-dashboard">
                <LayoutDashboard className="w-8 h-8 sm:w-10 sm:h-10 text-info mb-3 sm:mb-4" />
                <h3 className="text-lg sm:text-xl font-heading font-semibold mb-2">Unified Dashboard</h3>
                <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
                  See everything at a glance. Your tasks and applications, beautifully organized.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
