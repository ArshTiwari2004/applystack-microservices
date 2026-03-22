import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';

const BACKEND_URL = import.meta.env.VITE_API_URL;

export default function Login() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '', name: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const body = isLogin
        ? { email: formData.email, password: formData.password }
        : { email: formData.email, password: formData.password, name: formData.name };

      const response = await fetch(`${BACKEND_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body)
      });

      const data = await response.json();
      if (response.ok) {
        toast.success(isLogin ? 'Welcome back!' : 'Account created!');
        navigate('/dashboard', { state: { user: data }, replace: true });
      } else {
        toast.error(data.detail || 'Authentication failed');
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const field = (key, value) => setFormData(p => ({ ...p, [key]: value }));

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left panel — decorative */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-card/40 border-r border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 dot-grid opacity-[0.3]" style={{ backgroundSize: '28px 28px' }} />
        <div className="absolute top-0 left-0 w-72 h-72 bg-primary/10 rounded-full blur-[80px]" />
        <div className="absolute bottom-0 right-0 w-48 h-48 bg-accent/10 rounded-full blur-[60px]" />
        
        <Link to="/" className="flex items-center gap-2.5 relative z-10">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-white font-heading font-bold text-sm">A</span>
          </div>
          <span className="font-heading font-bold text-lg">ApplyStack</span>
        </Link>

        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="text-3xl font-heading font-bold mb-3">Your job search,<br />finally organised.</h2>
            <p className="text-muted-foreground leading-relaxed">Track every application through its full lifecycle. From first interest to offer letter.</p>
          </div>

          <div className="space-y-4">
            {[
              { label: 'Application pipeline tracking', color: 'bg-jobTracker' },
              { label: 'Daily task management', color: 'bg-taskManager' },
              { label: 'Reusable message templates', color: 'bg-accent' },
              { label: 'One-click PDF export', color: 'bg-warning' },
            ].map(({ label, color }) => (
              <div key={label} className="flex items-center gap-3">
                <div className={`w-1.5 h-1.5 rounded-full ${color}`} />
                <span className="text-sm text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-muted-foreground/60 relative z-10">Free forever. No credit card required.</p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-sm space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-white font-heading font-bold text-sm">A</span>
            </div>
            <span className="font-heading font-bold text-lg">ApplyStack</span>
          </div>

          <div>
            <h1 className="text-2xl font-heading font-bold mb-1">
              {isLogin ? 'Sign in' : 'Create account'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isLogin ? "Don't have an account? " : 'Already have one? '}
              <button
                onClick={() => { setIsLogin(!isLogin); setFormData({ email: '', password: '', name: '' }); }}
                className="text-primary hover:underline font-medium"
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-sm">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={e => field('name', e.target.value)}
                    className="pl-9 h-10 bg-card border-white/10 focus:border-primary/50"
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={e => field('email', e.target.value)}
                  className="pl-9 h-10 bg-card border-white/10 focus:border-primary/50"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm">Password</Label>
                {isLogin && (
                  <Link to="/forgot-password" className="text-xs text-muted-foreground hover:text-primary transition-colors">
                    Forgot password?
                  </Link>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={e => field('password', e.target.value)}
                  className="pl-9 pr-9 h-10 bg-card border-white/10 focus:border-primary/50"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-10 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg mt-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {isLogin ? 'Signing in...' : 'Creating account...'}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  {isLogin ? 'Sign In' : 'Create Account'}
                  <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </Button>
          </form>

          <p className="text-xs text-center text-muted-foreground">
            By continuing, you agree to our terms of service.
          </p>
        </div>
      </div>
    </div>
  );
}