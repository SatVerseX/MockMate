import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import { 
  Mic, MicOff, Video, VideoOff, X, AlertCircle, Maximize, 
  ShieldAlert, AlertTriangle, ScanFace, Clock, MessageSquare,
  Pause, Play, ChevronRight, ChevronLeft, Volume2, CheckCircle2, Loader2
} from 'lucide-react';
import { Button, IconButton } from './Button';
import { InterviewConfig, ConnectionStatus, TranscriptEntry, InterviewResult, INTERVIEW_TYPES, WARNING_THRESHOLD, LOOK_AWAY_THRESHOLD_MS, AppSettings, DEFAULT_SETTINGS } from '../types';
import { createPcmBlob, decode, decodeAudioData, blobToBase64 } from '../utils/audioUtils';
import { useBilling } from '../hooks/useBilling';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface LiveSessionProps {
  config: InterviewConfig;
  settings?: AppSettings;
  screenStream: MediaStream | null;
  onEndSession: (result?: any) => void;
}

export const LiveSession: React.FC<LiveSessionProps> = ({ config, settings = DEFAULT_SETTINGS, screenStream, onEndSession }) => {
  // Billing & Auth for Pro features
  const { canAccessFeature } = useBilling();
  const { user } = useAuth();
  const canRecordAudio = canAccessFeature('audio_recording');

  // Core State
  const [status, setStatus] = useState<ConnectionStatus>(ConnectionStatus.CONNECTING);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isWaitingForReady, setIsWaitingForReady] = useState(true); // Wait for user to say they're ready
  
  // Interview Progress
  const [elapsedTime, setElapsedTime] = useState(0);
  const [questionCount, setQuestionCount] = useState(0);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [showTranscript, setShowTranscript] = useState(settings.enableTranscript !== false);
  
  // Anti-Cheating State
  const [warningCount, setWarningCount] = useState(0);
  const [lastWarning, setLastWarning] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(true);
  const [isDisqualified, setIsDisqualified] = useState(false);
  const [isFaceMonitorReady, setIsFaceMonitorReady] = useState(false);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const screenVideoRef = useRef<HTMLVideoElement>(document.createElement('video')); // Hidden video for screen stream
  const canvasRef = useRef<HTMLCanvasElement>(document.createElement('canvas'));
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const activeSourcesCountRef = useRef<number>(0);
  const sessionRef = useRef<any>(null);
  const frameIntervalRef = useRef<number | null>(null);
  const visualizerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<Date>(new Date());
  
  // Vision / Monitoring Refs
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const lastLookAwayTimeRef = useRef<number>(0);

  // Audio Recording Refs (Pro feature)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const selectedTypeInfo = INTERVIEW_TYPES.find(t => t.id === config.interviewType);

  // Timer - only starts after user confirms ready
  useEffect(() => {
    if (status === ConnectionStatus.CONNECTED && !isPaused && !isDisqualified && !isWaitingForReady) {
      timerRef.current = window.setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status, isPaused, isDisqualified, isWaitingForReady]);

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get remaining time
  const remainingTime = Math.max(0, config.duration * 60 - elapsedTime);
  const isTimeWarning = remainingTime <= 60 && remainingTime > 0;
  const isTimeOver = remainingTime === 0;

  const cleanup = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
    frameIntervalRef.current = null;
    sourcesRef.current.forEach(source => {
      try { source.stop(); } catch (e) { /* ignore */ }
    });
    sourcesRef.current.clear();
    if (audioContextRef.current?.state !== 'closed') audioContextRef.current?.close();
    if (outputContextRef.current?.state !== 'closed') outputContextRef.current?.close();
    if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
    sessionRef.current = null;
    if (faceLandmarkerRef.current) {
      faceLandmarkerRef.current.close();
      faceLandmarkerRef.current = null;
    }
    // Stop audio recording if active
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  // Upload audio recording to Supabase Storage (Pro feature)
  const uploadAudioRecording = useCallback(async (): Promise<string | null> => {
    if (!user || audioChunksRef.current.length === 0) return null;
    
    try {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      const fileName = `${user.id}/${Date.now()}.webm`;
      
      const { data, error } = await supabase.storage
        .from('interview-recordings')
        .upload(fileName, audioBlob, {
          contentType: 'audio/webm',
          cacheControl: '3600',
        });
      
      if (error) {
        console.error('Failed to upload recording:', error);
        return null;
      }
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('interview-recordings')
        .getPublicUrl(fileName);
      
      return urlData?.publicUrl || null;
    } catch (err) {
      console.error('Recording upload error:', err);
      return null;
    }
  }, [user?.id]);

  // Wrapper to finish session with data
  const finishSession = useCallback(async () => {
    // Upload recording if Pro user
    let recordingUrl: string | null = null;
    if (canRecordAudio && audioChunksRef.current.length > 0) {
      recordingUrl = await uploadAudioRecording();
      setAudioUrl(recordingUrl);
    }
    
    cleanup();
    onEndSession({
      duration: elapsedTime,
      questionsAsked: questionCount,
      warningCount,
      transcript,
      audioUrl: recordingUrl,
      status: isDisqualified ? 'terminated' : 'completed'
    });
  }, [cleanup, onEndSession, elapsedTime, questionCount, warningCount, transcript, isDisqualified, canRecordAudio, uploadAudioRecording]);

  // Auto-end when time is over
  const [hasAutoEnded, setHasAutoEnded] = useState(false);
  useEffect(() => {
    if (isTimeOver && !hasAutoEnded && !isDisqualified && status === ConnectionStatus.CONNECTED) {
      setHasAutoEnded(true);
      // Give a brief delay so user sees "Time's up" before ending
      const timeoutId = setTimeout(() => {
        finishSession();
      }, 3000);
      return () => clearTimeout(timeoutId);
    }
  }, [isTimeOver, hasAutoEnded, isDisqualified, status, finishSession]);

  // Anti-Cheating Logic
  const triggerWarning = useCallback((reason: string) => {
    if (isDisqualified || isPaused) return;

    setWarningCount(prev => {
      const newCount = prev + 1;
      if (newCount >= WARNING_THRESHOLD) {
        setIsDisqualified(true);
        cleanup();
      }
      return newCount;
    });
    setLastWarning(reason);
    setTimeout(() => setLastWarning(null), 4000);
  }, [isDisqualified, isPaused, cleanup]);

  // Update screenVideoRef when screenStream changes
  useEffect(() => {
    if (screenVideoRef.current) {
        if (screenStream) {
            screenVideoRef.current.srcObject = screenStream;
            screenVideoRef.current.play().catch(e => console.error("Error playing screen video:", e));
        } else {
            screenVideoRef.current.srcObject = null;
        }
    }
  }, [screenStream]);

  const enterFullscreen = () => {
    if (containerRef.current) {
      containerRef.current.requestFullscreen().catch(err => {
        console.error("Error attempting to enable fullscreen:", err);
      });
    }
  };

  // Browser Event Monitoring
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && !isPaused && settings.enableAntiCheat && !screenStream) triggerWarning("Tab switch detected!");
    };
    const handleBlur = () => {
      if (!document.hidden && !isPaused && settings.enableAntiCheat && !screenStream) triggerWarning("Focus lost! Please stay on this window.");
    };
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsFullscreen(false);
        if (!isPaused && settings.enableAntiCheat) triggerWarning("Exited full screen mode.");
      } else {
        setIsFullscreen(true);
      }
    };
    
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [triggerWarning, isPaused, settings.enableAntiCheat]);

  // Screen Sharing Monitoring
  useEffect(() => {
    if (!screenStream) return;

    const videoTrack = screenStream.getVideoTracks()[0];
    
    const handleStreamEnded = () => {
      if (!isDisqualified && !hasAutoEnded) {
        triggerWarning("Screen sharing stopped! Integrity violation.");
      }
    };

    videoTrack.addEventListener('ended', handleStreamEnded);

    return () => {
      videoTrack.removeEventListener('ended', handleStreamEnded);
    };
  }, [screenStream, isDisqualified, hasAutoEnded, triggerWarning]);

  // Load Vision Model (only if face tracking is enabled)
  useEffect(() => {
    if (!settings.enableFaceTracking) {
      setIsFaceMonitorReady(false);
      return;
    }
    
    const loadVisionModel = async () => {
      try {
        const filesetResolver = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
        );
        faceLandmarkerRef.current = await FaceLandmarker.createFromOptions(filesetResolver, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numFaces: 1,
          minFaceDetectionConfidence: 0.5,
          minFacePresenceConfidence: 0.5,
        });
        setIsFaceMonitorReady(true);
      } catch (error) {
        console.error("Failed to load vision model:", error);
      }
    };
    loadVisionModel();
  }, [settings.enableFaceTracking]);

  // Vision Monitoring Loop
  useEffect(() => {
    if (!isFaceMonitorReady || !videoRef.current || isDisqualified || isPaused) return;
    
    let animationId: number;
    
    const monitorAttention = () => {
      const video = videoRef.current;
      if (video && video.readyState >= 2 && faceLandmarkerRef.current) {
        const startTimeMs = performance.now();
        try {
          const results = faceLandmarkerRef.current.detectForVideo(video, startTimeMs);
          
          let isLookingAway = false;
          let reason = "";

          if (results.faceLandmarks.length > 0) {
            const landmarks = results.faceLandmarks[0];
            const nose = landmarks[1];
            const leftCheek = landmarks[234];
            const rightCheek = landmarks[454];

            if (nose && leftCheek && rightCheek) {
              const d1 = Math.abs(nose.x - leftCheek.x);
              const d2 = Math.abs(nose.x - rightCheek.x);
              const ratio = Math.min(d1, d2) / Math.max(d1, d2);
              
              if (ratio < 0.25) {
                isLookingAway = true;
                reason = "Please look at the screen.";
              }
            }
          } else {
            isLookingAway = true;
            reason = "Face not detected.";
          }

          if (isLookingAway) {
            if (lastLookAwayTimeRef.current === 0) {
              lastLookAwayTimeRef.current = startTimeMs;
            } else if (startTimeMs - lastLookAwayTimeRef.current > LOOK_AWAY_THRESHOLD_MS) {
              triggerWarning(`Attention Alert: ${reason}`);
              lastLookAwayTimeRef.current = startTimeMs;
            }
          } else {
            lastLookAwayTimeRef.current = 0;
          }
        } catch (e) {
          // Ignore frames where vision processing fails
        }
      }
      animationId = requestAnimationFrame(monitorAttention);
    };

    monitorAttention();
    return () => cancelAnimationFrame(animationId);
  }, [isFaceMonitorReady, isDisqualified, isPaused, triggerWarning]);

  // Visualizer Loop
  useEffect(() => {
    let animationFrameId: number;
    const animate = () => {
      if (analyserRef.current && visualizerRef.current && isAiSpeaking) {
        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserRef.current.getByteFrequencyData(dataArray);
        const indices = [2, 4, 6, 9, 12];
        const bars = visualizerRef.current.children;
        for (let i = 0; i < Math.min(indices.length, bars.length); i++) {
          const value = dataArray[indices[i] % bufferLength] || 0;
          const height = Math.max(4, (value / 255) * 32);
          (bars[i] as HTMLElement).style.height = `${height}px`;
        }
      } else if (visualizerRef.current && !isAiSpeaking) {
        const bars = visualizerRef.current.children;
        for (let i = 0; i < bars.length; i++) {
          (bars[i] as HTMLElement).style.height = '4px';
        }
      }
      animationFrameId = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(animationFrameId);
  }, [isAiSpeaking]);

  // Init Session
  useEffect(() => {
    let active = true;
    startTimeRef.current = new Date();
    
    const initSession = async () => {
      try {
        if (isDisqualified) return;

        if (!(import.meta as any).env.VITE_GEMINI_API_KEY) throw new Error("API Key is missing. Please set VITE_GEMINI_API_KEY in .env.local");
        
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const inputCtx = new AudioContextClass({ sampleRate: 16000 });
        const outputCtx = new AudioContextClass({ sampleRate: 24000 });
        const analyser = outputCtx.createAnalyser();
        analyser.fftSize = 64;
        analyser.smoothingTimeConstant = 0.5;
        analyserRef.current = analyser;
        audioContextRef.current = inputCtx;
        outputContextRef.current = outputCtx;

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
          video: { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 15 } }
        });
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;

        // Build system prompt based on interview type
        const typePrompts: Record<string, string> = {
          'technical': `
FOCUS AREAS:
- Data structures, algorithms, and computational complexity
- System design principles and architectural patterns
- Coding best practices, testing, and debugging approaches
- Problem-solving methodology and technical communication
${config.skills ? `- Specific expertise in: ${config.skills}` : ''}

QUESTION TYPES:
- Start with a warm-up question about their background/experience
- Progress to conceptual questions about core CS fundamentals
- Include at least one problem-solving scenario
- Ask follow-up questions to probe depth of understanding`,

          'behavioral': `
FOCUS AREAS:
- Leadership and teamwork experiences using STAR method (Situation, Task, Action, Result)
- Conflict resolution and interpersonal skills
- Adaptability, resilience, and growth mindset
- Communication, collaboration, and stakeholder management

QUESTION TYPES:
- "Tell me about a time when..." format
- Probe for specific examples, not hypotheticals
- Follow up on vague answers with "What specifically did YOU do?"
- Assess self-awareness by asking what they learned`,

          'hr': `
FOCUS AREAS:
- Cultural fit and alignment with company values
- Career aspirations and long-term goals
- Work style preferences and expectations
- Motivation for the role and company interest

QUESTION TYPES:
- Open-ended questions about career journey
- Questions about ideal work environment
- Assess genuine interest and research about the company
- Discuss growth expectations and development goals`,

          'system-design': `
FOCUS AREAS:
- High-level architecture and component design
- Scalability, reliability, and performance trade-offs
- Database selection, caching strategies, and data flow
- API design, microservices patterns, and distributed systems

APPROACH:
- Let the candidate drive the discussion
- Start with clarifying questions about requirements
- Encourage them to think out loud
- Probe on trade-offs: "What are the downsides of that approach?"
- Cover edge cases and failure scenarios`
        };

        const experienceLevelContext: Record<string, string> = {
          'Entry': 'This is an entry-level candidate (0-2 years). Focus on fundamentals, learning ability, and potential. Be encouraging but still professional.',
          'Mid': 'This is a mid-level candidate (2-5 years). Expect solid fundamentals and some independent project experience. Probe for depth.',
          'Senior': 'This is a senior candidate (5-8 years). Expect strong technical depth, system thinking, and leadership examples. Challenge them appropriately.',
          'Lead': 'This is a lead/principal level candidate (8+ years). Expect strategic thinking, architectural decisions, and mentorship examples. Discuss high-level impact.'
        };

        const systemPrompt = `You are a seasoned ${selectedTypeInfo?.title || 'Technical'} Interviewer at ${config.companyName || 'a leading technology company'}.

INTERVIEWER PERSONA:
- You are professional, articulate, and respectful
- You speak naturally like a real human interviewer - conversational but focused
- You are genuinely interested in understanding the candidate's experience and potential
- You maintain a warm but evaluative tone throughout
- You are an expert in your field with years of interview experience

CANDIDATE PROFILE:
- Name: ${config.candidateName}
- Target Role: ${config.jobRole}
- Experience Level: ${config.experienceLevel}
${config.companyName ? `- Company: ${config.companyName}` : ''}
${config.skills ? `- Key Skills: ${config.skills}` : ''}
${config.portfolioLinks ? `- Portfolio/Links: ${config.portfolioLinks}` : ''}

${experienceLevelContext[config.experienceLevel] || ''}

${typePrompts[config.interviewType] || 'Conduct a professional interview.'}

${config.resumeText ? `RESUME / CV CONTEXT (Use this to ask personalized questions based on their actual experience):\n${config.resumeText.slice(0, 4000)}\n` : ''}

${config.jobDescription ? `
JOB CONTEXT (use to tailor questions):
${config.jobDescription.slice(0, 300)}
` : ''}

INTERVIEW STRUCTURE:
1. OPENING (1 question): Welcome them warmly by name, briefly introduce yourself, and ask an icebreaker about their background
2. CORE INTERVIEW (3-4 questions): Ask progressively challenging questions based on the interview type
3. CLOSING (1 question): Ask if they have any questions, then professionally wrap up

CRITICAL GUIDELINES:
- Ask ONE question at a time and wait for the complete response
- Listen actively - reference their previous answers in follow-ups
- Keep questions concise (aim for under 15 seconds speaking time)
- Eliminate conversational filler (e.g., avoid "That's a great point, I really like how you said that..." -> just say "Good point.")
- If an answer is unclear, ask for clarification immediately
- Maintain professional pacing - don't rush through questions
- After 4-5 substantive exchanges, begin wrapping up the interview
- End with: "Thank you for your time today, ${config.candidateName}. We'll be in touch soon."

BEGIN THE INTERVIEW NOW. Greet the candidate and start with your opening question.`;

        const ai = new GoogleGenAI({ apiKey: (import.meta as any).env.VITE_GEMINI_API_KEY });
        const sessionPromise = ai.live.connect({
          model: 'gemini-2.5-flash-native-audio-preview-12-2025',
          callbacks: {
            onopen: async () => {
              if (!active) return;
              setStatus(ConnectionStatus.CONNECTED);
              if (inputCtx.state === 'suspended') await inputCtx.resume();
              if (outputCtx.state === 'suspended') await outputCtx.resume();
              sessionPromise.then(session => sessionRef.current = session);
              
              const source = inputCtx.createMediaStreamSource(stream);
              const scriptProcessor = inputCtx.createScriptProcessor(2048, 1, 1);
              scriptProcessor.onaudioprocess = (e) => {
                if (!active || !isMicOn || isPaused) return;
                const pcmBlob = createPcmBlob(e.inputBuffer.getChannelData(0));
                sessionPromise.then((session) => session.sendRealtimeInput({ media: pcmBlob }));
              };
              source.connect(scriptProcessor);
              scriptProcessor.connect(inputCtx.destination);

              const FPS = 2;
              frameIntervalRef.current = window.setInterval(() => {
                if (!active || !videoRef.current || !isCamOn || isPaused) return;
                
                const videoEl = videoRef.current;
                const canvasEl = canvasRef.current;
                const ctx = canvasEl.getContext('2d');
                
                if (videoEl.readyState === 4 && ctx) {
                  // Determine layout
                  if (screenStream && screenVideoRef.current && screenVideoRef.current.readyState === 4) {
                       // SCENARIO 1: Screen Share Active (PiP Mode)
                       // Main canvas size matches screen share resolution (or capped at 1080p for bandwidth)
                       canvasEl.width = screenVideoRef.current.videoWidth;
                       canvasEl.height = screenVideoRef.current.videoHeight;
                       
                       // Draw Screen (Background)
                       ctx.drawImage(screenVideoRef.current, 0, 0, canvasEl.width, canvasEl.height);
                       
                       // Draw Webcam (PiP - Bottom Right)
                       // Size: 20% of canvas width
                       const pipWidth = canvasEl.width * 0.2;
                       const pipHeight = (videoEl.videoHeight / videoEl.videoWidth) * pipWidth;
                       const pipX = canvasEl.width - pipWidth - 20; // 20px padding
                       const pipY = canvasEl.height - pipHeight - 20;
                       
                       // Add a border/shadow for distinction
                       ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
                       ctx.shadowBlur = 10;
                       ctx.fillRect(pipX, pipY, pipWidth, pipHeight); // Background for PiP
                       ctx.shadowBlur = 0;
                       
                       ctx.drawImage(videoEl, pipX, pipY, pipWidth, pipHeight);

                  } else {
                        // SCENARIO 2: Webcam Only
                        canvasEl.width = videoEl.videoWidth;
                        canvasEl.height = videoEl.videoHeight;
                        ctx.drawImage(videoEl, 0, 0);
                  }

                  canvasEl.toBlob(async (blob) => {
                    if (blob) {
                      const base64Data = await blobToBase64(blob);
                      sessionPromise.then(session => session.sendRealtimeInput({ media: { data: base64Data, mimeType: 'image/jpeg' } }));
                    }
                  }, 'image/jpeg', 0.6);
                }
              }, 1000 / FPS);
              // Don't auto-start - wait for user to confirm they're ready
              // The startInterview function will trigger the AI
            },
            onmessage: async (message: LiveServerMessage) => {
              if (!active) return;
              
              // Fallback: If AI starts speaking, assume interview started and dismiss overlay
              const hasContent = message.serverContent?.modelTurn?.parts?.some(p => p.text || p.inlineData);
              if (hasContent && isWaitingForReady) {
                 console.log("AI started speaking, dismissing ready overlay");
                 setIsWaitingForReady(false);
              }
              
              const textPart = message.serverContent?.modelTurn?.parts?.find(p => p.text);
              if (textPart?.text) {
                // Add to transcript
                setTranscript(prev => [...prev, {
                  id: Date.now().toString(),
                  speaker: 'ai',
                  text: textPart.text || '',
                  timestamp: new Date()
                }]);
                
                // Count questions (rough heuristic)
                if (textPart.text.includes('?')) {
                  setQuestionCount(prev => prev + 1);
                }
                
                // Detect interview closing phrases
                const closingPhrases = [
                  "thank you for your time",
                  "we'll be in touch",
                  "we will be in touch", 
                  "interview is complete",
                  "interview has concluded",
                  "concludes our interview",
                  "end of the interview",
                  "that concludes",
                  "best of luck",
                  "good luck with"
                ];
                const lowerText = textPart.text.toLowerCase();
                const isClosing = closingPhrases.some(phrase => lowerText.includes(phrase));
                
                if (isClosing && !hasAutoEnded) {
                  // AI has concluded the interview - wait a moment then end
                  setHasAutoEnded(true);
                  setTimeout(() => {
                    finishSession();
                  }, 4000); // 4 second delay to let AI finish speaking
                }
              }
              
              const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
              if (base64Audio) {
                const ctx = outputContextRef.current;
                if (!ctx) return;
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                try {
                  const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
                  const source = ctx.createBufferSource();
                  source.buffer = audioBuffer;
                  if (analyserRef.current) {
                    source.connect(analyserRef.current);
                    analyserRef.current.connect(ctx.destination);
                  } else {
                    source.connect(ctx.destination);
                  }
                  source.addEventListener('ended', () => {
                    sourcesRef.current.delete(source);
                    activeSourcesCountRef.current = Math.max(0, activeSourcesCountRef.current - 1);
                    if (activeSourcesCountRef.current === 0) setIsAiSpeaking(false);
                  });
                  source.start(nextStartTimeRef.current);
                  nextStartTimeRef.current += audioBuffer.duration;
                  sourcesRef.current.add(source);
                  activeSourcesCountRef.current++;
                  setIsAiSpeaking(true);
                } catch (err) { console.error("Error decoding audio", err); }
              }
              if (message.serverContent?.interrupted) {
                sourcesRef.current.forEach(source => source.stop());
                sourcesRef.current.clear();
                nextStartTimeRef.current = 0;
                activeSourcesCountRef.current = 0;
                setIsAiSpeaking(false);
              }
            },
            onclose: () => active && setStatus(ConnectionStatus.DISCONNECTED),
            onerror: (e) => {
              console.error(e);
              if (active) { setStatus(ConnectionStatus.ERROR); setErrorMsg("Connection error. Please check your internet and try again."); }
            }
          },
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: settings.aiVoice || 'Kore' } } },
            systemInstruction: { parts: [{ text: systemPrompt }] },
          }
        });
      } catch (err: any) {
        setStatus(ConnectionStatus.ERROR);
        setErrorMsg(err.message || "Failed to initialize session.");
      }
    };
    
    initSession();
    return () => { active = false; cleanup(); };
  }, [config, cleanup, isMicOn, isCamOn, isDisqualified, isPaused, selectedTypeInfo]);

  const startInterview = () => {
    if (sessionRef.current && isWaitingForReady) {
      setIsWaitingForReady(false);
      
      // Start audio recording for Pro users
      if (canRecordAudio && streamRef.current) {
        try {
          const audioStream = new MediaStream(streamRef.current.getAudioTracks());
          const recorder = new MediaRecorder(audioStream, { mimeType: 'audio/webm' });
          
          recorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
              audioChunksRef.current.push(e.data);
            }
          };
          
          recorder.start(1000); // Collect data every second
          mediaRecorderRef.current = recorder;
          console.log('🎙️ Audio recording started (Pro feature)');
        } catch (err) {
          console.error('Failed to start audio recording:', err);
        }
      }
      
      (sessionRef.current as any).send({ 
        parts: [{ text: `I am ${config.candidateName}. I am ready for the interview. Please introduce yourself and start.` }], 
        turnComplete: true 
      });
    }
  };

  const toggleMic = () => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(track => track.enabled = !isMicOn);
      setIsMicOn(!isMicOn);
    }
  };

  const toggleCam = () => {
    if (streamRef.current) {
      streamRef.current.getVideoTracks().forEach(track => track.enabled = !isCamOn);
      setIsCamOn(!isCamOn);
    }
  };

  const handleEndSession = () => {
    finishSession();
  };

  const [voiceDebug, setVoiceDebug] = useState<string>("Initializing voice...");

  // Voice Trigger for Ready State
  useEffect(() => {
    if (!isWaitingForReady || !('webkitSpeechRecognition' in window)) {
      if (!('webkitSpeechRecognition' in window)) setVoiceDebug("Voice control not supported in this browser");
      return;
    }

    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setVoiceDebug("Listening for 'Ready'...");
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript.toLowerCase();
        if (event.results[i].isFinal) {
          console.log('Voice Trigger Final:', transcript);
          if (transcript.includes('ready') || transcript.includes('start') || transcript.includes('begin')) {
            setVoiceDebug("Heard command! Starting...");
            startInterview();
            recognition.stop();
            return;
          }
        } else {
          interimTranscript += transcript;
        }
      }
      
      if (interimTranscript) {
         setVoiceDebug(`Heard: "${interimTranscript}"`); // Removed ellipsis for cleaner look
         if (interimTranscript.includes('ready') || interimTranscript.includes('start') || interimTranscript.includes('begin')) {
            setVoiceDebug("Command detected! Starting...");
            startInterview();
            recognition.stop();
         }
      }
    };

    recognition.onerror = (event: any) => {
      console.log('Voice Trigger Error:', event.error);
      if (event.error === 'not-allowed') {
         setVoiceDebug("Microphone blocked. Please click Start.");
      } else if (event.error === 'no-speech') {
         // Ignore no-speech, it happens
      } else {
         setVoiceDebug(`Voice Error: ${event.error}`);
      }
    };

    recognition.onend = () => {
        if (isWaitingForReady) {
            try { recognition.start(); } catch(e) { console.log("Restart error", e); }
        }
    };

    try {
      recognition.start();
    } catch (e) {
      console.error('Failed to start voice trigger:', e);
      setVoiceDebug("Could not start microphone.");
    }

    return () => {
      try {
        recognition.stop();
      } catch (e) { }
    };
  }, [isWaitingForReady]);

  // Disqualification Screen
  if (isDisqualified) {
    return (
      <div className="flex flex-col h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-white items-center justify-center p-6 text-center overflow-hidden relative">
        {/* Background Glows */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
           <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-red-500/10 rounded-full blur-[100px]" />
           <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px]" />
        </div>

        <div className="glass-card-elevated p-10 max-w-md w-full relative z-10 border border-red-500/20 shadow-[0_0_50px_rgba(239,68,68,0.15)]">
          <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
            <ShieldAlert className="w-10 h-10 text-red-500 animate-pulse" />
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-2">Interview Disqualified</h2>
          
          <p className="text-zinc-400 mb-8 leading-relaxed">
            Multiple integrity violations were detected during the session. 
            As per the guidelines, the interview has been terminated to ensure fairness.
          </p>
          
          <div className="bg-red-500/5 border border-red-500/10 p-4 rounded-xl mb-8 text-left">
            <p className="text-xs text-red-400 uppercase font-semibold mb-2 tracking-wider">Violation Log</p>
            <div className="flex items-center gap-3 text-red-300 text-sm font-medium">
              <AlertTriangle size={16} />
              <span>{warningCount} violations recorded</span>
            </div>
          </div>
          
          <Button onClick={handleEndSession} variant="secondary" fullWidth size="lg">
            Return to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-white overflow-hidden relative transition-colors duration-300">
      
      {/* Fullscreen Enforcer Overlay */}
      {!isFullscreen && !isDisqualified && (
        <div className="absolute inset-0 z-[60] bg-zinc-900/60 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center transition-all duration-500">
          <div className="glass-card-elevated p-10 max-w-md border border-white/10 shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            
            <div className="relative z-10">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-500">
                <Maximize className="w-8 h-8 text-indigo-400 animate-pulse" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Fullscreen Required</h3>
              <p className="text-zinc-400 mb-8 leading-relaxed">
                To ensure a focused environment and interview integrity, please enable full screen mode to continue.
              </p>
              <Button onClick={enterFullscreen} glow size="lg" fullWidth>
                Enable Fullscreen
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Warning Toast */}
      {lastWarning && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-[70] animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="bg-red-500/10 backdrop-blur-xl border border-red-500/30 text-red-200 pl-4 pr-5 py-3 rounded-full flex items-center gap-3 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
            <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
              <AlertTriangle size={16} className="text-red-400" />
            </div>
            <span className="font-medium text-sm">{lastWarning}</span>
            <div className="h-4 w-px bg-red-500/30 mx-1" />
            <span className="text-xs font-mono text-red-300">
              {warningCount}/{WARNING_THRESHOLD}
            </span>
          </div>
        </div>
      )}

      {/* Ready to Start Overlay */}
      {isWaitingForReady && status === ConnectionStatus.CONNECTED && (
        <div className="absolute inset-0 z-[75] bg-white/80 dark:bg-zinc-900/60 backdrop-blur-2xl flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-700">
          {/* Ambient Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/10 dark:bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none" />
          
          <div className="glass-card-elevated p-12 max-w-lg w-full bg-white dark:bg-transparent border border-zinc-200 dark:border-white/10 shadow-2xl relative overflow-hidden">
            {/* Decorative Pulse Rings */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] border border-emerald-500/20 dark:border-white/5 rounded-full animate-ping opacity-20 pointer-events-none" style={{ animationDuration: '3s' }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-emerald-500/10 dark:border-white/5 rounded-full animate-ping opacity-10 pointer-events-none" style={{ animationDuration: '3s', animationDelay: '1s' }} />

            <div className="relative z-10 flex flex-col items-center">
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-emerald-500 blur-2xl opacity-20 animate-pulse" />
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-zinc-800 to-black border border-white/10 flex items-center justify-center shadow-2xl relative z-10">
                  <Mic className="w-10 h-10 text-emerald-400" />
                  
                  {/* Active Ring */}
                  <div className="absolute inset-0 rounded-full border-2 border-emerald-500/30 animate-[spin_4s_linear_infinite]" />
                  <div className="absolute -inset-1 rounded-full border border-emerald-500/10 animate-[spin_8s_linear_infinite_reverse]" />
                </div>
              </div>
              
              <h3 className="text-3xl font-bold text-zinc-900 dark:text-white mb-4 tracking-tight">Ready to Begin?</h3>
              
              <p className="text-zinc-500 dark:text-zinc-400 mb-8 leading-relaxed max-w-sm">
                Ensure you're in a quiet environment. When you're ready, speak the phrase below.
              </p>
              
              <div className="bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl px-6 py-4 mb-8 w-full max-w-sm">
                <p className="text-sm text-zinc-500 uppercase tracking-wider font-semibold mb-2">Say this phrase</p>
                <p className="text-lg text-zinc-900 dark:text-white font-medium">"I am ready to start the interview"</p>
              </div>
              
              <div className="flex flex-col gap-4 w-full max-w-xs">
                {/* Button removed as per user request to rely on voice trigger */}
                
                <div className="flex items-center justify-center gap-2 text-emerald-400/80 text-xs font-medium py-2 px-4 rounded-full bg-emerald-500/5 border border-emerald-500/10 w-fit mx-auto">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  {voiceDebug || "Microphone Active"}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Interview Ending Overlay */}
      {hasAutoEnded && (
        <div className="absolute inset-0 z-[80] bg-zinc-900/80 backdrop-blur-2xl flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-700">
           <div className="glass-card-elevated p-12 max-w-md w-full border border-white/10 shadow-2xl relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent pointer-events-none" />
             
             {isTimeOver ? (
               <div className="relative z-10">
                 <div className="w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-6">
                   <Clock className="w-10 h-10 text-amber-500 animate-pulse" />
                 </div>
                 <h3 className="text-2xl font-bold text-white mb-2">Time's Up!</h3>
                 <p className="text-zinc-400 mb-6">
                   Great effort! Your session has ended. Redirecting you to the results...
                 </p>
               </div>
             ) : (
               <div className="relative z-10">
                 <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-6">
                   <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                 </div>
                 <h3 className="text-2xl font-bold text-white mb-2">Interview Complete</h3>
                 <p className="text-zinc-400 mb-6">
                   The interviewer has concluded the session. Redirecting you to your performance review...
                 </p>
               </div>
             )}
             
             <div className="flex items-center justify-center gap-3 text-emerald-400 text-sm bg-emerald-500/5 py-2 px-4 rounded-full border border-emerald-500/10 mx-auto w-fit">
               <Loader2 className="w-4 h-4 animate-spin" />
               Generating Analysis...
             </div>
           </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        
        {/* Top Bar */}
        <header className="absolute top-0 left-0 right-0 z-20 p-6 flex justify-between items-start pointer-events-none">
          <div>
            <h2 className="text-sm font-semibold tracking-wide flex items-center gap-2 drop-shadow-md">
              <span className={`w-2 h-2 rounded-full ${status === ConnectionStatus.CONNECTED ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-amber-500'}`}></span>
              {status === ConnectionStatus.CONNECTED ? 'Live Interview' : 'Connecting...'}
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 font-mono uppercase opacity-80">
              {selectedTypeInfo?.title} • {config.jobRole}
            </p>
          </div>
          
          {/* Timer & Status */}
          <div className="flex items-center gap-3 pointer-events-auto">
            {/* Timer */}
            <div className={`bg-white/80 dark:bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border flex items-center gap-2 transition-colors ${
              isTimeWarning ? 'border-amber-500/50 text-amber-600 dark:text-amber-400' : 
              isTimeOver ? 'border-red-500/50 text-red-600 dark:text-red-400' : 
              'border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-white'
            }`}>
              <Clock className="w-4 h-4" />
              <span className="font-mono text-sm font-semibold">{formatTime(remainingTime)}</span>
            </div>

            {/* Question Counter */}
            <div className="bg-white/80 dark:bg-black/60 backdrop-blur-md px-3 py-2 rounded-full border border-zinc-200 dark:border-white/10 text-xs text-zinc-700 dark:text-white">
              Q{questionCount}
            </div>

            {/* Face Tracking Status */}
            {isFaceMonitorReady && (
              <div className="bg-white/80 dark:bg-black/60 backdrop-blur px-3 py-1.5 rounded-full border border-zinc-200 dark:border-white/10 flex items-center gap-2">
                <ScanFace className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />
                <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400">Active</span>
              </div>
            )}

            {/* Integrity Status */}
            <div className="bg-white/80 dark:bg-black/60 backdrop-blur px-3 py-1.5 rounded-full border border-zinc-200 dark:border-white/10 flex items-center gap-2">
              <ShieldCheckIcon status={warningCount === 0 ? 'good' : warningCount < 3 ? 'warning' : 'danger'} />
              <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400">{WARNING_THRESHOLD - warningCount} left</span>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 flex flex-col items-center justify-center relative p-4">
          
          {/* Error Modal */}
          {status === ConnectionStatus.ERROR && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-zinc-900/60 backdrop-blur-2xl p-6">
              <div className="glass-card-elevated p-8 max-w-sm w-full text-center border border-red-500/20 shadow-2xl">
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Connection Error</h3>
                <p className="text-zinc-400 text-sm mb-6 leading-relaxed">{errorMsg}</p>
                <Button onClick={handleEndSession} variant="secondary" fullWidth>Return Home</Button>
              </div>
            </div>
          )}

          {/* Video Container */}
          <div className="relative w-full max-w-5xl aspect-video bg-zinc-900 dark:bg-zinc-950 rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-2xl ring-1 ring-black/5 dark:ring-white/5">
            {/* User Camera */}
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className={`w-full h-full object-cover transform scale-x-[-1] transition-all duration-700 ${isCamOn ? 'opacity-100 scale-100' : 'opacity-0 scale-95 blur-sm'}`}
            />
            
            {!isCamOn && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-24 h-24 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                  <VideoOff size={40} className="text-zinc-600" />
                </div>
              </div>
            )}

            {/* AI Avatar & Indicator */}
            <div className={`absolute top-6 left-1/2 -translate-x-1/2 transition-all duration-300 flex flex-col items-center gap-3 ${isAiSpeaking ? 'scale-110' : 'scale-100'}`}>
              <div className={`relative w-24 h-24 rounded-full border-4 border-white/10 shadow-2xl overflow-hidden transition-all duration-300 ${isAiSpeaking ? 'ring-4 ring-emerald-500/50 shadow-emerald-500/50' : ''}`}>
                <img 
                  src="/ai-avatar.png" 
                  alt="AI Interviewer" 
                  className="w-full h-full object-cover"
                />
                {/* Speaking Wave Overlay */}
                {isAiSpeaking && (
                  <div className="absolute inset-0 bg-emerald-500/20 animate-pulse" />
                )}
              </div>
              
              <div className={`bg-black/60 backdrop-blur-xl px-5 py-2 rounded-full flex items-center gap-3 border border-white/10 shadow-lg transition-opacity duration-300 ${isAiSpeaking ? 'opacity-100' : 'opacity-0'}`}>
                <div ref={visualizerRef} className="flex items-center gap-1 h-4 items-end">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="w-1 bg-white rounded-full transition-[height] duration-75" style={{ height: '4px' }}></div>
                  ))}
                </div>
              </div>
            </div>

            {/* Listening State */}
            {status === ConnectionStatus.CONNECTED && !isAiSpeaking && activeSourcesCountRef.current === 0 && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-none">
                <div className="bg-black/60 backdrop-blur-md text-zinc-300 text-xs px-4 py-2 rounded-full border border-white/5 flex items-center gap-2 shadow-lg">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                  Listening...
                </div>
              </div>
            )}

            {/* Loading State */}
            {status === ConnectionStatus.CONNECTING && (
              <div className="absolute inset-0 flex items-center justify-center bg-zinc-950 z-10">
                <div className="text-center">
                  <div className="loading-spinner mx-auto mb-4"></div>
                  <p className="text-zinc-500 text-xs uppercase tracking-widest">Connecting to AI...</p>
                </div>
              </div>
            )}

            {/* User Name Tag */}
            <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-full border border-white/10 z-10">
              {config.candidateName}
            </div>
          </div>
        </div>

        {/* Floating Control Bar */}
        <footer className="fixed bottom-8 left-1/2 -translate-x-1/2 z-30">
          <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-zinc-200 dark:border-white/10 p-2 rounded-full shadow-xl flex items-center gap-2">
            <IconButton 
              icon={isMicOn ? <Mic size={20} /> : <MicOff size={20} />}
              onClick={toggleMic}
              variant={isMicOn ? "secondary" : "danger"}
              aria-label={isMicOn ? "Mute microphone" : "Unmute microphone"}
            />

            <IconButton 
              icon={isCamOn ? <Video size={20} /> : <VideoOff size={20} />}
              onClick={toggleCam}
              variant={isCamOn ? "secondary" : "danger"}
              aria-label={isCamOn ? "Turn off camera" : "Turn on camera"}
            />

            <div className="w-px h-8 bg-white/10 mx-1"></div>

            <IconButton 
              icon={<MessageSquare size={20} />}
              onClick={() => setShowTranscript(!showTranscript)}
              variant={showTranscript ? "primary" : "ghost"}
              aria-label="Toggle transcript"
            />

            <div className="w-px h-8 bg-white/10 mx-1"></div>

            <Button 
              onClick={handleEndSession}
              variant="primary"
              size="md"
              leftIcon={<X size={18} />}
            >
              End
            </Button>
          </div>
        </footer>
      </div>

      {/* Transcript Panel */}
      {showTranscript && (
        <div className="w-80 transcript-panel flex flex-col h-full bg-white/95 dark:bg-black/95 backdrop-blur-md border-l border-zinc-200 dark:border-zinc-800">
          <div className="p-4 border-b border-zinc-200 dark:border-white/5 flex items-center justify-between">
            <h3 className="font-semibold text-sm flex items-center gap-2 text-zinc-900 dark:text-white">
              <MessageSquare className="w-4 h-4" />
              Transcript
            </h3>
            <button 
              onClick={() => setShowTranscript(false)}
              className="w-6 h-6 rounded flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-zinc-500 dark:text-zinc-400"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {transcript.length === 0 ? (
              <div className="p-4 text-center text-zinc-500 text-sm">
                Transcript will appear here...
              </div>
            ) : (
              <div className="p-4 space-y-4">
                {transcript.map((entry) => (
                  <div 
                    key={entry.id}
                    className={`transcript-entry ${entry.speaker}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-semibold ${entry.speaker === 'ai' ? 'text-indigo-600 dark:text-indigo-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {entry.speaker === 'ai' ? 'Interviewer' : 'You'}
                      </span>
                      <span className="text-[10px] text-zinc-500 dark:text-zinc-600">
                        {entry.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-900/50 p-2 rounded-lg inline-block">
                      {entry.text}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Helper component for shield icon status
const ShieldCheckIcon: React.FC<{status: 'good' | 'warning' | 'danger'}> = ({status}) => {
  const color = status === 'good' ? 'text-emerald-500' : status === 'warning' ? 'text-amber-500' : 'text-red-500';
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`w-4 h-4 ${color}`}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      {status === 'good' && <path d="M9 12l2 2 4-4" />}
      {status !== 'good' && <path d="M12 8v4" />}
      {status !== 'good' && <path d="M12 16h.01" />}
    </svg>
  );
};