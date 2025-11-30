import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, MapPin, Navigation2, Clock, Footprints, Compass, User, Building2, Play, Pause, RotateCcw, Move, CornerUpRight } from 'lucide-react';

const Navigate = ({ onNavigate, buildings }) => {
  const [route, setRoute] = useState({
    start: '',
    destination: ''
  });
  const [routeInfo, setRouteInfo] = useState(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [stepByStep, setStepByStep] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [userPosition, setUserPosition] = useState(null);
  const [isSettingStart, setIsSettingStart] = useState(false);
  const [availableStartPoints, setAvailableStartPoints] = useState([]);
  
  // New state for tracking animation
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0); // Time accumulated while paused
  const [currentPathPoints, setCurrentPathPoints] = useState([]); // Store the calculated path

  const animationRef = useRef(null);
  const mapRef = useRef(null);

  // --- Navigation Constants ---
  const SIMULATED_SPEED = 0.05; // Units (pixels on the map) per millisecond
  
  // Available starting points (key locations on campus)
  const startPoints = [
    { id: 'current', name: 'Current Location', x: 160, y: 220, type: 'special' },
    { id: 'main_gate', name: 'Main Gate', x: 80, y: 400, type: 'entrance' },
    { id: 'quad_center', name: 'Quad Center', x: 160, y: 160, type: 'landmark' },
    { id: 'library_entrance', name: 'Library Entrance', x: 175, y: 155, type: 'building' },
    { id: 'cafeteria_entrance', name: 'Cafeteria Entrance', x: 85, y: 255, type: 'building' },
    { id: 'student_center', name: 'Student Center', x: 85, y: 185, type: 'building' },
    { id: 'gym_entrance', name: 'Gym Entrance', x: 255, y: 335, type: 'building' },
    { id: 'admin_entrance', name: 'Admin Entrance', x: 295, y: 145, type: 'building' }
  ];

  // Simulated route path coordinates
  const routePaths = {
    'College of Computer Studies': [
      { x: 135, y: 85 }  // CCS building
    ],
    'Main Library': [
      { x: 175, y: 155 } // LIB building
    ],
    'Student Center': [
      { x: 85, y: 185 }  // STUD building
    ],
    'Science Labs': [
      { x: 215, y: 85 }  // SCI building
    ],
    'Cafeteria': [
      { x: 85, y: 255 }  // CAF building
    ],
    'College of Business Administration': [
      { x: 135, y: 145 } // CBA building
    ],
    'College of Education': [
      { x: 215, y: 145 } // CED building
    ],
    'Gymnasium': [
      { x: 255, y: 335 } // GYM building
    ],
    'Sports Field': [
      { x: 260, y: 400 } // FIELD center
    ],
    'Administration': [
      { x: 295, y: 145 } // ADMIN building
    ],
    'Medical Clinic': [
      { x: 295, y: 275 } // MED building
    ]
  };

  // Utility to calculate distance between two points
  const getDistance = (p1, p2) => Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));

  // Calculates the total distance of a path
  const calculateTotalPathDistance = (path) => {
      let totalDistance = 0;
      for (let i = 0; i < path.length - 1; i++) {
          totalDistance += getDistance(path[i], path[i + 1]);
      }
      return totalDistance;
  };

  // Calculate path from start to destination (Simulated path generation)
  const calculatePath = (startPoint, destination) => {
    if (!startPoint || !routePaths[destination]) return [];
    
    const destinationPoint = routePaths[destination][0];
    
    // Simple path calculation - direct line with intermediate points
    const path = [startPoint];
    
    // Add intermediate points for more natural movement (4 segments / 5 points total)
    const steps = 4;
    for (let i = 1; i < steps; i++) {
      const progress = i / steps;
      const x = startPoint.x + (destinationPoint.x - startPoint.x) * progress;
      const y = startPoint.y + (destinationPoint.y - startPoint.y) * progress;
      path.push({ x, y });
    }
    
    path.push(destinationPoint);
    return path;
  };

  // --- Animation Loop (GPS Simulation) ---
  const animateMovement = (timestamp) => {
      if (!startTime) {
          // Set start time, adjusting for any time elapsed during pause
          setStartTime(timestamp - elapsedTime); 
          animationRef.current = requestAnimationFrame(animateMovement);
          return;
      }

      if (isPaused) {
          // Stop animation but preserve accumulated elapsed time
          return;
      }

      const path = currentPathPoints;
      const totalPathDistance = calculateTotalPathDistance(path); 
      
      // Total elapsed time since navigation start (adjusted for pauses)
      const newElapsedTime = (timestamp - startTime);
      
      // Total distance traveled so far
      const traveledDistance = newElapsedTime * SIMULATED_SPEED;

      // Calculate overall progress (0 to 1)
      const newProgress = Math.min(1, traveledDistance / totalPathDistance);

      // --- 1. Find Current Position (Interpolation) ---
      let currentDist = 0;
      let x = path[0].x;
      let y = path[0].y;
      
      // Calculate which segment we are currently in
      let currentSegmentIndex = 0;

      for (let i = 0; i < path.length - 1; i++) {
          const segmentDistance = getDistance(path[i], path[i + 1]);
          
          if (currentDist + segmentDistance > traveledDistance) {
              // Current position is within this segment (i to i+1)
              currentSegmentIndex = i;
              const segmentProgress = (traveledDistance - currentDist) / segmentDistance;
              
              const p1 = path[i];
              const p2 = path[i + 1];

              x = p1.x + (p2.x - p1.x) * segmentProgress;
              y = p1.y + (p2.y - p1.y) * segmentProgress;
              break;
          }
          currentDist += segmentDistance;
      }

      // --- 2. Update States ---
      if (newProgress >= 1) {
          // Reached destination
          setUserPosition(path[path.length - 1]);
          setProgress(100);
          setIsNavigating(false);
          setElapsedTime(0);
          setCurrentStep(stepByStep.length - 1);
          cancelAnimationFrame(animationRef.current);
          return;
      }

      // Update user position
      setUserPosition(prev => ({ ...prev, x, y, name: 'Following Route' }));
      setProgress(newProgress * 100);
      setElapsedTime(newElapsedTime);
      
      // Update step-by-step guidance.
      // Since we have 5 points and 4 segments, and 5 instructions:
      // Instruction 0 is "Start from X" (progress 0%)
      // Instruction 1 is triggered when progress > 0%
      // Instruction 2 is triggered when progress > 25%
      // Instruction 3 is triggered when progress > 50%
      // Instruction 4 is triggered when progress > 75%
      const stepThreshold = 0.25; 
      const newStep = Math.min(
          stepByStep.length - 1, 
          Math.floor(newProgress / stepThreshold)
      );
      setCurrentStep(newStep);

      // Continue the loop
      animationRef.current = requestAnimationFrame(animateMovement);
  };
  // --- End Animation Loop ---

  // Initialize available start points
  useEffect(() => {
    setAvailableStartPoints(startPoints);
    // Set default start position
    setUserPosition(startPoints[0]);
    setRoute(prev => ({ ...prev, start: startPoints[0].name }));

    // Cleanup function for animation frame
    return () => {
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
        }
    };
  }, []);

  const handleInputChange = (field, value) => {
    const newRoute = {
      ...route,
      [field]: value
    };
    setRoute(newRoute);
    
    if (field === 'destination' && value && userPosition) {
      calculateRoute(newRoute, userPosition);
    } else {
      setRouteInfo(null);
      setStepByStep([]);
      resetNavigation();
    }
  };

  const handleStartPointSelect = (startPoint) => {
    setUserPosition(startPoint);
    setRoute(prev => ({ ...prev, start: startPoint.name }));
    setIsSettingStart(false);
    
    if (route.destination) {
      calculateRoute({ ...route, start: startPoint.name }, startPoint);
    }
  };

  const calculateRoute = (routeData, startPoint) => {
    if (!routeData.destination || !startPoint) return;

    // Calculate path for accurate distance
    const path = calculatePath(startPoint, routeData.destination);
    const totalPathDistance = calculateTotalPathDistance(path);
    
    const distance = totalPathDistance * 2; // Scale factor for realistic distances
    const time = Math.ceil(distance / 75);
    
    const newRouteInfo = {
      distance: `${Math.round(distance)}m`,
      time: `~${time} min`,
      calories: Math.round(distance * 0.04),
      steps: Math.round(distance * 1.3)
    };

    // More detailed, GPS-like instructions
    const steps = [
      `Start navigation from ${routeData.start}`,
      'In 50m, proceed to the main pathway.',
      'Continue straight for 100m, passing the Cafeteria.',
      'Turn right at the Quad Center intersection.',
      `You have arrived at ${routeData.destination}.`
    ];

    setRouteInfo(newRouteInfo);
    setStepByStep(steps);
  };

  const startNavigation = () => {
    if (!route.destination || !userPosition) {
      alert('Please set both start location and destination');
      return;
    }
    
    // Calculate and store the path once
    const path = calculatePath(userPosition, route.destination);
    if (path.length === 0) return;
    setCurrentPathPoints(path);
    
    // Set initial navigation states
    setIsNavigating(true);
    setIsPaused(false);
    setCurrentStep(0);
    setProgress(0);
    setStartTime(null); // Will be set on the first frame of animateMovement
    setElapsedTime(0);
    
    // Start the tracking loop
    animationRef.current = requestAnimationFrame(animateMovement);
  };

  const pauseNavigation = () => {
    setIsPaused(true);
    cancelAnimationFrame(animationRef.current);
  };

  const resumeNavigation = () => {
    if (!currentPathPoints.length) return;
    setIsPaused(false);
    animationRef.current = requestAnimationFrame(animateMovement);
  };

  const resetNavigation = () => {
    setIsNavigating(false);
    setIsPaused(false);
    setCurrentStep(0);
    setProgress(0);
    setElapsedTime(0);
    setStartTime(null);
    setCurrentPathPoints([]);
    
    cancelAnimationFrame(animationRef.current);

    // Reset to selected start position
    if (route.start) {
      const selectedStart = availableStartPoints.find(point => point.name === route.start);
      if (selectedStart) {
        setUserPosition(selectedStart);
      }
    }
  };

  const handleMapClick = (event) => {
    if (!isSettingStart) return;
    
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 450;
    const y = ((event.clientY - rect.top) / rect.height) * 450;
    
    // Create custom start point
    const customStart = {
      id: 'custom',
      name: 'Custom Location',
      x: Math.max(20, Math.min(430, x)), // Keep within bounds
      y: Math.max(20, Math.min(430, y)),
      type: 'custom'
    };
    
    handleStartPointSelect(customStart);
  };

  // Building data for the map
  const mapBuildings = [
    { id: 'ADMIN', x: 280, y: 150, width: 80, height: 60, label: 'ADM', name: 'Administration', color: '#7e22ce' },
    { id: 'LIB', x: 140, y: 140, width: 100, height: 80, label: 'LIB', name: 'Main Library', color: '#2563eb' },
    { id: 'STDN', x: 30, y: 160, width: 80, height: 50, label: 'STUD', name: 'Student Center', color: '#dc2626' },
    { id: 'CCS', x: 100, y: 30, width: 80, height: 60, label: 'CCS', name: 'College of Computer Studies', color: '#1e40af' },
    { id: 'SCI', x: 220, y: 30, width: 80, height: 60, label: 'SCI', name: 'Science Labs', color: '#7c3aed' },
    { id: 'CAF', x: 30, y: 50, width: 50, height: 50, label: 'CAF', name: 'Cafeteria', color: '#ea580c' },
    { id: 'CBA', x: 60, y: 260, width: 80, height: 60, label: 'CBA', name: 'College of Business Administration', color: '#1e40af' },
    { id: 'CED', x: 260, y: 260, width: 80, height: 60, label: 'CED', name: 'College of Education', color: '#1e40af' },
    { id: 'GYM', x: 350, y: 320, width: 70, height: 70, label: 'GYM', name: 'Gymnasium', color: '#dc2626' },
    { id: 'FIELD', x: 160, y: 350, width: 150, height: 50, label: 'FIELD', name: 'Sports Field', color: '#16a34a' },
    { id: 'MED', x: 300, y: 70, width: 50, height: 50, label: 'MED', name: 'Medical Clinic', color: '#dc2626' },
  ];

  const Building = ({ b, isDestination }) => (
    <g>
      <rect 
        x={b.x} 
        y={b.y} 
        width={b.width} 
        height={b.height} 
        rx="8" 
        fill="white" 
        stroke={isDestination ? '#10b981' : '#e5e7eb'}
        strokeWidth={isDestination ? '3' : '2'}
        className="drop-shadow-sm"
      />
      <rect 
        x={b.x} 
        y={b.y} 
        width={b.width} 
        height={b.height * 0.3} 
        rx="8" 
        fill={isDestination ? '#10b981' : b.color}
        fillOpacity="0.9"
      />
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

  const StartPoint = ({ point, isSelected, isCurrentPosition }) => (
    <g>
      <circle 
        cx={point.x} 
        cy={point.y} 
        r="6" 
        fill={isCurrentPosition ? '#3b82f6' : '#ef4444'}
        stroke="white"
        strokeWidth="2"
      />
      {isCurrentPosition && (
        <circle 
          cx={point.x} 
          cy={point.y} 
          r="10" 
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2"
          strokeDasharray="4 2"
        />
      )}
    </g>
  );

  const currentPath = userPosition && route.destination ? calculatePath(userPosition, route.destination) : [];
  const destinationBuilding = mapBuildings.find(b => b.name === route.destination);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex flex-col">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md px-6 pt-12 pb-6 flex items-center border-b border-gray-200/50 shadow-sm sticky top-0 z-20">
        <button 
          onClick={() => onNavigate('map')} 
          className="p-2 -ml-2 mr-2 hover:bg-gray-100/80 rounded-full transition-all duration-200 text-gray-700"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">GPS Navigation</h1>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 space-y-6">
        {/* Location Inputs */}
        <div className="space-y-4 animate-enter">
          
          {/* Start Location */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 shadow-sm border border-gray-200/50">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Start Location</label>
              <button 
                onClick={() => setIsSettingStart(!isSettingStart)} 
                className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1"
              >
                <Move size={12} />
                {isSettingStart ? 'Cancel Setting' : 'Change/Set on Map'}
              </button>
            </div>
            <div className="flex items-center gap-2 mt-1">
                <MapPin size={20} className="text-[#601214]" />
                <span className="font-medium text-gray-900 text-lg">
                    {userPosition?.name || route.start || 'Select a starting point...'}
                </span>
            </div>
            {isSettingStart && (
              <div className="mt-4 pt-4 border-t border-gray-200 max-h-32 overflow-y-auto">
                {availableStartPoints.map(point => (
                  <button
                    key={point.id}
                    onClick={() => handleStartPointSelect(point)}
                    className={`w-full text-left p-2 rounded-lg text-sm transition-colors ${userPosition?.name === point.name ? 'bg-blue-100 text-blue-800 font-semibold' : 'hover:bg-gray-100 text-gray-700'}`}
                  >
                    {point.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Destination */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 shadow-sm border border-gray-200/50">
            <label htmlFor="destination-select" className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Destination</label>
            <select
              id="destination-select"
              value={route.destination}
              onChange={(e) => handleInputChange('destination', e.target.value)}
              className="w-full bg-transparent text-gray-900 outline-none font-medium text-lg appearance-none"
            >
              <option value="">Select your destination...</option>
              {buildings.map((building, index) => (
                <option key={index} value={building.name}>
                  {building.name} ({building.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Route Summary */}
        {routeInfo && (
          <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-gray-200/50 animate-enter delay-100">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 bg-[#601214] rounded-full flex items-center justify-center text-white">
                <Navigation2 size={24} fill="currentColor" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg">Route Summary</h3>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isNavigating ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
                  {isNavigating ? 'NAVIGATION ACTIVE' : 'ROUTE CALCULATED'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-4 border border-blue-200">
                <div className="flex items-center gap-2 text-blue-600 mb-2">
                  <Footprints size={16} />
                  <span className="text-xs font-semibold">DISTANCE</span>
                </div>
                <span className="text-xl font-bold text-blue-800">{routeInfo.distance}</span>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-4 border border-green-200">
                <div className="flex items-center gap-2 text-green-600 mb-2">
                  <Clock size={16} />
                  <span className="text-xs font-semibold">EST. TIME</span>
                </div>
                <span className="text-xl font-bold text-green-800">{routeInfo.time}</span>
              </div>
            </div>

            {/* Start/Reset Button (Main Action) */}
            <div className="flex items-center justify-center">
              {!isNavigating ? (
                  <button 
                      onClick={startNavigation} 
                      className="w-full bg-green-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-green-900/20 hover:bg-green-600 hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2"
                      disabled={!route.destination || !userPosition}
                  >
                      <Navigation2 size={20} /> Start Navigation
                  </button>
              ) : (
                  <button 
                      onClick={resetNavigation} 
                      className="w-full bg-red-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-red-900/20 hover:bg-red-600 hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2"
                  >
                      <RotateCcw size={20} /> Reset Navigation
                  </button>
              )}
            </div>
          </div>
        )}

        {/* --- GPS NAVIGATION CONTROLS --- */}
        {isNavigating && route.destination && (
          <div className="bg-white/90 backdrop-blur-md rounded-xl p-4 shadow-lg border border-gray-200/50 animate-enter delay-200">
            <div className="flex flex-col gap-4">

                {/* Next Instruction Display */}
                <div className="flex items-center gap-4 bg-blue-50/70 p-3 rounded-lg border border-blue-200">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white shadow-lg flex-shrink-0">
                        {progress < 100 ? <CornerUpRight size={24} /> : <MapPin size={24} />}
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-xs font-semibold text-blue-600 uppercase">
                            {progress < 100 ? 'NEXT INSTRUCTION' : 'FINAL DESTINATION'}
                        </p>
                        <h4 className="text-lg font-bold text-gray-900 whitespace-nowrap overflow-hidden text-ellipsis">
                            {progress < 100 ? stepByStep[currentStep] : `You've reached ${route.destination}!`}
                        </h4>
                    </div>
                </div>
              
              {/* Pause / Resume Buttons */}
              <div className="flex items-center justify-center gap-4 w-full">
                {isPaused ? (
                  <button 
                    onClick={resumeNavigation} 
                    className="flex-1 py-3 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                  >
                    <Play size={20} /> Resume
                  </button>
                ) : (
                  <button 
                    onClick={pauseNavigation} 
                    className="flex-1 py-3 bg-yellow-500 text-white rounded-xl font-bold hover:bg-yellow-600 transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                  >
                    <Pause size={20} /> Pause
                  </button>
                )}
                <button 
                    onClick={resetNavigation} 
                    className="py-3 px-6 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                >
                    <RotateCcw size={20} /> Stop
                </button>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full mt-2">
                  <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-gray-700">Route Progress:</span>
                      <span className="text-blue-600">{Math.round(progress)}% Complete</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                          className="bg-blue-500 h-2.5 rounded-full transition-all duration-500 ease-linear" 
                          style={{ width: `${progress}%` }}
                      ></div>
                  </div>
              </div>
            </div>
          </div>
        )}
        {/* --- END GPS NAVIGATION CONTROLS --- */}


        {/* Interactive Map */}
        {userPosition && (
          <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-gray-200/50 animate-enter delay-300">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                Current Position & Route
              </h2>
              <div className="flex items-center gap-2 bg-gray-100/80 rounded-xl px-3 py-2">
                <Compass size={16} className="text-[#601214]" />
                <span className="text-xs font-bold text-[#601214] tracking-wider">
                  {isSettingStart ? 'CLICK TO SET START' : isNavigating ? (isPaused ? 'NAVIGATION PAUSED' : 'NAVIGATION ACTIVE') : 'ROUTE MAP'}
                </span>
              </div>
            </div>
            
            <div ref={mapRef} className="bg-gradient-to-br from-green-50/80 to-blue-50/80 rounded-2xl w-full h-80 relative overflow-hidden border-2 border-green-200/50 shadow-inner cursor-pointer" onClick={handleMapClick}>
              <svg viewBox="0 0 450 450" className="w-full h-full" style={{ filter: 'drop-shadow(0px 4px 12px rgba(0, 0, 0, 0.1))' }}>
                {/* Background */}
                <rect x="0" y="0" width="450" height="450" fill="#f0fdf4" />
                
                {/* Main Pathways */}
                <path d="M190 0 L190 450" stroke="#a8a29e" strokeWidth="40" strokeLinecap="round" />
                <path d="M0 200 L450 200" stroke="#a8a29e" strokeWidth="30" strokeLinecap="round" />
                <circle cx="190" cy="200" r="25" fill="#a8a29e" /> {/* Center intersection */}
                
                {/* Buildings */}
                {mapBuildings.map(b => (
                  <Building 
                    key={b.id} 
                    b={b} 
                    isDestination={destinationBuilding && b.id === destinationBuilding.id} 
                  />
                ))}

                {/* --- Navigation Path and Marker --- */}
                {isNavigating && currentPathPoints.length > 0 && (
                  <g>
                    {/* Path line - shows the full route */}
                    <path
                      d={`M${currentPathPoints.map(p => `${p.x} ${p.y}`).join(' L')}`}
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="3"
                      strokeDasharray="8 4"
                      opacity="0.6"
                    />
                    
                    {/* User Position - The GPS Marker */}
                    <StartPoint 
                        point={userPosition} 
                        isCurrentPosition={true}
                    />
                  </g>
                )}
                
                {/* Static Start Points (when not navigating) */}
                {!isNavigating && availableStartPoints.map(point => (
                  <StartPoint 
                    key={point.id} 
                    point={point} 
                    isSelected={userPosition && userPosition.name === point.name} 
                    isCurrentPosition={userPosition && userPosition.name === point.name}
                  />
                ))}

              </svg>

            </div>
            
            {/* Quick Building Access */}
            {!route.destination && (
                <div className="mt-6">
                    <h3 className="font-bold text-gray-900 text-lg mb-4">Popular Destinations</h3>
                    <div className="grid grid-cols-2 gap-4">
                        {buildings.slice(0, 4).map((building, index) => (
                            <button
                                key={index}
                                onClick={() => handleInputChange('destination', building.name)}
                                className="bg-white/80 backdrop-blur-md rounded-2xl p-4 text-left hover:border-[#601214] transition-all duration-300 border border-gray-200/50 shadow-sm hover:shadow-lg hover:scale-105 group"
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 bg-gradient-to-br from-[#601214] to-[#8b1a1d] rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                                        <Building2 size={18} />
                                    </div>
                                    <span className="font-bold text-gray-900 text-base">{building.code}</span>
                                </div>
                                <p className="text-gray-600 text-sm">{building.name}</p>
                            </button>
                        ))}
                    </div>
                </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Navigate;