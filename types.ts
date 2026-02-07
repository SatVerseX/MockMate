// Interview Types
export type InterviewType = 'technical' | 'behavioral' | 'hr' | 'system-design';

// Experience Levels
export type ExperienceLevel = 'Entry' | 'Mid' | 'Senior' | 'Lead';

// Interview Configuration
export interface InterviewConfig {
  candidateName: string;
  jobRole: string;
  jobDescription: string;
  experienceLevel: ExperienceLevel;
  interviewType: InterviewType;
  companyName?: string;
  skills?: string;
  resumeText?: string;
  portfolioLinks?: string; // Comma separated links
  duration: number; // in minutes
}

// Connection Status
export enum ConnectionStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting',
  ERROR = 'error',
}

// Interview Status
export enum InterviewStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  TERMINATED = 'terminated',
}

// Audio Visualizer Data
export interface AudioVisualizerData {
  volume: number;
  frequencies?: number[];
}

// Transcript Entry
export interface TranscriptEntry {
  id: string;
  speaker: 'ai' | 'user';
  text: string;
  timestamp: Date;
}

// Performance Metrics
export interface PerformanceMetrics {
  communication: number;       // 0-100
  technicalKnowledge: number;  // 0-100
  problemSolving: number;      // 0-100
  confidence: number;          // 0-100
  clarity: number;             // 0-100
  overallScore: number;        // 0-100
}

// AI Feedback
export interface AIFeedback {
  summary: string;
  strengths: string[];
  areasToImprove: string[];
  tips: string[];
  recommendedResources?: string[];
}

// Interview Result
export interface InterviewResult {
  id: string;
  config: InterviewConfig;
  startTime: Date;
  endTime: Date;
  duration: number; // in seconds
  status: InterviewStatus;
  metrics: PerformanceMetrics;
  feedback: AIFeedback;
  transcript: TranscriptEntry[];
  questionsAsked: number;
  warningCount: number;
}

// Interview History Item (for listing)
export interface InterviewHistoryItem {
  id: string;
  jobRole: string;
  interviewType: InterviewType;
  date: Date;
  duration: number;
  overallScore: number;
  status: InterviewStatus;
}

// System Check Status
export interface SystemCheckStatus {
  camera: 'pending' | 'checking' | 'passed' | 'failed';
  microphone: 'pending' | 'checking' | 'passed' | 'failed';
  speaker: 'pending' | 'checking' | 'passed' | 'failed';
  internet: 'pending' | 'checking' | 'passed' | 'failed';
}

// App Settings
export interface AppSettings {
  theme: 'dark' | 'light' | 'system';
  audioInputDevice?: string;
  audioOutputDevice?: string;
  videoDevice?: string;
  aiVoice: string;
  enableTranscript: boolean;
  enableFaceTracking: boolean;
  enableAntiCheat: boolean;
}

// App Step Type
export type AppStep =
  | 'landing'
  | 'setup'
  | 'system-check'
  | 'instructions'
  | 'interview'
  | 'results'
  | 'history'
  | 'settings';

// Interview Type Info
export interface InterviewTypeInfo {
  id: InterviewType;
  title: string;
  description: string;
  icon: string;
  duration: number; // default duration in minutes
  color: string;
}

// Constants
export const INTERVIEW_TYPES: InterviewTypeInfo[] = [
  {
    id: 'technical',
    title: 'Technical',
    description: 'Coding, algorithms, and system knowledge',
    icon: '💻',
    duration: 30,
    color: '#3b82f6',
  },
  {
    id: 'behavioral',
    title: 'Behavioral',
    description: 'STAR method, past experiences, soft skills',
    icon: '🎯',
    duration: 25,
    color: '#22c55e',
  },
  {
    id: 'hr',
    title: 'HR Round',
    description: 'Culture fit, salary, expectations',
    icon: '🤝',
    duration: 20,
    color: '#f59e0b',
  },
  {
    id: 'system-design',
    title: 'System Design',
    description: 'Architecture, scalability, design patterns',
    icon: '🏗️',
    duration: 45,
    color: '#8b5cf6',
  },
];

// Default Settings
export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  aiVoice: 'Kore',
  enableTranscript: true,
  enableFaceTracking: true,
  enableAntiCheat: true,
};

// Warning Thresholds
export const WARNING_THRESHOLD = 4;
export const LOOK_AWAY_THRESHOLD_MS = 3000;

// Subscription Plans
export interface Plan {
  id: string; // Razorpay Plan ID
  name: string;
  price: number; // in paise
  interval: 'monthly' | 'yearly' | 'daily';
  type?: 'one_time' | 'recurring';
  features: string[];
}

// Plan Tiers for feature gating
export type PlanTier = 'free' | 'one_day' | 'starter' | 'pro_monthly' | 'pro_yearly';

// Features that can be gated
export type GatedFeature =
  | 'unlimited_interviews'
  | 'detailed_analysis'
  | 'pdf_download'
  | 'interview_history'
  | 'audio_recording'
  | 'progress_analytics';

// User Subscription
export interface Subscription {
  user_id: string;
  razorpay_customer_id: string;
  razorpay_subscription_id: string;
  plan_id: string;
  status: 'active' | 'created' | 'halted' | 'cancelled' | 'completed' | 'expired';
  current_period_end: string; // ISO date string
}