import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { InterviewConfig, INTERVIEW_TYPES } from '../types';
import { 
  ShieldCheck, 
  Clock, 
  Smartphone,
  ArrowLeft,
  Play,
  CheckCircle2,
  Cpu,
  Zap,
  Layout,
  User,
  Monitor
} from 'lucide-react';
import { 
  SystemDesignIcon, 
  VoiceFeatureIcon, 
  VideoFeatureIcon, 
  HRIcon, 
  SecurityFeatureIcon,
  TechnicalIcon,
  BehavioralIcon,
  SystemDesignIcon as SystemDesignTypeIcon
} from './RichIcons';

interface InstructionsScreenProps {
  config: InterviewConfig;
  onStart: (stream: MediaStream) => void;
  onBack?: () => void;
}

export const InstructionsScreen: React.FC<InstructionsScreenProps> = ({ config, onStart, onBack }) => {
  const [hasAgreed, setHasAgreed] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);

  const selectedTypeInfo = INTERVIEW_TYPES.find(t => t.id === config.interviewType);

  const handleStart = async () => {
    try {
      // Request screen share permission
      // We purposefully don't use 'monitor' constraint to avoid browser compatibility issues
      // instead we check the result settings
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      
      const track = stream.getVideoTracks()[0];
      const settings = track.getSettings();

      // Check if the user shared the entire screen (displaySurface should be 'monitor')
      // Note: 'monitor' is the standard value for entire screen sharing in most browsers
      if (settings.displaySurface && settings.displaySurface !== 'monitor') {
        // Stop the stream immediately
        track.stop();
        alert("Integrity Check Failed: You must share your ENTIRE SCREEN. Sharing a single window or tab is not allowed.");
        return;
      }

      setScreenStream(stream);
      setCountdown(3);
    } catch (err) {
      console.error("Screen share denied:", err);
      // Only show alert if it wasn't just a user cancellation (which throws NotAllowedError)
      if ((err as any).name !== 'NotAllowedError') {
         alert("Screen sharing is required to proceed with the interview for anti-cheating purposes.");
      }
    }
  };

  // Countdown effect
  useEffect(() => {
    if (countdown === null) return;
    
    if (countdown === 0) {
      if (screenStream) {
        onStart(screenStream);
      }
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, onStart, screenStream]);

  const guidelines = [
    {
      icon: <Monitor className="w-5 h-5 text-indigo-400" />,
      title: "Environment",
      text: "Find a quiet, well-lit space. Ensure your internet connection is stable."
    },
    {
      icon: <VoiceFeatureIcon size="sm" />,
      title: "Audio",
      text: "Use quality headphones/mic. Speak clearly and verify your audio input."
    },
    {
      icon: <VideoFeatureIcon size="sm" />,
      title: "Video",
      text: "Keep your camera on. Sit upright with your face clearly visible."
    },
    {
      icon: <HRIcon size="sm" />,
      title: "Responses",
      text: "Be detailed but concise. The AI evaluates both content and delivery."
    },
    {
      icon: <SecurityFeatureIcon size="sm" />,
      title: "Integrity",
      text: "Full-screen is mandatory. Tab switching or phone use will be flagged."
    },
  ];

  // Countdown overlay
  if (countdown !== null) {
    return (
      <div className="fixed inset-0 z-50 bg-white dark:bg-black flex flex-col items-center justify-center overflow-hidden transition-colors duration-500">
        {/* Ambient Background */}
        <div className="absolute inset-0">
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 dark:bg-emerald-500/20 rounded-full blur-[120px] animate-pulse" />
        </div>

        <div className="relative z-10 text-center">
          <div className="relative w-48 h-48 mx-auto mb-10">
            {/* Spinning Outer Ring */}
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-emerald-500 border-r-teal-500 animate-spin" style={{ animationDuration: '2s' }} />
            <div className="absolute inset-2 rounded-full border-2 border-zinc-200 dark:border-white/10" />
            
            {/* Countdown Number */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-8xl font-black bg-clip-text text-transparent bg-gradient-to-br from-zinc-900 to-zinc-500 dark:from-white dark:to-zinc-500 scale-110 animate-pulse">
                {countdown}
              </span>
            </div>
          </div>
          
          <h2 className="text-4xl font-bold text-zinc-900 dark:text-white mb-3 tracking-tight">Get Ready</h2>
          <p className="text-lg text-zinc-500 dark:text-zinc-400">Starting session environment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black text-zinc-900 dark:text-white flex flex-col relative overflow-hidden selection:bg-emerald-500/30 transition-colors duration-500">
      {/* Dynamic Background */}
      {/* Dynamic Background */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-white dark:from-emerald-900/10 to-transparent pointer-events-none" />
      <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-6 lg:px-12 border-b border-zinc-200 dark:border-white/5 bg-white/70 dark:bg-black/50 backdrop-blur-md sticky top-0 transition-colors duration-500">
        <button 
          onClick={onBack}
          className="group flex items-center gap-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all duration-300"
        >
          <div className="w-8 h-8 rounded-full bg-zinc-200/50 dark:bg-white/5 flex items-center justify-center group-hover:bg-zinc-200 dark:group-hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          </div>
          <span className="font-medium">Back to Setup</span>
        </button>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          System Ready
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-6xl">
          
          <div className="grid lg:grid-cols-12 gap-12">
            
            {/* Left Column: Context & Guidelines */}
            <div className="lg:col-span-7 space-y-8">
              
              <div className="space-y-4">
                <h1 className="text-5xl font-bold tracking-tight text-zinc-900 dark:text-white">
                  <span className="block text-emerald-500 dark:text-emerald-400 text-2xl font-medium mb-2">Hello, {config.candidateName}</span>
                  Review Instructions
                </h1>
                <p className="text-lg text-zinc-500 dark:text-zinc-400 max-w-xl leading-relaxed">
                  Before we begin, please review the interview guidelines to ensure the best possible experience and accurate evaluation.
                </p>
              </div>

              {/* Guidelines Grid */}
              <div className="grid md:grid-cols-2 gap-4">
                {guidelines.map((guideline, index) => (
                  <div 
                    key={index}
                    className={`
                      group relative p-5 rounded-2xl border transition-all duration-300
                      ${index === guidelines.length - 1 
                        ? 'md:col-span-2 bg-amber-50 dark:bg-amber-500/5 border-amber-200 dark:border-amber-500/20 hover:bg-amber-100 dark:hover:bg-amber-500/10' 
                        : 'bg-white/60 dark:bg-white/5 border-zinc-200 dark:border-white/5 hover:bg-white dark:hover:bg-white/10 hover:shadow-lg dark:hover:shadow-none hover:border-emerald-200 dark:hover:border-white/10'}
                    `}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`
                        flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center
                        ${index === guidelines.length - 1 
                          ? 'bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500' 
                          : 'bg-zinc-100 dark:bg-zinc-500/10 text-zinc-500 dark:text-zinc-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors'}
                      `}>
                         {guideline.icon}
                      </div>
                      <div>
                        <h3 className={`font-semibold mb-1 ${index === guidelines.length - 1 ? 'text-amber-800 dark:text-amber-200' : 'text-zinc-900 dark:text-zinc-200'}`}>
                          {guideline.title}
                        </h3>
                        <p className={`text-sm leading-snug ${index === guidelines.length - 1 ? 'text-amber-700 dark:text-amber-400/80' : 'text-zinc-500 dark:text-zinc-400'}`}>
                          {guideline.text}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

            </div>

            {/* Right Column: Session Card & Action */}
            <div className="lg:col-span-5 flex flex-col justify-center">
              <div className="relative group">
                {/* Glow Effect behind card */}
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-3xl opacity-20 dark:opacity-20 group-hover:opacity-30 dark:group-hover:opacity-40 blur transition duration-500" />
                
                <div className="relative p-1 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 h-full shadow-2xl dark:shadow-none">
                  <div className="bg-white/80 dark:bg-black/80 backdrop-blur-xl rounded-[20px] p-8 h-full flex flex-col transition-colors duration-500">
                    
                    {/* Session Header */}
                    <div className="flex items-start justify-between mb-8 pb-8 border-b border-zinc-100 dark:border-white/5">
                      <div>
                         <span className="text-xs uppercase tracking-wider font-semibold text-zinc-400 dark:text-zinc-500 mb-2 block">Sesion Type</span>
                         <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">{selectedTypeInfo?.title || config.interviewType}</h2>
                         <p className="text-emerald-600 dark:text-emerald-400 text-sm mt-1 font-medium">{config.jobRole}</p>
                      </div>
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-50 dark:from-emerald-500/20 to-teal-50 dark:to-teal-500/20 flex items-center justify-center border border-zinc-100 dark:border-white/10">
                         {config.interviewType === 'technical' && <TechnicalIcon size="lg" />}
                         {config.interviewType === 'behavioral' && <BehavioralIcon size="lg" />}
                         {config.interviewType === 'hr' && <HRIcon size="lg" />}
                         {config.interviewType === 'system-design' && <SystemDesignTypeIcon size="lg" />}
                      </div>
                    </div>

                    {/* Meta Stats */}
                    <div className="grid grid-cols-2 gap-4 mb-8">
                       <div className="bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-zinc-100 dark:border-white/5 text-zinc-900 dark:text-white">
                          <div className="flex items-center gap-2 text-zinc-400 dark:text-zinc-500 mb-1">
                            <Zap className="w-4 h-4" />
                            <span className="text-xs font-medium uppercase">Level</span>
                          </div>
                          <span className="text-lg font-semibold">{config.experienceLevel}</span>
                       </div>
                       <div className="bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-zinc-100 dark:border-white/5 text-zinc-900 dark:text-white">
                          <div className="flex items-center gap-2 text-zinc-400 dark:text-zinc-500 mb-1">
                            <Clock className="w-4 h-4" />
                            <span className="text-xs font-medium uppercase">Duration</span>
                          </div>
                          <span className="text-lg font-semibold">{config.duration}m</span>
                       </div>
                    </div>

                    {/* Action Area */}
                    <div className="mt-auto space-y-4">
                      <label className="flex items-start gap-4 cursor-pointer group/check">
                        <div className="relative flex items-center pt-0.5">
                          <input 
                            type="checkbox" 
                            checked={hasAgreed} 
                            onChange={(e) => setHasAgreed(e.target.checked)}
                            className="peer h-6 w-6 cursor-pointer appearance-none rounded-lg border-2 border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 transition-all checked:border-emerald-500 checked:bg-emerald-500 focus:outline-none hover:border-zinc-400 dark:hover:border-zinc-500"
                          />
                          <CheckCircle2 className="pointer-events-none absolute left-0 top-0.5 text-white dark:text-black opacity-0 peer-checked:opacity-100 w-6 h-6 p-0.5 transition-opacity" />
                        </div>
                        <span className="text-sm text-zinc-500 dark:text-zinc-400 group-hover/check:text-zinc-700 dark:group-hover/check:text-zinc-300 transition-colors leading-relaxed">
                          I confirm that I am ready to start and agree to the <span className="text-emerald-600 dark:text-emerald-400 font-medium pb-0.5 border-b border-emerald-500/30 dark:border-emerald-400/30">Session Recording & Monitoring Policy</span>.
                        </span>
                      </label>

                      <Button 
                        onClick={handleStart} 
                        disabled={!hasAgreed}
                        size="xl"
                        fullWidth
                        glow
                        className={`transition-all duration-300 ${hasAgreed ? 'hover:scale-[1.02]' : 'opacity-50'}`}
                        leftIcon={<Play className="w-5 h-5 fill-current" />}
                      >
                        Launch Interview
                      </Button>
                      
                      <p className="text-center text-[10px] text-zinc-400 dark:text-zinc-600">
                        System verified • Secure Connection • Auto-Recording
                      </p>
                    </div>

                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};