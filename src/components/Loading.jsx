import React from 'react';
import { MapPin } from 'lucide-react';

const Loading = () => {
  return (
    <div className="min-h-screen bg-[#601214] flex flex-col items-center justify-center p-6">
      {/* Animated Logo */}
      <div className="relative mb-8">
        <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center shadow-2xl rotate-3 animate-pulse">
          <div className="flex flex-col items-center">
            <div className="bg-[#601214] p-2 rounded-full mb-1 animate-bounce">
              <MapPin className="text-white w-6 h-6" />
            </div>
            <span className="text-[#601214] font-black text-xs tracking-widest text-center leading-tight">
              CAMPUS<br/>NAVI
            </span>
          </div>
        </div>
        
        {/* Pulsing Ring Effect */}
        <div className="absolute inset-0 border-4 border-white/30 rounded-2xl animate-ping"></div>
      </div>

      {/* Loading Text */}
      <div className="text-center">
        <h2 className="text-white text-xl font-semibold mb-2 animate-pulse">
          Campus Navi
        </h2>
        <p className="text-white/70 text-sm">
          Finding your way around campus...
        </p>
      </div>

      {/* Loading Dots */}
      <div className="flex space-x-2 mt-6">
        <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce"></div>
        <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
        <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
      </div>
    </div>
  );
};

export default Loading;