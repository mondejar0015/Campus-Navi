import React, { useState, useRef, useCallback } from 'react';
// Added 'Shield' to imports below
import { Menu, MapPin, Search, Navigation, Info as InfoIcon, Bell, Calendar, Compass, Plus, Minus, LogOut, User, Settings, Building2, BookOpen, Coffee, Dumbbell, FlaskRound, Trees, Shield } from 'lucide-react';

const CampusMap = ({ onNavigate, user, buildings, onLogout }) => {
  const [activeBuilding, setActiveBuilding] = useState(null);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [scale, setScale] = useState(1.0);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showBuildingDetails, setShowBuildingDetails] = useState(false);
  const startPanRef = useRef({ x: 0, y: 0 });

  const MIN_SCALE = 0.6;
  const MAX_SCALE = 3;
  const ZOOM_STEP = 0.2;

  // Organized campus layout with proper zones
  const campusZones = {
    academic: { x: 80, y: 50, width: 280, height: 120, label: 'ACADEMIC ZONE', color: '#1e40af' },
    student: { x: 30, y: 180, width: 150, height: 100, label: 'STUDENT LIFE', color: '#dc2626' },
    sports: { x: 200, y: 290, width: 200, height: 120, label: 'SPORTS ZONE', color: '#059669' },
    admin: { x: 300, y: 150, width: 120, height: 80, label: 'ADMIN ZONE', color: '#7e22ce' },
    residential: { x: 400, y: 50, width: 80, height: 200, label: 'RESIDENTIAL', color: '#ea580c' },
    arts: { x: 400, y: 270, width: 80, height: 140, label: 'ARTS ZONE', color: '#db2777' }
  };

  // Organized building data with proper placement
  const mapBuildings = [
    // Academic Zone
    { id: 'CCS', x: 100, y: 70, width: 70, height: 50, label: 'CCS', name: 'Computer Studies', type: 'academic', color: '#1e40af', zone: 'academic' },
    { id: 'SCI', x: 190, y: 70, width: 70, height: 50, label: 'SCI', name: 'Science Labs', type: 'science', color: '#7c3aed', zone: 'academic' },
    { id: 'CBA', x: 100, y: 140, width: 70, height: 50, label: 'CBA', name: 'Business Admin', type: 'academic', color: '#1e40af', zone: 'academic' },
    { id: 'CED', x: 190, y: 140, width: 70, height: 50, label: 'CED', name: 'Education', type: 'academic', color: '#1e40af', zone: 'academic' },
    { id: 'ENG', x: 280, y: 70, width: 70, height: 50, label: 'ENG', name: 'Engineering', type: 'academic', color: '#1e40af', zone: 'academic' },
    { id: 'MATH', x: 280, y: 140, width: 70, height: 50, label: 'MATH', name: 'Mathematics', type: 'academic', color: '#1e40af', zone: 'academic' },
    
    // Student Life Zone
    { id: 'STDN', x: 50, y: 200, width: 80, height: 60, label: 'STUD', name: 'Student Center', type: 'student', color: '#dc2626', zone: 'student' },
    { id: 'CAF', x: 50, y: 280, width: 60, height: 60, label: 'CAF', name: 'Cafeteria', type: 'cafeteria', color: '#ea580c', zone: 'student' },
    { id: 'LIB', x: 130, y: 200, width: 90, height: 70, label: 'LIB', name: 'Main Library', type: 'library', color: '#2563eb', zone: 'student' },
    { id: 'BOOK', x: 130, y: 280, width: 50, height: 50, label: 'BOOK', name: 'Bookstore', type: 'store', color: '#dc2626', zone: 'student' },
    
    // Sports Zone
    { id: 'GYM', x: 220, y: 310, width: 80, height: 70, label: 'GYM', name: 'Gymnasium', type: 'gym', color: '#dc2626', zone: 'sports' },
    { id: 'FIELD', x: 220, y: 400, width: 160, height: 50, label: 'FIELD', name: 'Sports Field', type: 'sports', color: '#16a34a', zone: 'sports' },
    { id: 'POOL', x: 320, y: 310, width: 60, height: 70, label: 'POOL', name: 'Swimming Pool', type: 'sports', color: '#0891b2', zone: 'sports' },
    { id: 'TENNIS', x: 390, y: 400, width: 70, height: 40, label: 'TENNIS', name: 'Tennis Courts', type: 'sports', color: '#16a34a', zone: 'sports' },
    
    // Admin Zone
    { id: 'ADMIN', x: 320, y: 170, width: 80, height: 60, label: 'ADM', name: 'Administration', type: 'admin', color: '#7e22ce', zone: 'admin' },
    { id: 'MED', x: 320, y: 250, width: 60, height: 50, label: 'MED', name: 'Medical Clinic', type: 'medical', color: '#dc2626', zone: 'admin' },
    { id: 'SEC', x: 390, y: 170, width: 50, height: 40, label: 'SEC', name: 'Security', type: 'admin', color: '#7e22ce', zone: 'admin' },
    
    // Residential Zone
    { id: 'DORM1', x: 410, y: 70, width: 60, height: 40, label: 'DORM1', name: 'North Dormitory', type: 'dorm', color: '#ea580c', zone: 'residential' },
    { id: 'DORM2', x: 410, y: 120, width: 60, height: 40, label: 'DORM2', name: 'South Dormitory', type: 'dorm', color: '#ea580c', zone: 'residential' },
    { id: 'DORM3', x: 410, y: 170, width: 60, height: 40, label: 'DORM3', name: 'East Dormitory', type: 'dorm', color: '#ea580c', zone: 'residential' },
    
    // Arts Zone
    { id: 'ART', x: 410, y: 290, width: 60, height: 50, label: 'ART', name: 'Art Studio', type: 'arts', color: '#db2777', zone: 'arts' },
    { id: 'MUSIC', x: 410, y: 350, width: 60, height: 50, label: 'MUSIC', name: 'Music Hall', type: 'arts', color: '#db2777', zone: 'arts' },
    { id: 'THEA', x: 410, y: 410, width: 60, height: 40, label: 'THEA', name: 'Theater', type: 'arts', color: '#db2777', zone: 'arts' },
    
    // Additional Buildings
    { id: 'PARK', x: 20, y: 420, width: 80, height: 40, label: 'PARK', name: 'Parking Lot', type: 'parking', color: '#6b7280', zone: 'student' },
    { id: 'CHAP', x: 20, y: 350, width: 50, height: 50, label: 'CHAP', name: 'Chapel', type: 'religious', color: '#d97706', zone: 'student' },
    { id: 'RES', x: 80, y: 350, width: 50, height: 50, label: 'RES', name: 'Research Center', type: 'science', color: '#7c3aed', zone: 'academic' }
  ];

  // Get building icon based on type
  const getBuildingIcon = (type) => {
    switch (type) {
      case 'library': return <BookOpen size={16} />;
      case 'cafeteria': return <Coffee size={16} />;
      case 'gym': return <Dumbbell size={16} />;
      case 'science': return <FlaskRound size={16} />;
      case 'sports': return <Dumbbell size={16} />;
      case 'medical': return <Plus size={16} />;
      case 'dorm': return <Building2 size={16} />;
      case 'arts': return <BookOpen size={16} />;
      case 'store': return <Building2 size={16} />;
      case 'parking': return <MapPin size={16} />;
      case 'religious': return <Building2 size={16} />;
      default: return <Building2 size={16} />;
    }
  };

  // Filter buildings based on search
  const filteredBuildings = mapBuildings.filter(building =>
    building.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    building.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Panning Logic
  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
    startPanRef.current = { 
      x: e.clientX - panX, 
      y: e.clientY - panY 
    };
  }, [panX, panY]);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    const newPanX = e.clientX - startPanRef.current.x;
    const newPanY = e.clientY - startPanRef.current.y;
    setPanX(newPanX);
    setPanY(newPanY);
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const zoomIn = () => setScale(prevScale => Math.min(prevScale + ZOOM_STEP, MAX_SCALE));
  const zoomOut = () => setScale(prevScale => Math.max(prevScale - ZOOM_STEP, MIN_SCALE));

  const resetView = () => {
    setScale(1.0);
    setPanX(0);
    setPanY(0);
  };

  const handleLogoutClick = (e) => {
    e.stopPropagation();
    setShowMenu(false);
    
    if (onLogout) {
      onLogout();
    } else {
      onNavigate('login');
    }
  };

  const handleBuildingClick = (building) => {
    setActiveBuilding(building.name);
    setSelectedBuilding(building);
    setShowBuildingDetails(true);
  };

  const handleNavigateToBuilding = () => {
    if (selectedBuilding) {
      onNavigate('navigate');
    }
  };

  const Zone = ({ zone }) => (
    <g>
      <rect 
        x={zone.x} 
        y={zone.y} 
        width={zone.width} 
        height={zone.height} 
        fill={zone.color}
        fillOpacity="0.1"
        stroke={zone.color}
        strokeWidth="1.5"
        strokeDasharray="4 4"
        rx="12"
      />
      <text 
        x={zone.x + zone.width/2} 
        y={zone.y - 8} 
        textAnchor="middle" 
        className="font-bold pointer-events-none"
        style={{ fontSize: '10px', fill: zone.color, fontWeight: 'bold' }}
      >
        {zone.label}
      </text>
    </g>
  );

  const Building = ({ b }) => (
    <g 
      key={b.id} 
      onClick={() => handleBuildingClick(b)}
      className={`cursor-pointer transition-all duration-200 hover:drop-shadow-lg ${activeBuilding === b.name ? 'opacity-100 drop-shadow-lg' : 'opacity-90'}`}
      style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
    >
      {/* Building Shadow */}
      <rect x={b.x} y={b.y + 3} width={b.width} height={b.height} rx="8" fill="#374151" fillOpacity="0.2" />
      
      {/* Building Base */}
      <rect 
        x={b.x} 
        y={b.y} 
        width={b.width} 
        height={b.height} 
        rx="8" 
        fill="white" 
        stroke={activeBuilding === b.name ? b.color : '#e5e7eb'}
        strokeWidth={activeBuilding === b.name ? '3' : '2'}
        className="drop-shadow-sm"
      />
      
      {/* Building Roof/Accent */}
      <rect 
        x={b.x} 
        y={b.y} 
        width={b.width} 
        height={b.height * 0.3} 
        rx="8" 
        fill={b.color}
        fillOpacity="0.9"
      />
      
      {/* Building Label */}
      <text 
        x={b.x + b.width/2} 
        y={b.y + b.height/2 + 4} 
        textAnchor="middle" 
        className="font-bold pointer-events-none"
        style={{ fontSize: '11px', fontWeight: 'bold', fill: '#1f2937' }}
      >
        {b.label}
      </text>
    </g>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex flex-col text-gray-900">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md px-6 pt-12 pb-4 flex items-center justify-between border-b border-gray-200/50 shadow-sm sticky top-0 z-50">
        <div className="relative">
          <button 
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 -ml-2 hover:bg-gray-100/80 rounded-full transition-all duration-200 text-gray-700 hover:scale-105"
          >
            <Menu size={24} />
          </button>
          
          {/* Dropdown Menu */}
          {showMenu && (
            <div className="absolute top-12 left-0 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200/50 py-2 min-w-48 z-50 animate-enter">
              <div className="px-4 py-3 border-b border-gray-200/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-[#601214] to-[#8b1a1d] rounded-full flex items-center justify-center shadow-lg">
                    <User size={16} className="text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{user?.username || 'Guest'}</p>
                    <p className="text-gray-500 text-xs">Student</p>
                  </div>
                </div>
              </div>

              {user?.role === 'admin' && (
                <button 
                  onClick={() => onNavigate('admin')}
                  className="w-full px-4 py-3 text-left hover:bg-purple-50/80 flex items-center gap-3 text-purple-600 transition-all duration-200 border-t border-gray-200/50"
                >
                  <Shield size={18} />
                  <span className="text-sm">Admin Panel</span>
                </button>
              )}
              
              <button className="w-full px-4 py-3 text-left hover:bg-gray-50/80 flex items-center gap-3 text-gray-700 transition-all duration-200">
                <Settings size={18} />
                <span className="text-sm">Settings</span>
              </button>
              
              <button 
                onClick={handleLogoutClick}
                className="w-full px-4 py-3 text-left hover:bg-red-50/80 flex items-center gap-3 text-red-600 transition-all duration-200 border-t border-gray-200/50"
              >
                <LogOut size={18} />
                <span className="text-sm">Log Out</span>
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center">
          <div className="bg-gradient-to-br from-[#601214] to-[#8b1a1d] p-2 rounded-xl mr-3 shadow-lg">
            <MapPin size={18} className="text-white" />
          </div>
          <div className="text-center">
            <span className="text-sm font-black tracking-widest text-[#601214] block">CAMPUS NAVI</span>
            <span className="text-xs text-gray-500 font-medium">Interactive Campus Map</span>
          </div>
        </div>
        
        <button className="p-2 -mr-2 hover:bg-gray-100/80 rounded-full transition-all duration-200 text-gray-700 hover:scale-105 relative">
          <Bell size={24} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white shadow-sm"></span>
        </button>
      </div>

      {/* Close menu when clicking outside */}
      {showMenu && (
        <div 
          className="fixed inset-0 z-40 bg-black/10" 
          onClick={() => setShowMenu(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 p-6 space-y-6">
        
        {/* Search Bar */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 shadow-sm border border-gray-200/50">
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-white rounded-xl h-14 px-4 flex items-center border border-gray-300/50 focus-within:border-[#601214] focus-within:ring-2 focus-within:ring-[#601214]/20 transition-all duration-200 shadow-sm">
              <Search className="w-5 h-5 text-gray-400 mr-3" />
              <input 
                type="text" 
                placeholder="🔍 Search buildings, rooms, or facilities..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-gray-900 placeholder-gray-500 outline-none font-medium" 
              />
            </div>
            <button 
              onClick={resetView}
              className="bg-gradient-to-br from-[#601214] to-[#8b1a1d] text-white rounded-xl w-14 h-14 flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200"
              title="Reset View"
            >
              <Compass size={20} />
            </button>
          </div>
        </div>

        {/* Map Container */}
        <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-gray-200/50">
          <div className="flex items-center justify-between mb-6 px-2">
            <div>
              <h2 className="font-bold text-2xl text-gray-900 bg-gradient-to-r from-[#601214] to-[#8b1a1d] bg-clip-text text-transparent">
                Campus Map
              </h2>
              <p className="text-gray-600 text-sm mt-1">Click on buildings for details and navigation</p>
            </div>
            <div className="flex items-center space-x-2 bg-gray-100/80 rounded-xl px-3 py-2">
              <Compass size={16} className="text-[#601214]" />
              <span className="text-xs font-bold text-[#601214] tracking-wider">DRAG TO MOVE • SCROLL TO ZOOM</span>
            </div>
          </div>

          <div 
            className="bg-gradient-to-br from-green-50/80 to-blue-50/80 rounded-2xl w-full h-80 relative overflow-hidden border-2 border-green-200/50 cursor-grab active:cursor-grabbing shadow-inner"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            
            <div 
              className="absolute inset-0" 
              style={{ 
                transform: `translate(${panX}px, ${panY}px) scale(${scale})`, 
                transformOrigin: '0 0', 
                transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }} 
            >
                <svg 
                  viewBox="0 0 500 500"
                  className="drop-shadow-sm"
                  width="500"
                  height="500"
                  style={{ filter: 'drop-shadow(0px 4px 12px rgba(0, 0, 0, 0.1))' }}
                >
                  {/* Background with subtle grid */}
                  <defs>
                    <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                      <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#d1d5db" strokeWidth="0.5" opacity="0.3"/>
                    </pattern>
                  </defs>
                  <rect x="0" y="0" width="500" height="500" fill="#f0fdf4" />
                  <rect x="0" y="0" width="500" height="500" fill="url(#grid)" />
                  
                  {/* Campus Zones */}
                  {Object.values(campusZones).map((zone, index) => (
                    <Zone key={index} zone={zone} />
                  ))}

                  {/* Main Pathways */}
                  <g className="opacity-80">
                    {/* Horizontal Main Path */}
                    <path d="M0 250 L500 250" stroke="#a8a29e" strokeWidth="35" strokeLinecap="round" />
                    {/* Vertical Main Path */}
                    <path d="M250 0 L250 500" stroke="#a8a29e" strokeWidth="35" strokeLinecap="round" />
                    {/* Central Circle */}
                    <circle cx="250" cy="250" r="40" fill="#a8a29e" />
                    
                    {/* Secondary Paths */}
                    <path d="M100 100 L400 100" stroke="#d6d3d1" strokeWidth="20" strokeLinecap="round" strokeDasharray="2 8" />
                    <path d="M100 400 L400 400" stroke="#d6d3d1" strokeWidth="20" strokeLinecap="round" strokeDasharray="2 8" />
                  </g>

                  {/* Water Feature */}
                  <g className="opacity-90">
                    <circle cx="400" cy="400" r="35" fill="url(#waterGradient)" stroke="#38bdf8" strokeWidth="2" />
                    <text x="400" y="400" textAnchor="middle" className="font-bold" style={{ fontSize: '9px', fill: '#0c4a6e', fontWeight: 'bold' }}>
                      POND
                    </text>
                  </g>

                  {/* Parking Area */}
                  <g>
                    <rect x="20" y="420" width="80" height="40" rx="6" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="3 3" />
                    <text x="60" y="440" textAnchor="middle" className="font-bold" style={{ fontSize: '10px', fill: '#475569', fontWeight: 'bold' }}>
                      PARKING
                    </text>
                  </g>

                  {/* Landscaping - Trees */}
                  {[
                    { x: 30, y: 30 }, { x: 450, y: 30 }, { x: 450, y: 150 }, 
                    { x: 30, y: 350 }, { x: 450, y: 350 }, { x: 200, y: 80 },
                    { x: 350, y: 180 }, { x: 80, y: 180 }, { x: 480, y: 480 },
                    { x: 20, y: 480 }, { x: 480, y: 20 }, { x: 20, y: 20 }
                  ].map((p, i) => (
                    <g key={`tree-${i}`} className="opacity-90">
                      <circle cx={p.x} cy={p.y} r="12" fill="#65a30d" />
                      <circle cx={p.x} cy={p.y} r="8" fill="#4d7c0f" />
                      <circle cx={p.x} cy={p.y} r="4" fill="#3f6212" />
                    </g>
                  ))}

                  {/* Buildings */}
                  {filteredBuildings.map((b) => (
                    <Building key={b.id} b={b} />
                  ))}

                  {/* "You Are Here" Marker */}
                  <g transform="translate(240, 240)" className="animate-pulse">
                    <circle cx="10" cy="10" r="12" fill="#ef4444" opacity="0.4" />
                    <circle cx="10" cy="10" r="8" fill="#dc2626" opacity="0.7" />
                    <circle cx="10" cy="10" r="4" fill="#b91c1c" />
                    <circle cx="10" cy="10" r="1" fill="white" />
                    <text x="25" y="15" textAnchor="start" className="font-bold" style={{ fontSize: '10px', fill: '#dc2626', fontWeight: 'bold' }}>
                      YOU ARE HERE
                    </text>
                  </g>

                  {/* Water Gradient Definition */}
                  <defs>
                    <linearGradient id="waterGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#7dd3fc" />
                      <stop offset="50%" stopColor="#38bdf8" />
                      <stop offset="100%" stopColor="#0ea5e9" />
                    </linearGradient>
                  </defs>
                </svg>
            </div>

            {/* Building Details Panel */}
            {showBuildingDetails && selectedBuilding && (
              <div className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur-md p-5 rounded-2xl shadow-2xl border border-gray-200/50 z-10 animate-enter">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg" style={{ backgroundColor: selectedBuilding.color }}>
                      {getBuildingIcon(selectedBuilding.type)}
                    </div>
                    <div>
                      <h3 className="font-bold text-xl text-gray-900">{selectedBuilding.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm font-bold text-white px-2 py-1 rounded-md" style={{ backgroundColor: selectedBuilding.color }}>
                          {selectedBuilding.label}
                        </span>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-md capitalize">
                          {selectedBuilding.type}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      setShowBuildingDetails(false);
                      setActiveBuilding(null);
                      setSelectedBuilding(null);
                    }}
                    className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center text-gray-500 hover:text-gray-700 transition-all duration-200 hover:scale-110"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-blue-50 rounded-xl p-3 border border-blue-200">
                    <div className="text-blue-600 text-xs font-semibold uppercase mb-1">Zone</div>
                    <div className="text-blue-800 font-semibold capitalize">{selectedBuilding.zone}</div>
                  </div>
                  <div className="bg-green-50 rounded-xl p-3 border border-green-200">
                    <div className="text-green-600 text-xs font-semibold uppercase mb-1">Status</div>
                    <div className="text-green-800 font-semibold">Open</div>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <button 
                    onClick={handleNavigateToBuilding}
                    className="flex-1 bg-gradient-to-r from-[#601214] to-[#8b1a1d] text-white font-semibold py-3 px-4 rounded-xl hover:shadow-lg transition-all duration-200 hover:scale-105 flex items-center justify-center gap-2"
                  >
                    <Navigation size={18} />
                    Get Directions
                  </button>
                  <button 
                    onClick={() => onNavigate('info')}
                    className="flex-1 bg-gray-100 text-gray-700 font-semibold py-3 px-4 rounded-xl hover:bg-gray-200 transition-all duration-200 hover:scale-105 flex items-center justify-center gap-2"
                  >
                    <InfoIcon size={18} />
                    More Info
                  </button>
                </div>
              </div>
            )}
            
            {/* Map Controls */}
            <div className="absolute top-4 right-4 flex flex-col space-y-3 z-10">
              <button 
                onClick={zoomIn} 
                disabled={scale >= MAX_SCALE}
                className="w-10 h-10 bg-white/90 backdrop-blur-md rounded-xl shadow-lg border border-gray-200/50 text-gray-700 hover:bg-white hover:shadow-xl hover:scale-110 disabled:opacity-50 transition-all duration-200 flex items-center justify-center"
                title="Zoom In"
              >
                <Plus size={20} />
              </button>
              <button 
                onClick={zoomOut} 
                disabled={scale <= MIN_SCALE}
                className="w-10 h-10 bg-white/90 backdrop-blur-md rounded-xl shadow-lg border border-gray-200/50 text-gray-700 hover:bg-white hover:shadow-xl hover:scale-110 disabled:opacity-50 transition-all duration-200 flex items-center justify-center"
                title="Zoom Out"
              >
                <Minus size={20} />
              </button>
              <div className="h-px bg-gray-300/50 mx-2"></div>
              <button 
                onClick={resetView}
                className="w-10 h-10 bg-white/90 backdrop-blur-md rounded-xl shadow-lg border border-gray-200/50 text-gray-700 hover:bg-white hover:shadow-xl hover:scale-110 transition-all duration-200 flex items-center justify-center"
                title="Reset View"
              >
                <Compass size={20} />
              </button>
            </div>

            {/* Scale and Coordinates */}
            <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-md px-3 py-2 rounded-xl text-xs font-semibold text-gray-600 border border-gray-200/50 shadow-lg">
              <div>Scale: {Math.round(scale * 100)}%</div>
              <div className="text-gray-400">X: {Math.round(panX)} Y: {Math.round(panY)}</div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-gray-200/50">
          <h3 className="font-bold text-gray-900 text-lg mb-4">Map Legend</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50/50 rounded-xl border border-gray-200/50">
              <div className="w-8 h-8 bg-[#1e40af] rounded-lg flex items-center justify-center">
                <Building2 size={16} className="text-white" />
              </div>
              <div>
                <div className="font-semibold text-gray-900 text-sm">Academic</div>
                <div className="text-gray-500 text-xs">Classrooms & Labs</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-gray-50/50 rounded-xl border border-gray-200/50">
              <div className="w-8 h-8 bg-[#2563eb] rounded-lg flex items-center justify-center">
                <BookOpen size={16} className="text-white" />
              </div>
              <div>
                <div className="font-semibold text-gray-900 text-sm">Library</div>
                <div className="text-gray-500 text-xs">Study & Resources</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-gray-50/50 rounded-xl border border-gray-200/50">
              <div className="w-8 h-8 bg-[#dc2626] rounded-lg flex items-center justify-center">
                <Dumbbell size={16} className="text-white" />
              </div>
              <div>
                <div className="font-semibold text-gray-900 text-sm">Student Life</div>
                <div className="text-gray-500 text-xs">Services & Activities</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-gray-50/50 rounded-xl border border-gray-200/50">
              <div className="w-8 h-8 bg-[#059669] rounded-lg flex items-center justify-center">
                <Trees size={16} className="text-white" />
              </div>
              <div>
                <div className="font-semibold text-gray-900 text-sm">Sports</div>
                <div className="text-gray-500 text-xs">Athletics & Recreation</div>
              </div>
            </div>
          </div>
          
          {/* Additional Legend Items */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50/50 rounded-xl border border-gray-200/50">
              <div className="w-6 h-6 bg-[#7e22ce] rounded-full"></div>
              <div>
                <div className="font-semibold text-gray-900 text-sm">Administration</div>
                <div className="text-gray-500 text-xs">Office & Services</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-gray-50/50 rounded-xl border border-gray-200/50">
              <div className="w-6 h-6 bg-[#ea580c] rounded-full"></div>
              <div>
                <div className="font-semibold text-gray-900 text-sm">Residential</div>
                <div className="text-gray-500 text-xs">Dormitories</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-gray-50/50 rounded-xl border border-gray-200/50">
              <div className="w-6 h-6 bg-[#db2777] rounded-full"></div>
              <div>
                <div className="font-semibold text-gray-900 text-sm">Arts</div>
                <div className="text-gray-500 text-xs">Creative Spaces</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-gray-50/50 rounded-xl border border-gray-200/50">
              <div className="w-6 h-6 bg-[#7c3aed] rounded-full"></div>
              <div>
                <div className="font-semibold text-gray-900 text-sm">Science</div>
                <div className="text-gray-500 text-xs">Labs & Research</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={() => onNavigate('navigate')}
            className="group bg-white/80 backdrop-blur-md rounded-2xl p-5 border border-gray-200/50 shadow-sm hover:shadow-lg hover:border-[#601214] transition-all duration-300 hover:scale-105"
          >
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-[#601214] to-[#8b1a1d] p-3 rounded-xl text-white group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Navigation size={24} />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-gray-900 text-lg">Campus Navigation</h3>
                <p className="text-gray-600 text-sm">Step-by-step directions to any location</p>
              </div>
            </div>
          </button>

          <button 
            onClick={() => onNavigate('info')}
            className="group bg-white/80 backdrop-blur-md rounded-2xl p-5 border border-gray-200/50 shadow-sm hover:shadow-lg hover:border-[#601214] transition-all duration-300 hover:scale-105"
          >
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-[#601214] to-[#8b1a1d] p-3 rounded-xl text-white group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <InfoIcon size={24} />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-gray-900 text-lg">Building Guide</h3>
                <p className="text-gray-600 text-sm">Detailed information and facilities</p>
              </div>
            </div>
          </button>

          {/* Announcements Button */}
          <button 
            onClick={() => onNavigate('announcements')}
            className="group bg-white/80 backdrop-blur-md rounded-2xl p-5 border border-gray-200/50 shadow-sm hover:shadow-lg hover:border-blue-500 transition-all duration-300 hover:scale-105"
          >
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl text-white group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Bell size={24} />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-gray-900 text-lg">Announcements</h3>
                <p className="text-gray-600 text-sm">Campus news & updates</p>
              </div>
            </div>
          </button>

          {/* Schedule Button */}
          <button 
            onClick={() => onNavigate('schedule')}
            className="group bg-white/80 backdrop-blur-md rounded-2xl p-5 border border-gray-200/50 shadow-sm hover:shadow-lg hover:border-green-500 transition-all duration-300 hover:scale-105"
          >
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-green-500 to-green-600 p-3 rounded-xl text-white group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Calendar size={24} />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-gray-900 text-lg">Campus Schedule</h3>
                <p className="text-gray-600 text-sm">Events & activities</p>
              </div>
            </div>
          </button>
        </div>

        {/* Recent Searches/Favorites - FIXED SECTION */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-gray-200/50 shadow-sm">
          <h2 className="text-xl font-bold mb-4">Quick Access</h2>
          <div className="grid grid-cols-2 gap-3">
            {mapBuildings.slice(0, 4).map((building) => (
              <button
                key={building.id}
                onClick={() => handleBuildingClick(building)}
                className="bg-gray-50 rounded-xl p-3 text-left hover:bg-gray-100 transition-colors border border-gray-200"
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-md flex items-center justify-center text-white" style={{ backgroundColor: building.color }}>
                    {getBuildingIcon(building.type)}
                  </div>
                  <span className="font-semibold text-gray-900 text-sm">{building.label}</span>
                </div>
                <p className="text-gray-500 text-xs">{building.name}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampusMap;