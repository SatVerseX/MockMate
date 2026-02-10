
import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Target, 
  TrendingUp, 
  Clock, 
  Calendar, 
  ChevronRight, 
  Star,
  Zap,
  Award,
  ArrowUpRight,
  Loader2
} from 'lucide-react';
import { Navbar } from './Navbar';
import { Button } from './Button';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useInterviews } from '../hooks/useSupabase';
import { useBilling } from '../hooks/useBilling';
import { INTERVIEW_TYPES } from '../types';

interface UserDashboardProps {
  onStartNew: () => void;
  onViewHistory: () => void;
  onOpenSettings: () => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({ 
  onStartNew, 
  onViewHistory, 
  onOpenSettings 
}) => {
  const { theme } = useTheme();
  const { user, profile } = useAuth();
  const { interviews, isLoading } = useInterviews();
  const { checkInterviewLimit } = useBilling();
  const navigate = useNavigate();
  const [checkingLimit, setCheckingLimit] = useState(false);

  const handleStartClick = async () => {
    setCheckingLimit(true);
    try {
        const { allowed, remaining } = await checkInterviewLimit();
        if (allowed) {
            onStartNew();
        } else {
            if (window.confirm("Daily Limit Reached! \n\nYou have used your free daily interview. Upgrade to Pro for unlimited practice?")) {
                navigate('/pricing');
            }
        }
    } catch (err) {
        console.error(err);
        onStartNew(); // Fail safe
    } finally {
        setCheckingLimit(false);
    }
  };

  // Get user's display name
  const userName = useMemo(() => {
    if (profile?.fullName) return profile.fullName.split(' ')[0];
    if (user?.email) return user.email.split('@')[0];
    return 'Guest';
  }, [profile, user]);

  // Calculate stats from real interview data
  const stats = useMemo(() => {
    const totalInterviews = interviews.length;
    
    // Calculate average score
    const scoresWithValues = interviews.filter(i => i.overallScore !== null);
    const avgScore = scoresWithValues.length > 0 
      ? Math.round(scoresWithValues.reduce((acc, i) => acc + (i.overallScore || 0), 0) / scoresWithValues.length)
      : 0;
    
    // Calculate total practice time
    const totalSeconds = interviews.reduce((acc, i) => acc + (i.duration || 0), 0);
    const hours = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const practiceTime = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    
    // Calculate this week's interviews
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const thisWeekCount = interviews.filter(i => i.createdAt > oneWeekAgo).length;
    
    // Calculate improvement (compare last 3 vs previous 3)
    let improvement = 0;
    if (scoresWithValues.length >= 6) {
      const recent3 = scoresWithValues.slice(0, 3);
      const previous3 = scoresWithValues.slice(3, 6);
      const recentAvg = recent3.reduce((a, i) => a + (i.overallScore || 0), 0) / 3;
      const previousAvg = previous3.reduce((a, i) => a + (i.overallScore || 0), 0) / 3;
      improvement = Math.round(recentAvg - previousAvg);
    }

    return [
      { 
        label: 'Total Interviews', 
        value: totalInterviews.toString(), 
        icon: <Target className="w-4 h-4" />, 
        change: thisWeekCount > 0 ? `+${thisWeekCount} this week` : 'Start practicing' 
      },
      { 
        label: 'Avg. Score', 
        value: avgScore > 0 ? `${avgScore}%` : '-', 
        icon: <Award className="w-4 h-4" />, 
        change: improvement > 0 ? `+${improvement}% improvement` : avgScore > 0 ? 'Keep going!' : 'No data yet'
      },
      { 
        label: 'Practice Time', 
        value: totalSeconds > 0 ? practiceTime : '0m', 
        icon: <Clock className="w-4 h-4" />, 
        change: totalInterviews > 0 ? 'Great effort!' : 'Get started' 
      },
    ];
  }, [interviews]);

  // Get recent activity from real data
  const recentActivity = useMemo(() => {
    return interviews.slice(0, 3).map(interview => {
      const typeInfo = INTERVIEW_TYPES.find(t => t.id === interview.config.interviewType);
      
      // Format date
      const now = new Date();
      const diffMs = now.getTime() - interview.createdAt.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      let dateStr = '';
      if (diffDays === 0) dateStr = 'Today';
      else if (diffDays === 1) dateStr = 'Yesterday';
      else if (diffDays < 7) dateStr = `${diffDays} days ago`;
      else dateStr = interview.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      return {
        id: interview.id,
        role: interview.config.jobRole,
        type: typeInfo?.title || interview.config.interviewType,
        date: dateStr,
        score: interview.overallScore || 0,
        status: interview.status === 'completed' ? 'Completed' : 'Terminated'
      };
    });
  }, [interviews]);

  // Calculate skill breakdown from real metrics
  const skills = useMemo(() => {
    const withMetrics = interviews.filter(i => i.metrics !== null);
    
    if (withMetrics.length === 0) {
      return [
        { name: 'Technical', score: 0, color: 'bg-emerald-500' },
        { name: 'Communication', score: 0, color: 'bg-blue-500' },
        { name: 'Problem Solving', score: 0, color: 'bg-amber-500' },
        { name: 'Confidence', score: 0, color: 'bg-purple-500' },
      ];
    }

    const avgMetrics = {
      technical: Math.round(withMetrics.reduce((a, i) => a + (i.metrics?.technicalKnowledge || 0), 0) / withMetrics.length),
      communication: Math.round(withMetrics.reduce((a, i) => a + (i.metrics?.communication || 0), 0) / withMetrics.length),
      problemSolving: Math.round(withMetrics.reduce((a, i) => a + (i.metrics?.problemSolving || 0), 0) / withMetrics.length),
      confidence: Math.round(withMetrics.reduce((a, i) => a + (i.metrics?.confidence || 0), 0) / withMetrics.length),
    };

    return [
      { name: 'Technical', score: avgMetrics.technical, color: 'bg-emerald-500' },
      { name: 'Communication', score: avgMetrics.communication, color: 'bg-blue-500' },
      { name: 'Problem Solving', score: avgMetrics.problemSolving, color: 'bg-amber-500' },
      { name: 'Confidence', score: avgMetrics.confidence, color: 'bg-purple-500' },
    ];
  }, [interviews]);

  // Calculate streak (consecutive days with interviews)
  const streak = useMemo(() => {
    if (interviews.length === 0) return 0;
    
    let currentStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      
      const hasInterview = interviews.some(interview => {
        const interviewDate = new Date(interview.createdAt);
        interviewDate.setHours(0, 0, 0, 0);
        return interviewDate.getTime() === checkDate.getTime();
      });
      
      if (hasInterview) {
        currentStreak++;
      } else if (i > 0) {
        break;
      }
    }
    
    return currentStreak;
  }, [interviews]);

  // Personalized daily challenge based on user profile
  const dailyChallenge = useMemo(() => {
    const spec = (profile?.specialization || '').toLowerCase();
    const course = (profile?.course || '').toLowerCase();
    const hasResume = !!profile?.resumeUrl;
    const isRecent = profile?.graduationYear 
      ? profile.graduationYear >= new Date().getFullYear() 
      : true;

    // Challenge pools based on specialization/course
    const challengeMap: Record<string, { title: string; description: string }[]> = {
      'cs': [
        { title: 'Data Structures: Binary Trees', description: 'Master tree traversals, BST operations, and balanced trees.' },
        { title: 'System Design: URL Shortener', description: 'Design a globally scalable URL shortening service.' },
        { title: 'Algorithms: Dynamic Programming', description: 'Crack DP patterns — from memoization to tabulation.' },
        { title: 'OOP Concepts Deep Dive', description: 'Inheritance, polymorphism, SOLID principles — nail the fundamentals.' },
        { title: 'Concurrency & Multithreading', description: 'Threads, locks, deadlocks — understand parallel programming.' },
        { title: 'Database Design: E-Commerce', description: 'Schema design, indexing, and query optimization.' },
        { title: 'API Design Best Practices', description: 'RESTful design, versioning, authentication patterns.' },
      ],
      'web': [
        { title: 'Frontend: React Performance', description: 'Virtual DOM, memoization, lazy loading — optimize your React apps.' },
        { title: 'Full-Stack: Auth System Design', description: 'OAuth, JWT, session management — build secure authentication.' },
        { title: 'CSS Architecture Challenge', description: 'Master component-based styling, responsive design, and CSS-in-JS.' },
        { title: 'REST vs GraphQL Debate', description: 'Compare API paradigms, trade-offs, and when to use each.' },
        { title: 'Progressive Web Apps', description: 'Service workers, caching strategies, and offline-first design.' },
      ],
      'data': [
        { title: 'SQL & Data Modeling', description: 'Complex joins, window functions, and schema design patterns.' },
        { title: 'Machine Learning Pipeline', description: 'Feature engineering, model selection, and deployment strategies.' },
        { title: 'Data Visualization Challenge', description: 'Tell a story with data — dashboards, charts, and insights.' },
        { title: 'Statistics for Interviews', description: 'Probability, hypothesis testing, and A/B testing fundamentals.' },
        { title: 'Big Data Architecture', description: 'Hadoop, Spark, data lakes — handle data at scale.' },
      ],
      'ai': [
        { title: 'Neural Network Fundamentals', description: 'Backpropagation, activation functions, and architecture choices.' },
        { title: 'NLP: Text Classification', description: 'Tokenization, embeddings, transformers — process natural language.' },
        { title: 'Computer Vision Basics', description: 'CNNs, object detection, and image classification techniques.' },
        { title: 'ML System Design', description: 'Design end-to-end ML systems — from data pipeline to inference.' },
      ],
      'general': [
        { title: 'Behavioral: Leadership Stories', description: 'Prepare compelling STAR stories about leadership and teamwork.' },
        { title: 'HR Round: Salary Negotiation', description: 'Practice discussing compensation, benefits, and expectations.' },
        { title: 'Problem Solving Under Pressure', description: 'Think out loud, structure your approach, and stay calm.' },
        { title: 'Tell Me About Yourself', description: 'Craft a compelling 2-minute pitch that highlights your strengths.' },
        { title: 'Why This Company?', description: 'Research-backed answers that show genuine interest and fit.' },
      ],
    };

    // Determine which pool to use based on profile
    let pool = challengeMap['general'];

    if (spec.includes('ai') || spec.includes('machine learning') || spec.includes('deep learning') || course.includes('ai')) {
      pool = [...challengeMap['ai'], ...challengeMap['cs']];
    } else if (spec.includes('data') || spec.includes('analytics') || course.includes('data')) {
      pool = [...challengeMap['data'], ...challengeMap['cs']];
    } else if (spec.includes('web') || spec.includes('frontend') || spec.includes('fullstack') || spec.includes('full stack') || spec.includes('mern') || spec.includes('mean')) {
      pool = [...challengeMap['web'], ...challengeMap['cs']];
    } else if (spec.includes('computer') || spec.includes('software') || spec.includes('cs') || spec.includes('programming') || 
               course.includes('btech') || course.includes('b.tech') || course.includes('b.e') || course.includes('engineering') || 
               course.includes('mca') || course.includes('bca') || course.includes('msc computer') || course.includes('bsc computer')) {
      pool = [...challengeMap['cs'], ...challengeMap['general']];
    }

    // Add resume-based suggestions if resume is uploaded
    if (hasResume && pool !== challengeMap['general']) {
      pool.push({ title: 'Resume Walk-Through Practice', description: 'Practice explaining your projects and experience from your resume.' });
    }

    // Add fresher-specific challenges
    if (isRecent) {
      pool.push({ title: 'Campus Placement Prep', description: 'Common aptitude, coding, and HR questions for placements.' });
    }

    // Pick a challenge based on day of year (rotates daily)
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    const challenge = pool[dayOfYear % pool.length];

    return challenge;
  }, [profile]);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-white transition-colors duration-300 font-sans selection:bg-emerald-500/30">
      <Navbar 
        onViewHistory={onViewHistory}
        onOpenSettings={onOpenSettings}
        onStart={() => {}} 
      />
      
      <main className="max-w-7xl mx-auto px-6 lg:px-12 py-24 space-y-8">
        
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 fade-in-up">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-400 dark:to-teal-200">{userName}</span>
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400">
              {streak > 0 
                ? `Ready to crush your next interview? You're on a ${streak}-day streak! 🔥`
                : interviews.length > 0 
                  ? "Ready to continue your practice? Let's go! 💪"
                  : "Start your first mock interview to track your progress! 🚀"}
            </p>
          </div>
          <Button 
            size="lg" 
            glow 
            onClick={handleStartClick}
            disabled={checkingLimit}
            leftIcon={checkingLimit ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
            className="shadow-xl shadow-emerald-500/20"
          >
            {checkingLimit ? "Checking..." : "New Interview"}
          </Button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          </div>
        )}

        {/* Stats Grid */}
        {!isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 fade-in-up" style={{ animationDelay: '0.1s' }}>
            {stats.map((stat, i) => (
              <div key={i} className="glass-card p-6 bg-white/50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 hover:shadow-lg transition-all duration-300 group">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 group-hover:bg-emerald-500/10 group-hover:text-emerald-500 transition-colors">
                    {stat.icon}
                  </div>
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                    {stat.change}
                  </span>
                </div>
                <div className="text-3xl font-bold mb-1 text-zinc-900 dark:text-white">{stat.value}</div>
                <div className="text-sm text-zinc-500 dark:text-zinc-400">{stat.label}</div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Main Content: Recent Activity & Recommend */}
            <div className="lg:col-span-2 space-y-8 fade-in-up" style={{ animationDelay: '0.2s' }}>
              
              {/* Recent Activity */}
              <div className="glass-card p-1 bg-white/50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-2xl">
                <div className="bg-white/40 dark:bg-black/40 rounded-[14px] p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-emerald-500" />
                      Recent Activity
                    </h2>
                    <button onClick={onViewHistory} className="text-sm text-zinc-500 hover:text-emerald-500 transition-colors flex items-center gap-1 group">
                      View All <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>

                  {recentActivity.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-4">
                        <Target className="w-8 h-8 text-zinc-400" />
                      </div>
                      <h3 className="font-semibold mb-2">No interviews yet</h3>
                      <p className="text-sm text-zinc-500 mb-4">Complete your first mock interview to see your activity here.</p>
                      <Button onClick={onStartNew} size="sm">Start Now</Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {recentActivity.map((item) => (
                        <div 
                          key={item.id} 
                          className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-white dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800 hover:border-emerald-500/30 transition-all cursor-pointer hover:shadow-md"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-lg text-zinc-700 dark:text-zinc-300 group-hover:text-emerald-500 transition-colors">
                              {item.score}
                            </div>
                            <div>
                              <h4 className="font-semibold text-zinc-900 dark:text-white">{item.role}</h4>
                              <div className="flex items-center gap-2 text-xs text-zinc-500 mt-1">
                                <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">{item.type}</span>
                                <span>• {item.date}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 self-end sm:self-center">
                            <span className={`text-xs font-medium px-3 py-1 rounded-full ${
                              item.status === 'Completed' 
                                ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10' 
                                : 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10'
                            }`}>
                              {item.status}
                            </span>
                            <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-emerald-500 transition-colors" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Recommended Challenge */}
              <div className="relative overflow-hidden rounded-2xl p-8 bg-gradient-to-r from-emerald-600 to-teal-600 shadow-xl transition-transform hover:scale-[1.01] duration-300">
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="space-y-3 text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-2">
                      <Zap className="w-5 h-5 text-yellow-300 fill-current" />
                      <span className="text-xs font-bold uppercase tracking-widest text-emerald-100/90">Daily Challenge</span>
                    </div>
                    <h3 className="text-3xl font-bold text-white tracking-tight">{dailyChallenge.title}</h3>
                    <p className="text-emerald-50 max-w-lg text-lg leading-relaxed">
                      {dailyChallenge.description}
                    </p>
                  </div>
                  <Button 
                    onClick={onStartNew}
                    className="bg-black/30 text-emerald-50 hover:bg-black/40 border border-emerald-400/30 shadow-lg backdrop-blur-sm min-w-[160px] h-12 text-base font-semibold"
                  >
                    Start Challenge
                  </Button>
                </div>
                
                {/* Decorative Glows */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-900/40 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />
              </div>

            </div>

            {/* Sidebar: Skills & Insights */}
            <div className="space-y-6 fade-in-up" style={{ animationDelay: '0.3s' }}>
              
              {/* Skill Breakdown */}
              <div className="glass-card p-6 bg-white/50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-2xl">
                <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-500" />
                  Skill Breakdown
                </h2>
                <div className="space-y-5">
                  {skills.map((skill) => (
                    <div key={skill.name}>
                      <div className="flex justify-between items-end mb-2">
                        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{skill.name}</span>
                        <span className="text-sm font-bold text-zinc-900 dark:text-white">{skill.score > 0 ? `${skill.score}%` : '-'}</span>
                      </div>
                      <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${skill.color} rounded-full transition-all duration-1000 ease-out`} 
                          style={{ width: `${skill.score}%` }} 
                        />
                      </div>
                    </div>
                  ))}
                </div>
                {interviews.length === 0 && (
                  <p className="text-xs text-zinc-500 text-center mt-4">
                    Complete interviews to see your skills analysis
                  </p>
                )}
                <button onClick={onViewHistory} className="w-full mt-6 py-2 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors border-t border-zinc-100 dark:border-zinc-800">
                  View Detailed Analysis
                </button>
              </div>

              {/* Quick Tips */}
              <div className="glass-card p-6 bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-500/10 rounded-2xl">
                <h3 className="font-bold text-emerald-800 dark:text-emerald-400 mb-3 flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  Pro Tip
                </h3>
                <p className="text-sm text-emerald-900/70 dark:text-emerald-200/70 leading-relaxed mb-4">
                  "During behavioral questions, use the STAR method: Situation, Task, Action, Result. It structures your answers perfectly."
                </p>
                <Link to="/guide" className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1">
                  Read guide <ArrowUpRight className="w-3 h-3" />
                </Link>
              </div>

            </div>
          </div>
        )}

      </main>
    </div>
  );
};
