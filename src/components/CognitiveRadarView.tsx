import React, { useState, useEffect } from 'react';
import { JournalEntry, CognitiveAnalyticsReport } from '../types';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import {
  Brain,
  Sparkles,
  TrendingUp,
  ShieldAlert,
  HelpCircle,
  RefreshCw,
  Target,
  Lightbulb,
  CheckCircle,
  AlertCircle,
  Tag,
  ArrowRight,
  Zap,
  Award
} from 'lucide-react';

interface CognitiveRadarViewProps {
  entries: JournalEntry[];
  onStartReflectionWithPrompt: (promptText: string, title?: string) => void;
}

export const CognitiveRadarView: React.FC<CognitiveRadarViewProps> = ({
  entries,
  onStartReflectionWithPrompt
}) => {
  const [report, setReport] = useState<CognitiveAnalyticsReport | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPatternIndex, setSelectedPatternIndex] = useState<number | null>(null);

  const fetchAnalytics = async (entriesList: JournalEntry[]) => {
    if (!entriesList || entriesList.length === 0) return;
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/analytics/patterns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries: entriesList })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with ${response.status}`);
      }

      const data: CognitiveAnalyticsReport = await response.json();
      data.generatedAt = Date.now();
      setReport(data);
    } catch (err: any) {
      console.error('Failed to fetch cognitive analytics report:', err);
      setError(err.message || 'Failed to synthesize cognitive radar patterns.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (entries.length > 0 && !report && !isLoading) {
      fetchAnalytics(entries);
    }
  }, [entries.length]);

  if (entries.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-white rounded-3xl border border-[#E5DFD5] shadow-xs">
        <div className="w-14 h-14 rounded-3xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800 mb-4 shadow-xs">
          <Brain className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-bold text-stone-900 mb-2">No Reflections to Analyze Yet</h3>
        <p className="text-xs sm:text-sm text-stone-600 max-w-md mb-6 leading-relaxed">
          Record at least one reflection or voice journal session in your private vault to generate your longitudinal cognitive blindspot radar, mood trajectory, and growth patterns.
        </p>
        <button
          onClick={() => onStartReflectionWithPrompt('What is currently top of mind that I want to reflect on?', 'My First Reflection')}
          className="px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold flex items-center space-x-2 transition-all cursor-pointer shadow-xs"
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Begin First Reflection</span>
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white rounded-3xl border border-[#E5DFD5] shadow-xs overflow-hidden">
      
      {/* Top Header Bar */}
      <div className="p-4 sm:p-5 border-b border-stone-200/80 bg-[#FAF8F5] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-900 shadow-2xs">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base sm:text-lg font-bold text-stone-900">Cognitive Growth & Blindspot Radar</h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-mono font-semibold">
                Longitudinal AI Synthesis
              </span>
            </div>
            <p className="text-xs text-stone-500">
              Cross-session meta-analysis of {entries.length} reflections in your private vault
            </p>
          </div>
        </div>

        <button
          id="refresh-cognitive-analytics-btn"
          onClick={() => fetchAnalytics(entries)}
          disabled={isLoading}
          className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-white hover:bg-stone-100 border border-stone-300 text-stone-800 text-xs font-semibold transition-all shadow-2xs disabled:opacity-50 cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-amber-700' : 'text-stone-600'}`} />
          <span>{isLoading ? 'Synthesizing...' : 'Refresh Radar Analysis'}</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        
        {/* Error Banner */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between shadow-2xs">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => fetchAnalytics(entries)}
              className="px-3 py-1 bg-rose-100 hover:bg-rose-200 rounded-lg text-rose-900 font-semibold cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading Skeleton */}
        {isLoading && !report && (
          <div className="py-16 text-center space-y-4">
            <div className="w-10 h-10 border-3 border-amber-700 border-t-transparent rounded-full animate-spin mx-auto" />
            <div>
              <p className="text-sm font-semibold text-stone-800">Synthesizing Cognitive Vectors...</p>
              <p className="text-xs text-stone-500 mt-1">Cross-referencing mental models, blindspots, and emotional trends across entries</p>
            </div>
          </div>
        )}

        {report && (
          <>
            {/* Top Bento Row: Executive Summary & Highlights */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              
              {/* Executive Mindset Synthesis Bento Tile */}
              <div className="lg:col-span-2 p-5 sm:p-6 rounded-3xl bg-[#FAF7F2] border border-amber-300/80 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-amber-200/60 pb-2.5">
                  <div className="flex items-center space-x-2 text-amber-900 text-xs font-bold uppercase tracking-wider">
                    <Sparkles className="w-4 h-4 text-amber-700" />
                    <span>Executive Mindset Synthesis</span>
                  </div>
                  {report.modelUsed && (
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-100 border border-amber-300 text-amber-900 font-mono">
                      {report.modelUsed}
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-stone-800 leading-relaxed font-sans">
                  {report.growthSummary}
                </p>
                
                {/* Meta badges */}
                <div className="pt-2 flex flex-wrap gap-2 text-xs">
                  <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-white border border-stone-200 text-stone-700 font-medium shadow-2xs">
                    <Award className="w-3.5 h-3.5 text-amber-600" />
                    <span>{report.cognitivePatterns?.filter(p => p.type === 'strength').length || 0} Core Strengths</span>
                  </span>
                  <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-white border border-stone-200 text-stone-700 font-medium shadow-2xs">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                    <span>{report.cognitivePatterns?.filter(p => p.type === 'blindspot').length || 0} Blindspots Identified</span>
                  </span>
                  <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-white border border-stone-200 text-stone-700 font-medium shadow-2xs">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{report.cognitivePatterns?.filter(p => p.type === 'growth_opportunity').length || 0} Growth Frontiers</span>
                  </span>
                </div>
              </div>

              {/* Recurring Key Themes Tile */}
              <div className="p-5 sm:p-6 rounded-3xl bg-[#FAF8F5] border border-stone-200/90 shadow-xs flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center space-x-2 text-stone-700 text-xs font-bold uppercase tracking-wider mb-3">
                    <Tag className="w-4 h-4 text-amber-700" />
                    <span>Top Focus Themes</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {report.topThemes?.map((item, idx) => (
                      <div
                        key={idx}
                        className="px-3 py-1.5 rounded-xl bg-white border border-stone-200 text-xs flex items-center space-x-2 shadow-2xs"
                      >
                        <span className="font-semibold text-stone-800">{item.theme}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono ${
                          item.status === 'growing'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.status === 'stable'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-stone-100 text-stone-600'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="text-[11px] text-stone-500 pt-2 border-t border-stone-200/70">
                  Reflected across {entries.length} vault entries.
                </div>
              </div>

            </div>

            {/* Middle Bento Row: Radar Chart & Longitudinal Mood Trajectory */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              
              {/* Radar Chart Tile */}
              <div className="p-5 sm:p-6 rounded-3xl bg-white border border-[#E5DFD5] shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-stone-200/80 pb-2.5">
                  <div className="flex items-center space-x-2 text-stone-900 text-xs font-bold uppercase tracking-wider">
                    <Brain className="w-4 h-4 text-amber-700" />
                    <span>6-Factor Cognitive Dimensions Radar</span>
                  </div>
                  <div className="flex items-center space-x-3 text-[11px]">
                    <span className="flex items-center space-x-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-600 inline-block" />
                      <span className="text-stone-600 font-medium">Your Score</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-stone-300 inline-block" />
                      <span className="text-stone-400 font-medium">Benchmark</span>
                    </span>
                  </div>
                </div>

                <div className="h-64 sm:h-72 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="75%" data={report.radarMetrics || []}>
                      <PolarGrid stroke="#E5DFD5" />
                      <PolarAngleAxis
                        dataKey="category"
                        tick={{ fill: '#44403C', fontSize: 11, fontWeight: 600 }}
                      />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#D6D3D1" />
                      <Radar
                        name="Benchmark"
                        dataKey="benchmark"
                        stroke="#A8A29E"
                        fill="#A8A29E"
                        fillOpacity={0.2}
                      />
                      <Radar
                        name="Your Score"
                        dataKey="score"
                        stroke="#B45309"
                        fill="#D97706"
                        fillOpacity={0.45}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1C1917',
                          borderRadius: '12px',
                          border: '1px solid #44403C',
                          color: '#FFFFFF',
                          fontSize: '12px'
                        }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                {/* Radar Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-stone-100">
                  {report.radarMetrics?.map((metric, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-stone-50 border border-stone-200/80 text-left">
                      <div className="text-[11px] text-stone-500 font-medium truncate">{metric.category}</div>
                      <div className="flex items-baseline space-x-1.5 mt-0.5">
                        <span className="text-base font-bold text-stone-900">{metric.score}</span>
                        <span className="text-[10px] text-stone-400">/ 100</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mood Trajectory Area Chart Tile */}
              <div className="p-5 sm:p-6 rounded-3xl bg-white border border-[#E5DFD5] shadow-xs space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-stone-200/80 pb-2.5">
                    <div className="flex items-center space-x-2 text-stone-900 text-xs font-bold uppercase tracking-wider">
                      <TrendingUp className="w-4 h-4 text-emerald-700" />
                      <span>Longitudinal Sentiment & Mood Trajectory</span>
                    </div>
                    <span className="text-[11px] text-stone-500 font-mono">1-10 Sentiment Index</span>
                  </div>

                  <div className="h-64 sm:h-72 w-full pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={report.moodTrajectory || []}
                        margin={{ top: 10, right: 15, left: -20, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="colorSentiment" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#059669" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F0ECE4" />
                        <XAxis
                          dataKey="date"
                          stroke="#78716C"
                          fontSize={11}
                          tickLine={false}
                        />
                        <YAxis
                          stroke="#78716C"
                          fontSize={11}
                          domain={[0, 10]}
                          tickLine={false}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1C1917',
                            borderRadius: '12px',
                            border: '1px solid #44403C',
                            color: '#FFFFFF',
                            fontSize: '12px'
                          }}
                          formatter={(value: any) => [`${value} / 10`, 'Sentiment Score']}
                          labelFormatter={(label: any) => `Date: ${label}`}
                        />
                        <Area
                          type="monotone"
                          dataKey="sentimentScore"
                          stroke="#059669"
                          strokeWidth={2.5}
                          fillOpacity={1}
                          fill="url(#colorSentiment)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="text-[11px] text-stone-500 pt-2 border-t border-stone-100 flex items-center justify-between">
                  <span>Tracked from reflection tone and takeaways</span>
                  <span className="font-semibold text-emerald-700">Healthy Emotional Variance</span>
                </div>
              </div>

            </div>

            {/* Cognitive Patterns & Blindspots Bento Tile Section */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-stone-900 text-sm font-bold uppercase tracking-wider">
                <ShieldAlert className="w-4 h-4 text-amber-700" />
                <span>Identified Cognitive Patterns & Distortion Blindspots</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {report.cognitivePatterns?.map((pattern, idx) => {
                  const isStrength = pattern.type === 'strength';
                  const isBlindspot = pattern.type === 'blindspot';

                  return (
                    <div
                      key={idx}
                      className={`p-5 rounded-3xl border transition-all shadow-xs flex flex-col justify-between space-y-3 ${
                        isStrength
                          ? 'bg-emerald-50/40 border-emerald-200'
                          : isBlindspot
                          ? 'bg-rose-50/40 border-rose-200'
                          : 'bg-amber-50/40 border-amber-200'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                            isStrength
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                              : isBlindspot
                              ? 'bg-rose-100 text-rose-900 border border-rose-300'
                              : 'bg-amber-100 text-amber-900 border border-amber-300'
                          }`}>
                            {pattern.type.replace('_', ' ')}
                          </span>

                          <span className="text-[11px] text-stone-500 font-mono">
                            {pattern.frequency} Frequency
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-stone-900">{pattern.name}</h4>
                        <p className="text-xs text-stone-600 leading-relaxed">{pattern.description}</p>
                      </div>

                      {pattern.recommendation && (
                        <div className="pt-2.5 border-t border-stone-200/80 text-xs">
                          <div className="text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1 flex items-center space-x-1">
                            <Lightbulb className="w-3 h-3 text-amber-700" />
                            <span>Actionable Countermeasure:</span>
                          </div>
                          <p className="text-stone-800 font-medium">{pattern.recommendation}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Personalized Coaching Questions Bento Section */}
            <div className="p-5 sm:p-6 rounded-3xl bg-[#FAF8F5] border border-stone-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-stone-200 pb-2.5">
                <div className="flex items-center space-x-2 text-stone-900 text-xs font-bold uppercase tracking-wider">
                  <HelpCircle className="w-4 h-4 text-amber-700" />
                  <span>Personalized Socratic Coaching Inquiries</span>
                </div>
                <span className="text-[10px] text-stone-500 font-medium">Click any card to start a reflection</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {report.coachingQuestions?.map((q, idx) => (
                  <button
                    key={q.id || idx}
                    onClick={() => onStartReflectionWithPrompt(q.question, `Inquiry: ${q.question.slice(0, 30)}...`)}
                    className="p-4 rounded-2xl bg-white hover:bg-stone-50 border border-stone-200 text-left transition-all shadow-2xs hover:border-amber-400 group cursor-pointer flex flex-col justify-between space-y-3 active:scale-98"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center space-x-1.5 text-[10px] font-bold text-amber-800 uppercase tracking-wider">
                        <Zap className="w-3 h-3 text-amber-600" />
                        <span>Coaching Prompt #{idx + 1}</span>
                      </div>
                      <p className="text-xs sm:text-sm font-semibold text-stone-900 leading-snug group-hover:text-amber-950">
                        "{q.question}"
                      </p>
                      <p className="text-[11px] text-stone-500 leading-relaxed">{q.context}</p>
                    </div>

                    <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs font-bold text-amber-800">
                      <span>Reflect on this now</span>
                      <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
                    </div>
                  </button>
                ))}
              </div>
            </div>

          </>
        )}

      </div>

    </div>
  );
};
