import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, Building2, LogOut, Target, Menu, X, FileText } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { useState } from 'react';

const BACKEND_URL = import.meta.env.REACT_APP_BACKEND_URL;

export default function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch(`${BACKEND_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
      toast.success('Logged out successfully');
      navigate('/');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/tasks', icon: CheckSquare, label: 'Tasks' },
    { path: '/companies', icon: Building2, label: 'Companies' },
    { path: '/templates', icon: FileText, label: 'Templates' },
  ];

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden glassmorphism fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-4">
        <Link to="/dashboard" className="flex items-center gap-2">
          <Target className="w-6 h-6 text-taskManager" />
          <span className="text-xl font-heading font-bold">ApplyStack</span>
        </Link>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="h-10 w-10 p-0"
          data-testid="mobile-menu-toggle"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </Button>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 border-r border-white/5 bg-card/30 backdrop-blur-sm fixed h-full z-40">
        <div className="p-6 border-b border-white/5">
          <Link to="/dashboard" className="flex items-center gap-2">
            <Target className="w-6 h-6 text-taskManager" />
            <span className="text-xl font-heading font-bold">ApplyStack</span>
          </Link>
        </div>

        <nav className="p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                data-testid={`nav-${item.label.toLowerCase()}`}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                    ? 'bg-white/10 text-foreground'
                    : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
                  }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-6 left-4 right-4">
          <Button
            data-testid="logout-button"
            onClick={handleLogout}
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-white/5"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 z-40"
          onClick={closeMobileMenu}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`md:hidden fixed top-16 left-0 bottom-0 w-64 bg-card border-r border-white/5 z-40 transition-transform duration-300 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <nav className="p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={closeMobileMenu}
                data-testid={`mobile-nav-${item.label.toLowerCase()}`}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                    ? 'bg-white/10 text-foreground'
                    : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
                  }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-6 left-4 right-4">
          <Button
            data-testid="mobile-logout-button"
            onClick={handleLogout}
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-white/5"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 pt-16 md:pt-0">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
