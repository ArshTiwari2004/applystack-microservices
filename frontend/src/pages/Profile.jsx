// src/pages/Profile.jsx

import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { toast } from 'sonner';
import { User, Mail, Calendar } from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_API_URL;

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch user data on mount
  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/me`, {
        credentials: 'include',
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        toast.error('Failed to load profile');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-full">
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Heading */}
        <div>
          <h1 className="text-3xl font-heading font-bold">Profile</h1>
          <p className="text-muted-foreground text-sm">
            Your account details
          </p>
        </div>

        {/* Profile Card */}
        <div className="bg-card border border-white/5 rounded-xl p-6 shadow-card">
          
          {/* Avatar + Basic Info */}
          <div className="flex items-center gap-4 mb-6">
            
            {/* If picture exists show image, else fallback icon */}
            <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
              {user?.picture ? (
                <img
                  src={user.picture}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-6 h-6 text-primary" />
              )}
            </div>

            <div>
              <h2 className="text-lg font-semibold">
                {user?.name}
              </h2>
              <p className="text-sm text-muted-foreground">
                {user?.email}
              </p>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-4">

            {/* Name */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
              <User className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Full Name</p>
                <p className="text-sm font-medium">{user?.name}</p>
              </div>
            </div>

            {/* Email */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm font-medium">{user?.email}</p>
              </div>
            </div>

            {/* Joined Date */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Joined On</p>
                <p className="text-sm font-medium">
                  {new Date(user?.created_at).toDateString()}
                </p>
              </div>
            </div>

            {/* User ID (optional but useful) */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
              <User className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">User ID</p>
                <p className="text-sm font-medium">{user?.user_id}</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </Layout>
  );
}