import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from './Button';
import { 
  CheckCircle2, 
  Volume2, 
  Wifi, 
  Loader2, 
  Play, 
  Camera,
  Mic,
  AlertCircle,
  RefreshCw,
  ArrowLeft,
  WifiOff,
  CameraOff,
  MicOff,
  ArrowRight,
  Info,
  Settings,
  ShieldCheck
} from 'lucide-react';
import { 
  SystemDesignIcon, 
  VoiceFeatureIcon, 
  VideoFeatureIcon, 
  HRIcon, 
  SecurityFeatureIcon 
} from './RichIcons';
import { InterviewConfig } from '../types';

interface SystemCheckScreenProps {
  config: InterviewConfig;
  onComplete: () => void;
  onBack?: () => void;
}

type CheckStatus = 'pending' | 'checking' | 'passed' | 'failed';

export const SystemCheckScreen: React.FC<SystemCheckScreenProps> = ({ config, onComplete, onBack }) => {
  const [cameraStatus, setCameraStatus] = useState<CheckStatus>('pending');
  const [micStatus, setMicStatus] = useState<CheckStatus>('pending');
  const [internetStatus, setInternetStatus] = useState<CheckStatus>('pending');
  
  // Specific error messages
  const [micErrorDetail, setMicErrorDetail] = useState<string>('');
  const [cameraErrorDetail, setCameraErrorDetail] = useState<string>('');

  const [speakerTested, setSpeakerTested] = useState(false);
  const [isPlayingSound, setIsPlayingSound] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    if (audioContextRef.current?.state !== 'closed') {
      audioContextRef.current?.close();
      audioContextRef.current = null;
    }
    // We only stop tracks if we are fully unmounting or resetting completely
    // Partial retries might handle tracks manually
  }, []);

  const fullCleanup = useCallback(() => {
    cleanup();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [cleanup]);

  // Check Internet
  useEffect(() => {
    setInternetStatus('checking');
    const checkInternet = async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setInternetStatus(navigator.onLine ? 'passed' : 'failed');
    };
    checkInternet();
  }, []);

  // Helper to get friendly error message
  const getErrorMessage = (error: any): string => {
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      return 'Permission denied';
    }
    if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
      return 'Device not found';
    }
    if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
      return 'Device in use';
    }
    return 'Access failed';
  };

  const setupAudioMonitoring = (stream: MediaStream) => {
    try {
      if (audioContextRef.current?.state !== 'closed') {
        audioContextRef.current?.close();
      }

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioContextRef.current = ctx;
      
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      
      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateLevel = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        setAudioLevel(Math.min(100, average * 1.5));
        animationRef.current = requestAnimationFrame(updateLevel);
      };
      updateLevel();
    } catch (e) {
      console.error("Failed to setup audio monitoring", e);
    }
  };

  // Robust Media Request Function
  const requestMediaPermissions = useCallback(async (retryType: 'all' | 'mic' | 'camera' = 'all') => {
    // If retrying all, clean slate.
    if (retryType === 'all') {
      fullCleanup();
      setCameraStatus('checking');
      setMicStatus('checking');
      setCameraErrorDetail('');
      setMicErrorDetail('');
    } else if (retryType === 'mic') {
      setMicStatus('checking');
      setMicErrorDetail('');
    } else if (retryType === 'camera') {
      setCameraStatus('checking');
      setCameraErrorDetail('');
    }

    try {
      // STRATEGY 1: Combined Request (Only if retrying all or both missing)
      if (retryType === 'all') {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { width: { ideal: 640 }, height: { ideal: 480 } }, 
            audio: true 
          });
          
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
          
          setCameraStatus('passed');
          setMicStatus('passed');
          setupAudioMonitoring(stream);
          return;
        } catch (err) {
          console.warn("Combined request failed, falling back to separate requests:", err);
          // Don't fail yet, fall through to separate requests
        }
      }

      // STRATEGY 2: Separate Requests
      
      // 2a. Handle Video
      if (retryType === 'all' || retryType === 'camera') {
        // If we already have a stream and just retrying camera? Rare case, usually we rebuild.
        // Let's keep it simple: if retrying camera, assume we need a new video track.
        try {
          const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
          
          if (!streamRef.current) {
            streamRef.current = videoStream;
          } else {
            // Add video tracks to existing stream (which might have audio)
            videoStream.getVideoTracks().forEach(track => streamRef.current?.addTrack(track));
          }

          if (videoRef.current) {
            videoRef.current.srcObject = streamRef.current;
          }
          setCameraStatus('passed');
        } catch (err: any) {
          console.error("Camera failed:", err);
          setCameraStatus('failed');
          setCameraErrorDetail(getErrorMessage(err));
        }
      }

      // 2b. Handle Audio
      if (retryType === 'all' || retryType === 'mic') {
        try {
          const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          
          if (!streamRef.current) {
            streamRef.current = audioStream;
          } else {
            // Add audio tracks to existing stream
            audioStream.getAudioTracks().forEach(track => streamRef.current?.addTrack(track));
          }
          
          setMicStatus('passed');
          setupAudioMonitoring(streamRef.current!); // Use the combined stream ref
        } catch (err: any) {
          console.error("Mic failed:", err);
          setMicStatus('failed');
          setMicErrorDetail(getErrorMessage(err));
        }
      }

    } catch (err: any) {
      console.error("Unexpected error in media request:", err);
      if (retryType === 'all') {
        setCameraStatus('failed');
        setMicStatus('failed');
      }
    }
  }, [fullCleanup]);

  // Initial Check
  useEffect(() => {
    const timer = setTimeout(() => {
      requestMediaPermissions('all');
    }, 500);

    return () => {
      clearTimeout(timer);
      fullCleanup();
    };
  }, [requestMediaPermissions, fullCleanup]);

  const playTestSound = () => {
    if (isPlayingSound) return;
    setIsPlayingSound(true);
    
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(440, ctx.currentTime);
      
      gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.5);
      
      setTimeout(() => {
        setIsPlayingSound(false);
        setSpeakerTested(true);
        if (ctx.state !== 'closed') ctx.close();
      }, 500);
    } catch (e) {
      console.error("Audio playback failed", e);
      setIsPlayingSound(false);
    }
  };

  const handleRetryAll = () => {
    setSpeakerTested(false);
    setAudioLevel(0);
    setInternetStatus('checking');
    setTimeout(() => {
      setInternetStatus(navigator.onLine ? 'passed' : 'failed');
    }, 500);
    requestMediaPermissions('all');
  };

  const allChecksPassed = cameraStatus === 'passed' && micStatus === 'passed' && internetStatus === 'passed';
  const hasFailures = cameraStatus === 'failed' || micStatus === 'failed' || internetStatus === 'failed';
  const isChecking = cameraStatus === 'checking' || micStatus === 'checking' || internetStatus === 'checking';

  const StatusIcon: React.FC<{ status: CheckStatus }> = ({ status }) => {
    switch (status) {
      case 'passed':
        return <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center"><CheckCircle2 className="w-5 h-5 text-emerald-500" /></div>;
      case 'failed':
        return <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center"><AlertCircle className="w-5 h-5 text-red-500" /></div>;
      case 'checking':
        return <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center"><Loader2 className="w-5 h-5 text-amber-500 animate-spin" /></div>;
      default:
        return <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center"><div className="w-2 h-2 rounded-full bg-zinc-400 dark:bg-zinc-600" /></div>;
    }
  };

  const getStatusBg = (status: CheckStatus) => {
    switch (status) {
      case 'passed': return 'bg-emerald-500/10 dark:bg-emerald-500/5 border-emerald-500/20';
      case 'failed': return 'bg-red-500/10 dark:bg-red-500/5 border-red-500/20';
      case 'checking': return 'bg-amber-500/10 dark:bg-amber-500/5 border-amber-500/20';
      default: return 'bg-white/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800';
    }
  };

  const checks = [
    {
      id: 'internet',
      icon: internetStatus === 'failed' ? <WifiOff className="w-5 h-5" /> : <Wifi className="w-5 h-5" />,
      title: 'Internet Connection',
      status: internetStatus,
      message: internetStatus === 'passed' ? 'Connected • Strong signal' : internetStatus === 'checking' ? 'Testing connection...' : 'No connection detected'
    },
    {
      id: 'camera',
      icon: cameraStatus === 'failed' ? <CameraOff className="w-5 h-5" /> : <Camera className="w-5 h-5" />,
      title: 'Camera',
      status: cameraStatus,
      message: cameraStatus === 'passed' ? 'Camera ready' : cameraStatus === 'checking' ? 'Requesting access...' : (cameraErrorDetail || 'Check permissions')
    },
    {
      id: 'microphone',
      icon: micStatus === 'failed' ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />,
      title: 'Microphone',
      status: micStatus,
      message: micStatus === 'passed' ? 'Microphone ready' : micStatus === 'checking' ? 'Requesting access...' : (micErrorDetail || 'Check permissions')
    }
  ];

  const guidelines = [
    { 
      icon: <SystemDesignIcon size="sm" />, 
      text: "Find a quiet, well-lit space with stable internet." 
    },
    { 
      icon: <VoiceFeatureIcon size="sm" />, 
      text: "Use earphones for better audio quality." 
    },
    { 
      icon: <VideoFeatureIcon size="sm" />, 
      text: "Dress neatly. Sit upright with your face clearly visible." 
    },
    { 
      icon: <HRIcon size="sm" />, 
      text: "Give detailed responses for better evaluation." 
    },
    { 
      icon: <SecurityFeatureIcon size="sm" />, 
      text: "Don't exit full-screen or switch tabs during the interview." 
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-white flex flex-col transition-colors duration-300">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="glow-orb w-[500px] h-[500px] top-0 right-0 opacity-10 dark:opacity-20" style={{ background: 'rgba(34, 197, 94, 0.3)' }} />
        <div className="glow-orb w-[400px] h-[400px] bottom-0 left-0 opacity-5 dark:opacity-15" style={{ background: 'rgba(16, 185, 129, 0.3)' }} />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5 lg:px-12">
        {onBack && (
          <button onClick={onBack} className="flex items-center gap-2 text-zinc-500 hover:text-black dark:text-zinc-400 dark:hover:text-white transition-colors group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">Back</span>
          </button>
        )}
        <div className="flex-1" />
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <div className={`w-2 h-2 rounded-full ${allChecksPassed ? 'bg-emerald-500' : isChecking ? 'bg-amber-500 animate-pulse' : 'bg-red-500'}`} />
          {allChecksPassed ? 'All systems ready' : isChecking ? 'Checking...' : 'Issues detected'}
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-6 py-8">
        <div className="w-full max-w-5xl fade-in-up">
          
            {/* Left: System Checks & Welcome */}
          <div className="grid lg:grid-cols-5 gap-6">
            <div className="lg:col-span-2 space-y-6">
              
              {/* Hero & Intro */}
              <div className="glass-card overflow-hidden p-0">
                <div className="relative h-48">
                  <img 
                    src="/system-check-hero.png" 
                    alt="System Setup" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6">
                     <h1 className="text-3xl font-bold text-white mb-2">
                      Welcome, <span className="text-emerald-400">{config.candidateName}</span>
                    </h1>
                    <p className="text-sm text-zinc-300">
                      Let's check your setup before we begin.
                    </p>
                  </div>
                </div>
              </div>

              {/* System Checks List */}
              <div className="glass-card p-6 bg-white/50 dark:bg-white/5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">System Status</h3>
                  <button onClick={handleRetryAll} className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-300 flex items-center gap-1 transition-colors">
                    <RefreshCw className="w-3 h-3" />
                    Re-check All
                  </button>
                </div>
                
                <div className="space-y-3">
                  {checks.map((check) => (
                    <div key={check.id} className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${getStatusBg(check.status)}`}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        check.status === 'passed' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                        check.status === 'failed' ? 'bg-red-500/10 text-red-600 dark:text-red-400' :
                        check.status === 'checking' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' :
                        'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500'
                      }`}>
                        {check.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                           <div className="font-medium text-sm">{check.title}</div>
                           <StatusIcon status={check.status} />
                        </div>
                        <div className={`text-xs mt-0.5 ${
                          check.status === 'passed' ? 'text-emerald-400/70' :
                          check.status === 'failed' ? 'text-red-400/70' :
                          'text-zinc-500'
                        }`}>
                          {check.message}
                        </div>
                        
                        {/* Audio Level Meter */}
                        {check.id === 'microphone' && micStatus === 'passed' && (
                          <div className="mt-2 flex items-center gap-2">
                            <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500 transition-all duration-75" style={{ width: `${audioLevel}%` }} />
                            </div>
                          </div>
                        )}
                        
                        {/* Specific Retry for Device */}
                        {check.status === 'failed' && (check.id === 'microphone' || check.id === 'camera') && (
                          <button 
                            onClick={() => requestMediaPermissions(check.id === 'camera' ? 'camera' : 'mic')}
                            className="mt-2 text-xs text-red-400 hover:text-red-300 underline"
                          >
                            Retry Permission
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Speaker Test */}
                  <div className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${speakerTested ? 'bg-emerald-500/10 dark:bg-emerald-500/5 border-emerald-500/20' : 'bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800'}`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${speakerTested ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500'}`}>
                      <Volume2 className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                         <div className="font-medium text-sm">Speaker Check</div>
                         <Button 
                            variant={speakerTested ? "success" : "secondary"}
                            size="sm"
                            onClick={playTestSound}
                            isLoading={isPlayingSound}
                            className="h-7 text-xs px-3"
                          >
                            {speakerTested ? 'Tested' : 'Test Sound'}
                          </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Helpful Hints for Permissions */}
                {hasFailures && (
                  <div className="mt-4 p-3 rounded-lg bg-red-500/5 border border-red-500/10">
                    <div className="flex gap-2">
                      <Settings className="w-4 h-4 text-red-500 mt-0.5" />
                      <div>
                        <p className="font-medium text-red-400 text-xs mb-1">Permission Required</p>
                        <p className="text-zinc-500 text-[10px] leading-tight">
                          Please allow camera/microphone access in your browser settings (look for the lock icon 🔒 in the address bar).
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Video Preview */}
            <div className="lg:col-span-3">
              <div className="glass-card-elevated overflow-hidden h-full flex flex-col">
                <div className="relative flex-1 bg-gradient-to-br from-zinc-900 to-zinc-950 min-h-[300px]">
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    muted 
                    playsInline 
                    className={`absolute inset-0 w-full h-full object-cover transform scale-x-[-1] transition-opacity duration-500 ${cameraStatus === 'passed' ? 'opacity-100' : 'opacity-0'}`}
                  />
                  
                  {cameraStatus !== 'passed' && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center p-6">
                        {cameraStatus === 'checking' ? (
                          <>
                            <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
                              <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                            </div>
                            <p className="text-sm text-zinc-400">Initializing camera...</p>
                          </>
                        ) : (
                          <>
                            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                              <CameraOff className="w-8 h-8 text-red-400" />
                            </div>
                            <p className="text-sm text-zinc-400 mb-2">{cameraErrorDetail || 'Camera not available'}</p>
                            <Button variant="secondary" size="sm" onClick={() => requestMediaPermissions('camera')} leftIcon={<Camera className="w-4 h-4" />}>
                              Request Access
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {cameraStatus === 'passed' && (
                    <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-md text-white text-sm px-4 py-2 rounded-lg border border-white/10 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      {config.candidateName}
                    </div>
                  )}
                  
                  {/* Visual Guide Overlay */}
                  {cameraStatus === 'passed' && (
                    <div className="absolute inset-0 pointer-events-none opacity-50">
                      <div className="absolute top-8 left-8 w-16 h-16 border-l-2 border-t-2 border-white/30 rounded-tl-xl" />
                      <div className="absolute top-8 right-8 w-16 h-16 border-r-2 border-t-2 border-white/30 rounded-tr-xl" />
                      <div className="absolute bottom-8 left-8 w-16 h-16 border-l-2 border-b-2 border-white/30 rounded-bl-xl" />
                      <div className="absolute bottom-8 right-8 w-16 h-16 border-r-2 border-b-2 border-white/30 rounded-br-xl" />
                    </div>
                  )}
                </div>

                <div className="p-5 border-t border-white/5 bg-zinc-100 dark:bg-zinc-900/30">
                  <div className="flex items-center gap-2 mb-4">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />
                    <h4 className="text-sm font-medium text-zinc-900 dark:text-white">Interview Guidelines</h4>
                  </div>
                  <div className="space-y-3">
                    {guidelines.map((guideline, index) => (
                      <div key={index} className="flex items-center gap-4">
                        <div className="flex-shrink-0 text-zinc-500 dark:text-zinc-400">{guideline.icon}</div>
                        <span className="text-xs text-zinc-600 dark:text-zinc-400/90 leading-relaxed font-medium">{guideline.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-center mt-10">
            <Button 
              onClick={onComplete} 
              disabled={!allChecksPassed}
              size="lg"
              glow={allChecksPassed}
              rightIcon={<ArrowRight className="w-5 h-5" />}
              className="min-w-[240px]"
            >
              {allChecksPassed ? 'Continue to Instructions' : isChecking ? 'Checking systems...' : 'Fix issues to continue'}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};