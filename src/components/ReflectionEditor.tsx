import React, { useState, useRef, useEffect } from 'react';
import { 
  JournalEntry, 
  ReflectionMode, 
  ChatMessage, 
  InteractionRecord 
} from '../types';
import { 
  Send, 
  Sparkles, 
  BrainCircuit, 
  Lightbulb, 
  HeartHandshake, 
  Target, 
  Copy, 
  Check, 
  Download, 
  RefreshCw, 
  AlertCircle,
  Tag as TagIcon,
  Smile,
  FileText,
  ListCheck,
  CheckCircle,
  ChevronDown,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Radio,
  Square,
  Waves,
  Zap
} from 'lucide-react';

interface ReflectionEditorProps {
  userId: string;
  entry: JournalEntry;
  onUpdateEntry: (updated: JournalEntry) => void;
  onSaveToFirestore: (entry: JournalEntry) => Promise<void>;
  isSaving: boolean;
  saveError: string | null;
}

const PROMPT_STARTERS: Record<ReflectionMode, string[]> = {
  daily_reflection: [
    'What gave me the most energy today, and what drained my focus?',
    'What was an assumption I held today that proved incorrect?',
    'How did I react to unexpected friction today, and what can I learn?'
  ],
  socratic_voice: [
    'Speak your raw stream of consciousness about a current dilemma...',
    'What is an unspoken doubt you have been carrying this week?',
    'If your current strategy fails in 6 months, what was the blind spot?'
  ],
  brainstorming: [
    'Brainstorm 5 unorthodox strategies to achieve my current milestone.',
    'If I had 10x fewer resources, how would I still accomplish this?',
    'What adjacent industries have solved a similar challenge?'
  ],
  problem_solving: [
    'Deconstruct the core bottlenecks in my current workflow.',
    'What are the 2nd and 3rd order consequences of this decision?',
    'What is the single root cause if I apply the 5 Whys technique?'
  ],
  gratitude: [
    'What are three quiet, overlooked things that went right today?',
    'Who supported me or made a task easier recently, and how?',
    'What obstacle did I successfully navigate this week?'
  ],
  action_planning: [
    'Break down my top objective into 3 actionable 30-minute steps.',
    'What is the single highest leverage task I should complete tomorrow morning?',
    'What risks could derail execution and how will I mitigate them?'
  ]
};

const MOODS = [
  { id: 'energized', label: '⚡ Energized' },
  { id: 'reflective', label: '💭 Reflective' },
  { id: 'calm', label: '🌿 Calm' },
  { id: 'challenged', label: '⛰️ Challenged' },
  { id: 'grateful', label: '🙏 Grateful' },
  { id: 'focused', label: '🎯 Focused' }
] as const;

export const ReflectionEditor: React.FC<ReflectionEditorProps> = ({
  userId,
  entry,
  onUpdateEntry,
  onSaveToFirestore,
  isSaving,
  saveError
}) => {
  const [inputText, setInputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [newTagInput, setNewTagInput] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);

  // Voice stream recording state
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [activeSpeechMessageId, setActiveSpeechMessageId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);
  const timerIntervalRef = useRef<any>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entry.messages, isGenerating, isRecordingVoice]);

  // Adjust textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [inputText]);

  // Stop TTS speech on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      stopVoiceRecording(false);
    };
  }, []);

  // Voice recording & waveform canvas logic
  const startVoiceRecording = async () => {
    setGenerationError(null);
    setVoiceTranscript('');
    setRecordingSeconds(0);

    // Cancel any active TTS speech
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setActiveSpeechMessageId(null);
    }

    try {
      // 1. Setup Audio Stream for Live Waveform Visualizer
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 128;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      // Start canvas waveform loop
      drawWaveform();

      // 2. Setup SpeechRecognition (Web Speech API)
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let currentTranscript = '';
          for (let i = 0; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript;
          }
          setVoiceTranscript(currentTranscript);
        };

        recognition.onerror = (event: any) => {
          console.warn('SpeechRecognition error:', event.error);
        };

        recognition.start();
        recognitionRef.current = recognition;
      }

      setIsRecordingVoice(true);

      // Timer
      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);

    } catch (err: any) {
      console.error('Microphone access error:', err);
      setGenerationError(err.message || 'Microphone access denied. Please verify browser permissions.');
    }
  };

  const drawWaveform = () => {
    if (!canvasRef.current || !analyserRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      animationFrameRef.current = requestAnimationFrame(render);
      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.2;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * (canvas.height * 0.9);
        
        // Gradient styling matching our warm palette
        ctx.fillStyle = `rgb(${217 + Math.floor(i * 0.5)}, ${119 - Math.floor(i * 0.5)}, 6)`;
        ctx.beginPath();
        ctx.roundRect(x, (canvas.height - barHeight) / 2, barWidth - 2, barHeight, 4);
        ctx.fill();

        x += barWidth + 1;
      }
    };

    render();
  };

  const stopVoiceRecording = (submit: boolean = true) => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
      recognitionRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }

    setIsRecordingVoice(false);

    if (submit && voiceTranscript.trim()) {
      handleSendMessage(voiceTranscript.trim(), true);
    }
  };

  // Text-To-Speech (TTS) for Gemini's voice responses
  const toggleTTS = (message: ChatMessage) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported in this browser.');
      return;
    }

    if (activeSpeechMessageId === message.id) {
      window.speechSynthesis.cancel();
      setActiveSpeechMessageId(null);
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(message.text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.lang = 'en-US';

    utterance.onend = () => {
      setActiveSpeechMessageId(null);
    };

    utterance.onerror = () => {
      setActiveSpeechMessageId(null);
    };

    setActiveSpeechMessageId(message.id);
    window.speechSynthesis.speak(utterance);
  };

  const handleTitleChange = (newTitle: string) => {
    const updated: JournalEntry = {
      ...entry,
      title: newTitle,
      updatedAt: Date.now()
    };
    onUpdateEntry(updated);
  };

  const handleModeChange = (mode: ReflectionMode) => {
    const updated: JournalEntry = {
      ...entry,
      mode,
      updatedAt: Date.now()
    };
    onUpdateEntry(updated);
  };

  const handleMoodSelect = (mood: any) => {
    const updated: JournalEntry = {
      ...entry,
      mood: entry.mood === mood ? undefined : mood,
      updatedAt: Date.now()
    };
    onUpdateEntry(updated);
  };

  const handleAddTag = () => {
    const tag = newTagInput.trim().toLowerCase().replace(/^#/, '');
    if (tag && !entry.tags.includes(tag)) {
      const updated: JournalEntry = {
        ...entry,
        tags: [...entry.tags, tag],
        updatedAt: Date.now()
      };
      onUpdateEntry(updated);
    }
    setNewTagInput('');
    setShowTagInput(false);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const updated: JournalEntry = {
      ...entry,
      tags: entry.tags.filter(t => t !== tagToRemove),
      updatedAt: Date.now()
    };
    onUpdateEntry(updated);
  };

  // Send message to Gemini and update Firestore
  const handleSendMessage = async (textToSend?: string, isSpoken: boolean = false) => {
    const prompt = (textToSend || inputText).trim();
    if (!prompt || isGenerating) return;

    setGenerationError(null);
    setInputText('');

    const userMessage: ChatMessage = {
      id: `msg-user-${Date.now()}`,
      role: 'user',
      text: prompt,
      timestamp: Date.now(),
      isSpokenVoice: isSpoken
    };

    const currentMessages = [...(entry.messages || []), userMessage];
    
    // Auto-set title if it's default or empty
    let newTitle = entry.title;
    if (!newTitle || newTitle === 'Untitled Reflection') {
      newTitle = prompt.length > 40 ? `${prompt.slice(0, 40)}...` : prompt;
    }

    const optimisticEntry: JournalEntry = {
      ...entry,
      title: newTitle,
      mode: isSpoken ? 'socratic_voice' : entry.mode,
      messages: currentMessages,
      updatedAt: Date.now()
    };

    onUpdateEntry(optimisticEntry);
    setIsGenerating(true);

    try {
      const res = await fetch('/api/gemini/reflect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: optimisticEntry.mode,
          messages: currentMessages.map(m => ({
            role: m.role,
            content: m.text
          }))
        })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP ${res.status}: Failed to get reflection response.`);
      }

      const data = await res.json();
      
      const assistantMessage: ChatMessage = {
        id: `msg-ai-${Date.now()}`,
        role: 'assistant',
        text: data.text,
        model: data.modelUsed,
        timestamp: Date.now(),
        isSpokenVoice: isSpoken
      };

      const finalMessages = [...currentMessages, assistantMessage];
      const finalEntry: JournalEntry = {
        ...optimisticEntry,
        messages: finalMessages,
        updatedAt: Date.now()
      };

      onUpdateEntry(finalEntry);
      await onSaveToFirestore(finalEntry);

      // Auto-trigger TTS if user reflected via voice stream
      if (isSpoken) {
        toggleTTS(assistantMessage);
      }

    } catch (err: any) {
      console.error('Generation error:', err);
      setGenerationError(err.message || 'Failed to generate AI reflection.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate structured summary & takeaways
  const handleGenerateSummary = async () => {
    if (!entry.messages || entry.messages.length === 0 || isSummarizing) return;

    setIsSummarizing(true);
    setGenerationError(null);

    try {
      const res = await fetch('/api/gemini/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: entry.title,
          mode: entry.mode,
          messages: entry.messages.map(m => ({
            role: m.role,
            content: m.text
          }))
        })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to synthesize summary.');
      }

      const data = await res.json();

      const combinedTags = Array.from(
        new Set([...(entry.tags || []), ...(data.suggestedTags || [])])
      );

      const updatedEntry: JournalEntry = {
        ...entry,
        summary: data.summary || entry.summary,
        takeaways: data.takeaways || entry.takeaways,
        tags: combinedTags,
        mood: data.mood || entry.mood,
        updatedAt: Date.now()
      };

      onUpdateEntry(updatedEntry);
      await onSaveToFirestore(updatedEntry);

    } catch (err: any) {
      console.error('Summary error:', err);
      setGenerationError(err.message || 'Failed to generate summary.');
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const handleExportMarkdown = () => {
    let md = `# ${entry.title || 'Journal Reflection'}\n\n`;
    md += `**Date:** ${new Date(entry.createdAt).toLocaleString()}\n`;
    md += `**Mode:** ${entry.mode}\n`;
    if (entry.mood) md += `**Mood:** ${entry.mood}\n`;
    if (entry.tags?.length) md += `**Tags:** ${entry.tags.map(t => `#${t}`).join(', ')}\n`;
    md += `\n---\n\n`;

    if (entry.summary) {
      md += `## 📋 Executive Summary\n${entry.summary}\n\n`;
    }

    if (entry.takeaways?.length) {
      md += `## 🎯 Actionable Takeaways\n`;
      entry.takeaways.forEach(t => {
        md += `- [ ] ${t}\n`;
      });
      md += `\n`;
    }

    md += `## 💬 Reflection Dialogue\n\n`;
    (entry.messages || []).forEach(m => {
      md += `### ${m.role === 'assistant' ? 'Gemini (' + (m.model || 'Flash') + ')' : 'User'}\n`;
      md += `${m.text}\n\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(entry.title || 'reflection').toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-full flex flex-col bg-white text-stone-900 overflow-hidden">
      
      {/* Top Header Workspace Controls */}
      <div className="p-4 sm:p-5 border-b border-stone-200/80 bg-[#FAF8F5] space-y-4">
        
        {/* Title & Top Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <input
            id="journal-title-input"
            type="text"
            value={entry.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Name your reflection session..."
            className="text-lg sm:text-xl font-bold bg-transparent border-none text-stone-900 focus:outline-none placeholder-stone-400 w-full tracking-tight"
          />

          <div className="flex items-center space-x-2 shrink-0">
            {/* Auto-Summary Trigger */}
            <button
              id="generate-summary-btn"
              onClick={handleGenerateSummary}
              disabled={isSummarizing || !entry.messages || entry.messages.length === 0}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200/80 border border-amber-300 text-amber-900 text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-2xs"
              title="Synthesize conversation into key takeaways and summary"
            >
              {isSummarizing ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-800" />
              ) : (
                <ListCheck className="w-3.5 h-3.5 text-amber-800" />
              )}
              <span>{isSummarizing ? 'Synthesizing...' : 'Generate Summary'}</span>
            </button>

            {/* Export Markdown */}
            <button
              id="export-markdown-btn"
              onClick={handleExportMarkdown}
              className="p-2 rounded-xl bg-white hover:bg-stone-100 text-stone-700 text-xs transition-colors border border-stone-300 shadow-2xs cursor-pointer"
              title="Export entry to Markdown"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mode Selector & Mood Bar */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {/* Reflection Mode Pill */}
          <div className="flex items-center space-x-1 bg-white p-1 rounded-2xl border border-stone-200 text-xs shadow-2xs overflow-x-auto">
            <span className="text-[11px] font-bold text-stone-500 px-2 uppercase tracking-wider">Mode:</span>
            {(['daily_reflection', 'socratic_voice', 'brainstorming', 'problem_solving', 'gratitude', 'action_planning'] as ReflectionMode[]).map((mode) => (
              <button
                key={mode}
                id={`mode-btn-${mode}`}
                onClick={() => handleModeChange(mode)}
                className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center space-x-1 ${
                  entry.mode === mode
                    ? 'bg-stone-900 text-white shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {mode === 'socratic_voice' && <Mic className="w-3 h-3 text-indigo-400 mr-0.5" />}
                <span>
                  {mode === 'daily_reflection' && 'Daily'}
                  {mode === 'socratic_voice' && 'Socratic Voice'}
                  {mode === 'brainstorming' && 'Brainstorm'}
                  {mode === 'problem_solving' && 'Problem Solving'}
                  {mode === 'gratitude' && 'Gratitude'}
                  {mode === 'action_planning' && 'Action'}
                </span>
              </button>
            ))}
          </div>

          {/* Mood Pills */}
          <div className="flex items-center space-x-1 bg-white p-1 rounded-2xl border border-stone-200 text-xs overflow-x-auto shadow-2xs">
            {MOODS.map((m) => (
              <button
                key={m.id}
                onClick={() => handleMoodSelect(m.id)}
                className={`px-2.5 py-1 rounded-xl text-xs transition-colors whitespace-nowrap cursor-pointer ${
                  entry.mood === m.id
                    ? 'bg-amber-100 border border-amber-300 text-amber-900 font-bold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tags Bar */}
        <div className="flex items-center space-x-2 text-xs flex-wrap">
          <TagIcon className="w-3.5 h-3.5 text-stone-400 shrink-0" />
          {entry.tags && entry.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-lg bg-stone-100 text-stone-700 border border-stone-200"
            >
              <span>#{tag}</span>
              <button
                onClick={() => handleRemoveTag(tag)}
                className="hover:text-rose-600 text-stone-400 font-bold text-[11px] cursor-pointer"
              >
                ×
              </button>
            </span>
          ))}

          {showTagInput ? (
            <div className="flex items-center space-x-1">
              <input
                type="text"
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                placeholder="tag name..."
                autoFocus
                className="px-2 py-0.5 bg-white border border-stone-300 rounded-lg text-xs text-stone-800 focus:outline-none focus:border-amber-600 w-24"
              />
              <button
                onClick={handleAddTag}
                className="px-2 py-0.5 rounded-lg bg-stone-900 text-white font-bold text-xs cursor-pointer"
              >
                Add
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowTagInput(true)}
              className="text-xs text-stone-500 hover:text-stone-800 underline underline-offset-2 cursor-pointer font-medium"
            >
              + Add tag
            </button>
          )}
        </div>
      </div>

      {/* Main Conversation & Summary Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-white">
        
        {/* Synthesis Summary Bento Tile (if generated) */}
        {entry.summary && (
          <div className="p-5 sm:p-6 rounded-3xl bg-[#FAF7F2] border border-amber-300/80 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between border-b border-amber-200/60 pb-2.5">
              <div className="flex items-center space-x-2 text-amber-900 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-amber-700" />
                <span>AI Executive Synthesis</span>
              </div>
              <span className="text-[10px] text-stone-500 font-mono">Persisted in Firestore</span>
            </div>

            <p className="text-xs sm:text-sm text-stone-800 leading-relaxed font-sans">
              {entry.summary}
            </p>

            {/* Actionable Takeaways Checklist */}
            {entry.takeaways && entry.takeaways.length > 0 && (
              <div className="pt-3 border-t border-amber-200/60 space-y-2.5">
                <span className="text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                  Key Takeaways & Action Items
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {entry.takeaways.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-2xl bg-white border border-stone-200/90 text-xs text-stone-800 flex items-start space-x-2.5 shadow-2xs"
                    >
                      <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                      <span className="leading-relaxed">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Prompt Starters Bento Tiles (if messages are empty or few) */}
        {(!entry.messages || entry.messages.length <= 1) && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-stone-600 font-semibold">
              <div className="flex items-center space-x-2">
                <Lightbulb className="w-3.5 h-3.5 text-amber-700" />
                <span>Prompt Starters for {entry.mode.replace('_', ' ')}:</span>
              </div>
              
              {/* Quick Voice Stream Trigger Button in Starters */}
              <button
                id="voice-stream-starter-btn"
                onClick={startVoiceRecording}
                className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-indigo-100 hover:bg-indigo-200 text-indigo-900 border border-indigo-300 font-bold text-xs transition-colors cursor-pointer shadow-2xs"
              >
                <Mic className="w-3.5 h-3.5 text-indigo-700" />
                <span>Try Voice Stream Dialogue</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {PROMPT_STARTERS[entry.mode]?.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(prompt)}
                  className="p-3.5 rounded-2xl bg-[#FAF8F5] hover:bg-stone-100 border border-stone-200 text-left text-xs text-stone-700 hover:text-stone-900 transition-all group active:scale-98 cursor-pointer shadow-2xs"
                >
                  <p className="line-clamp-2 leading-relaxed">{prompt}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages List */}
        <div className="space-y-4">
          {(entry.messages || []).map((msg) => {
            const isUser = msg.role === 'user';
            const isSpeakingThis = activeSpeechMessageId === msg.id;

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center space-x-2 mb-1 px-1 text-[11px] text-stone-400">
                  <span className="font-semibold text-stone-600 flex items-center space-x-1">
                    {msg.isSpokenVoice && <Mic className="w-3 h-3 text-indigo-600 inline" />}
                    <span>{isUser ? (msg.isSpokenVoice ? 'You (Spoken Voice)' : 'You') : 'Gemini Socratic Partner'}</span>
                  </span>
                  {!isUser && msg.model && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300 font-mono font-medium">
                      {msg.model}
                    </span>
                  )}
                  <span>• {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>

                <div
                  className={`group relative p-4 rounded-2xl max-w-2xl text-xs sm:text-sm leading-relaxed ${
                    isUser
                      ? 'bg-stone-900 text-white font-medium rounded-tr-xs shadow-xs'
                      : 'bg-[#FAF8F5] border border-stone-200 text-stone-800 rounded-tl-xs shadow-2xs'
                  }`}
                >
                  {/* Text Content */}
                  <div className="whitespace-pre-wrap">{msg.text}</div>

                  {/* Actions bar on top right of message */}
                  <div className="absolute top-2 right-2 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    
                    {/* TTS Read Aloud Button for AI responses */}
                    {!isUser && (
                      <button
                        onClick={() => toggleTTS(msg)}
                        className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                          isSpeakingThis
                            ? 'bg-amber-500 text-white'
                            : 'bg-black/5 hover:bg-black/10 text-stone-600 hover:text-stone-900'
                        }`}
                        title={isSpeakingThis ? 'Stop Voice Playback' : 'Listen to Socratic Response (TTS)'}
                      >
                        {isSpeakingThis ? (
                          <VolumeX className="w-3 h-3 animate-pulse" />
                        ) : (
                          <Volume2 className="w-3 h-3" />
                        )}
                      </button>
                    )}

                    {/* Copy Button */}
                    <button
                      onClick={() => handleCopyMessage(msg.id, msg.text)}
                      className="p-1.5 rounded-lg bg-black/5 hover:bg-black/10 text-stone-500 hover:text-stone-800 transition-colors cursor-pointer"
                      title="Copy text"
                    >
                      {copiedMessageId === msg.id ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Live Recording Stream Overlay & Real-Time Audio Waveform */}
          {isRecordingVoice && (
            <div className="p-5 rounded-3xl bg-indigo-50/80 border-2 border-indigo-300 shadow-sm space-y-3 animate-fade-in">
              <div className="flex items-center justify-between border-b border-indigo-200 pb-2">
                <div className="flex items-center space-x-2 text-indigo-900 font-bold text-xs uppercase tracking-wider">
                  <Radio className="w-4 h-4 text-rose-600 animate-pulse" />
                  <span>Live Stream of Consciousness Audio Recording</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs font-bold text-indigo-900 px-2 py-0.5 rounded-lg bg-white border border-indigo-200">
                    {formatTimer(recordingSeconds)}
                  </span>
                  <span className="text-[10px] text-indigo-700">Listening...</span>
                </div>
              </div>

              {/* Real-time Frequency Waveform Canvas */}
              <div className="h-16 w-full bg-white/90 rounded-2xl border border-indigo-200 flex items-center justify-center p-2 overflow-hidden shadow-2xs">
                <canvas
                  ref={canvasRef}
                  width={400}
                  height={60}
                  className="w-full h-full"
                />
              </div>

              {/* Real-time Rolling Transcript Preview */}
              <div className="p-3 bg-white rounded-2xl border border-indigo-200 min-h-[50px] text-xs sm:text-sm text-stone-800 leading-relaxed shadow-2xs">
                {voiceTranscript ? (
                  <span>"{voiceTranscript}"</span>
                ) : (
                  <span className="text-stone-400 italic">Speak freely about whatever is on your mind...</span>
                )}
              </div>

              {/* Recording Controls */}
              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={() => stopVoiceRecording(false)}
                  className="px-3 py-1.5 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-700 text-xs font-semibold cursor-pointer transition-colors"
                >
                  Cancel Spoken Stream
                </button>

                <button
                  id="finish-voice-stream-btn"
                  onClick={() => stopVoiceRecording(true)}
                  disabled={!voiceTranscript.trim()}
                  className="px-4 py-2 rounded-xl bg-indigo-900 hover:bg-indigo-800 text-white text-xs font-bold flex items-center space-x-2 shadow-xs cursor-pointer disabled:opacity-50 transition-all"
                >
                  <Square className="w-3.5 h-3.5 fill-white" />
                  <span>Finish & Synthesize Socratic Dialogue</span>
                </button>
              </div>
            </div>
          )}

          {/* Thinking Skeleton Indicator */}
          {isGenerating && (
            <div className="flex flex-col items-start space-y-1">
              <span className="text-[11px] text-stone-500 font-semibold px-1">Gemini is synthesizing reflection...</span>
              <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-stone-200 text-stone-600 text-xs rounded-tl-xs flex items-center space-x-2 shadow-2xs">
                <div className="w-2 h-2 rounded-full bg-amber-600 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-amber-600 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-amber-600 animate-bounce" style={{ animationDelay: '300ms' }} />
                <span className="text-stone-600 text-xs ml-1 font-medium">Formulating Socratic inquiry via fallback ladder...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Generation / Network Error Banner */}
        {generationError && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start space-x-2 shadow-2xs">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold">AI Reflection Error</p>
              <p className="text-[11px] text-rose-700 mt-0.5">{generationError}</p>
            </div>
            <button
              onClick={() => handleSendMessage()}
              className="px-2.5 py-1 bg-rose-100 hover:bg-rose-200 rounded-lg text-[11px] font-semibold text-rose-900 cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-stone-200/80 bg-[#FAF8F5]">
        <div className="max-w-4xl mx-auto flex items-end space-x-2">
          
          {/* Voice Stream Toggle Button with visible pill/label */}
          <button
            id="voice-stream-toggle-btn"
            onClick={isRecordingVoice ? () => stopVoiceRecording(true) : startVoiceRecording}
            className={`px-3.5 py-3 rounded-2xl font-bold transition-all shadow-xs active:scale-95 cursor-pointer shrink-0 flex items-center space-x-2 ${
              isRecordingVoice
                ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
            }`}
            title={isRecordingVoice ? 'Stop and Submit Voice Stream' : 'Record Voice Stream & Socratic Dialogue'}
          >
            {isRecordingVoice ? (
              <>
                <Square className="w-4 h-4 fill-white" />
                <span className="text-xs font-bold hidden sm:inline">Stop & Send</span>
              </>
            ) : (
              <>
                <Mic className="w-4 h-4" />
                <span className="text-xs font-bold hidden sm:inline">Voice Mic</span>
              </>
            )}
          </button>

          {/* Text input area */}
          <div className="flex-1 relative bg-white border border-stone-300 rounded-2xl overflow-hidden focus-within:border-amber-600 focus-within:ring-1 focus-within:ring-amber-500/30 transition-all shadow-2xs">
            <textarea
              id="reflection-input-textarea"
              ref={textareaRef}
              rows={1}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={`Reflect on ${entry.mode.replace('_', ' ')} or click Voice Mic to speak aloud...`}
              disabled={isGenerating || isRecordingVoice}
              className="w-full px-4 py-3 bg-transparent text-xs sm:text-sm text-stone-800 placeholder-stone-400 focus:outline-none resize-none"
            />
          </div>

          <button
            id="send-reflection-btn"
            onClick={() => handleSendMessage()}
            disabled={!inputText.trim() || isGenerating || isRecordingVoice}
            className="p-3 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white font-bold transition-all shadow-xs active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
          >
            <Send className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        <div className="max-w-4xl mx-auto flex items-center justify-between text-[10px] text-stone-500 mt-2 px-1 font-medium">
          <span className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            <span className="font-semibold text-indigo-900">Voice Stream & Socratic Audio Enabled</span>
          </span>
          <span>Encrypted & Isolated in Cloud Firestore</span>
        </div>
      </div>

    </div>
  );
};
