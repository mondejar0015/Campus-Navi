import React, { useState } from 'react';
import { Mail, Lock, ArrowRight, Shield } from 'lucide-react';
import { supabase } from '../supabaseClient';

const AdminLogin = ({ onNavigate, onAdminLoginSuccess }) => {
  const [formData, setFormData] = useState({
    email: '', 
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      alert('Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        // Admin Login
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password
        });

        if (error) {
          alert('Login failed: ' + error.message);
          setLoading(false);
          return;
        }

        if (data.user) {
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('id', data.user.id)
            .single();

          if (roleData && roleData.role === 'admin') {
             console.log('Admin verified, forcing update...');
             // Explicitly trigger the app update
             if (onAdminLoginSuccess) {
                await onAdminLoginSuccess();
             }
          } else {
             await supabase.auth.signOut();
             alert('Access denied. Admin privileges required.');
             setLoading(false);
          }
        }
      } else {
        // Admin Registration
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              username: formData.email.split('@')[0].toLowerCase(),
              full_name: 'Administrator',
              role: 'admin'
            }
          }
        });

        if (error) {
          alert('Registration error: ' + error.message);
          setLoading(false);
          return;
        }

        if (data.user) {
          alert('Admin account created successfully! You can now log in.');
          setIsLogin(true);
          setFormData({ email: '', password: '' });
          setLoading(false);
        }
      }
    } catch (error) {
      console.error('Admin auth error:', error);
      alert('An unexpected error occurred: ' + error.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-red-100 rounded-full blur-3xl opacity-60"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-gray-200 rounded-full blur-3xl opacity-60"></div>

      <div className="w-full max-w-md animate-enter z-10">
        <div className="flex flex-col items-center mb-10">
          <div className="bg-gradient-to-br from-[#601214] to-[#8b1a1d] p-4 rounded-2xl shadow-xl shadow-red-900/20 mb-4 transform hover:scale-105 transition-transform duration-300">
            <Shield className="text-white w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Admin Portal</h1>
          <p className="text-gray-500 mt-2">Campus Management System</p>
        </div>
        
        <form onSubmit={handleSubmit} className="bg-white/80 backdrop-blur-md p-8 rounded-3xl shadow-xl border border-gray-200/50">
          <div className="space-y-5">
            <div className="group">
              <label className="block text-gray-700 text-sm font-semibold mb-2 ml-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-[#601214] transition-colors" />
                <input 
                  type="email" 
                  name="email" 
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-12 pr-4 py-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#601214] focus:ring-1 focus:ring-[#601214] transition-all"
                  placeholder="Enter admin email"
                  required
                />
              </div>
            </div>
            
            <div className="group">
              <label className="block text-gray-700 text-sm font-semibold mb-2 ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-[#601214] transition-colors" />
                <input 
                  type="password" 
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-12 pr-4 py-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#601214] focus:ring-1 focus:ring-[#601214] transition-all"
                  placeholder="Enter password"
                  required
                />
              </div>
            </div>

            <button 
              type="submit"
              className="w-full bg-gradient-to-br from-[#601214] to-[#8b1a1d] text-white font-bold py-4 rounded-xl shadow-lg shadow-red-900/20 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center group"
              disabled={loading}
            >
              <span>{loading ? 'Processing...' : (isLogin ? 'Admin Login' : 'Create Admin Account')}</span>
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </form>

        <div className="mt-8 text-center animate-enter delay-200">
          <span className="text-gray-500">
            {isLogin ? "Need admin access? " : "Already have an admin account? "}
          </span>
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-[#601214] font-bold hover:underline decoration-2 underline-offset-4"
          >
            {isLogin ? 'Register as Admin' : 'Login instead'}
          </button>
        </div>

        <div className="mt-6 text-center">
          <button 
            onClick={() => onNavigate('login')}
            className="text-gray-500 hover:text-gray-700 text-sm underline"
          >
            ← Back to Student App
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;