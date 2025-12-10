import React, { useState, useEffect } from 'react';
import { ChevronLeft, Search, SlidersHorizontal, ChevronRight, Building2, Clock, MapPin, Users, Wifi, BookOpen, Coffee, Dumbbell, FlaskRound, Trees, Shield, Navigation } from 'lucide-react';

const Info = ({ onNavigate, buildings }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredBuildings, setFilteredBuildings] = useState([]);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [loading, setLoading] = useState(false);

  // Enhanced building data with all buildings from CampusMap
  const enhancedBuildings = [
    {
      name: 'College of Computer Studies',
      code: 'CCS',
      desc: 'Home to computer science and IT programs with state-of-the-art computer labs and research facilities.',
      hours: '7:00 AM - 9:00 PM',
      floors: 5,
      facilities: ['Computer Labs', 'Research Center', 'Faculty Offices', 'Student Lounge', 'Conference Rooms'],
      type: 'academic',
      zone: 'academic',
      color: '#1e40af'
    },
    {
      name: 'Science Labs',
      code: 'SCI',
      desc: 'Advanced laboratory facilities for chemistry, biology, physics, and environmental science research.',
      hours: '7:00 AM - 8:00 PM',
      floors: 4,
      facilities: ['Research Labs', 'Equipment Rooms', 'Faculty Offices', 'Student Workspaces', 'Safety Stations'],
      type: 'science',
      zone: 'academic',
      color: '#7c3aed'
    },
    {
      name: 'College of Business Administration',
      code: 'CBA',
      desc: 'Modern business education facility with trading rooms, case study rooms, and executive education spaces.',
      hours: '7:00 AM - 9:00 PM',
      floors: 6,
      facilities: ['Trading Room', 'Case Rooms', 'Faculty Offices', 'Student Lounge', 'Career Center'],
      type: 'academic',
      zone: 'academic',
      color: '#1e40af'
    },
    {
      name: 'College of Education',
      code: 'CED',
      desc: 'Dedicated to teacher education and educational research with specialized classrooms and observation areas.',
      hours: '7:00 AM - 8:00 PM',
      floors: 4,
      facilities: ['Smart Classrooms', 'Observation Rooms', 'Curriculum Library', 'Faculty Offices', 'Seminar Hall'],
      type: 'academic',
      zone: 'academic',
      color: '#1e40af'
    },
    {
      name: 'Engineering Building',
      code: 'ENG',
      desc: 'State-of-the-art engineering facilities with specialized labs for mechanical, electrical, and civil engineering.',
      hours: '7:00 AM - 10:00 PM',
      floors: 5,
      facilities: ['Engineering Labs', 'Design Studios', 'Workshop', 'Faculty Offices', 'Project Rooms'],
      type: 'academic',
      zone: 'academic',
      color: '#1e40af'
    },
    {
      name: 'Mathematics Building',
      code: 'MATH',
      desc: 'Center for mathematical sciences with collaborative learning spaces and advanced computing facilities.',
      hours: '7:00 AM - 9:00 PM',
      floors: 4,
      facilities: ['Math Labs', 'Collaborative Spaces', 'Faculty Offices', 'Study Areas', 'Computer Lab'],
      type: 'academic',
      zone: 'academic',
      color: '#1e40af'
    },
    {
      name: 'Student Center',
      code: 'STUD',
      desc: 'Hub for student activities, organizations, and campus events with various amenities and services.',
      hours: '8:00 AM - 11:00 PM',
      floors: 3,
      facilities: ['Food Court', 'Game Room', 'Meeting Rooms', 'Student Org Offices', 'Lounges'],
      type: 'student',
      zone: 'student',
      color: '#dc2626'
    },
    {
      name: 'Cafeteria',
      code: 'CAF',
      desc: 'Main dining facility offering diverse food options for students, faculty, and staff.',
      hours: '6:30 AM - 8:00 PM',
      floors: 2,
      facilities: ['Food Stations', 'Seating Areas', 'Vending Machines', 'Microwave Stations', 'Outdoor Terrace'],
      type: 'cafeteria',
      zone: 'student',
      color: '#ea580c'
    },
    {
      name: 'Main Library',
      code: 'LIB',
      desc: 'Central library with extensive collections, study areas, and digital resources for academic research.',
      hours: '6:00 AM - 10:00 PM',
      floors: 4,
      facilities: ['Reading Areas', 'Group Study Rooms', 'Computer Station', 'Printing Services', 'Quiet Zones'],
      type: 'library',
      zone: 'student',
      color: '#2563eb'
    },
    {
      name: 'Bookstore',
      code: 'BOOK',
      desc: 'Campus bookstore offering textbooks, school supplies, university merchandise, and academic resources.',
      hours: '9:00 AM - 6:00 PM',
      floors: 2,
      facilities: ['Textbooks', 'School Supplies', 'University Store', 'Coffee Corner', 'Study Guides'],
      type: 'store',
      zone: 'student',
      color: '#dc2626'
    },
    {
      name: 'Gymnasium',
      code: 'GYM',
      desc: 'Comprehensive athletic facility for sports, fitness, and recreational activities for the campus community.',
      hours: '5:00 AM - 11:00 PM',
      floors: 2,
      facilities: ['Basketball Courts', 'Fitness Center', 'Locker Rooms', 'Climbing Wall', 'Swimming Pool'],
      type: 'gym',
      zone: 'sports',
      color: '#dc2626'
    },
    {
      name: 'Sports Field',
      code: 'FIELD',
      desc: 'Outdoor athletic complex for various sports including football, track, and intramural activities.',
      hours: '5:00 AM - 10:00 PM',
      floors: 1,
      facilities: ['Football Field', 'Track', 'Bleachers', 'Equipment Rental', 'Lighting System'],
      type: 'sports',
      zone: 'sports',
      color: '#16a34a'
    },
    {
      name: 'Swimming Pool',
      code: 'POOL',
      desc: 'Olympic-sized swimming pool for recreational swimming, competitions, and aquatic fitness classes.',
      hours: '6:00 AM - 9:00 PM',
      floors: 1,
      facilities: ['Olympic Pool', 'Diving Area', 'Locker Rooms', 'Swim Lessons', 'Aquatic Fitness'],
      type: 'sports',
      zone: 'sports',
      color: '#0891b2'
    },
    {
      name: 'Tennis Courts',
      code: 'TENNIS',
      desc: 'Professional tennis facilities with multiple courts for recreational play and competitive matches.',
      hours: '6:00 AM - 10:00 PM',
      floors: 1,
      facilities: ['Tennis Courts', 'Equipment Rental', 'Lighting', 'Seating Area', 'Pro Shop'],
      type: 'sports',
      zone: 'sports',
      color: '#16a34a'
    },
    {
      name: 'Administration',
      code: 'ADM',
      desc: 'Central administrative offices handling university operations, student services, and administrative functions.',
      hours: '8:00 AM - 5:00 PM',
      floors: 5,
      facilities: ['Registrar Office', 'Bursar', 'Student Affairs', 'HR Department', 'Meeting Rooms'],
      type: 'admin',
      zone: 'admin',
      color: '#7e22ce'
    },
    {
      name: 'Medical Clinic',
      code: 'MED',
      desc: 'Campus health center providing medical services, wellness programs, and emergency care for students and staff.',
      hours: '24/7 Emergency, 8AM-6PM Regular',
      floors: 3,
      facilities: ['Emergency Room', 'Consultation Rooms', 'Pharmacy', 'Laboratory', 'Wellness Center'],
      type: 'medical',
      zone: 'admin',
      color: '#dc2626'
    },
    {
      name: 'Security Office',
      code: 'SEC',
      desc: 'Campus security headquarters providing safety services, emergency response, and security monitoring.',
      hours: '24/7',
      floors: 2,
      facilities: ['Security Operations', 'Emergency Response', 'Lost & Found', 'Safety Resources', 'Parking Enforcement'],
      type: 'admin',
      zone: 'admin',
      color: '#7e22ce'
    },
    {
      name: 'North Dormitory',
      code: 'DORM1',
      desc: 'Modern student residence with comfortable living spaces, study areas, and community facilities.',
      hours: '24/7 with Access Control',
      floors: 8,
      facilities: ['Student Rooms', 'Study Lounges', 'Common Kitchen', 'Laundry', 'Recreation Room'],
      type: 'dorm',
      zone: 'residential',
      color: '#ea580c'
    },
    {
      name: 'South Dormitory',
      code: 'DORM2',
      desc: 'Student housing facility offering residential experience with academic support and community engagement.',
      hours: '24/7 with Access Control',
      floors: 6,
      facilities: ['Student Rooms', 'Study Areas', 'Community Kitchen', 'Laundry', 'Game Room'],
      type: 'dorm',
      zone: 'residential',
      color: '#ea580c'
    },
    {
      name: 'East Dormitory',
      code: 'DORM3',
      desc: 'Residential building providing comfortable accommodation with modern amenities for students.',
      hours: '24/7 with Access Control',
      floors: 7,
      facilities: ['Student Rooms', 'Study Spaces', 'Common Areas', 'Laundry', 'Fitness Corner'],
      type: 'dorm',
      zone: 'residential',
      color: '#ea580c'
    },
    {
      name: 'Art Studio',
      code: 'ART',
      desc: 'Creative space for visual arts with studios, exhibition areas, and specialized art equipment.',
      hours: '8:00 AM - 10:00 PM',
      floors: 3,
      facilities: ['Painting Studio', 'Sculpture Room', 'Digital Lab', 'Gallery Space', 'Art Storage'],
      type: 'arts',
      zone: 'arts',
      color: '#db2777'
    },
    {
      name: 'Music Hall',
      code: 'MUSIC',
      desc: 'Acoustically designed facility for music education, practice, and performances.',
      hours: '7:00 AM - 11:00 PM',
      floors: 4,
      facilities: ['Practice Rooms', 'Concert Hall', 'Recording Studio', 'Music Library', 'Instrument Storage'],
      type: 'arts',
      zone: 'arts',
      color: '#db2777'
    },
    {
      name: 'Theater',
      code: 'THEA',
      desc: 'Professional theater venue for dramatic arts, performances, and cultural events.',
      hours: '9:00 AM - 11:00 PM',
      floors: 3,
      facilities: ['Main Stage', 'Rehearsal Rooms', 'Costume Shop', 'Scene Shop', 'Box Office'],
      type: 'arts',
      zone: 'arts',
      color: '#db2777'
    },
    {
      name: 'Parking Lot',
      code: 'PARK',
      desc: 'Main campus parking facility with ample spaces for students, faculty, and visitors.',
      hours: '24/7',
      floors: 1,
      facilities: ['Parking Spaces', 'EV Charging', 'Security Patrol', 'Payment Kiosks', 'Accessible Parking'],
      type: 'parking',
      zone: 'student',
      color: '#6b7280'
    },
    {
      name: 'Chapel',
      code: 'CHAP',
      desc: 'Interfaith spiritual center providing space for reflection, prayer, and religious services.',
      hours: '6:00 AM - 10:00 PM',
      floors: 2,
      facilities: ['Main Chapel', 'Meditation Room', 'Meeting Spaces', 'Religious Resources', 'Community Area'],
      type: 'religious',
      zone: 'student',
      color: '#d97706'
    },
    {
      name: 'Research Center',
      code: 'RES',
      desc: 'Advanced research facility supporting interdisciplinary research projects and innovation.',
      hours: '24/7 Access for Researchers',
      floors: 5,
      facilities: ['Research Labs', 'Collaborative Spaces', 'Conference Rooms', 'Equipment Center', 'Data Lab'],
      type: 'science',
      zone: 'academic',
      color: '#7c3aed'
    }
  ];

  // Initialize filtered buildings on component mount
  useEffect(() => {
    setFilteredBuildings(enhancedBuildings);
  }, []);

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    
    if (term === '') {
      setFilteredBuildings(enhancedBuildings);
    } else {
      const filtered = enhancedBuildings.filter(building => 
        building.name.toLowerCase().includes(term) || 
        building.code.toLowerCase().includes(term) ||
        building.desc.toLowerCase().includes(term) ||
        building.type.toLowerCase().includes(term) ||
        building.zone.toLowerCase().includes(term)
      );
      setFilteredBuildings(filtered);
    }
  };

  const handleBuildingClick = (building) => {
    console.log('Building clicked:', building);
    setSelectedBuilding(building);
  };

  const closeDetails = () => {
    setSelectedBuilding(null);
  };

  const handleNavigateToBuilding = () => {
    if (selectedBuilding) {
      // Store the building data to pass to navigate
      localStorage.setItem('selectedDestination', selectedBuilding.name);
      onNavigate('navigate');
    }
  };

  const getBuildingIcon = (type) => {
    switch (type) {
      case 'library': return <BookOpen size={20} />;
      case 'cafeteria': return <Coffee size={20} />;
      case 'gym': return <Dumbbell size={20} />;
      case 'science': return <FlaskRound size={20} />;
      case 'sports': return <Dumbbell size={20} />;
      case 'medical': return <Shield size={20} />;
      case 'dorm': return <Building2 size={20} />;
      case 'arts': return <BookOpen size={20} />;
      case 'store': return <Building2 size={20} />;
      case 'parking': return <MapPin size={20} />;
      case 'religious': return <Building2 size={20} />;
      case 'admin': return <Shield size={20} />;
      default: return <Building2 size={20} />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'academic': return '#1e40af';
      case 'science': return '#7c3aed';
      case 'student': return '#dc2626';
      case 'cafeteria': return '#ea580c';
      case 'library': return '#2563eb';
      case 'gym': return '#dc2626';
      case 'sports': return '#16a34a';
      case 'medical': return '#dc2626';
      case 'admin': return '#7e22ce';
      case 'dorm': return '#ea580c';
      case 'arts': return '#db2777';
      case 'store': return '#dc2626';
      case 'parking': return '#6b7280';
      case 'religious': return '#d97706';
      default: return '#601214';
    }
  };

  // Prevent accidental clicks on the list items
  const handleBuildingItemClick = (e, building) => {
    e.preventDefault();
    e.stopPropagation();
    handleBuildingClick(building);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex flex-col">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md px-6 pt-12 pb-6 flex items-center border-b border-gray-200/50 sticky top-0 z-20 shadow-sm">
        <button 
          onClick={() => onNavigate('map')} 
          className="p-2 -ml-2 mr-2 hover:bg-gray-100/80 rounded-full transition-all duration-200 text-gray-700 hover:scale-105"
        >
          <ChevronLeft size={24} />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Building Information</h1>
          <p className="text-gray-500 text-sm">Detailed campus building guide</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        {/* Search Bar */}
        <div className="flex gap-3 mb-8 animate-enter">
          <div className="flex-1 bg-white/80 backdrop-blur-md rounded-xl h-14 px-4 flex items-center shadow-sm border border-gray-300/50 focus-within:border-[#601214] focus-within:ring-2 focus-within:ring-[#601214]/20 transition-all">
            <Search className="w-5 h-5 text-gray-400 mr-3" />
            <input 
              type="text" 
              placeholder="Search buildings, facilities, or departments..." 
              value={searchTerm}
              onChange={handleSearch}
              className="w-full bg-transparent text-gray-900 placeholder-gray-500 outline-none font-medium" 
            />
          </div>
          <button className="bg-white/80 backdrop-blur-md rounded-xl w-14 h-14 flex items-center justify-center shadow-sm border border-gray-300/50 hover:bg-gray-100/80 active:scale-95 transition-all text-gray-600">
            <SlidersHorizontal className="w-5 h-5" />
          </button>
        </div>

        {/* Building Cards or Detailed View */}
        {selectedBuilding ? (
          // Detailed Building View
          <div className="animate-enter">
            <button 
              onClick={closeDetails}
              className="flex items-center gap-2 text-[#601214] font-semibold mb-6 hover:underline hover:text-[#4a0d0e] transition-colors"
            >
              <ChevronLeft size={20} />
              Back to List
            </button>

            <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-gray-200/50">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div 
                    className="p-3 rounded-2xl text-white shadow-lg" 
                    style={{ backgroundColor: getTypeColor(selectedBuilding.type) }}
                  >
                    {getBuildingIcon(selectedBuilding.type)}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedBuilding.name}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span 
                        className="text-sm font-bold text-white px-2 py-1 rounded-full shadow-sm"
                        style={{ backgroundColor: getTypeColor(selectedBuilding.type) }}
                      >
                        {selectedBuilding.code}
                      </span>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full capitalize">
                        {selectedBuilding.type}
                      </span>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full capitalize">
                        {selectedBuilding.zone} Zone
                      </span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={handleNavigateToBuilding}
                  className="bg-gradient-to-br from-[#601214] to-[#8b1a1d] text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all duration-200 flex items-center gap-2"
                >
                  <Navigation size={18} />
                  Get Directions
                </button>
              </div>

              <p className="text-gray-600 text-lg mb-8 leading-relaxed">
                {selectedBuilding.desc}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="space-y-4">
                  <h3 className="font-bold text-gray-900 text-lg">Building Details</h3>
                  
                  <div className="flex items-center gap-3 text-gray-600 p-3 bg-gray-50/50 rounded-xl">
                    <Clock size={18} className="text-[#601214]" />
                    <div>
                      <p className="font-semibold">Operating Hours</p>
                      <p className="text-sm">{selectedBuilding.hours}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-gray-600 p-3 bg-gray-50/50 rounded-xl">
                    <Building2 size={18} className="text-[#601214]" />
                    <div>
                      <p className="font-semibold">Floors</p>
                      <p className="text-sm">{selectedBuilding.floors} floors</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-gray-600 p-3 bg-gray-50/50 rounded-xl">
                    <Wifi size={18} className="text-[#601214]" />
                    <div>
                      <p className="font-semibold">WiFi Coverage</p>
                      <p className="text-sm">Available throughout building</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-gray-900 text-lg mb-4">Facilities & Amenities</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedBuilding.facilities.map((facility, index) => (
                      <span 
                        key={index}
                        className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                      >
                        {facility}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-gray-50/50 rounded-2xl p-6 border border-gray-200/50">
                <h3 className="font-bold text-gray-900 text-lg mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-white/80 rounded-xl border border-gray-200/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <MapPin size={18} className="text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Find on Map</p>
                        <p className="text-gray-500 text-sm">Locate this building</p>
                      </div>
                    </div>
                    <button className="text-[#601214] font-semibold text-sm hover:underline">
                      Show
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-white/80 rounded-xl border border-gray-200/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <Users size={18} className="text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Contact Information</p>
                        <p className="text-gray-500 text-sm">Building administration</p>
                      </div>
                    </div>
                    <button className="text-[#601214] font-semibold text-sm hover:underline">
                      View
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Building List View
          <div className="space-y-4">
            {filteredBuildings.length > 0 ? (
              filteredBuildings.map((b, index) => (
                <div 
                  key={index} 
                  className={`bg-white/80 backdrop-blur-md rounded-2xl p-5 shadow-lg border border-gray-200/50 hover:border-[#601214] transition-all duration-300 animate-enter cursor-pointer hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]`}
                  style={{ animationDelay: `${index * 50}ms` }}
                  onClick={(e) => handleBuildingItemClick(e, b)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div 
                        className="p-2.5 rounded-xl text-white shadow-md" 
                        style={{ backgroundColor: getTypeColor(b.type) }}
                      >
                        {getBuildingIcon(b.type)}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg">{b.name}</h3>
                        <div className="flex gap-2 mt-1">
                          <span 
                            className="text-xs font-bold text-white px-2 py-0.5 rounded-md shadow-sm"
                            style={{ backgroundColor: getTypeColor(b.type) }}
                          >
                            {b.code}
                          </span>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md capitalize">
                            {b.type}
                          </span>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                            {b.zone}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button className="text-gray-300 hover:text-[#601214] transition-colors">
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                  <p className="text-gray-500 text-sm leading-relaxed pl-[3.25rem]">
                    {b.desc}
                  </p>
                  <div className="flex items-center gap-4 mt-3 pl-[3.25rem] text-xs text-gray-400">
                    <div className="flex items-center gap-1">
                      <Building2 size={12} />
                      <span>{b.floors} floors</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock size={12} />
                      <span>{b.hours}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search size={24} className="text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No buildings found</h3>
                <p className="text-gray-500">
                  No buildings match "{searchTerm}". Try searching with different terms.
                </p>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilteredBuildings(enhancedBuildings);
                  }}
                  className="mt-4 text-[#601214] font-semibold text-sm hover:underline"
                >
                  Clear Search
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      {!selectedBuilding && (
        <div className="p-6 border-t border-gray-200/50 bg-white/80 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                Showing {filteredBuildings.length} of {enhancedBuildings.length} buildings
              </p>
            </div>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="text-[#601214] font-semibold text-sm hover:underline"
            >
              Back to Top
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Info;