import React from 'react';
import { User } from 'firebase/auth';
import { 
  Sparkles, 
  LogOut, 
  ShieldCheck, 
  Plus, 
  BookOpen, 
  Brain,
  User as UserIcon,
  Database,
  Mic
} from 'lucide-react';

interface NavbarProps {
  user: User | null;
  activeTab?: 'workspace' | 'radar';
  onChangeTab?: (tab: 'workspace' | 'radar') => void;
  onSignOut: () => void;
  onNewEntry: () => void;
  onOpenSecurity: () => void;
  isSaving?: boolean;
  saveError?: string | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  activeTab = 'workspace',
  onChangeTab,
  onSignOut,
  onNewEntry,
  onOpenSecurity,
  isSaving = false,
  saveError = null
}) => {
  return (
    <header className="sticky top-0 z-30 bg-[#F5F2ED]/95 backdrop-blur-md border-b border-[#E5DFD5] text-stone-900 shadow-2xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
        
        {/* Left: Brand */}
        <div className="flex items-center space-x-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-stone-900 text-amber-400 flex items-center justify-center shadow-xs">
            <Sparkles className="w-4 h-4 font-bold" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <span className="font-bold text-base sm:text-lg tracking-tight text-stone-900">ReflectAI</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 sm:px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                Gemini 3.6
              </span>
            </div>
            <p className="text-[11px] text-stone-500 hidden md:block">Voice Stream & Cognitive Growth Radar</p>
          </div>
        </div>

        {/* Center: Prominent Navigation Tabs (when user logged in or in demo mode) */}
        {user && onChangeTab && (
          <div className="flex items-center bg-stone-200/80 p-1 rounded-2xl border border-stone-300/80 shadow-2xs text-xs">
            <button
              id="nav-tab-workspace-btn"
              onClick={() => onChangeTab('workspace')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                activeTab === 'workspace'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-stone-800" />
              <span className="hidden xs:inline">Journal & Voice</span>
              <span className="xs:hidden">Journal</span>
            </button>

            <button
              id="nav-tab-radar-btn"
              onClick={() => onChangeTab('radar')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                activeTab === 'radar'
                  ? 'bg-amber-800 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Brain className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden xs:inline">Growth Radar</span>
              <span className="xs:hidden">Radar</span>
            </button>
          </div>
        )}

        {/* Right: Actions and User Profile */}
        <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
          {/* Threat Model / Security Inspector */}
          <button
            id="security-modal-btn"
            onClick={onOpenSecurity}
            className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-white hover:bg-stone-50 border border-stone-200 text-xs font-semibold text-stone-700 transition-colors shadow-2xs cursor-pointer"
            title="View Security Threat Model & Isolation Specs"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Threat Model</span>
          </button>

          {user ? (
            <>
              {/* New Entry Button */}
              <button
                id="navbar-new-entry-btn"
                onClick={onNewEntry}
                className="flex items-center space-x-1 sm:space-x-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-medium text-xs sm:text-sm transition-all shadow-xs active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span className="hidden sm:inline">New Reflection</span>
              </button>

              {/* User Avatar & Logout */}
              <div className="flex items-center space-x-1.5 sm:space-x-2 pl-1 sm:pl-2 border-l border-stone-300">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-stone-300 object-cover shadow-2xs"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-stone-200 border border-stone-300 flex items-center justify-center text-xs font-semibold text-stone-700">
                    {user.email ? user.email.charAt(0).toUpperCase() : <UserIcon className="w-3.5 h-3.5" />}
                  </div>
                )}
                
                <button
                  id="signout-button"
                  onClick={onSignOut}
                  className="p-1 sm:p-1.5 rounded-lg hover:bg-stone-200 text-stone-500 hover:text-rose-600 transition-colors cursor-pointer"
                  title="Sign Out / Exit Demo"
                >
                  <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
};

