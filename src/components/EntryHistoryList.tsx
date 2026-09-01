import React, { useState, useMemo } from 'react';
import { 
  JournalEntry, 
  ReflectionMode 
} from '../types';
import { 
  Search, 
  Calendar, 
  Trash2, 
  ChevronRight, 
  Sparkles, 
  BrainCircuit, 
  Target, 
  HeartHandshake, 
  Lightbulb,
  Tag,
  Filter,
  FileText,
  Clock,
  Mic
} from 'lucide-react';

interface EntryHistoryListProps {
  entries: JournalEntry[];
  selectedEntryId: string | null;
  onSelectEntry: (entry: JournalEntry) => void;
  onDeleteEntry: (entryId: string) => void;
  onNewEntry: () => void;
  isLoading?: boolean;
}

const MODE_CONFIG: Record<ReflectionMode, { label: string; icon: any; color: string; bg: string }> = {
  daily_reflection: { 
    label: 'Daily Reflection', 
    icon: Sparkles, 
    color: 'text-amber-800', 
    bg: 'bg-amber-100 border-amber-300' 
  },
  socratic_voice: {
    label: 'Socratic Voice',
    icon: Mic,
    color: 'text-indigo-800',
    bg: 'bg-indigo-100 border-indigo-300'
  },
  brainstorming: { 
    label: 'Brainstorming', 
    icon: Lightbulb, 
    color: 'text-purple-800', 
    bg: 'bg-purple-100 border-purple-300' 
  },
  problem_solving: { 
    label: 'Problem Solving', 
    icon: BrainCircuit, 
    color: 'text-sky-800', 
    bg: 'bg-sky-100 border-sky-300' 
  },
  gratitude: { 
    label: 'Gratitude & Wins', 
    icon: HeartHandshake, 
    color: 'text-emerald-800', 
    bg: 'bg-emerald-100 border-emerald-300' 
  },
  action_planning: { 
    label: 'Action Planning', 
    icon: Target, 
    color: 'text-rose-800', 
    bg: 'bg-rose-100 border-rose-300' 
  }
};

const MOOD_EMOJIS: Record<string, string> = {
  energized: '⚡ Energized',
  reflective: '💭 Reflective',
  calm: '🌿 Calm',
  challenged: '⛰️ Challenged',
  grateful: '🙏 Grateful',
  focused: '🎯 Focused'
};

export const EntryHistoryList: React.FC<EntryHistoryListProps> = ({
  entries,
  selectedEntryId,
  onSelectEntry,
  onDeleteEntry,
  onNewEntry,
  isLoading = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModeFilter, setSelectedModeFilter] = useState<string>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      // Search match
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || (
        (entry.title && entry.title.toLowerCase().includes(q)) ||
        (entry.summary && entry.summary.toLowerCase().includes(q)) ||
        (entry.tags && entry.tags.some(t => t.toLowerCase().includes(q))) ||
        (entry.messages && entry.messages.some(m => m.text.toLowerCase().includes(q)))
      );

      // Mode match
      const matchesMode = selectedModeFilter === 'all' || entry.mode === selectedModeFilter;

      return matchesSearch && matchesMode;
    });
  }, [entries, searchQuery, selectedModeFilter]);

  const handleDelete = (e: React.MouseEvent, entryId: string) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to permanently delete this journal entry from Firestore?')) {
      setDeletingId(entryId);
      onDeleteEntry(entryId);
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="h-full flex flex-col bg-white text-stone-900">
      
      {/* Top Header & Search */}
      <div className="p-4 border-b border-stone-200/80 space-y-3 bg-[#FAF8F5]">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-amber-700" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-stone-700">Journal Vault</h2>
          </div>
          <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-stone-200/80 text-stone-700 font-mono font-medium">
            {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
          </span>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
          <input
            id="search-entries-input"
            type="text"
            placeholder="Search thoughts, tags, summaries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-stone-300 rounded-xl text-stone-800 placeholder-stone-400 focus:outline-none focus:border-amber-600 transition-colors shadow-2xs"
          />
        </div>

        {/* Mode Filter Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-[11px] scrollbar-thin">
          <button
            onClick={() => setSelectedModeFilter('all')}
            className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
              selectedModeFilter === 'all'
                ? 'bg-stone-900 text-white font-semibold shadow-2xs'
                : 'bg-stone-200/70 text-stone-600 hover:text-stone-900'
            }`}
          >
            All
          </button>
          {Object.entries(MODE_CONFIG).map(([key, config]) => (
            <button
              key={key}
              onClick={() => setSelectedModeFilter(key)}
              className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
                selectedModeFilter === key
                  ? 'bg-stone-900 text-white font-semibold shadow-2xs'
                  : 'bg-stone-200/70 text-stone-600 hover:text-stone-900'
              }`}
            >
              {config.label}
            </button>
          ))}
        </div>
      </div>

      {/* Entries List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-white">
        {isLoading ? (
          <div className="p-8 text-center space-y-2">
            <div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-stone-500">Loading your private vault...</p>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-stone-100 flex items-center justify-center mx-auto text-stone-400">
              <FileText className="w-5 h-5" />
            </div>
            <p className="text-xs text-stone-500">
              {searchQuery || selectedModeFilter !== 'all'
                ? 'No matching entries found for your filter.'
                : 'No journal reflections yet.'}
            </p>
            <button
              id="empty-state-new-entry-btn"
              onClick={onNewEntry}
              className="px-3.5 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              Start First Entry
            </button>
          </div>
        ) : (
          filteredEntries.map((entry) => {
            const isSelected = selectedEntryId === entry.id;
            const modeInfo = MODE_CONFIG[entry.mode] || MODE_CONFIG.daily_reflection;
            const Icon = modeInfo.icon;

            return (
              <div
                key={entry.id}
                id={`journal-entry-card-${entry.id}`}
                onClick={() => onSelectEntry(entry)}
                className={`group relative p-3.5 rounded-2xl border transition-all cursor-pointer text-left ${
                  isSelected
                    ? 'bg-[#FAF7F2] border-amber-600/70 shadow-xs ring-1 ring-amber-500/30'
                    : 'bg-white hover:bg-stone-50/80 border-stone-200/90 hover:border-stone-300 shadow-2xs'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className={`p-1 rounded-md border ${modeInfo.bg} ${modeInfo.color}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </span>
                    <span className="text-[11px] font-semibold text-stone-600">
                      {modeInfo.label}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1">
                    <span className="text-[10px] text-stone-400 flex items-center space-x-1">
                      <Clock className="w-2.5 h-2.5" />
                      <span>{formatDate(entry.updatedAt || entry.createdAt)}</span>
                    </span>
                    
                    <button
                      id={`delete-entry-btn-${entry.id}`}
                      onClick={(e) => handleDelete(e, entry.id)}
                      disabled={deletingId === entry.id}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-rose-50 text-stone-400 hover:text-rose-600 transition-all ml-1 cursor-pointer"
                      title="Delete Entry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Entry Title */}
                <h3 className="mt-2 text-xs font-bold text-stone-900 truncate">
                  {entry.title || 'Untitled Reflection'}
                </h3>

                {/* Summary or Preview snippet */}
                <p className="mt-1 text-[11px] text-stone-600 line-clamp-2 leading-relaxed">
                  {entry.summary || (entry.messages && entry.messages[0]?.text) || 'No content yet...'}
                </p>

                {/* Mood and Tags Bar */}
                <div className="mt-2.5 pt-2 border-t border-stone-100 flex items-center justify-between text-[10px]">
                  <div className="flex items-center space-x-1.5 overflow-hidden">
                    {entry.mood && (
                      <span className="px-1.5 py-0.5 rounded-md bg-stone-100 text-stone-700 font-medium">
                        {MOOD_EMOJIS[entry.mood] || entry.mood}
                      </span>
                    )}
                    {entry.tags && entry.tags.slice(0, 2).map((t, idx) => (
                      <span key={idx} className="px-1.5 py-0.5 rounded-md bg-stone-100 text-stone-600">
                        #{t}
                      </span>
                    ))}
                  </div>

                  <span className="text-[10px] text-stone-400 font-mono">
                    {entry.messages ? `${entry.messages.length} msgs` : '0 msgs'}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Quick Trigger */}
      <div className="p-3 border-t border-stone-200/80 bg-[#FAF8F5]">
        <button
          id="sidebar-new-entry-btn"
          onClick={onNewEntry}
          className="w-full py-2.5 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-medium text-xs flex items-center justify-center space-x-2 transition-colors cursor-pointer shadow-2xs"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>New Journal Session</span>
        </button>
      </div>

    </div>
  );
};
