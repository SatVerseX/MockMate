import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from './Button';
import { InterviewConfig, InterviewType, ExperienceLevel, INTERVIEW_TYPES } from '../types';
import { 
  Briefcase, 
  FileText, 
  User, 
  Building2,
  ArrowLeft,
  ArrowRight,
  Check,
  Clock,
  Zap,
  Target,
  GraduationCap,
  Crown,
  Sparkles
} from 'lucide-react';
import { 
  TechnicalIcon, 
  BehavioralIcon, 
  HRIcon, 
  SystemDesignIcon 
} from './RichIcons';
import { extractTextFromPDF } from '../utils/pdfUtils';
import { Loader2, CheckCircle2 } from 'lucide-react';

interface SetupScreenProps {
  onComplete: (config: InterviewConfig) => void;
  onBack?: () => void;
}

const EXPERIENCE_LEVELS: { level: ExperienceLevel; icon: React.ReactNode; label: string }[] = [
  { level: 'Entry', icon: <GraduationCap className="w-3.5 h-3.5" />, label: '0-2y' },
  { level: 'Mid', icon: <Target className="w-3.5 h-3.5" />, label: '2-5y' },
  { level: 'Senior', icon: <Zap className="w-3.5 h-3.5" />, label: '5-8y' },
  { level: 'Lead', icon: <Crown className="w-3.5 h-3.5" />, label: '8+y' },
];

export const SetupScreen: React.FC<SetupScreenProps> = ({ onComplete, onBack }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [candidateName, setCandidateName] = useState('');
  const [jobRole, setJobRole] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [skills, setSkills] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [portfolioLinks, setPortfolioLinks] = useState('');
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('Mid');
  const [interviewType, setInterviewType] = useState<InterviewType>('technical');
  const [duration, setDuration] = useState(25);
  const [isUploading, setIsUploading] = useState(false);
  const [hasProfileResume, setHasProfileResume] = useState(false);
  
  const { profile } = useAuth();

  // Load resume from profile if available
  useEffect(() => {
    if (profile?.resumeUrl && !resumeText) {
      setHasProfileResume(true);
    }
  }, [profile, resumeText]);

  const selectedTypeInfo = INTERVIEW_TYPES.find(t => t.id === interviewType);

  const handleContinue = () => {
    if (step === 1) {
      if (!candidateName.trim()) return;
      setStep(2);
    } else {
      if (!jobRole.trim()) return;
      onComplete({ 
        candidateName, 
        jobRole, 
        jobDescription, 
        experienceLevel, 
        interviewType,
        companyName,
        skills,
        resumeText,
        portfolioLinks,
        duration
      });
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
    } else if (onBack) {
      onBack();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      if (file.type === 'application/pdf') {
        setIsUploading(true);
        const text = await extractTextFromPDF(file);
        setResumeText(text);
        setIsUploading(false);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setResumeText(text);
      };
      reader.readAsText(file);
    } catch (error) {
      console.error('File upload error:', error);
      alert('Failed to read file. Please try copy-pasting the text instead.');
      setIsUploading(false);
    }
  };

  const isStep1Valid = candidateName.trim().length > 0;
  const isStep2Valid = jobRole.trim().length > 0;

  const getInterviewIcon = (id: InterviewType, size: 'sm' | 'md' = 'md') => {
    const sizeClass = size === 'sm' ? 'scale-75' : '';
    switch (id) {
      case 'technical': return <div className={sizeClass}><TechnicalIcon size="md" /></div>;
      case 'behavioral': return <div className={sizeClass}><BehavioralIcon size="md" /></div>;
      case 'hr': return <div className={sizeClass}><HRIcon size="md" /></div>;
      case 'system-design': return <div className={sizeClass}><SystemDesignIcon size="md" /></div>;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-white flex flex-col font-sans selection:bg-emerald-500/30 transition-colors duration-300">
      {/* Background Ambience */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-emerald-500/10 dark:bg-emerald-500/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-blue-500/10 dark:bg-blue-500/10 blur-[100px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-8 py-6">
        <button 
          onClick={handleBack}
          className="group flex items-center gap-2 text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors"
        >
          <div className="p-2 rounded-full group-hover:bg-black/5 dark:group-hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </div>
          <span className="text-sm font-medium">Back</span>
        </button>
        
        {/* Progress Stepper */}
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 ${step >= 1 ? 'text-zinc-900 dark:text-white' : 'text-zinc-400 dark:text-zinc-600'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border transition-all ${
              step >= 1 ? 'bg-emerald-500 border-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-900'
            }`}>
              {step > 1 ? <Check className="w-4 h-4" /> : '1'}
            </div>
            <span className="text-sm font-medium hidden sm:block">Personal Details</span>
          </div>
          
          <div className={`w-12 h-[1px] ${step > 1 ? 'bg-emerald-500/50' : 'bg-zinc-300 dark:bg-zinc-800'}`} />
          
          <div className={`flex items-center gap-2 ${step >= 2 ? 'text-zinc-900 dark:text-white' : 'text-zinc-400 dark:text-zinc-600'}`}>
             <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border transition-all ${
              step >= 2 ? 'bg-emerald-500 border-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-900'
            }`}>
              2
            </div>
            <span className="text-sm font-medium hidden sm:block">Configuration</span>
          </div>
        </div>

        <div className="w-24" /> {/* Spacer */}
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pb-12">
        <div className="w-full max-w-5xl fade-in-up">
          
          {/* Header Text */}
          <div className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 bg-gradient-to-br from-zinc-900 via-zinc-700 to-zinc-500 dark:from-white dark:via-zinc-200 dark:to-zinc-500 bg-clip-text text-transparent">
              {step === 1 ? 'Start Your Journey' : 'Tailor Your Interview'}
            </h1>
            <p className="text-zinc-400 text-lg max-w-xl mx-auto">
              {step === 1 
                ? 'Tell us a bit about yourself so we can personalize the experience.' 
                : 'Configure the specifics to simulate your real-world scenario.'}
            </p>
          </div>

          {/* Form Content */}
          {step === 1 ? (
            <div className="grid lg:grid-cols-12 gap-6">
              {/* Left Column: Personal Info */}
              <div className="lg:col-span-5 space-y-6">
                <div className="glass-card p-1 bg-white/50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-2xl">
                 <div className="bg-white/10 dark:bg-black/40 rounded-[14px] p-6 h-full">
                    <label className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-4">
                      <User className="w-4 h-4" />
                      Candidate Name
                    </label>
                    <input
                      type="text"
                      value={candidateName}
                      onChange={(e) => setCandidateName(e.target.value)}
                      className="w-full bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all text-lg"
                      placeholder="e.g. Ram"
                      autoFocus
                    />
                  </div>
                </div>

                <div className="glass-card p-1 bg-white/50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-2xl">
                  <div className="bg-white/10 dark:bg-black/40 rounded-[14px] p-6 h-full">
                    <label className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-4">
                      <Target className="w-4 h-4" />
                      Experience Level
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {EXPERIENCE_LEVELS.map(({ level, icon, label }) => (
                         // ... existing buttons ...
                         <button
                          key={level}
                          onClick={() => setExperienceLevel(level)}
                          className={`group relative p-3 rounded-xl text-left border transition-all duration-300 ${
                            experienceLevel === level
                              ? 'bg-emerald-500/10 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.1)]'
                              : 'bg-white dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/40'
                          }`}
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                              experienceLevel === level ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 group-hover:text-zinc-700 dark:group-hover:text-zinc-300'
                            }`}>
                              {icon}
                            </div>
                            <span className={`text-sm font-semibold ${
                              experienceLevel === level ? 'text-zinc-900 dark:text-white' : 'text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white'
                            }`}>
                              {level}
                            </span>
                          </div>
                          <div className={`text-xs pl-11 ${
                            experienceLevel === level ? 'text-emerald-600/80 dark:text-emerald-400/80' : 'text-zinc-500 dark:text-zinc-600'
                          }`}>
                            {label} experience
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Additional Context: Resume & Portfolio */}
                <div className="glass-card p-1 bg-white/50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-2xl">
                  <div className="bg-white/10 dark:bg-black/40 rounded-[14px] p-6 h-full space-y-4">
                    <label className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                      <FileText className="w-4 h-4" />
                      Resume & Portfolio
                    </label>
                    
                    <div>
                      <input
                        type="text"
                        value={portfolioLinks}
                        onChange={(e) => setPortfolioLinks(e.target.value)}
                         className="w-full bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all text-sm mb-3"
                        placeholder="Portfolio / LinkedIn URL"
                      />
                      
                      {/* Show profile resume indicator */}
                      {hasProfileResume && !resumeText && (
                        <div className="mb-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            <span className="text-sm text-zinc-700 dark:text-zinc-300">
                              Resume from profile: <span className="font-medium">{profile?.resumeName || 'Resume'}</span>
                            </span>
                          </div>
                          <a
                            href={profile?.resumeUrl || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
                          >
                            View
                          </a>
                        </div>
                      )}
                      
                      <div className="relative">
                        <textarea
                          value={resumeText}
                          onChange={(e) => setResumeText(e.target.value)}
                          className="w-full min-h-[100px] bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all text-sm resize-y"
                          placeholder={hasProfileResume ? "Add additional context or paste different resume..." : "Paste your resume content here..."}
                        />
                        <div className="absolute bottom-3 right-3">
                           <label className="cursor-pointer bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs px-3 py-1.5 rounded-lg border border-emerald-500/20 transition-colors flex items-center gap-2">
                             <FileText size={12} />
                             Upload File
                             <input 
                               type="file" 
                               accept=".txt,.md,.pdf"
                               className="hidden" 
                               onChange={handleFileUpload}
                             />
                           </label>
                           {isUploading && <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />}
                        </div>
                      </div>
                       <p className="text-[10px] text-zinc-400 mt-2 ml-1">
                        {hasProfileResume && !resumeText 
                          ? "✓ Your profile resume will be used. Add text above to supplement."
                          : "Supported: Text, Markdown, PDF."
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Interview Selection */}
              <div className="lg:col-span-7">
                <div className="glass-card p-1 h-full bg-white/50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-2xl">
                  <div className="bg-white/10 dark:bg-black/40 rounded-[14px] p-6 h-full flex flex-col">
                    <label className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-6">
                      <Sparkles className="w-4 h-4" />
                      Select Interview Type
                    </label>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
                      {INTERVIEW_TYPES.map((type) => (
                        <button
                          key={type.id}
                          onClick={() => {
                            setInterviewType(type.id);
                            setDuration(type.duration);
                          }}
                          className={`relative p-4 rounded-xl text-left border transition-all duration-300 group flex flex-col ${
                            interviewType === type.id
                              ? 'bg-gradient-to-br from-emerald-500/10 to-transparent border-emerald-500/50 ring-1 ring-emerald-500/20'
                              : 'bg-white dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/40'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="transform scale-90 origin-top-left transition-transform group-hover:scale-100 duration-300">
                              {getInterviewIcon(type.id)}
                            </div>
                            {interviewType === type.id && (
                              <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                                <Check className="w-3.5 h-3.5 text-black stroke-[3]" />
                              </div>
                            )}
                          </div>
                          
                          <div className="mt-auto">
                            <h3 className={`font-bold text-base mb-1 transition-colors ${
                              interviewType === type.id ? 'text-zinc-900 dark:text-white' : 'text-zinc-600 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-white'
                            }`}>
                              {type.title}
                            </h3>
                            <p className="text-xs text-zinc-500 leading-relaxed mb-3 min-h-[2.5em]">
                              {type.description}
                            </p>
                            <div className={`flex items-center gap-2 text-xs font-medium py-1 px-2 rounded w-fit ${
                              interviewType === type.id ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                            }`}>
                              <Clock className="w-3 h-3" />
                              {type.duration} mins
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Step 2 Content */
            <div className="space-y-6">
              {/* Summary Bar */}
              <div className="glass-card p-1 bg-white/50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-2xl">
                <div className="bg-white/10 dark:bg-black/40 rounded-[14px] px-6 py-4 flex flex-wrap items-center gap-6">
                  <div className="flex items-center gap-4 min-w-[200px]">
                    <div className="transform scale-75 origin-center bg-zinc-100 dark:bg-zinc-900 rounded-xl p-1 border border-zinc-200 dark:border-zinc-800">
                      {getInterviewIcon(interviewType)}
                    </div>
                    <div>
                      <div className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Type</div>
                      <div className="font-semibold text-zinc-900 dark:text-white">{selectedTypeInfo?.title}</div>
                    </div>
                  </div>
                  <div className="w-px h-10 bg-zinc-200 dark:bg-zinc-800 hidden sm:block" />
                  <div>
                     <div className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Candidate</div>
                     <div className="font-semibold text-zinc-900 dark:text-white">{candidateName}</div>
                  </div>
                  <div className="w-px h-10 bg-zinc-200 dark:bg-zinc-800 hidden sm:block" />
                  <div className="flex gap-2 ml-auto">
                    <span className="px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 text-xs font-medium">
                      {experienceLevel} Level
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid lg:grid-cols-12 gap-6">
                {/* Left Column: Core Info */}
                <div className="lg:col-span-7 glass-card p-1 bg-white/50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-2xl">
                  <div className="bg-white/10 dark:bg-black/40 rounded-[14px] p-8 h-full space-y-8">
                     <div>
                      <label className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-3">
                        <Briefcase className="w-4 h-4" />
                        Target Role <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={jobRole}
                        onChange={(e) => setJobRole(e.target.value)}
                        className="w-full bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                        placeholder="e.g. Senior Frontend Engineer"
                        autoFocus
                      />
                    </div>

                    <div className="grid sm:grid-cols-2 gap-6">
                      <div>
                        <label className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-3">
                          <Building2 className="w-4 h-4" />
                          Company
                        </label>
                        <input
                          type="text"
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          className="w-full bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all text-sm"
                          placeholder="e.g. Google (Optional)"
                        />
                      </div>
                      <div>
                        <label className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-3">
                          <Zap className="w-4 h-4" />
                          Top Skills
                        </label>
                        <input
                          type="text"
                          value={skills}
                          onChange={(e) => setSkills(e.target.value)}
                          className="w-full bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all text-sm"
                          placeholder="e.g. React, Node (Optional)"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-3">
                        <Clock className="w-4 h-4" />
                        Duration
                      </label>
                      <div className="bg-white dark:bg-zinc-900/50 rounded-xl p-4 border border-zinc-200 dark:border-zinc-800">
                        <div className="flex justify-between items-center mb-4">
                           <span className="text-sm text-zinc-500 dark:text-zinc-400">Length</span>
                           <span className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">{duration} min</span>
                        </div>
                        <input
                          type="range"
                          min={10}
                          max={60}
                          step={5}
                          value={duration}
                          onChange={(e) => setDuration(Number(e.target.value))}
                          className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-emerald-500 [&::-webkit-slider-thumb]:cursor-pointer hover:[&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(16,185,129,0.5)] transition-all"
                        />
                         <div className="flex justify-between text-[10px] text-zinc-500 dark:text-zinc-600 mt-2 font-mono">
                          <span>10m</span>
                          <span>30m</span>
                          <span>60m</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Context */}
                <div className="lg:col-span-5 glass-card p-1 bg-white/50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-2xl">
                  <div className="bg-white/10 dark:bg-black/40 rounded-[14px] p-8 h-full flex flex-col">
                    <label className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-3">
                      <FileText className="w-4 h-4" />
                      Job Description
                    </label>
                    <div className="flex-1">
                      <textarea
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                        className="w-full h-full min-h-[200px] bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all text-sm resize-none"
                        placeholder="Paste the job description here. This allows the AI to tailor questions specifically to the role's requirements..."
                      />
                    </div>
                    <div className="mt-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/10">
                      <div className="flex gap-3">
                        <Sparkles className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">Pro Tip:</span> Adding a job description significantly improves the relevance of technical and behavioral questions.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Area */}
          <div className="mt-10 flex justify-center">
            <Button 
              onClick={handleContinue} 
              disabled={step === 1 ? !isStep1Valid : !isStep2Valid}
              size="xl"
              glow={step === 1 ? isStep1Valid : isStep2Valid}
              rightIcon={<ArrowRight className="w-5 h-5" />}
              className="px-12 py-4 text-lg min-w-[240px]"
            >
              {step === 1 ? 'Configure Role' : 'Start System Check'}
            </Button>
          </div>

        </div>
      </main>
    </div>
  );
};