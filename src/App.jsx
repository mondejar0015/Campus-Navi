import React, { useState, useEffect, useRef, useCallback } from 'react';
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

  // Buildings data (Collapsed for brevity - keep your existing data)
  const [buildings, setBuildings] = useState([
    {
      name: 'College of Computer Studies',
      code: 'CCS',
      desc: 'Home to computer science and IT programs with state-of-the-art computer labs and research facilities.',
      hours: '7:00 AM - 9:00 PM',
      floors: 5,
      facilities: ['Computer Labs', 'Research Center', 'Faculty Offices', 'Student Lounge', 'Conference Rooms']
    },
    // ... rest of your buildings array ...
    {
      name: 'Main Library',
      code: 'LIB',
      desc: 'Central library with extensive collections, study areas, and digital resources for academic research.',
      hours: '6:00 AM - 10:00 PM',
      floors: 4,
      facilities: ['Reading Areas', 'Group Study Rooms', 'Computer Station', 'Printing Services', 'Quiet Zones']
    },
    {
      name: 'Student Center',
      code: 'STUD',
      desc: 'Hub for student activities, organizations, and campus events with various amenities and services.',
      hours: '8:00 AM - 11:00 PM',
      floors: 3,
      facilities: ['Food Court', 'Game Room', 'Meeting Rooms', 'Student Org Offices', 'Lounges']
    },
    {
      name: 'Science Labs',
      code: 'SCI',
      desc: 'Advanced laboratory facilities for chemistry, biology, physics, and environmental science research.',
      hours: '7:00 AM - 8:00 PM',
      floors: 4,
      facilities: ['Research Labs', 'Equipment Rooms', 'Faculty Offices', 'Student Workspaces', 'Safety Stations']
    },
    {
      name: 'Cafeteria',
      code: 'CAF',
      desc: 'Main dining facility offering diverse food options for students, faculty, and staff.',
      hours: '6:30 AM - 8:00 PM',
      floors: 2,
      facilities: ['Food Stations', 'Seating Areas', 'Vending Machines', 'Microwave Stations', 'Outdoor Terrace']
    },
    {
      name: 'College of Business Administration',
      code: 'CBA',
      desc: 'Modern business education facility with trading rooms, case study rooms, and executive education spaces.',
      hours: '7:00 AM - 9:00 PM',
      floors: 6,
      facilities: ['Trading Room', 'Case Rooms', 'Faculty Offices', 'Student Lounge', 'Career Center']
    },
    {
      name: 'College of Education',
      code: 'CED',
      desc: 'Dedicated to teacher education and educational research with specialized classrooms and observation areas.',
      hours: '7:00 AM - 8:00 PM',
      floors: 4,
      facilities: ['Smart Classrooms', 'Observation Rooms', 'Curriculum Library', 'Faculty Offices', 'Seminar Hall']
    },
    {
      name: 'Gymnasium',
      code: 'GYM',
      desc: 'Comprehensive athletic facility for sports, fitness, and recreational activities for the campus community.',
      hours: '5:00 AM - 11:00 PM',
      floors: 2,
      facilities: ['Basketball Courts', 'Fitness Center', 'Locker Rooms', 'Climbing Wall', 'Swimming Pool']
    },
    {
      name: 'Sports Field',
      code: 'FIELD',
      desc: 'Outdoor athletic complex for various sports including football, track, and intramural activities.',
      hours: '5:00 AM - 10:00 PM',
      floors: 1,
      facilities: ['Football Field', 'Track', 'Bleachers', 'Equipment Rental', 'Lighting System']
    },
    {
      name: 'Administration',
      code: 'ADM',
      desc: 'Central administrative offices handling university operations, student services, and administrative functions.',
      hours: '8:00 AM - 5:00 PM',
      floors: 5,
      facilities: ['Registrar Office', 'Bursar', 'Student Affairs', 'HR Department', 'Meeting Rooms']
    },
    {
      name: 'Medical Clinic',
      code: 'MED',
      desc: 'Campus health center providing medical services, wellness programs, and emergency care for students and staff.',
      hours: '24/7 Emergency, 8AM-6PM Regular',
      floors: 3,
      facilities: ['Emergency Room', 'Consultation Rooms', 'Pharmacy', 'Laboratory', 'Wellness Center']
    }
  ]);

  // CORE LOGIC: Check session and update state
  // Wrapped in useCallback to ensure stability
  const checkSession = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session?.user) {
        setUser(null);
        setCurrentView('login');
        setIsLoading(false);
        return;
      }

      // Default User Object
      const basicUser = {
        ...session.user,
        username: session.user.email?.split('@')[0] || 'user',
        full_name: '',
        role: 'student'
      };

      try {
        // Fetch Role
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (roleData) basicUser.role = roleData.role;
        
        // Fetch Profile Name
        const { data: profile } = await supabase
          .from('users')
          .select('username, full_name')
          .eq('id', session.user.id)
          .single();
          
        if (profile) {
          basicUser.username = profile.username || basicUser.username;
          basicUser.full_name = profile.full_name || basicUser.full_name;
        }

      } catch (err) {
        console.log('Minor error fetching details:', err);
      }

      setUser(basicUser);
      
      if (basicUser.role === 'admin') {
        setCurrentView('admin');
      } else {
        setCurrentView('map');
      }
      
      setIsLoading(false);
      initComplete.current = true;

    } catch (error) {
      console.error('Session check failed:', error);
      setIsLoading(false);
      setCurrentView('login');
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    // Safety Timeout
    const timeoutId = setTimeout(() => {
      if (mounted && !initComplete.current) {
        console.warn('Force stopping loading screen');
        setIsLoading(false);
        if (!user) setCurrentView('login');
      }
    }, 4000);

    // Initial Check
    checkSession();

    // Auth Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (!mounted) return;
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        checkSession();
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setCurrentView('login');
        setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      subscription?.unsubscribe();
    };
  }, [checkSession]); // Added checkSession as dependency

  const handleLogout = async () => {
    setIsLoading(true);
    await supabase.auth.signOut();
  };

  const handleSignupSuccess = () => {
    alert('Account created successfully! You can now log in.');
    setCurrentView('login');
  };

  // RENDER
  const renderView = () => {
    if (isLoading) return <Loading />;

    switch (currentView) {
      case 'login': 
        // Pass checkSession as onLoginSuccess so Login can trigger it manually
        return <Login onNavigate={setCurrentView} onLoginSuccess={checkSession} />;
      case 'signup': 
        return <Signup onNavigate={setCurrentView} onSignupSuccess={handleSignupSuccess} />;
      case 'admin-login': 
        // Pass checkSession here too
        return <AdminLogin onNavigate={setCurrentView} onAdminLoginSuccess={checkSession} />;
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
        return <Login onNavigate={setCurrentView} onLoginSuccess={checkSession} />;
    }
  };

  return (
    <div className="min-h-screen w-full bg-gray-50 font-sans text-gray-900 overflow-hidden">
      {renderView()}
    </div>
  );
}