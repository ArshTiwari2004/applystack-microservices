import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, Building2, LogOut, Menu, X, FileText, ChevronRight, User } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { useState } from 'react';

const BACKEND_URL = import.meta.env.VITE_API_URL;

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', color: 'text-info' },
  { path: '/tasks', icon: CheckSquare, label: 'Tasks', color: 'text-taskManager' },
  { path: '/companies', icon: Building2, label: 'Applications', color: 'text-jobTracker' },
  { path: '/templates', icon: FileText, label: 'Templates', color: 'text-accent' },
  { path: '/profile', icon: User, label: 'Profile', color: 'text-primary' },
];

export default function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // 🔥 NEW: logout modal state
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch(`${BACKEND_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
      toast.success('Logged out successfully');
      navigate('/');
    } catch {
      toast.error('Logout failed');
    }
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const NavLink = ({ item, onClick }) => {
    const Icon = item.icon;
    const isActive = location.pathname === item.path;

    return (
      <Link
        to={item.path}
        onClick={onClick}
        data-testid={`nav-${item.label.toLowerCase()}`}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group relative ${
          isActive
            ? 'bg-white/8 text-foreground'
            : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
        }`}
      >
        {isActive && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-r-full" />
        )}
        <Icon
          className={`w-4.5 h-4.5 flex-shrink-0 ${
            isActive ? item.color : 'text-muted-foreground group-hover:text-foreground'
          } transition-colors`}
        />
        <span className={`font-medium text-sm ${isActive ? 'text-foreground' : ''}`}>
          {item.label}
        </span>
        {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-40" />}
      </Link>
    );
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      
      {/* Mobile Header */}
      <div className="md:hidden glassmorphism fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-4">
        <Link to="/dashboard" className="flex items-center gap-2">
          <img src="/applystacklogo.png" alt="ApplyStack Logo" className="w-6 h-6 rounded-md object-contain" />
          <span className="font-heading font-bold text-base tracking-tight">ApplyStack</span>
        </Link>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="h-9 w-9 p-0 hover:bg-white/5"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-60 border-r border-white/5 bg-card/40 backdrop-blur-sm fixed h-full z-40">
        
        {/* Logo */}
        <div className="p-5 border-b border-white/5 flex items-center h-24">
          <Link to="/dashboard" className="flex items-center gap-3">
            <img src="/applystacklogo.png" alt="ApplyStack Logo" className="h-12 w-auto object-contain" />
            <span className="text-xl font-semibold text-white">ApplyStack</span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5">
          <p className="text-xs text-muted-foreground/60 font-medium uppercase tracking-wider px-3 py-2 mt-1">
            Menu
          </p>
          {navItems.map((item) => <NavLink key={item.path} item={item} />)}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-white/5">
          <button
            onClick={() => setShowLogoutModal(true)} // open modal instead
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg w-full text-muted-foreground hover:bg-white/5 hover:text-foreground transition-all duration-150 group"
          >
            <LogOut className="w-4 h-4 group-hover:text-destructive transition-colors" />
            <span className="font-medium text-sm">Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={closeMobileMenu} />
      )}

      {/* Mobile Sidebar */}
      <aside className={`md:hidden fixed top-14 left-0 bottom-0 w-64 bg-card border-r border-white/5 z-40 transition-transform duration-300 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <nav className="p-3 space-y-0.5 mt-2">
          {navItems.map((item) => <NavLink key={item.path} item={item} onClick={closeMobileMenu} />)}
        </nav>

        <div className="absolute bottom-6 left-3 right-3">
          <button
            onClick={() => setShowLogoutModal(true)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg w-full text-muted-foreground hover:bg-white/5 hover:text-foreground transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span className="font-medium text-sm">Logout</span>
          </button>
        </div>
      </aside>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-white/10 rounded-xl p-6 w-[90%] max-w-md shadow-xl">
            
            <h2 className="text-lg font-semibold mb-2">Confirm Logout</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Are you sure you want to log out of your account?
            </p>

            <div className="flex justify-end gap-3">
              
              {/* Cancel */}
              <Button
                variant="ghost"
                onClick={() => setShowLogoutModal(false)}
              >
                Cancel
              </Button>

              {/* Confirm Logout */}
              <Button
                variant="destructive"
                onClick={() => {
                  setShowLogoutModal(false);
                  handleLogout();
                }}
              >
                Logout
              </Button>

            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 md:ml-60 pt-14 md:pt-0 min-h-screen">
        <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}