import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, LayoutDashboard, Building2, ArrowRight, Zap, Shield, Layers } from 'lucide-react';
import { Button } from '../components/ui/button';

const BACKEND_URL = import.meta.env.VITE_API_URL;

const stats = [
  { value: '50+', label: 'Applications tracked' },
  { value: '5min', label: 'Setup time' },
  { value: '0', label: 'Lost opportunities' },
];

const features = [
  {
    icon: CheckCircle2,
    color: 'text-taskManager',
    bg: 'bg-taskManager/10',
    title: 'Smart Task Management',
    description: 'Priority-based tasks with overdue tracking, tags, and daily grouping. Never miss a prep deadline.',
    testId: 'feature-card-tasks',
  },
  {
    icon: Building2,
    color: 'text-jobTracker',
    bg: 'bg-jobTracker/10',
    title: 'Job Application Tracker',
    description: 'Full-lifecycle tracking: applied → shortlisted → interviews → offer. Grouped by company with status filters.',
    testId: 'feature-card-tracker',
  },
  {
    icon: LayoutDashboard,
    color: 'text-info',
    bg: 'bg-info/10',
    title: 'Unified Dashboard',
    description: 'Today\'s tasks and active applications at a glance. The command center for your job search.',
    testId: 'feature-card-dashboard',
  },
  {
    icon: Layers,
    color: 'text-accent',
    bg: 'bg-accent/10',
    title: 'Reusable Templates',
    description: 'Save LinkedIn referral requests, HR emails, and cover letter content. Write once, use everywhere.',
    testId: 'feature-card-templates',
  },
  {
    icon: Zap,
    color: 'text-warning',
    bg: 'bg-warning/10',
    title: 'Instant Reminders',
    description: 'Automatic banners for companies you haven\'t applied to yet. Stay ahead of every opportunity.',
    testId: 'feature-card-reminders',
  },
  {
    icon: Shield,
    color: 'text-success',
    bg: 'bg-success/10',
    title: 'Secure & Private',
    description: 'JWT authentication, bcrypt passwords, HttpOnly cookies. Your data stays yours.',
    testId: 'feature-card-security',
  },
];

export default function Landing() {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/auth/me`, { credentials: 'include' });
        if (response.ok) navigate('/dashboard');
      } catch (_) {}
      finally { setIsChecking(false); }
    };
    checkAuth();
    setTimeout(() => setMounted(true), 50);
  }, [navigate]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background overflow-x-hidden">
      {/* Dot grid background */}
      <div className="fixed inset-0 dot-grid opacity-[0.3] pointer-events-none" style={{ backgroundSize: '28px 28px' }} />
      
      {/* Top gradient glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Nav */}
      <nav className="glassmorphism fixed top-0 left-0 right-0 z-50">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-white font-heading font-bold text-sm">A</span>
            </div>
            <span className="font-heading font-bold text-lg tracking-tight">ApplyStack</span>
          </div>
          <Button
            data-testid="nav-signin-button"
            onClick={() => navigate('/login')}
            size="sm"
            className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-foreground transition-all"
          >
            Sign In
            <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </Button>
        </div>
      </nav>

      <main className="flex-1 pt-16">
        {/* Hero */}
        <section className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-5 sm:px-8 relative">
          <div className={`max-w-4xl w-full text-center space-y-10 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-sm text-primary font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Built for placement season
            </div>

            {/* Headline */}
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-6xl md:text-7xl font-heading font-bold tracking-tight leading-[1.1]">
                Stop losing track of
                <br />
                <span className="gradient-text">your opportunities.</span>
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
                ApplyStack is a purpose-built tracker for job seekers managing 30+ applications. Structured pipelines, smart reminders, reusable templates.
              </p>
            </div>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                data-testid="hero-get-started-button"
                onClick={() => navigate('/login')}
                size="lg"
                className="h-12 px-8 bg-primary hover:bg-primary/90 text-white font-medium rounded-xl pulse-glow w-full sm:w-auto"
              >
                Get Started Free
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate('/login')}
                className="h-12 px-8 border-white/10 hover:border-white/20 hover:bg-white/5 rounded-xl w-full sm:w-auto"
              >
                See how it works
              </Button>
            </div>

            {/* Stats */}
            <div className="flex items-center justify-center gap-8 sm:gap-16 pt-4">
              {stats.map(({ value, label }) => (
                <div key={label} className="text-center">
                  <div className="text-2xl sm:text-3xl font-heading font-bold gradient-text">{value}</div>
                  <div className="text-xs sm:text-sm text-muted-foreground mt-0.5">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="px-5 sm:px-8 pb-24 max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-heading font-bold mb-3">Everything you need</h2>
            <p className="text-muted-foreground">One workspace. Your entire job search.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map(({ icon: Icon, color, bg, title, description, testId }, i) => (
              <div
                key={title}
                data-testid={testId}
                className={`card-base p-6 space-y-4 animate-fade-in-up`}
                style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'both' }}
              >
                <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-base mb-1.5">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA band */}
        <section className="px-5 sm:px-8 pb-24 max-w-4xl mx-auto">
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-8 sm:p-12 text-center space-y-6">
            <h2 className="text-3xl sm:text-4xl font-heading font-bold">Ready to get organised?</h2>
            <p className="text-muted-foreground max-w-md mx-auto">Set up in 5 minutes. Track your first application today.</p>
            <Button
              onClick={() => navigate('/login')}
              size="lg"
              className="h-12 px-8 bg-primary hover:bg-primary/90 text-white rounded-xl"
            >
              Start Tracking — It's Free
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-6 px-5 sm:px-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-primary/80 flex items-center justify-center">
              <span className="text-white font-heading font-bold text-xs">A</span>
            </div>
            <span className="font-heading font-medium text-foreground">ApplyStack</span>
          </div>
          <p>Built for students, by a student. Open source.</p>
        </div>
      </footer>
    </div>
  );
}