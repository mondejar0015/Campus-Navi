import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './supabaseClient';
import Login from './components/Login';
import Signup from './components/Signup';
import CampusMap from './components/CampusMap';
import Info from './components/Info';
import Navigate from './components/Navigate';
import Announcements from './components/Announcements';
import Schedule from './components/Schedule';
import Loading from './components/Loading';
import AdminPanel from './componentsAdmin/AdminPanel';
import AdminLogin from './componentsAdmin/AdminLogin';

export default function App() {
  const [currentView, setCurrentView] = useState('loading');
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const initComplete = useRef(false);

  // Buildings data
  const [buildings, setBuildings] = useState([
    // ... your existing buildings data
  ]);

  // Enhanced session check
  const checkSession = async () => {
    try {
      console.log('🔍 Checking session...');
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('❌ Session error:', error);
        setIsLoading(false);
        setCurrentView('login');
        return;
      }

      if (!session?.user) {
        console.log('👤 No active session');
        setIsLoading(false);
        setCurrentView('login');
        return;
      }

      console.log('✅ Session found for:', session.user.email);
      
      // Create basic user object
      const basicUser = {
        ...session.user,
        username: session.user.email?.split('@')[0] || 'user',
        full_name: session.user.user_metadata?.full_name || '',
        role: session.user.user_metadata?.role || 'student'
      };

      setUser(basicUser);
      
      // Navigate based on role
      if (basicUser.role === 'admin') {
        console.log('🚀 Redirecting to admin panel');
        setCurrentView('admin');
      } else {
        console.log('🗺️ Redirecting to campus map');
        setCurrentView('map');
      }
      
      setIsLoading(false);
      initComplete.current = true;

    } catch (error) {
      console.error('💥 Session check failed:', error);
      setIsLoading(false);
      setCurrentView('login');
    }
  };

  useEffect(() => {
    let mounted = true;

    // Quick session check with shorter timeout
    const timeoutId = setTimeout(() => {
      if (mounted && isLoading) {
        console.log('⏰ Session check timeout - checking session state');
        checkSession(); // Re-check instead of forcing login
      }
    }, 3000); // Reduced timeout

    // Initial session check
    checkSession();

    // Enhanced auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      
      console.log('🔄 Auth state changed:', event);
      
      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') {
        console.log('👤 User session updated');
        checkSession();
      } else if (event === 'SIGNED_OUT') {
        console.log('👋 User signed out');
        setUser(null);
        setCurrentView('login');
        setIsLoading(false);
      } else if (event === 'USER_UPDATED') {
        console.log('📝 User updated');
        checkSession();
      }
    });

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      subscription?.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setCurrentView('login');
      setIsLoading(false);
    }
  };

  const handleSignupSuccess = () => {
    alert('Account created successfully! You can now log in.');
    setCurrentView('login');
  };

  const handleLoginSuccess = async () => {
    console.log('🔄 Manual login success trigger');
    await checkSession();
  };

  // RENDER
  const renderView = () => {
    if (isLoading) return <Loading />;

    switch (currentView) {
      case 'login': 
        return <Login onNavigate={setCurrentView} onLoginSuccess={handleLoginSuccess} />;
      case 'signup': 
        return <Signup onNavigate={setCurrentView} onSignupSuccess={handleSignupSuccess} />;
      case 'admin-login': 
        return <AdminLogin onNavigate={setCurrentView} onAdminLoginSuccess={handleLoginSuccess} />;
      case 'map': 
        return <CampusMap onNavigate={setCurrentView} user={user} buildings={buildings} onLogout={handleLogout} />;
      case 'info': 
        return <Info onNavigate={setCurrentView} buildings={buildings} />;
      case 'navigate': 
        return <Navigate onNavigate={setCurrentView} buildings={buildings} />;
      case 'announcements': 
        return <Announcements onNavigate={setCurrentView} user={user} />;
      case 'schedule': 
        return <Schedule onNavigate={setCurrentView} user={user} />;
      case 'admin': 
        return <AdminPanel onNavigate={setCurrentView} user={user} />;
      default: 
        return <Login onNavigate={setCurrentView} onLoginSuccess={handleLoginSuccess} />;
    }
  };

  return (
    <div className="min-h-screen w-full bg-gray-50 font-sans text-gray-900 overflow-hidden">
      {renderView()}
    </div>
  );
}