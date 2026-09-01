import React, { useState } from 'react';
import { 
  Sparkles, 
  ShieldCheck, 
  Lock, 
  Bot, 
  BrainCircuit, 
  ArrowRight, 
  CheckCircle2, 
  FileText,
  KeyRound,
  Zap,
  Mic,
  Brain,
  Play
} from 'lucide-react';
import { signInWithGoogle } from '../lib/firebase';

interface AuthLandingProps {
  onGuestAccess: () => void;
  onOpenSecurity: () => void;
}

export const AuthLanding: React.FC<AuthLandingProps> = ({ onGuestAccess, onOpenSecurity }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      await signInWithGoogle();
    } catch (err: any) {
      console.error('Sign in error:', err);
      setError(err.message || 'Failed to complete Google Sign-In.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F5F2ED] text-stone-900 flex flex-col justify-center px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-5xl mx-auto w-full space-y-6">
        
        {/* Top Bento Row: Main Hero Tile + Quick Stat Tile */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          
          {/* Main Hero Bento Card */}
          <div className="lg:col-span-2 p-7 sm:p-10 rounded-3xl bg-white border border-[#E5DFD5] shadow-xs flex flex-col justify-between relative overflow-hidden">
            <div className="space-y-4 z-10">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-100/80 border border-amber-300 text-amber-900 text-xs font-semibold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                <span>AI Thinking Partner & Cognitive Growth Vault</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-stone-900 leading-tight">
                Reflect deeper with <span className="text-amber-800 font-serif italic">Gemini 3.6</span> & secured by Firestore.
              </h1>

              <p className="text-sm sm:text-base text-stone-600 max-w-xl leading-relaxed">
                A private, multi-turn cognitive journaling platform with <strong>live voice stream Socratic dialogue</strong> and <strong>longitudinal growth & blindspot radar analytics</strong>.
              </p>
            </div>

            {/* Action Area */}
            <div className="pt-8 flex flex-col sm:flex-row items-center gap-3 z-10">
              {/* Google Sign-in */}
              <button
                id="google-signin-hero-btn"
                onClick={handleSignIn}
                disabled={loading}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white font-semibold text-sm flex items-center justify-center space-x-3 shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                )}
                <span>{loading ? 'Authenticating...' : 'Sign in with Google'}</span>
              </button>

              {/* Guest / Instant Preview Button */}
              <button
                id="guest-preview-btn"
                onClick={onGuestAccess}
                className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-amber-100 hover:bg-amber-200/80 border border-amber-300 text-amber-950 text-sm font-bold flex items-center justify-center space-x-2 transition-all shadow-xs cursor-pointer active:scale-95"
              >
                <Play className="w-4 h-4 fill-amber-900" />
                <span>Instant Live Preview Vault</span>
              </button>

              <button
                id="view-threat-model-btn"
                onClick={onOpenSecurity}
                className="w-full sm:w-auto px-4 py-3.5 rounded-2xl bg-stone-100 hover:bg-stone-200 border border-stone-300/80 text-stone-700 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Security Specs</span>
              </button>
            </div>

            {error && (
              <div className="mt-4 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs space-y-3 shadow-xs">
                <div className="flex items-start space-x-2">
                  <span className="font-bold shrink-0 bg-rose-200 text-rose-950 px-2 py-0.5 rounded-md">Notice</span>
                  <span className="leading-relaxed">{error}</span>
                </div>
                <div className="pt-2 border-t border-rose-200/80 flex items-center justify-between">
                  <span className="text-[11px] text-rose-700">Want to use the app right now without configuring Firebase?</span>
                  <button
                    onClick={onGuestAccess}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center space-x-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Enter Guest Vault</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Side Hero Bento Card: Zero-Trust Summary */}
          <div className="p-8 rounded-3xl bg-[#ECE7DE] border border-[#DDD6CA] shadow-2xs flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-stone-900 text-amber-400 flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-stone-900 tracking-tight">Zero-Trust Isolation</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Reflections are partitioned with owner-bound rules in Cloud Firestore. No cross-user access, no client-side secret exposure.
              </p>
            </div>

            <div className="space-y-2 pt-4 border-t border-stone-300/80">
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-600">Model Ladder</span>
                <span className="font-mono font-semibold text-stone-800">4-Tier Fallback</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-600">Security Rule</span>
                <span className="font-mono font-semibold text-emerald-700">auth.uid == userId</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-600">Microphone</span>
                <span className="font-semibold text-indigo-700">Web Speech + Audio API</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bento Row: 4 Feature Pillar Cards including Voice & Radar */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Pillar 1: Voice Stream */}
          <div className="p-6 rounded-3xl bg-indigo-50/70 border border-indigo-200 flex flex-col justify-between shadow-2xs">
            <div className="space-y-2.5">
              <div className="w-10 h-10 rounded-2xl bg-indigo-100 border border-indigo-300 flex items-center justify-center text-indigo-800">
                <Mic className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-indigo-950">Voice Stream & Socratic Audio</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Speak your raw stream of consciousness. Gemini analyzes your speech, challenges assumptions via TTS, and auto-generates takeaways.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-indigo-200 flex items-center space-x-1.5 text-[11px] text-indigo-800 font-semibold">
              <Zap className="w-3.5 h-3.5 text-indigo-600" />
              <span>Real-Time Waveforms + TTS</span>
            </div>
          </div>

          {/* Pillar 2: Cognitive Radar */}
          <div className="p-6 rounded-3xl bg-amber-50/70 border border-amber-200 flex flex-col justify-between shadow-2xs">
            <div className="space-y-2.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800">
                <Brain className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-amber-950">Cognitive Blindspot Radar</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Longitudinal meta-analysis mapping 6-dimension cognitive scores, mood trajectories, and recurring mental model blindspots.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-amber-200 flex items-center space-x-1.5 text-[11px] text-amber-800 font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Recharts Radar & Trends</span>
            </div>
          </div>

          {/* Pillar 3: Multi-turn loops */}
          <div className="p-6 rounded-3xl bg-white border border-[#E5DFD5] flex flex-col justify-between shadow-2xs">
            <div className="space-y-2.5">
              <div className="w-10 h-10 rounded-2xl bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-800">
                <BrainCircuit className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-stone-900">Multi-Turn Thinking Loops</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Deep multi-turn reflection across daily check-ins, root cause deconstruction, lateral brainstorming, and action planning.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-stone-200 flex items-center space-x-1.5 text-[11px] text-stone-700 font-semibold">
              <Zap className="w-3.5 h-3.5" />
              <span>Gemini 3.6 Flash</span>
            </div>
          </div>

          {/* Pillar 4: Owner-bound Firestore */}
          <div className="p-6 rounded-3xl bg-white border border-[#E5DFD5] flex flex-col justify-between shadow-2xs">
            <div className="space-y-2.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-800">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-stone-900">Owner-Bound Firestore</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Every reflection, transcript, and summary is partitioned strictly under <code className="text-stone-800 font-mono">/users/&#123;uid&#125;</code>.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-stone-200 flex items-center space-x-1.5 text-[11px] text-emerald-800 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Zero Cross-User Leaks</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

