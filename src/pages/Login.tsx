import React, { useState } from 'react';
import { useAuth } from '../store/AuthContext';
import { Lock, Mail, User, AlertCircle, Loader2, ChefHat, BarChart3, Shield, Zap, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { cn } from '../lib/utils';

type Mode = 'login' | 'signup';

const features = [
  { icon: BarChart3, title: 'Live Analytics', desc: 'Revenue, orders & table status in real time' },
  { icon: ChefHat,  title: 'Kitchen Control', desc: 'Track every dish from prep to serve' },
  { icon: Shield,   title: 'Role-based Access', desc: 'Separate portals for owners & managers' },
  { icon: Zap,      title: 'Instant Sync', desc: 'Changes reflect everywhere immediately' },
];

export function Login() {
  const { login, signUp, authError } = useAuth();
  const [mode, setMode]               = useState<Mode>('login');
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [fullName, setFullName]       = useState('');
  const [role, setRole]               = useState<'owner' | 'manager'>('owner');
  const [showPw, setShowPw]           = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [loading, setLoading]         = useState(false);
  const [done, setDone]               = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    if (mode === 'login') {
      const { error } = await login(email, password);
      if (error) { setError(error); setLoading(false); }
    } else {
      if (password.length < 6) { setError('Password must be at least 6 characters.'); setLoading(false); return; }
      const { error } = await signUp(email, password, fullName, role);
      if (error) { setError(error); setLoading(false); } else { setDone(true); setLoading(false); }
    }
  };

  const displayError = error || authError;

  return (
    <div className="min-h-screen flex bg-[#07070F] overflow-hidden">

      {/* ── Left brand panel ── */}
      <div className="hidden lg:flex w-[54%] relative flex-col justify-between p-14 overflow-hidden">
        {/* Layered backgrounds */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0D0B1E] via-[#07070F] to-[#0B0A15]" />
        <div className="absolute inset-0" style={{
          backgroundImage:
            'radial-gradient(ellipse 60% 50% at 10% 10%, rgba(249,115,22,0.10) 0%, transparent 70%),' +
            'radial-gradient(ellipse 50% 40% at 90% 90%, rgba(129,140,248,0.08) 0%, transparent 70%)',
        }} />
        <div className="absolute inset-0 dot-grid opacity-[0.12]" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center">
            <ChefHat className="w-5 h-5 text-orange-400" />
          </div>
          <span className="text-xl font-bold text-[#F0F0FF]">OrbitDine</span>
        </div>

        {/* Hero copy */}
        <div className="relative z-10 space-y-8">
          <div className="space-y-4">
            <p className="text-orange-400 text-xs font-bold uppercase tracking-[0.2em]">Operations Platform</p>
            <h1 className="text-[3.5rem] font-bold leading-[1.1] text-[#F0F0FF]">
              The command<br />center for your<br />restaurant.
            </h1>
            <p className="text-[#6B6B9A] text-lg leading-relaxed max-w-md">
              Manage every table, order, and team member from one intelligent, real-time dashboard.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} className="glass rounded-2xl p-4 space-y-2.5">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/15 border border-orange-500/20 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-orange-400" />
                  </div>
                  <p className="text-sm font-semibold text-[#E0E0F0]">{f.title}</p>
                  <p className="text-xs text-[#6B6B9A] leading-snug">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-[#2A2A45] text-sm">© 2025 OrbitDine. All rights reserved.</p>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-16">
        <div className="w-full max-w-[420px]">

          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center">
              <ChefHat className="w-4 h-4 text-orange-400" />
            </div>
            <span className="text-lg font-bold text-[#F0F0FF]">OrbitDine</span>
          </div>

          {done ? (
            /* ── Sign-up success state ── */
            <div className="animate-scale-in">
              <div className="glass rounded-3xl p-8 text-center space-y-5">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center mx-auto">
                  <Shield className="w-8 h-8 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-[#F0F0FF]">Account created!</h2>
                  <p className="text-[#6B6B9A] text-sm mt-2 leading-relaxed">
                    Your <span className="text-orange-400 font-semibold capitalize">{role}</span> account for{' '}
                    <span className="text-[#F0F0FF]">{email}</span> is ready.
                  </p>
                </div>
                <button
                  onClick={() => { setMode('login'); setDone(false); setError(null); }}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-semibold text-sm transition-all active:scale-[0.98]"
                >
                  Sign in now <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            /* ── Main form ── */
            <div className="animate-fade-up space-y-7">
              <div>
                <h2 className="text-3xl font-bold text-[#F0F0FF]">
                  {mode === 'login' ? 'Welcome back' : 'Create account'}
                </h2>
                <p className="text-[#6B6B9A] text-sm mt-1.5">
                  {mode === 'login'
                    ? 'Sign in to access your operations portal.'
                    : 'Set up your OrbitDine account in seconds.'}
                </p>
              </div>

              {displayError && (
                <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm animate-fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{displayError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'signup' && (
                  <>
                    {/* Full name */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[#A0A0C0] uppercase tracking-wider">Full name</label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4A4A6A]" />
                        <input
                          type="text" required value={fullName} onChange={e => setFullName(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-[#F0F0FF] placeholder-[#3A3A5C] text-sm focus:outline-none focus:border-orange-500/50 focus:bg-white/[0.06] transition-all"
                          placeholder="Alex Johnson"
                        />
                      </div>
                    </div>

                    {/* Role picker */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[#A0A0C0] uppercase tracking-wider">I am a</label>
                      <div className="grid grid-cols-2 gap-2">
                        {(['owner', 'manager'] as const).map(r => (
                          <button key={r} type="button" onClick={() => setRole(r)}
                            className={cn(
                              'py-3 rounded-xl text-sm font-semibold capitalize transition-all border',
                              role === r
                                ? 'bg-orange-500/20 border-orange-500/40 text-orange-400'
                                : 'bg-white/[0.03] border-white/[0.07] text-[#6B6B9A] hover:bg-white/[0.06] hover:text-[#F0F0FF]',
                            )}>
                            {r === 'owner' ? '👑 Owner' : '🍽 Manager'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#A0A0C0] uppercase tracking-wider">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4A4A6A]" />
                    <input
                      type="email" required value={email} onChange={e => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-[#F0F0FF] placeholder-[#3A3A5C] text-sm focus:outline-none focus:border-orange-500/50 focus:bg-white/[0.06] transition-all"
                      placeholder="you@restaurant.com"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#A0A0C0] uppercase tracking-wider">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4A4A6A]" />
                    <input
                      type={showPw ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)}
                      className="w-full pl-10 pr-11 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-[#F0F0FF] placeholder-[#3A3A5C] text-sm focus:outline-none focus:border-orange-500/50 focus:bg-white/[0.06] transition-all"
                      placeholder="••••••••" minLength={6}
                    />
                    <button type="button" onClick={() => setShowPw(s => !s)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#4A4A6A] hover:text-[#F0F0FF] transition-colors">
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button type="submit" disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3.5 mt-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-2xl font-semibold text-sm transition-all active:scale-[0.98]">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
                </button>
              </form>

              <p className="text-center text-sm text-[#6B6B9A]">
                {mode === 'login' ? (
                  <>Don't have an account?{' '}
                    <button onClick={() => { setMode('signup'); setError(null); }}
                      className="text-orange-400 hover:text-orange-300 font-semibold transition-colors">Sign up</button>
                  </>
                ) : (
                  <>Already have an account?{' '}
                    <button onClick={() => { setMode('login'); setError(null); }}
                      className="text-orange-400 hover:text-orange-300 font-semibold transition-colors">Sign in</button>
                  </>
                )}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
