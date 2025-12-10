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

export default function App() {
  const [currentView, setCurrentView] = useState('loading');
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const initComplete = useRef(false);

  // Buildings data - moved outside of checkSession function
  const [buildings] = useState([
    // Academic Zone
    { id: 'CCS', name: 'College of Computer Studies', type: 'academic', color: '#1e40af' },
    { id: 'SCI', name: 'Science Labs', type: 'science', color: '#7c3aed' },
    { id: 'CBA', name: 'College of Business Administration', type: 'academic', color: '#1e40af' },
    { id: 'CED', name: 'College of Education', type: 'academic', color: '#1e40af' },
    { id: 'ENG', name: 'Engineering Building', type: 'academic', color: '#1e40af' },
    { id: 'MATH', name: 'Mathematics Building', type: 'academic', color: '#1e40af' },
    
    // Student Life Zone
    { id: 'STUD', name: 'Student Center', type: 'student', color: '#dc2626' },
    { id: 'CAF', name: 'Cafeteria', type: 'cafeteria', color: '#ea580c' },
    { id: 'LIB', name: 'Main Library', type: 'library', color: '#2563eb' },
    { id: 'BOOK', name: 'Bookstore', type: 'store', color: '#dc2626' },
    
    // Sports Zone
    { id: 'GYM', name: 'Gymnasium', type: 'gym', color: '#dc2626' },
    { id: 'FIELD', name: 'Sports Field', type: 'sports', color: '#16a34a' },
    { id: 'POOL', name: 'Swimming Pool', type: 'sports', color: '#0891b2' },
    { id: 'TENNIS', name: 'Tennis Courts', type: 'sports', color: '#16a34a' },
    
    // Admin Zone
    { id: 'ADMIN', name: 'Administration', type: 'admin', color: '#7e22ce' },
    { id: 'MED', name: 'Medical Clinic', type: 'medical', color: '#dc2626' },
    { id: 'SEC', name: 'Security', type: 'admin', color: '#7e22ce' },
    
    // Residential Zone
    { id: 'DORM1', name: 'North Dormitory', type: 'dorm', color: '#ea580c' },
    { id: 'DORM2', name: 'South Dormitory', type: 'dorm', color: '#ea580c' },
    { id: 'DORM3', name: 'East Dormitory', type: 'dorm', color: '#ea580c' },
    
    // Arts Zone
    { id: 'ART', name: 'Art Studio', type: 'arts', color: '#db2777' },
    { id: 'MUSIC', name: 'Music Hall', type: 'arts', color: '#db2777' },
    { id: 'THEA', name: 'Theater', type: 'arts', color: '#db2777' },
    
    // Additional Buildings
    { id: 'PARK', name: 'Parking Lot', type: 'parking', color: '#6b7280' },
    { id: 'CHAP', name: 'Chapel', type: 'religious', color: '#d97706' },
    { id: 'RES', name: 'Research Center', type: 'science', color: '#7c3aed' }
  ]);

  // Enhanced session check with proper error handling
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
      
      // Get user role from database with PROPER error handling
      let userRole = 'student';
      try {
        // Get the latest auth user object
        const { data: { user: authUser }, error: userErr } = await supabase.auth.getUser();
        if (userErr) console.warn('getUser warning:', userErr);
        const authObj = authUser || session.user;

        // First, check any metadata flags on the auth user (faster and often set for admin accounts)
        const metaRole =
          authObj?.user_metadata?.role?.toString().toLowerCase() ||
          authObj?.app_metadata?.role?.toString().toLowerCase();

        if (metaRole === 'admin') {
          console.log('Admin role found in user metadata/app metadata');
          userRole = 'admin';
        } else {
          // Then try to read the user_roles table
          const { data: roleData, error: roleError } = await supabase
            .from('user_roles')
            .select('role')
            .eq('id', authObj.id)
            .maybeSingle();

          console.log('Role query result:', { roleData, roleError });

          if (roleError) {
            console.warn('Role query error:', roleError);
            // Don't attempt to overwrite any DB rows here; fall back to metadata or default
            userRole = metaRole === 'admin' ? 'admin' : 'student';
          } else if (roleData && roleData.role) {
            userRole = roleData.role;
          } else {
            // No DB row found — prefer metadata if present, otherwise default to student.
            if (metaRole === 'admin') {
              userRole = 'admin';
            } else {
              console.log('No role found in DB or metadata; attempting safe insert of student role (non-destructive)');
              const created = await createUserRoleEntry(authObj.id);
              if (!created) {
                console.warn('Could not create role row (table may be missing or no permissions). Defaulting to student.');
              }
              userRole = 'student';
            }
          }
        }
      } catch (roleErr) {
        console.warn('Role check exception:', roleErr);
        userRole = 'student';
      }
      
      // Create user object
      const basicUser = {
        ...session.user,
        username: session.user.user_metadata?.username || 
                 session.user.email?.split('@')[0] || 'user',
        full_name: session.user.user_metadata?.full_name || '',
        role: userRole
      };

      console.log('User object created:', basicUser);
      setUser(basicUser);
      
      // Navigate based on role
      if (userRole === 'admin') {
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

  // Helper function to create user role entry
  const createUserRoleEntry = async (userId) => {
    try {
      // Try a plain INSERT — do not upsert. If the row already exists, treat it as success.
      const { data, error } = await supabase
        .from('user_roles')
        .insert([{ id: userId, role: 'student', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }]);

      if (error) {
        console.warn('Could not create user role entry:', error);

        // Table doesn't exist / permission error => return false (don't assume write happened)
        if (error.code === '42P01' || (error.message && error.message.toLowerCase().includes('does not exist'))) {
          return false;
        }

        // Duplicate key (row already exists) => treat as success (another process already created it)
        if (error.code === '23505' || (error.message && error.message.toLowerCase().includes('duplicate key'))) {
          return true;
        }

        // Other errors: log and return false
        return false;
      }

      // Insert succeeded
      return true;
    } catch (err) {
      console.warn('createUserRoleEntry error:', err);
      return false;
    }
  };

  // Initialize user_roles table on app start
  const initializeDatabase = async () => {
    try {
      // Try to create user_roles table if it doesn't exist
      // Remove the RPC call since it doesn't exist
      console.log('Skipping database function - not needed');
    } catch (err) {
      console.log('Database initialization skipped:', err.message);
    }
  };

  useEffect(() => {
    let mounted = true;

    // Initialize database first
    initializeDatabase();

    // Quick session check with shorter timeout
    const timeoutId = setTimeout(() => {
      if (mounted && isLoading) {
        console.log('⏰ Session check timeout - checking session state');
        checkSession();
      }
    }, 3000);

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

// public/sw.js - Production-ready service worker with offline support
const CACHE_NAME = 'campus-navi-v1';
const STATIC_CACHE = 'static-v1';
const DYNAMIC_CACHE = 'dynamic-v1';

// Essential assets to cache on install
const staticAssets = [
  '/',
  '/index.html',
  '/manifest.json',
  '/Logo.svg',
  '/offline.html'
];

// Install - Cache all static assets
self.addEventListener('install', async (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => {
      console.log('Service Worker: Caching static assets');
      return cache.addAll(staticAssets);
    }).then(() => {
      // Force the waiting service worker to become the active service worker
      self.skipWaiting();
    })
  );
});

// Activate - Clean up old caches
self.addEventListener('activate', async (event) => {
  console.log('Service Worker: Activating');
  
  event.waitUntil(
    caches.keys().then(cacheKeys => {
      return Promise.all(
        cacheKeys.map(key => {
          if (key !== STATIC_CACHE && key !== DYNAMIC_CACHE) {
            console.log('Service Worker: Removing old cache', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => {
      // Take control of all clients immediately
      return self.clients.claim();
    })
  );
});

// Fetch - Network first, fall back to cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }
  
  // For API requests - network first
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request));
  }
  // For navigation requests (HTML) - network first with fallback
  else if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
  }
  // For static assets - cache first with network fallback
  else {
    event.respondWith(cacheFirst(request));
  }
});

async function cacheFirst(request) {
  try {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    
    const response = await fetch(request);
    
    // Cache successful responses
    if (response && response.status === 200) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('Cache first failed, returning offline page:', error);
    // Return cached asset or offline page
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    return caches.match('/offline.html');
  }
}

async function networkFirst(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  
  try {
    const response = await fetch(request);
    
    // Cache successful responses
    if (response && response.status === 200) {
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('Network request failed, checking cache:', error);
    
    // Fall back to cached version
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/index.html') || caches.match('/offline.html');
    }
    
    throw error;
  }
}