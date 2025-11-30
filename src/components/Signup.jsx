import React, { useState } from 'react';
import { MapPin, ArrowLeft, Mail, User, Lock } from 'lucide-react'; 
import { supabase } from '../supabaseClient';

const Signup = ({ onNavigate, onSignupSuccess }) => {
  const [formData, setFormData] = useState({
    email: '', 
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.username || !formData.password || !formData.confirmPassword) {
      alert('Please fill in all fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      alert('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    
    try {
      // Sign up with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            username: formData.username.toLowerCase(),
            full_name: formData.username,
            role: 'student' // Default role for regular signups
          }
        }
      });

      if (error) {
        alert('Signup error: ' + error.message);
        setLoading(false);
        return;
      }

      if (data?.user) {
        // Success - call the success handler
        onSignupSuccess();
      }
    } catch (error) {
      console.error('Signup error:', error);
      alert('An unexpected error occurred during signup.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#601214] flex flex-col relative overflow-hidden">
      
      {/* Back Button */}
      <button 
        onClick={() => onNavigate('login')}
        className="absolute top-6 left-6 text-white/80 hover:text-white z-20 p-2 bg-white/10 rounded-full backdrop-blur-sm transition-colors"
      >
        <ArrowLeft size={24} />
      </button>

      {/* Top Section */}
      <div className="flex-shrink-0 flex flex-col items-center justify-center pt-16 pb-10 z-10 animate-fade">
        <div className="w-28 h-28 bg-white rounded-3xl flex items-center justify-center shadow-2xl rotate-3 mb-6">
            <div className="flex flex-col items-center">
                <div className="bg-[#601214] p-2 rounded-full mb-1">
                    <MapPin className="text-white w-6 h-6" />
                </div>
                <span className="text-[#601214] font-black text-[10px] tracking-widest text-center leading-tight">CAMPUS<br/>NAVI</span>
            </div>
        </div>
        <h2 className="text-white/90 font-medium text-lg tracking-wide">Join the Community</h2>
      </div>

      {/* Bottom Section - White Card Overlay */}
      <form onSubmit={handleSubmit} className="absolute bottom-0 w-full h-[75%] bg-gray-50 rounded-t-[3rem] flex flex-col px-8 pt-12 pb-8 shadow-[0_-10px_40px_rgba(0,0,0,0.2)] animate-enter overflow-y-auto">
        
        <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">Create Account</h1>
        
        <div className="space-y-4 max-w-md mx-auto w-full">
          {/* Email Field */}
          <div className="bg-white rounded-2xl p-1 shadow-sm border border-gray-200 focus-within:border-[#601214] focus-within:ring-1 focus-within:ring-[#601214] transition-all relative">
            <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full bg-transparent pl-12 pr-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none"
              placeholder="Email Address"
              required
            />
          </div>
          
          {/* Username Field */}
          <div className="bg-white rounded-2xl p-1 shadow-sm border border-gray-200 focus-within:border-[#601214] focus-within:ring-1 focus-within:ring-[#601214] transition-all relative">
            <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text" 
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="w-full bg-transparent pl-12 pr-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none"
              placeholder="Username"
              required
            />
          </div>
          
          {/* Password Field */}
          <div className="bg-white rounded-2xl p-1 shadow-sm border border-gray-200 focus-within:border-[#601214] focus-within:ring-1 focus-within:ring-[#601214] transition-all relative">
            <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="password" 
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full bg-transparent pl-12 pr-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none"
              placeholder="Create Password"
              required
            />
          </div>

          {/* Confirm Password Field */}
          <div className="bg-white rounded-2xl p-1 shadow-sm border border-gray-200 focus-within:border-[#601214] focus-within:ring-1 focus-within:ring-[#601214] transition-all relative">
            <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="password" 
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full bg-transparent pl-12 pr-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none"
              placeholder="Confirm Password"
              required
            />
          </div>

          <button 
            type="submit"
            className="w-full bg-[#601214] text-white font-bold py-4 rounded-xl shadow-lg shadow-red-900/20 hover:bg-[#4a0d0e] hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 mt-6"
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </div>

        <div className="mt-auto text-center pt-6">
          <span className="text-gray-500 text-sm">Already have an account? </span>
          <button 
            type="button"
            onClick={() => onNavigate('login')}
            className="text-[#601214] font-bold text-sm hover:underline"
          >
            Log in
          </button>
        </div>
      </form>
    </div>
  );
};

export default Signup;