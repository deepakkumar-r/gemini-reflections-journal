import React, { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import { JournalEntry, ReflectionMode } from '../types';
import { 
  subscribeToUserEntries, 
  saveJournalEntry, 
  deleteJournalEntry, 
  logUserInteraction,
  sanitizeForFirestore 
} from '../lib/firebase';
import { EntryHistoryList } from './EntryHistoryList';
import { ReflectionEditor } from './ReflectionEditor';
import { CognitiveRadarView } from './CognitiveRadarView';
import { 
  PanelLeftClose, 
  PanelLeftOpen, 
  AlertTriangle, 
  RefreshCw,
  Sparkles,
  Brain,
  BookOpen
} from 'lucide-react';

interface DashboardProps {
  user: User;
  activeTab?: 'workspace' | 'radar';
  onChangeTab?: (tab: 'workspace' | 'radar') => void;
  onOpenSecurity: () => void;
}

const SAMPLE_GUEST_ENTRIES: JournalEntry[] = [
  {
    id: 'guest-entry-1',
    userId: 'guest_explorer_vault',
    title: 'Product Architecture & Technical Debt Decisions',
    mode: 'problem_solving',
    initialPrompt: 'Balancing quick prototype launches with long-term zero-trust architecture security',
    messages: [
      {
        id: 'msg-1',
        role: 'user',
        text: 'I feel pressured to deliver features rapidly, but I worry we are bypassing proper threat modeling and authorization boundary checks. How do I balance speed and robustness?',
        timestamp: Date.now() - 86400000 * 2,
        isSpokenVoice: false
      },
      {
        id: 'msg-2',
        role: 'assistant',
        text: 'What underlying assumption leads you to treat velocity and architectural security as mutually exclusive rather than interdependent constraints? What would happen if security boundaries became your velocity enabler?',
        timestamp: Date.now() - 86400000 * 2 + 10000,
        model: 'gemini-3.6-flash'
      }
    ],
    summary: 'Explored tension between shipping velocity and architectural security. Identified cognitive bias treating speed and defense-in-depth as zero-sum rather than synergistic.',
    takeaways: [
      'Define non-negotiable security guardrails (e.g. owner-bound Firestore rules)',
      'Automate verification steps so secure paths are the path of least resistance',
      'Frame security as velocity assurance for scalable deployment'
    ],
    mood: 'reflective',
    tags: ['architecture', 'security', 'velocity', 'decision-making'],
    createdAt: Date.now() - 86400000 * 2,
    updatedAt: Date.now() - 86400000 * 2
  },
  {
    id: 'guest-entry-2',
    userId: 'guest_explorer_vault',
    title: 'Strategic Priorities for Next Quarter',
    mode: 'daily_reflection',
    initialPrompt: 'Reflecting on team focus, high-leverage outcomes, and boundary setting',
    messages: [
      {
        id: 'msg-3',
        role: 'user',
        text: 'Recorded via voice stream: I noticed I am saying yes to too many ad-hoc requests, diluting focus on our core machine learning pipeline.',
        timestamp: Date.now() - 86400000,
        isSpokenVoice: true
      },
      {
        id: 'msg-4',
        role: 'assistant',
        text: 'If you could only accomplish ONE single outcome next quarter that would make all other efforts secondary or effortless, which specific lever would that be? What fear makes saying no difficult right now?',
        timestamp: Date.now() - 86400000 + 15000,
        model: 'gemini-3.6-flash'
      }
    ],
    summary: 'Addressed attention fragmentation and boundary enforcement. Synthesized essential priorities for high-leverage impact.',
    takeaways: [
      'Establish a weekly triage filter for incoming ad-hoc tasks',
      'Protect 3-hour morning deep work blocks for machine learning modeling',
      'Practice explicit, compassionate boundary setting with cross-functional peers'
    ],
    mood: 'focused',
    tags: ['strategy', 'focus', 'leadership', 'voice-stream'],
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now() - 86400000
  },
  {
    id: 'guest-entry-3',
    userId: 'guest_explorer_vault',
    title: 'Gratitude & Creative Breakthroughs in Design',
    mode: 'gratitude',
    initialPrompt: 'Celebrating cross-functional harmony and breakthrough user interfaces',
    messages: [
      {
        id: 'msg-5',
        role: 'user',
        text: 'Grateful for our team solving the real-time audio waveform and radar visualization challenges today without friction.',
        timestamp: Date.now() - 3600000 * 4,
        isSpokenVoice: false
      },
      {
        id: 'msg-6',
        role: 'assistant',
        text: 'What specific creative or communicative behaviors made today\'s breakthrough effortless? How can you cultivate those conditions systematically?',
        timestamp: Date.now() - 3600000 * 4 + 8000,
        model: 'gemini-3.6-flash'
      }
    ],
    summary: 'Recognized conditions that foster psychological safety, rapid prototyping, and high-quality UI craftsmanship.',
    takeaways: [
      'Document collaborative sprint rituals that worked well',
      'Express explicit recognition to engineering partners',
      'Keep aesthetic standards paired with strict architectural bounds'
    ],
    mood: 'calm',
    tags: ['gratitude', 'craftsmanship', 'teamwork', 'creativity'],
    createdAt: Date.now() - 3600000 * 4,
    updatedAt: Date.now() - 3600000 * 4
  }
];

function createDefaultEntry(userId: string): JournalEntry {
  return {
    id: `entry-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    userId,
    title: 'Untitled Reflection',
    mode: 'daily_reflection',
    initialPrompt: '',
    messages: [],
    tags: ['reflection'],
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  user, 
  activeTab: controlledTab, 
  onChangeTab,
  onOpenSecurity 
}) => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [activeEntry, setActiveEntry] = useState<JournalEntry>(() => createDefaultEntry(user.uid));
  const [isLoadingEntries, setIsLoadingEntries] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [localTab, setLocalTab] = useState<'workspace' | 'radar'>('workspace');

  const activeTab = controlledTab ?? localTab;
  const setActiveTab = (tab: 'workspace' | 'radar') => {
    setLocalTab(tab);
    if (onChangeTab) onChangeTab(tab);
  };

  // Subscribe to user entries from Firestore in real-time or load guest demo
  useEffect(() => {
    if (!user.uid) return;

    if (user.uid === 'guest_explorer_vault') {
      // Preload rich sample entries for instant preview
      setEntries(SAMPLE_GUEST_ENTRIES);
      setSelectedEntryId(SAMPLE_GUEST_ENTRIES[0].id);
      setActiveEntry(SAMPLE_GUEST_ENTRIES[0]);
      setIsLoadingEntries(false);
      return;
    }

    setIsLoadingEntries(true);
    const unsubscribe = subscribeToUserEntries(
      user.uid,
      (fetchedEntries) => {
        setEntries(fetchedEntries);
        setIsLoadingEntries(false);
        setSaveError(null);

        // If no active entry selected, select the latest or keep fresh
        if (fetchedEntries.length > 0 && !selectedEntryId) {
          setSelectedEntryId(fetchedEntries[0].id);
          setActiveEntry(fetchedEntries[0]);
        }
      },
      (err) => {
        console.error('Subscription error:', err);
        setSaveError('Failed to synchronize with Cloud Firestore. Please check your network.');
        setIsLoadingEntries(false);
      }
    );

    return () => unsubscribe();
  }, [user.uid]);


  // Handle manual or automatic Firestore Save
  const handleSaveToFirestore = useCallback(async (entryToSave: JournalEntry) => {
    if (!user.uid) return;
    setIsSaving(true);
    setSaveError(null);

    try {
      await saveJournalEntry(user.uid, entryToSave);
      
      // Also log interaction record if messages exist
      const lastMsg = entryToSave.messages?.[entryToSave.messages.length - 1];
      if (lastMsg && lastMsg.role === 'assistant') {
        const userPrompt = entryToSave.messages[entryToSave.messages.length - 2]?.text || '';
        await logUserInteraction(user.uid, {
          id: `interact-${Date.now()}`,
          userId: user.uid,
          entryId: entryToSave.id,
          prompt: userPrompt,
          response: lastMsg.text,
          mode: entryToSave.mode,
          modelUsed: lastMsg.model || 'gemini-3.6-flash',
          timestamp: Date.now()
        });
      }
    } catch (err: any) {
      console.error('Firestore save failed:', err);
      setSaveError(err.message || 'Failed to save entry to Firestore.');
    } finally {
      setIsSaving(false);
    }
  }, [user.uid]);

  // Update active entry state in memory and optionally trigger debounce save
  const handleUpdateEntry = (updated: JournalEntry) => {
    setActiveEntry(updated);
    
    // Update in local entries list for immediate responsive UI
    setEntries(prev => {
      const idx = prev.findIndex(e => e.id === updated.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = updated;
        return copy;
      }
      return [updated, ...prev];
    });
  };

  // Start a new blank journal reflection
  const handleNewEntry = useCallback(() => {
    const fresh = createDefaultEntry(user.uid);
    setActiveEntry(fresh);
    setSelectedEntryId(fresh.id);
    setActiveTab('workspace');
    // On mobile, close sidebar when creating new
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  }, [user.uid]);

  // Start reflection from a coaching prompt in the Radar view
  const handleStartReflectionWithPrompt = (promptText: string, title?: string) => {
    const fresh: JournalEntry = {
      ...createDefaultEntry(user.uid),
      title: title || 'Coaching Inquiry Reflection',
      messages: [
        {
          id: `msg-ai-starter-${Date.now()}`,
          role: 'assistant',
          text: `**Socratic Inquiry:** ${promptText}\n\nTake a moment to explore your thoughts honestly. What comes to surface?`,
          timestamp: Date.now(),
          model: 'gemini-3.6-flash'
        }
      ]
    };
    setActiveEntry(fresh);
    setSelectedEntryId(fresh.id);
    setActiveTab('workspace');
    handleSaveToFirestore(fresh);
  };

  // Listen to navbar new entry trigger
  useEffect(() => {
    const handleNewEntryEvent = () => {
      handleNewEntry();
    };
    window.addEventListener('refletai-new-entry', handleNewEntryEvent);
    return () => window.removeEventListener('refletai-new-entry', handleNewEntryEvent);
  }, [handleNewEntry]);

  // Select an existing entry from history list
  const handleSelectEntry = (entry: JournalEntry) => {
    setSelectedEntryId(entry.id);
    setActiveEntry(entry);
    setActiveTab('workspace');
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  // Delete an entry from Firestore
  const handleDeleteEntry = async (entryId: string) => {
    try {
      await deleteJournalEntry(user.uid, entryId);
      if (activeEntry.id === entryId) {
        const remaining = entries.filter(e => e.id !== entryId);
        if (remaining.length > 0) {
          setSelectedEntryId(remaining[0].id);
          setActiveEntry(remaining[0]);
        } else {
          handleNewEntry();
        }
      }
    } catch (err: any) {
      console.error('Failed to delete entry:', err);
      setSaveError(err.message || 'Failed to delete entry.');
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-[#F5F2ED] text-stone-900 overflow-hidden p-3 sm:p-4 md:p-6 gap-3">
      
      {/* Save Error Alert Banner with Retry */}
      {saveError && (
        <div className="bg-rose-50 border border-rose-200 px-4 py-2.5 rounded-2xl text-xs text-rose-800 flex items-center justify-between z-20 shadow-2xs">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{saveError}</span>
          </div>
          <button
            onClick={() => handleSaveToFirestore(activeEntry)}
            className="flex items-center space-x-1 px-3 py-1 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-900 font-semibold text-xs transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Retry Sync</span>
          </button>
        </div>
      )}

      {/* Main Bento Workspace Layout */}
      <div className="flex-1 flex overflow-hidden relative gap-4">
        
        {/* Left Sidebar (History & Vault Bento Tile) */}
        <div
          className={`
            fixed md:relative inset-y-0 left-0 z-30
            w-80 md:w-80 lg:w-88 shrink-0
            transform transition-transform duration-200 ease-in-out
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:-translate-x-full md:hidden'}
          `}
        >
          <div className="h-full bg-white rounded-3xl border border-[#E5DFD5] shadow-xs overflow-hidden flex flex-col">
            
            {/* Top Workspace / Analytics Tab Switcher in Sidebar */}
            <div className="p-3 border-b border-stone-200/80 bg-[#FAF8F5] grid grid-cols-2 gap-1.5 text-xs">
              <button
                id="tab-btn-workspace"
                onClick={() => setActiveTab('workspace')}
                className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                  activeTab === 'workspace'
                    ? 'bg-stone-900 text-white shadow-2xs'
                    : 'bg-white hover:bg-stone-100 text-stone-600 border border-stone-200'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Journal</span>
              </button>

              <button
                id="tab-btn-radar"
                onClick={() => setActiveTab('radar')}
                className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                  activeTab === 'radar'
                    ? 'bg-amber-800 text-white shadow-2xs'
                    : 'bg-white hover:bg-stone-100 text-stone-600 border border-stone-200'
                }`}
              >
                <Brain className="w-3.5 h-3.5 text-amber-500" />
                <span>Growth Radar</span>
              </button>
            </div>

            <div className="flex-1 overflow-hidden">
              <EntryHistoryList
                entries={entries}
                selectedEntryId={selectedEntryId}
                onSelectEntry={handleSelectEntry}
                onDeleteEntry={handleDeleteEntry}
                onNewEntry={handleNewEntry}
                isLoading={isLoadingEntries}
              />
            </div>
          </div>
        </div>

        {/* Mobile Backdrop for sidebar */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="md:hidden fixed inset-0 bg-stone-900/40 z-20 backdrop-blur-2xs"
          />
        )}

        {/* Central Reflection Editor / Analytics Radar Bento Tile */}
        <div className="flex-1 flex flex-col min-w-0 relative overflow-hidden">
          {/* Toggle Sidebar Button */}
          <button
            id="toggle-sidebar-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="absolute top-4 left-4 z-20 p-2 rounded-xl bg-stone-100/90 hover:bg-stone-200 border border-stone-200 text-stone-600 hover:text-stone-900 transition-colors shadow-2xs cursor-pointer"
            title={sidebarOpen ? 'Collapse Vault Sidebar' : 'Expand Vault Sidebar'}
          >
            {sidebarOpen ? (
              <PanelLeftClose className="w-4 h-4" />
            ) : (
              <PanelLeftOpen className="w-4 h-4" />
            )}
          </button>

          <div className="flex-1 overflow-hidden pt-12 md:pt-0">
            {activeTab === 'workspace' ? (
              <div className="h-full bg-white rounded-3xl border border-[#E5DFD5] shadow-xs overflow-hidden">
                <ReflectionEditor
                  userId={user.uid}
                  entry={activeEntry}
                  onUpdateEntry={handleUpdateEntry}
                  onSaveToFirestore={handleSaveToFirestore}
                  isSaving={isSaving}
                  saveError={saveError}
                />
              </div>
            ) : (
              <div className="h-full overflow-hidden">
                <CognitiveRadarView
                  entries={entries}
                  onStartReflectionWithPrompt={handleStartReflectionWithPrompt}
                />
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

