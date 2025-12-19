// components/Navigate.jsx

import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, MapPin, Navigation2, Play, RotateCcw, Plus, Minus, LocateFixed } from 'lucide-react';
import { supabase } from '../supabaseClient';

const Navigate = ({ onNavigate }) => {
  const [route, setRoute] = useState({ start: '', destination: '' });
  const [routeInfo, setRouteInfo] = useState(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  
  // GPS State
  const [userPosition, setUserPosition] = useState(null); // { x, y, heading }
  const [isTracking, setIsTracking] = useState(true); // Camera follows user
  
  // Map State
  const [availableStartPoints, setAvailableStartPoints] = useState([]);
  const [scale, setScale] = useState(1.2);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [buildings, setBuildings] = useState([]);
  
  // Animation State
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentPathPoints, setCurrentPathPoints] = useState([]);

  const animationRef = useRef(null);
  const startPanRef = useRef({ x: 0, y: 0 });
  const SIMULATED_SPEED = 0.08; 

  // --- STANDARDIZED MAP DATA ---
  const campusZones = {
    entrance: { x: 300, y: 10, width: 200, height: 80, label: 'MAIN ENTRANCE', color: '#ef4444' },
    administration: { x: 40, y: 100, width: 180, height: 140, label: 'ADMINISTRATION', color: '#7e22ce' },
    library: { x: 40, y: 260, width: 180, height: 120, label: 'LIBRARY DISTRICT', color: '#2563eb' },
    academic: { x: 240, y: 110, width: 320, height: 220, label: 'ACADEMIC CORE', color: '#1e40af' },
    student_life: { x: 240, y: 350, width: 320, height: 100, label: 'STUDENT PLAZA', color: '#dc2626' },
    arts: { x: 580, y: 100, width: 180, height: 140, label: 'ARTS & CULTURE', color: '#db2777' },
    residential: { x: 580, y: 260, width: 180, height: 300, label: 'RESIDENTIAL VILLAGE', color: '#ea580c' },
    sports: { x: 40, y: 400, width: 180, height: 180, label: 'SPORTS COMPLEX', color: '#059669' },
    parking: { x: 240, y: 470, width: 320, height: 110, label: 'MAIN PARKING', color: '#4b5563' }
  };

  useEffect(() => {
    fetchBuildings();
    
    // Default Static Start Points
    const startPoints = [
        { id: 'gate', name: 'Main Gate', x: 400, y: 50 },
        { id: 'quad', name: 'Central Quad', x: 400, y: 220 },
        { id: 'parking', name: 'Parking Lot', x: 400, y: 520 },
    ];
    setAvailableStartPoints(startPoints);
    
    // Set Initial Position
    setUserPosition({ ...startPoints[0], heading: 0 });
    setRoute(p => ({ ...p, start: startPoints[0].name }));
    centerMapOn(startPoints[0].x, startPoints[0].y);

    // Handle pre-selected destination from other pages
    const savedDest = localStorage.getItem('selectedDestination');
    if (savedDest) { 
        setRoute(p => ({ ...p, destination: savedDest })); 
        localStorage.removeItem('selectedDestination'); 
    }
  }, []);

  const fetchBuildings = async () => {
    try {
      const { data } = await supabase.from('buildings').select('*').eq('is_active', true);
      if (data) {
          // Add 'name' property to match static points structure for easier searching
          setBuildings(data.map(b => ({ 
              ...b, 
              name: b.building_name, // Standardize name property
              x: b.coordinates?.x||100, 
              y: b.coordinates?.y||100, 
              width: b.coordinates?.width||60, 
              height: b.coordinates?.height||40 
          })));
      }
    } catch (error) { console.error(error); }
  };

  useEffect(() => { return () => { if (animationRef.current) cancelAnimationFrame(animationRef.current); }; }, []);

  // --- MAP UTILS ---
  const getDistance = (p1, p2) => Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));

  const centerMapOn = (x, y) => {
      const targetPanX = 400 - (x * scale);
      const targetPanY = 300 - (y * scale);
      setPanX(targetPanX);
      setPanY(targetPanY);
  };

  const calculatePath = (start, destName) => {
    if (!start || !destName) return [];
    
    // Find destination in buildings list
    const dest = buildings.find(b => b.building_name === destName);
    if (!dest) return [];
    
    const target = { x: dest.x + dest.width/2, y: dest.y + dest.height/2 };
    const path = [start];
    
    // Smart Waypoints to stick to roads if distance is far
    if (getDistance(start, target) > 250) {
        path.push({ x: 400, y: 340 }); // Student Plaza Hub
    }
    
    path.push(target);
    return path;
  };

  const startNavigation = () => {
    const path = calculatePath(userPosition, route.destination);
    if (!path.length) return;
    
    setCurrentPathPoints(path);
    setIsNavigating(true); 
    setIsPaused(false); 
    setProgress(0); 
    setStartTime(null); 
    setElapsedTime(0);
    setIsTracking(true); // Enable camera follow
    
    animationRef.current = requestAnimationFrame(animateMovement);
    
    const dist = getDistance(path[0], path[path.length-1]);
    setRouteInfo({ distance: `${Math.round(dist*1.5)}m`, time: `${Math.ceil(dist/60)} min` });
  };

  const animateMovement = (timestamp) => {
    if (!startTime) { setStartTime(timestamp - elapsedTime); animationRef.current = requestAnimationFrame(animateMovement); return; }
    if (isPaused) return;

    const path = currentPathPoints;
    let totalDist = 0; for(let i=0; i<path.length-1; i++) totalDist += getDistance(path[i], path[i+1]);

    const newElapsed = (timestamp - startTime);
    const traveled = newElapsed * SIMULATED_SPEED;
    const ratio = Math.min(1, traveled / totalDist);

    let currentDist = 0, x = path[0].x, y = path[0].y, nextX = path[0].x, nextY = path[0].y;
    
    // Find current segment
    for (let i = 0; i < path.length - 1; i++) {
      const segDist = getDistance(path[i], path[i + 1]);
      if (currentDist + segDist > traveled) {
        const segProg = (traveled - currentDist) / segDist;
        x = path[i].x + (path[i+1].x - path[i].x) * segProg;
        y = path[i].y + (path[i+1].y - path[i].y) * segProg;
        
        // Look ahead for rotation
        nextX = path[i+1].x;
        nextY = path[i+1].y;
        break;
      }
      currentDist += segDist;
    }

    // Calculate Heading
    const angleRad = Math.atan2(nextY - y, nextX - x);
    const angleDeg = angleRad * (180 / Math.PI) + 90; // +90 to align SVG arrow up

    if (ratio >= 1) { 
        setUserPosition({ x: path[path.length-1].x, y: path[path.length-1].y, heading: angleDeg });
        setProgress(100); 
        setIsNavigating(false); 
        setElapsedTime(0); 
        cancelAnimationFrame(animationRef.current); 
        return; 
    }

    setUserPosition({ x, y, heading: angleDeg });
    
    // GPS Camera Follow Logic
    if (isTracking) {
        setPanX(400 - (x * scale));
        setPanY(300 - (y * scale));
    }

    setProgress(ratio * 100); 
    setElapsedTime(newElapsed);
    animationRef.current = requestAnimationFrame(animateMovement);
  };

  const handleMouseDown = (e) => { 
      setIsDragging(true); 
      setIsTracking(false); // User took control, stop following
      startPanRef.current = { x: e.clientX - panX, y: e.clientY - panY }; 
  };
  const handleMouseMove = (e) => { if (isDragging) { setPanX(e.clientX - startPanRef.current.x); setPanY(e.clientY - startPanRef.current.y); } };
  const handleMouseUp = () => setIsDragging(false);

  // Combine static points + buildings for the dropdown
  const allStartLocations = [...availableStartPoints, ...buildings];

  // Visual Helper
  const Tree = ({ x, y }) => (
    <g transform={`translate(${x}, ${y})`}>
      <circle cx="0" cy="0" r="10" fill="#16a34a" opacity="0.6" />
      <circle cx="3" cy="-5" r="8" fill="#22c55e" opacity="0.7" />
    </g>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
       <div className="bg-white p-4 shadow-sm flex items-center sticky top-0 z-20">
          <button onClick={() => onNavigate('map')} className="p-2 mr-2 hover:bg-gray-100 rounded-full"><ChevronLeft /></button>
          <h1 className="font-bold text-xl">Navigation</h1>
       </div>

       <div className="flex-1 p-6 space-y-4 flex flex-col">
          {/* Controls */}
          <div className="bg-white p-4 rounded-xl shadow-sm border space-y-3 z-10 relative">
             
             {/* START LOCATION SELECTOR */}
             <div className="flex items-center gap-2">
                 <MapPin size={16} className="text-gray-400"/>
                 <select 
                    className="w-full bg-transparent p-2 border-b outline-none" 
                    value={route.start} 
                    onChange={e => { 
                        const selectedName = e.target.value;
                        const pt = allStartLocations.find(p => p.name === selectedName);
                        if(pt) { 
                            // If it's a building, center on it properly
                            const targetX = pt.width ? pt.x + pt.width/2 : pt.x;
                            const targetY = pt.height ? pt.y + pt.height/2 : pt.y;
                            
                            setUserPosition({ x: targetX, y: targetY, heading: 0 });
                            setRoute(r => ({...r, start: pt.name}));
                            centerMapOn(targetX, targetY);
                            setIsTracking(true); 
                        } 
                    }}
                 >
                    {/* Group 1: Common Points */}
                    <optgroup label="Common Locations">
                        {availableStartPoints.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                    </optgroup>
                    {/* Group 2: Buildings */}
                    <optgroup label="Buildings">
                        {buildings.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                    </optgroup>
                 </select>
             </div>

             {/* DESTINATION SELECTOR */}
             <div className="flex items-center gap-2">
                 <Navigation2 size={16} className="text-gray-400"/>
                 <select 
                    className="w-full bg-transparent p-2 border-b outline-none" 
                    value={route.destination} 
                    onChange={e => setRoute({...route, destination: e.target.value})}
                 >
                    <option value="">Destination...</option>
                    {buildings.map(b => <option key={b.id} value={b.building_name}>{b.building_name}</option>)}
                 </select>
             </div>

             {routeInfo && <div className="flex justify-between text-xs font-bold text-gray-500 bg-gray-50 p-2 rounded"><span>DIST: {routeInfo.distance}</span><span>TIME: {routeInfo.time}</span></div>}
             
             {!isNavigating ? 
                <button onClick={startNavigation} className="w-full bg-[#601214] text-white py-3 rounded-lg font-bold flex justify-center items-center gap-2 shadow-lg active:scale-95 transition-transform"><Play size={16}/> Start Navigation</button> 
                : 
                <button onClick={() => { setIsNavigating(false); setProgress(0); }} className="w-full bg-red-600 text-white py-3 rounded-lg font-bold flex justify-center items-center gap-2 shadow-lg active:scale-95 transition-transform"><RotateCcw size={16}/> End Trip</button>
             }
          </div>

          {/* Map Container */}
          <div className="flex-1 bg-white rounded-xl shadow-lg border overflow-hidden relative cursor-move min-h-[400px]" 
               onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
             
             {/* Map Controls */}
             <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-10">
                {!isTracking && <button onClick={() => { setIsTracking(true); if(userPosition) centerMapOn(userPosition.x, userPosition.y); }} className="bg-white p-3 rounded-xl shadow-lg border text-blue-600 animate-bounce"><LocateFixed size={20}/></button>}
                <button onClick={() => setScale(s => Math.min(s + 0.2, 3))} className="bg-white p-3 rounded-xl shadow-lg border"><Plus size={20}/></button>
                <button onClick={() => setScale(s => Math.max(s - 0.2, 0.5))} className="bg-white p-3 rounded-xl shadow-lg border"><Minus size={20}/></button>
             </div>

             {/* SVG Canvas */}
             <div style={{ transform: `translate(${panX}px, ${panY}px) scale(${scale})`, transformOrigin: '0 0', transition: isTracking ? 'transform 0.1s linear' : 'none' }} className="absolute inset-0">
                <svg width="800" height="600" viewBox="0 0 800 600">
                   <defs>
                      <pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse"><path d="M 100 0 L 0 0 0 100" fill="none" stroke="#d1d5db" strokeWidth="0.5" opacity="0.3"/></pattern>
                      <linearGradient id="roadGradient" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#9ca3af" /><stop offset="50%" stopColor="#d1d5db" /><stop offset="100%" stopColor="#9ca3af" /></linearGradient>
                      
                      {/* Navigation Arrow Marker */}
                      <marker id="arrow" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto"><path d="M0,0 L10,5 L0,10 L2,5 Z" fill="#10b981" /></marker>
                   </defs>
                   
                   <rect width="800" height="600" fill="#f0fdf4" />
                   <rect width="800" height="600" fill="url(#grid)" />
                   
                   {/* 1. ZONES */}
                   {Object.values(campusZones).map((zone, i) => (
                        <g key={i}>
                            <rect x={zone.x} y={zone.y} width={zone.width} height={zone.height} fill={zone.color} fillOpacity="0.08" stroke={zone.color} strokeWidth="1" strokeDasharray="4 4" rx="12" />
                            <text x={zone.x + zone.width/2} y={zone.y + 15} textAnchor="middle" fontSize="10" fill={zone.color} fontWeight="bold" opacity="0.6" style={{textTransform: 'uppercase', letterSpacing: '1px'}}>{zone.label}</text>
                        </g>
                   ))}
                   
                   {/* 2. ROADS */}
                   <g className="opacity-90">
                      <path d="M20,90 L780,90 L780,590 L20,590 Z" fill="none" stroke="url(#roadGradient)" strokeWidth="25" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M230,90 L230,590" fill="none" stroke="url(#roadGradient)" strokeWidth="18" />
                      <path d="M570,90 L570,590" fill="none" stroke="url(#roadGradient)" strokeWidth="18" />
                      <path d="M20,250 L230,250" fill="none" stroke="url(#roadGradient)" strokeWidth="15" />
                      <path d="M570,250 L780,250" fill="none" stroke="url(#roadGradient)" strokeWidth="15" />
                      <path d="M230,340 L570,340" fill="none" stroke="url(#roadGradient)" strokeWidth="15" />
                      <path d="M20,460 L780,460" fill="none" stroke="url(#roadGradient)" strokeWidth="15" />
                      <path d="M400,0 L400,90" fill="none" stroke="url(#roadGradient)" strokeWidth="30" />
                   </g>

                   {/* 3. TREES */}
                   <g opacity="0.8">
                       <Tree x={350} y={50} /> <Tree x={450} y={50} /> <Tree x={400} y={220} />
                       <Tree x={100} y={80} /> <Tree x={700} y={80} /> <Tree x={100} y={450} />
                       <Tree x={700} y={450} /> <Tree x={230} y={300} /> <Tree x={570} y={300} />
                   </g>

                   {/* 4. BUILDINGS */}
                   {buildings.map(b => (
                       <g key={b.id}>
                           <rect x={b.x} y={b.y} width={b.width} height={b.height} rx="4" fill="white" stroke={b.color} strokeWidth="1" />
                           <rect x={b.x} y={b.y} width={b.width} height={b.height * 0.3} rx="4" fill={b.color} fillOpacity="0.8" />
                           <text x={b.x+b.width/2} y={b.y+b.height/2+3} textAnchor="middle" fontSize="9" fill="#374151" fontWeight="bold">{b.building_code}</text>
                       </g>
                   ))}
                   
                   {/* 5. ACTIVE PATH */}
                   {isNavigating && currentPathPoints.length > 0 && (
                       <polyline points={currentPathPoints.map(p => `${p.x},${p.y}`).join(' ')} fill="none" stroke="#2563eb" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" />
                   )}
                   {isNavigating && currentPathPoints.length > 0 && (
                       <polyline points={currentPathPoints.map(p => `${p.x},${p.y}`).join(' ')} fill="none" stroke="#3b82f6" strokeWidth="3" strokeDasharray="8,4" className="animate-pulse" />
                   )}

                   {/* 6. USER LOCATION (REAL GPS STYLE) */}
                   {userPosition && (
                      <g transform={`translate(${userPosition.x}, ${userPosition.y})`}>
                          {/* Accuracy Circle */}
                          <circle r="20" fill="#3b82f6" fillOpacity="0.1" className="animate-ping" />
                          <circle r="15" fill="#3b82f6" fillOpacity="0.2" />
                          
                          {/* Directional Arrow / Puck */}
                          <g transform={`rotate(${userPosition.heading || 0})`}>
                             <path d="M0,-12 L9,12 L0,8 L-9,12 Z" fill="#2563eb" stroke="white" strokeWidth="2" filter="drop-shadow(0px 3px 2px rgba(0,0,0,0.3))" />
                          </g>
                      </g>
                   )}
                </svg>
             </div>
          </div>
       </div>
    </div>
  );
};

export default Navigate;