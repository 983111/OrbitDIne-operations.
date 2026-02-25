import React, { useState } from 'react';
import { useAuth } from '../store/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Lock, ShieldCheck } from 'lucide-react';

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.toLowerCase().includes('owner')) {
      login('owner');
      navigate('/owner');
    } else {
      login('manager');
      navigate('/manager');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a2035] via-[#241b3d] to-[#1a1025] p-6">
      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        
        {/* Left Content */}
        <div className="text-white space-y-6">
          <div className="inline-flex items-center px-3 py-1 rounded-full border border-blue-400/30 bg-blue-500/10 text-blue-300 text-xs font-bold tracking-widest uppercase">
            <ShieldCheck className="w-4 h-4 mr-2" />
            OrbitDine Operations
          </div>
          
          <h1 className="text-4xl lg:text-5xl font-bold leading-tight text-white">
            Securely access the<br />manager and owner<br />console.
          </h1>
          
          <p className="text-slate-300 text-lg max-w-md leading-relaxed">
            Monitor tables, control kitchen flow, and manage settings in one place. 
            Sign in with your staff credentials to continue.
          </p>
        </div>

        {/* Right Content - Login Form */}
        <div className="bg-[#f8f9fa] rounded-3xl p-8 lg:p-10 shadow-2xl">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900">Staff Login</h2>
            <p className="text-slate-500 text-sm mt-2">Only authorized managers and owners can access this section.</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Username</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="block w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white text-slate-900"
                placeholder="Enter your username"
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white text-slate-900"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-base font-bold text-white bg-[#1d4ed8] hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors mt-2"
            >
              Sign in
            </button>
          </form>
          
          <div className="mt-8 text-center text-sm text-slate-500">
            Looking for guest ordering? <a href="#" className="text-blue-600 font-semibold hover:underline">Open customer menu</a>
          </div>
          
          <div className="mt-6 text-center text-xs text-slate-400">
            <p>Hint: Use "owner" for Owner view, or "manager" for Manager view.</p>
          </div>
        </div>
        
      </div>
    </div>
  );
}
