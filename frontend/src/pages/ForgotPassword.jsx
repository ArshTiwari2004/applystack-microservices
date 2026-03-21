import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Target, Mail, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';

const BACKEND_URL = import.meta.env.VITE_API_URL;

export default function ForgotPassword() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await fetch(`${BACKEND_URL}/api/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (response.ok) {
                toast.success('OTP sent successfully to your email');
                navigate('/reset-password', { state: { email } });
            } else {
                toast.error(data.detail || 'Failed to send OTP');
            }
        } catch (error) {
            console.error('Forgot password error:', error);
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
                                Forgot Password
                            </h1>
                            <p className="text-muted-foreground text-sm">
                                Enter your email to receive a password reset OTP
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="pl-10"
                                        required
                                    />
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
                                        Sending OTP...
                                    </span>
                                ) : (
                                    'Send OTP'
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
