import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import { Button } from './Button';
import { 
  InterviewResult, 
  PerformanceMetrics, 
  INTERVIEW_TYPES,
  InterviewConfig,
  TranscriptEntry
} from '../types';
import { generateInterviewFeedback, AIAnalysisResult } from '../utils/aiFeedback';
import { Loader2 } from 'lucide-react';
import { useSaveInterview } from '../hooks/useSupabase';
import { useAuth } from '../context/AuthContext';
import { 
  Trophy, 
  TrendingUp, 
  MessageSquare, 
  Lightbulb,
  Download,
  Share2,
  RotateCcw,
  Home,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertCircle,
  Target,
  Mic,
  Brain,
  Sparkles
} from 'lucide-react';

interface ResultsScreenProps {
  config: InterviewConfig;
  duration: number; // in seconds
  questionCount: number;
  warningCount: number;
  transcript?: TranscriptEntry[];
  onTryAgain: () => void;
  onGoHome: () => void;
}


export const ResultsScreen: React.FC<ResultsScreenProps> = ({ 
  config, 
  duration, 
  questionCount,
  warningCount,
  onTryAgain, 
  onGoHome,
  transcript
}) => {
  const { user } = useAuth();
  const { saveInterview, isSaving } = useSaveInterview();
  const [hasSaved, setHasSaved] = useState(false);
  
  const [showFullFeedback, setShowFullFeedback] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Initialize with default zero metrics
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    communication: 0,
    technicalKnowledge: 0,
    problemSolving: 0,
    confidence: 0,
    clarity: 0,
    overallScore: 0
  });

  const [feedback, setFeedback] = useState<any>({
    summary: "Waiting for analysis...",
    strengths: [],
    areasToImprove: [],
    tips: []
  });

  // Run analysis when component mounts if transcript exists
  useEffect(() => {
    let active = true;

    const analyzeInterview = async () => {
      if (transcript && transcript.length > 0 && !hasSaved) {
        setIsAnalyzing(true);
        try {
          // Add a small delay for better UX (so user sees "Analyzing")
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          if (!active) return;
          
          const result = await generateInterviewFeedback(transcript, config);
          
          if (active) {
             setMetrics(result.metrics);
             setFeedback(result.feedback);
             
             // Save to database
             if (user) {
               await saveResultsToDb(result);
             }
          }
        } catch (err) {
          console.error("Analysis failed:", err);
          // Fallback to mock data if analysis fails completely? 
          // For now just keep error state or previous state
        } finally {
          if (active) setIsAnalyzing(false);
        }
      } else if (!transcript?.length && !hasSaved && user) {
         // Save mock data if no transcript (demo mode)
         saveResultsToDb({ metrics, feedback });
      }
    };

    analyzeInterview();
    return () => { active = false; };
  }, [transcript, config]); // Removed user/hasSaved from dependency array to prevent double runs, controlled inside

  const saveResultsToDb = async (data: { metrics: PerformanceMetrics, feedback: any }) => {
     if (hasSaved) return;
     
     const interviewId = await saveInterview({
        config: {
          candidateName: config.candidateName,
          jobRole: config.jobRole,
          jobDescription: config.jobDescription,
          experienceLevel: config.experienceLevel,
          interviewType: config.interviewType,
          companyName: config.companyName,
          skills: config.skills,
          duration: config.duration,
        },
        status: 'completed',
        duration: duration,
        questionsAsked: questionCount,
        warningCount: warningCount,
        overallScore: data.metrics.overallScore,
        metrics: data.metrics,
        feedback: data.feedback,
        transcript: transcript?.map(t => ({
          ...t,
          timestamp: t.timestamp.toISOString()
        }))
      });
      
      if (interviewId) {
        setHasSaved(true);
        console.log('Interview saved successfully:', interviewId);
      }
  };

  const selectedTypeInfo = INTERVIEW_TYPES.find(t => t.id === config.interviewType);
  
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-400';
    if (score >= 70) return 'text-amber-400';
    return 'text-red-400';
  };

  const getScoreGradient = (score: number) => {
    if (score >= 85) return 'from-emerald-500 to-emerald-400';
    if (score >= 70) return 'from-amber-500 to-amber-400';
    return 'from-red-500 to-red-400';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Very Good';
    if (score >= 70) return 'Good';
    if (score >= 60) return 'Fair';
    return 'Needs Improvement';
  };

  const metricItems = [
    { key: 'communication', label: 'Communication', icon: <Mic className="w-4 h-4" />, value: metrics.communication },
    { key: 'technicalKnowledge', label: 'Technical Knowledge', icon: <Brain className="w-4 h-4" />, value: metrics.technicalKnowledge },
    { key: 'problemSolving', label: 'Problem Solving', icon: <Target className="w-4 h-4" />, value: metrics.problemSolving },
    { key: 'confidence', label: 'Confidence', icon: <Sparkles className="w-4 h-4" />, value: metrics.confidence },
    { key: 'clarity', label: 'Clarity', icon: <MessageSquare className="w-4 h-4" />, value: metrics.clarity },
  ];

  // Download report as PDF
  const handleDownload = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPos = 20;
    
    // Helper function to check and add new page if needed
    const checkPageBreak = (neededSpace: number) => {
      if (yPos + neededSpace > pageHeight - 30) {
        doc.addPage();
        yPos = 20;
        return true;
      }
      return false;
    };
    
    // Header
    doc.setFillColor(24, 24, 27); // zinc-900
    doc.rect(0, 0, pageWidth, 45, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('MockMate', 20, 25);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('AI Interview Report', 20, 35);
    
    yPos = 60;
    doc.setTextColor(0, 0, 0);
    
    // Candidate Info Section
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Candidate Information', 20, yPos);
    yPos += 10;
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text(`Name: ${config.candidateName}`, 20, yPos);
    yPos += 7;
    doc.text(`Role: ${config.jobRole}`, 20, yPos);
    yPos += 7;
    doc.text(`Interview Type: ${selectedTypeInfo?.title || config.interviewType}`, 20, yPos);
    yPos += 7;
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, yPos);
    yPos += 7;
    doc.text(`Duration: ${formatDuration(duration)} | Questions Asked: ${questionCount}`, 20, yPos);
    yPos += 7;
    if (warningCount > 0) {
      doc.setTextColor(239, 68, 68);
      doc.text(`Warnings: ${warningCount}`, 20, yPos);
      doc.setTextColor(80, 80, 80);
    }
    yPos += 18;
    
    // Overall Score
    checkPageBreak(50);
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Overall Score', 20, yPos);
    yPos += 12;
    
    const scoreColor = metrics.overallScore >= 70 ? [34, 197, 94] : [239, 68, 68];
    doc.setFillColor(scoreColor[0], scoreColor[1], scoreColor[2]);
    doc.roundedRect(20, yPos, 55, 28, 4, 4, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text(`${metrics.overallScore}/100`, 26, yPos + 19);
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.text(getScoreLabel(metrics.overallScore), 85, yPos + 19);
    yPos += 45;
    
    // Performance Metrics
    checkPageBreak(80);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Performance Metrics', 20, yPos);
    yPos += 12;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const metricsData = [
      ['Communication', metrics.communication],
      ['Technical Knowledge', metrics.technicalKnowledge],
      ['Problem Solving', metrics.problemSolving],
      ['Confidence', metrics.confidence],
      ['Clarity', metrics.clarity]
    ];
    
    metricsData.forEach(([label, value]) => {
      checkPageBreak(12);
      doc.setTextColor(60, 60, 60);
      doc.text(`${label}:`, 20, yPos);
      
      // Progress bar background
      doc.setFillColor(229, 231, 235);
      doc.roundedRect(85, yPos - 4, 80, 7, 2, 2, 'F');
      
      // Progress bar fill
      const barColor = (value as number) >= 70 ? [34, 197, 94] : [251, 191, 36];
      doc.setFillColor(barColor[0], barColor[1], barColor[2]);
      doc.roundedRect(85, yPos - 4, (value as number) * 0.8, 7, 2, 2, 'F');
      
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'bold');
      doc.text(`${value}%`, 170, yPos);
      doc.setFont('helvetica', 'normal');
      yPos += 12;
    });
    yPos += 15;
    
    // AI Feedback Summary
    checkPageBreak(40);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('AI Feedback Summary', 20, yPos);
    yPos += 10;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    const summaryLines = doc.splitTextToSize(feedback.summary, pageWidth - 40);
    summaryLines.forEach((line: string) => {
      checkPageBreak(7);
      doc.text(line, 20, yPos);
      yPos += 6;
    });
    yPos += 12;
    
    // Strengths
    checkPageBreak(30);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(34, 197, 94); // green
    doc.text('✓ Strengths', 20, yPos);
    yPos += 9;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    feedback.strengths.forEach(s => {
      checkPageBreak(8);
      doc.text(`  • ${s}`, 22, yPos);
      yPos += 7;
    });
    yPos += 10;
    
    // Areas to Improve
    checkPageBreak(30);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(251, 146, 60); // orange
    doc.text('⚠ Areas to Improve', 20, yPos);
    yPos += 9;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    feedback.areasToImprove.forEach(a => {
      checkPageBreak(8);
      doc.text(`  • ${a}`, 22, yPos);
      yPos += 7;
    });
    yPos += 10;
    
    // Tips for Improvement
    checkPageBreak(30);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(59, 130, 246); // blue
    doc.text('💡 Tips for Improvement', 20, yPos);
    yPos += 9;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    feedback.tips.forEach(t => {
      checkPageBreak(8);
      doc.text(`  • ${t}`, 22, yPos);
      yPos += 7;
    });
    
    // Footer on last page
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text('Generated by MockMate AI Interviewer', 20, pageHeight - 10);
      doc.text(`Page ${i} of ${totalPages}`, pageWidth - 40, pageHeight - 10);
    }
    
    // Save PDF
    doc.save(`mockmate-report-${config.candidateName.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // Share results
  const handleShare = async () => {
    const shareData = {
      title: 'MockMate Interview Results',
      text: `I scored ${metrics.overallScore}/100 (${getScoreLabel(metrics.overallScore)}) on my ${selectedTypeInfo?.title || config.interviewType} interview practice for ${config.jobRole}! 🎯`,
      url: window.location.href
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
        alert('Results copied to clipboard!');
      }
    } catch (err) {
      console.error('Share failed:', err);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-white py-8 px-4 md:px-8 transition-colors duration-300">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="glow-orb glow-orb-purple w-[500px] h-[500px] -top-[200px] left-1/4 opacity-10 dark:opacity-20" />
        <div className="glow-orb glow-orb-blue w-[400px] h-[400px] bottom-0 right-0 opacity-10 dark:opacity-20" />
      </div>

      <div className="max-w-4xl mx-auto relative z-10 space-y-6">
        
        {/* Header */}
        <div className="text-center mb-8 fade-in-up">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white shadow-lg shadow-emerald-500/10 dark:shadow-[0_0_30px_rgba(255,255,255,0.2)] mb-4">
            <Trophy className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Interview Complete!</h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Great job, {config.candidateName}! Here's your performance summary.
          </p>
        </div>

        {/* Loading Overlay */}
        {isAnalyzing && (
          <div className="flex flex-col items-center justify-center py-12 fade-in-up">
             <div className="relative w-20 h-20 mb-6">
                <div className="absolute inset-0 rounded-full border-4 border-zinc-200 dark:border-zinc-800"></div>
                <div className="absolute inset-0 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin"></div>
                <Sparkles className="absolute inset-0 m-auto w-8 h-8 text-emerald-500 animate-pulse" />
             </div>
             <h2 className="text-2xl font-bold mb-2">Analyzing Performance...</h2>
             <p className="text-zinc-500">Our AI is reviewing your answers to provide detailed feedback.</p>
          </div>
        )}

        {/* No Data State */}
        {!isAnalyzing && metrics.overallScore === 0 && (!transcript || transcript.length === 0) && (
          <div className="flex flex-col items-center justify-center py-12 fade-in-up text-center">
            <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-6">
              <AlertCircle className="w-10 h-10 text-zinc-400" />
            </div>
            <h2 className="text-2xl font-bold mb-2">No Interview Data</h2>
            <p className="text-zinc-500 dark:text-zinc-400 max-w-md mx-auto mb-8">
              We couldn't find any interview transcript to analyze. This usually happens if the interview was too short or if there were connection issues.
            </p>
            <div className="flex gap-4">
               <Button onClick={onTryAgain} size="lg" glow>Practice Again</Button>
               <Button onClick={onGoHome} variant="secondary" size="lg">Go Home</Button>
            </div>
          </div>
        )}

        {/* Score & Success Section */}
        {!isAnalyzing && (
        <>
        <div className="grid lg:grid-cols-2 gap-6 fade-in-up" style={{ animationDelay: '0.1s' }}>
          
          {/* Left: Score Card */}
          <div className="glass-card-elevated p-8 text-center flex flex-col items-center justify-center bg-white/50 dark:bg-zinc-900/50">
            <div className="relative w-48 h-48 mb-6">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="96"
                  cy="96"
                  r="80"
                  stroke="currentColor"
                  strokeWidth="10"
                  fill="none"
                  className="text-zinc-100 dark:text-white/5"
                />
                <circle
                  cx="96"
                  cy="96"
                  r="80"
                  stroke="url(#scoreGradient)"
                  strokeWidth="10"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={502}
                  strokeDashoffset={502 - (502 * metrics.overallScore / 100)}
                  className="transition-all duration-1000 ease-out"
                />
                <defs>
                  <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor={metrics.overallScore >= 70 ? '#22c55e' : '#ef4444'} />
                    <stop offset="100%" stopColor={metrics.overallScore >= 70 ? '#10b981' : '#f87171'} />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-6xl font-bold ${getScoreColor(metrics.overallScore)}`}>
                  {metrics.overallScore}
                </span>
                <span className="text-xs text-zinc-500 uppercase tracking-wider mt-1">Score</span>
              </div>
            </div>

            <div className={`text-3xl font-bold ${getScoreColor(metrics.overallScore)} mb-2`}>
              {getScoreLabel(metrics.overallScore)}
            </div>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm">{selectedTypeInfo?.title} Interview</p>
          </div>

          {/* Right: Hero Image */}
          <div className="relative rounded-2xl overflow-hidden">
            <img 
              src="/results-hero.png" 
              alt="Success Celebration" 
              className="absolute w-full h-full object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 p-8">
               <h3 className="text-xl font-bold text-white mb-2">Keep Crushing It!</h3>
               
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 fade-in-up" style={{ animationDelay: '0.2s' }}>
          {metricItems.map((item) => (
            <div key={item.key} className="glass-card p-4 text-center bg-white/50 dark:bg-zinc-900/50">
              <div className="flex items-center justify-center gap-1 text-zinc-500 mb-2">
                {item.icon}
              </div>
              <div className={`text-2xl font-bold ${getScoreColor(item.value)} mb-1`}>
                {item.value}
              </div>
              <div className="text-xs text-zinc-500">{item.label}</div>
              <div className="mt-2 h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full bg-gradient-to-r ${getScoreGradient(item.value)} transition-all duration-1000`}
                  style={{ width: `${item.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Feedback Section */}
        <div className="glass-card p-6 fade-in-up bg-white/50 dark:bg-zinc-900/50" style={{ animationDelay: '0.3s' }}>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-500" />
            AI Feedback Summary
          </h3>
          <p className="text-zinc-600 dark:text-zinc-300 mb-6">{feedback.summary}</p>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Strengths */}
            <div>
              <h4 className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Strengths
              </h4>
              <ul className="space-y-2">
                {feedback.strengths.map((strength, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                    {strength}
                  </li>
                ))}
              </ul>
            </div>

            {/* Areas to Improve */}
            <div>
              <h4 className="text-sm font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Areas to Improve
              </h4>
              <ul className="space-y-2">
                {feedback.areasToImprove.map((area, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                    {area}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Expandable Tips */}
          <button 
            onClick={() => setShowFullFeedback(!showFullFeedback)}
            className="mt-6 w-full flex items-center justify-center gap-2 py-3 text-sm text-zinc-500 hover:text-black dark:text-zinc-400 dark:hover:text-white transition-colors border-t border-zinc-200 dark:border-zinc-800"
          >
            {showFullFeedback ? 'Hide' : 'Show'} Improvement Tips
            {showFullFeedback ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showFullFeedback && (
            <div className="mt-4 p-4 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl border border-indigo-100 dark:border-indigo-500/20">
              <h4 className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Pro Tips for Next Time
              </h4>
              <ul className="space-y-2">
                {feedback.tips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-300">
                    <span className="text-indigo-500 dark:text-indigo-400">💡</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 fade-in-up" style={{ animationDelay: '0.4s' }}>
          <Button 
            variant="outline" 
            size="lg"
            leftIcon={<Download className="w-5 h-5" />}
            className="flex-1"
            onClick={handleDownload}
          >
            Download Report
          </Button>
          <Button 
            variant="outline" 
            size="lg"
            leftIcon={<Share2 className="w-5 h-5" />}
            className="flex-1"
            onClick={handleShare}
          >
            Share Results
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            variant="secondary" 
            size="lg"
            leftIcon={<Home className="w-5 h-5" />}
            onClick={onGoHome}
            className="flex-1"
          >
            Go Home
          </Button>
          <Button 
            size="lg"
            glow
            leftIcon={<RotateCcw className="w-5 h-5" />}
            onClick={onTryAgain}
            className="flex-1"
          >
            Practice Again
          </Button>
        </div>
        </>
      )}
      </div>
    </div>
  );
};
