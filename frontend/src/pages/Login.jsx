import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Target, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
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
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        name: ''
    });

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
                toast.success(isLogin ? 'Welcome back!' : 'Account created successfully!');
                navigate('/dashboard', { state: { user: data }, replace: true });
            } else {
                toast.error(data.detail || 'Authentication failed');
            }
        } catch (error) {
            console.error('Auth error:', error);
            toast.error('Something went wrong. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col">
            <nav className="glassmorphism fixed top-0 left-0 right-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2">
                        <Target className="w-5 h-5 sm:w-6 sm:h-6 text-taskManager" />
                        <span className="text-lg sm:text-xl font-heading font-bold">ApplyStack</span>
                    </Link>
                </div>
            </nav>

            <main className="flex-1 pt-16 flex items-center justify-center px-4">
                <div className="w-full max-w-md">
                    <div className="p-8 rounded-xl border border-white/10 bg-card/50 backdrop-blur-sm">
                        <div className="text-center mb-8">
                            <h1 className="text-2xl sm:text-3xl font-heading font-bold mb-2">
                                {isLogin ? 'Welcome Back' : 'Create Account'}
                            </h1>
                            <p className="text-muted-foreground text-sm">
                                {isLogin
                                    ? 'Sign in to continue to ApplyStack'
                                    : 'Get started with ApplyStack today'}
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {!isLogin && (
                                <div className="space-y-2">
                                    <Label htmlFor="name">Full Name</Label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <Input
                                            id="name"
                                            type="text"
                                            placeholder="John Doe"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="pl-10"
                                            required={!isLogin}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="you@example.com"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="pl-10"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="pl-10 pr-10"
                                        required
                                        minLength={6}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                {isLogin && (
                                    <div className="flex justify-end mt-1">
                                        <Link
                                            to="/forgot-password"
                                            className="text-xs text-muted-foreground hover:text-taskManager transition-colors"
                                        >
                                            Forgot password?
                                        </Link>
                                    </div>
                                )}
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <span className="flex items-center gap-2">
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        {isLogin ? 'Signing in...' : 'Creating account...'}
                                    </span>
                                ) : (
                                    isLogin ? 'Sign In' : 'Create Account'
                                )}
                            </Button>
                        </form>

                        <div className="mt-6 text-center">
                            <p className="text-sm text-muted-foreground">
                                {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
                                <button
                                    onClick={() => {
                                        setIsLogin(!isLogin);
                                        setFormData({ email: '', password: '', name: '' });
                                    }}
                                    className="text-taskManager hover:underline font-medium"
                                >
                                    {isLogin ? 'Sign up' : 'Sign in'}
                                </button>
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
