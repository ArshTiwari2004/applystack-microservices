import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Target, Lock, Key, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';

const BACKEND_URL = import.meta.env.VITE_API_URL;

export default function ResetPassword() {
    const navigate = useNavigate();
    const location = useLocation();
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        email: location.state?.email || '',
        otp: '',
        newPassword: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await fetch(`${BACKEND_URL}/api/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                toast.success('Password reset successfully! Please login.');
                navigate('/login');
            } else {
                toast.error(data.detail || 'Failed to reset password');
            }
        } catch (error) {
            console.error('Reset password error:', error);
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
                                Reset Password
                            </h1>
                            <p className="text-muted-foreground text-sm">
                                Enter the OTP sent to your email and your new password
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="otp">OTP</Label>
                                <div className="relative">
                                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        id="otp"
                                        type="text"
                                        placeholder="123456"
                                        value={formData.otp}
                                        onChange={(e) => setFormData({ ...formData, otp: e.target.value })}
                                        className="pl-10"
                                        required
                                        maxLength={6}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="newPassword">New Password</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        id="newPassword"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        value={formData.newPassword}
                                        onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
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
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <span className="flex items-center gap-2">
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Resetting...
                                    </span>
                                ) : (
                                    'Reset Password'
                                )}
                            </Button>
                        </form>

                        <div className="mt-6 text-center">
                            <Link to="/login" className="text-sm text-taskManager hover:underline flex items-center justify-center gap-2">
                                <ArrowLeft className="w-4 h-4" />
                                Back to Login
                            </Link>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
