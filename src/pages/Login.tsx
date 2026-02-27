import React, { useState } from 'react';
import { useAuth } from '../store/AuthContext';
import { Lock, Mail, ShieldCheck, User, AlertCircle, Loader2 } from 'lucide-react';

type Mode = 'login' | 'signup';

export function Login() {
  const { login, signUp, authError } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'owner' | 'manager'>('manager');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [signUpSuccess, setSignUpSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (mode === 'login') {
      const { error } = await login(email, password);
      if (error) {
        setError(error);
        setLoading(false);
      }
      // On success: auth state change → App.tsx redirects automatically
    } else {
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        setLoading(false);
        return;
      }
      const { error } = await signUp(email, password, fullName, role);
      if (error) {
        setError(error);
        setLoading(false);
      } else {
        // Supabase may require email confirmation depending on your project settings.
        // If email confirmation is OFF (recommended for dev), user is signed in immediately.
        // Show success and let them log in.
        setSignUpSuccess(true);
        setLoading(false);
      }
    }
  };

  const displayError = error || authError;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a2035] via-[#241b3d] to-[#1a1025] p-6">
      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

        {/* Left branding */}
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
          </p>
        </div>

        {/* Right form */}
        <div className="bg-[#f8f9fa] rounded-3xl p-8 lg:p-10 shadow-2xl">
          {signUpSuccess ? (
            <div className="text-center space-y-4 py-8">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                <ShieldCheck className="w-8 h-8 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Account Created!</h2>
              <p className="text-slate-500">
                Your account for <strong>{email}</strong> is ready.
                {' '}Sign in to access your portal.
              </p>
              <button
                onClick={() => { setMode('login'); setSignUpSuccess(false); setError(null); }}
                className="w-full py-3 px-4 bg-[#1d4ed8] text-white rounded-xl font-bold hover:bg-blue-700 transition-colors"
              >
                Sign In Now
              </button>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900">
                  {mode === 'login' ? 'Staff Login' : 'Create Account'}
                </h2>
                <p className="text-slate-500 text-sm mt-2">
                  {mode === 'login'
                    ? 'Only authorized managers and owners can access this section.'
                    : 'Register as manager or owner for OrbitDine.'}
                </p>
              </div>

              {displayError && (
                <div className="mb-4 flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{displayError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'signup' && (
                  <>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Full Name</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <User className="h-4 w-4 text-slate-400" />
                        </div>
                        <input
                          type="text"
                          required
                          value={fullName}
                          onChange={e => setFullName(e.target.value)}
                          className="block w-full pl-11 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900"
                          placeholder="Alice Owner"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Role</label>
                      <div className="flex gap-3">
                        {(['owner', 'manager'] as const).map(r => (
                          <button
                            key={r}
                            type="button"
                            onClick={() => setRole(r)}
                            className={`flex-1 py-3 rounded-xl border-2 text-sm font-bold capitalize transition-colors ${
                              role === r
                                ? 'border-blue-600 bg-blue-50 text-blue-700'
                                : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300'
                            }`}
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Email</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="block w-full pl-11 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900"
                      placeholder="you@orbitdine.com"
                    />
                  </div>
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
                      onChange={e => setPassword(e.target.value)}
                      className="block w-full pl-11 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900"
                      placeholder="••••••••"
                      minLength={6}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center items-center py-3.5 px-4 rounded-xl shadow-sm text-base font-bold text-white bg-[#1d4ed8] hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                >
                  {loading
                    ? <Loader2 className="w-5 h-5 animate-spin" />
                    : mode === 'login' ? 'Sign In' : 'Create Account'}
                </button>
              </form>

              <div className="mt-6 text-center text-sm text-slate-500">
                {mode === 'login' ? (
                  <>Don't have an account?{' '}
                    <button
                      onClick={() => { setMode('signup'); setError(null); }}
                      className="text-blue-600 font-semibold hover:underline"
                    >
                      Sign up
                    </button>
                  </>
                ) : (
                  <>Already have an account?{' '}
                    <button
                      onClick={() => { setMode('login'); setError(null); }}
                      className="text-blue-600 font-semibold hover:underline"
                    >
                      Sign in
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
