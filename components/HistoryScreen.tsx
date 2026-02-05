import React, { useState, useMemo } from 'react';
import { Button } from './Button';
import { InterviewHistoryItem, INTERVIEW_TYPES, InterviewType, InterviewStatus } from '../types';
import { useInterviews } from '../hooks/useSupabase';
import { useAuth } from '../context/AuthContext';
import {
  History,
  Search,
  Filter,
  TrendingUp,
  Clock,
  Trophy,
  ChevronRight,
  Trash2,
  ArrowLeft,
  Calendar,
  Target,
  Loader2,
  Sparkles,
  Laptop,
  MessageCircle,
  Brain,
  Server,
  BarChart3
} from 'lucide-react';
import { 
  IconWrapper, 
  TechnicalIcon, 
  BehavioralIcon, 
  HRIcon, 
  SystemDesignIcon 
} from './RichIcons';

interface HistoryScreenProps {
  onBack: () => void;
  onSelectInterview?: (id: string) => void;
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({ onBack, onSelectInterview }) => {
  const { user } = useAuth();
  const { interviews, isLoading, error } = useInterviews();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<InterviewType | 'all'>('all');

  // Transform Supabase data to InterviewHistoryItem format
  const history: InterviewHistoryItem[] = useMemo(() => {
    return interviews.map(interview => ({
      id: interview.id,
      jobRole: interview.config.jobRole,
      interviewType: interview.config.interviewType as InterviewType,
      date: interview.createdAt,
      duration: interview.duration || 0,
      overallScore: interview.overallScore || 0,
      status: interview.status === 'completed' ? InterviewStatus.COMPLETED : 
              interview.status === 'terminated' ? InterviewStatus.TERMINATED : 
              InterviewStatus.COMPLETED
    }));
  }, [interviews]);

  const filteredHistory = history.filter(item => {
    const matchesSearch = item.jobRole.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || item.interviewType === filterType;
    return matchesSearch && matchesType;
  });

  // Calculate stats
  const totalInterviews = history.length;
  const avgScore = totalInterviews > 0 ? Math.round(history.reduce((acc, h) => acc + h.overallScore, 0) / totalInterviews) : 0;
  const totalDuration = history.reduce((acc, h) => acc + h.duration, 0);
  const bestScore = history.length > 0 ? Math.max(...history.map(h => h.overallScore)) : 0;

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-400';
    if (score >= 70) return 'text-amber-400';
    return 'text-red-400';
  };

  const getTypeInfo = (type: InterviewType) => {
    return INTERVIEW_TYPES.find(t => t.id === type);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-white transition-colors duration-300">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="glow-orb glow-orb-blue w-[400px] h-[400px] top-0 right-0 opacity-10 dark:opacity-20" />
        <div className="glow-orb glow-orb-purple w-[300px] h-[300px] bottom-1/4 left-0 opacity-10 dark:opacity-15" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-zinc-200 dark:border-white/5 px-6 py-4 lg:px-12">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back</span>
          </button>
          
          <h1 className="text-lg font-semibold flex items-center gap-2">
            <History className="w-5 h-5" />
            Interview History
          </h1>

          <div className="w-16" />
        </div>
      </header>

      <main className="relative z-10 px-6 py-8 lg:px-12">
        <div className="max-w-6xl mx-auto space-y-8">

          {/* Loading State */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-24 fade-in-up">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mb-4" />
              <p className="text-zinc-500">Loading your interview history...</p>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && history.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 fade-in-up">
              <div className="mb-6">
                <IconWrapper gradient="from-zinc-500 to-slate-500" size="lg">
                  <History className="w-10 h-10 text-zinc-200" />
                  <Sparkles className="absolute -bottom-2 -right-2 w-6 h-6 text-slate-400 opacity-50" />
                </IconWrapper>
              </div>
              <h3 className="text-lg font-semibold mb-2">No interviews yet</h3>
              <p className="text-zinc-500 text-center max-w-sm mb-6">
                Complete your first mock interview to see your progress here.
              </p>
              <Button onClick={onBack} variant="primary">
                Start Your First Interview
              </Button>
            </div>
          )}

          {/* Main Content - only show when we have data */}
          {!isLoading && history.length > 0 && (
            <>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 fade-in-up">
            <div className="glass-card p-5 bg-white/50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 group hover:border-blue-500/30 transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <IconWrapper gradient="from-blue-500 to-cyan-500" size="sm">
                  <BarChart3 className="w-5 h-5 text-blue-200" />
                </IconWrapper>
                <span className="text-xs uppercase tracking-wider text-zinc-500">Total</span>
              </div>
              <div className="text-3xl font-bold text-zinc-900 dark:text-white">{totalInterviews}</div>
              <div className="text-xs text-zinc-500 mt-1">interviews completed</div>
            </div>

            <div className="glass-card p-5 bg-white/50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 group hover:border-violet-500/30 transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <IconWrapper gradient="from-violet-500 to-purple-500" size="sm">
                  <Target className="w-5 h-5 text-violet-200" />
                </IconWrapper>
                <span className="text-xs uppercase tracking-wider text-zinc-500">Avg Score</span>
              </div>
              <div className={`text-3xl font-bold ${getScoreColor(avgScore)}`}>{avgScore}</div>
              <div className="text-xs text-zinc-500 mt-1">average performance</div>
            </div>

            <div className="glass-card p-5 bg-white/50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 group hover:border-amber-500/30 transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <IconWrapper gradient="from-amber-500 to-orange-500" size="sm">
                  <Trophy className="w-5 h-5 text-amber-200" />
                </IconWrapper>
                <span className="text-xs uppercase tracking-wider text-zinc-500">Best</span>
              </div>
              <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{bestScore}</div>
              <div className="text-xs text-zinc-500 mt-1">highest score achieved</div>
            </div>

            <div className="glass-card p-5 bg-white/50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 group hover:border-emerald-500/30 transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <IconWrapper gradient="from-emerald-500 to-teal-500" size="sm">
                  <Clock className="w-5 h-5 text-emerald-200" />
                </IconWrapper>
                <span className="text-xs uppercase tracking-wider text-zinc-500">Practice</span>
              </div>
              <div className="text-3xl font-bold text-zinc-900 dark:text-white">{formatDuration(totalDuration)}</div>
              <div className="text-xs text-zinc-500 mt-1">total time spent</div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 fade-in-up" style={{ animationDelay: '0.1s' }}>
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-500" />
              <input
                type="text"
                placeholder="Search by role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-premium pl-11 w-full bg-white dark:bg-black border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
              />
            </div>

            {/* Type Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
              <button
                onClick={() => setFilterType('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  filterType === 'all'
                    ? 'bg-zinc-900 dark:bg-white text-white dark:text-black'
                    : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800'
                }`}
              >
                All Types
              </button>
              {INTERVIEW_TYPES.map((type) => {
                const getIcon = () => {
                  switch (type.id) {
                    case 'technical': return <Laptop className="w-4 h-4" />;
                    case 'behavioral': return <Target className="w-4 h-4" />;
                    case 'hr': return <MessageCircle className="w-4 h-4" />;
                    case 'system-design': return <Server className="w-4 h-4" />;
                    default: return null;
                  }
                };

                return (
                  <button
                    key={type.id}
                    onClick={() => setFilterType(type.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
                      filterType === type.id
                        ? 'bg-zinc-900 dark:bg-white text-white dark:text-black'
                        : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800'
                    }`}
                  >
                    <span>{getIcon()}</span>
                    {type.title}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interview List */}
          <div className="space-y-3 fade-in-up" style={{ animationDelay: '0.2s' }}>
            {filteredHistory.length === 0 ? (
              <div className="glass-card p-12 text-center bg-white/50 dark:bg-white/5 border border-zinc-200 dark:border-white/10">
                <div className="mb-4 flex justify-center">
                  <IconWrapper gradient="from-zinc-500 to-slate-500" size="md">
                    <Search className="w-8 h-8 text-zinc-200" />
                  </IconWrapper>
                </div>
                <h3 className="text-lg font-semibold mb-2 text-zinc-900 dark:text-white">No interviews found</h3>
                <p className="text-zinc-500 text-sm">
                  {searchQuery || filterType !== 'all' 
                    ? 'Try adjusting your filters'
                    : 'Start practicing to build your history'}
                </p>
              </div>
            ) : (
              filteredHistory.map((item, index) => {
                const typeInfo = getTypeInfo(item.interviewType);
                return (
                  <div 
                    key={item.id}
                    className="glass-card p-4 bg-white/50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 hover:bg-white dark:hover:bg-white/10 transition-all cursor-pointer group"
                    onClick={() => onSelectInterview?.(item.id)}
                    style={{ animationDelay: `${0.05 * index}s` }}
                  >
                    <div className="flex items-center gap-4">
                      {/* Type Icon */}
                      <div className="flex-shrink-0">
                        {item.interviewType === 'technical' && <TechnicalIcon size="sm" />}
                        {item.interviewType === 'behavioral' && <BehavioralIcon size="sm" />}
                        {item.interviewType === 'hr' && <HRIcon size="sm" />}
                        {item.interviewType === 'system-design' && <SystemDesignIcon size="sm" />}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold truncate text-zinc-900 dark:text-white">{item.jobRole}</h3>
                          {item.status === InterviewStatus.TERMINATED && (
                            <span className="text-xs px-2 py-0.5 rounded bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400">
                              Terminated
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-zinc-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(item.date)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDuration(item.duration)}
                          </span>
                          <span className="hidden md:inline px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-xs">
                            {typeInfo?.title}
                          </span>
                        </div>
                      </div>

                      {/* Score */}
                      <div className="text-right flex-shrink-0">
                        <div className={`text-2xl font-bold ${getScoreColor(item.overallScore)}`}>
                          {item.overallScore}
                        </div>
                        <div className="text-xs text-zinc-500">score</div>
                      </div>

                      {/* Arrow */}
                      <ChevronRight className="w-5 h-5 text-zinc-400 group-hover:text-black dark:group-hover:text-white transition-colors flex-shrink-0" />
                    </div>
                  </div>
                );
              })
            )}
          </div>


            </>
          )}
        </div>
      </main>
    </div>
  );
};
