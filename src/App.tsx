import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { onAuthChange, logOut } from './lib/firebase';
import { Navbar } from './components/Navbar';
import { AuthLanding } from './components/AuthLanding';
import { Dashboard } from './components/Dashboard';
import { ThreatModelModal } from './components/ThreatModelModal';

// Sample guest user structure for instant preview without popup requirement
const GUEST_PREVIEW_USER: Partial<User> = {
  uid: 'guest_explorer_vault',
  displayName: 'Explorer Guest',
  email: 'guest@reflectai.internal',
  photoURL: undefined
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'workspace' | 'radar'>('workspace');

  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      if (user) {
        setCurrentUser(user);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await logOut();
      setCurrentUser(null);
    } catch (err) {
      console.error('Logout error:', err);
      setCurrentUser(null);
    }
  };

  const handleGuestAccess = () => {
    setCurrentUser(GUEST_PREVIEW_USER as User);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F5F2ED] flex flex-col items-center justify-center text-stone-800 space-y-4 font-sans">
        <div className="w-10 h-10 border-3 border-amber-600 border-t-transparent rounded-full animate-spin shadow-md" />
        <p className="text-xs tracking-wider uppercase font-semibold text-stone-500">
          Initializing Secure Session...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F2ED] text-stone-900 flex flex-col font-sans selection:bg-amber-200 selection:text-amber-900">
      
      {/* Top Navigation */}
      <Navbar
        user={currentUser}
        activeTab={activeTab}
        onChangeTab={(tab) => setActiveTab(tab)}
        onSignOut={handleSignOut}
        onNewEntry={() => {
          setActiveTab('workspace');
          const event = new CustomEvent('refletai-new-entry');
          window.dispatchEvent(event);
        }}
        onOpenSecurity={() => setIsSecurityModalOpen(true)}
      />

      {/* Main View Router */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {!currentUser ? (
          <AuthLanding 
            onGuestAccess={handleGuestAccess} 
            onOpenSecurity={() => setIsSecurityModalOpen(true)} 
          />
        ) : (
          <Dashboard
            user={currentUser}
            activeTab={activeTab}
            onChangeTab={(tab) => setActiveTab(tab)}
            onOpenSecurity={() => setIsSecurityModalOpen(true)}
          />
        )}
      </main>

      {/* Security Threat Model Modal */}
      <ThreatModelModal
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
      />

    </div>
  );
}

