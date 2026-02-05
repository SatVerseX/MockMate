import React from 'react';
import { 
  Laptop, 
  Code2, 
  Terminal, 
  Target, 
  Brain, 
  Lightbulb,
  Users, 
  HeartHandshake, 
  MessageCircle,
  Server, 
  Database, 
  Cloud,
  Sparkles,
  Bot,
  Zap,
  Video,
  ScanFace,
  Eye,
  Mic,
  AudioLines,
  Volume2,
  Shield,
  Lock,
  AlertTriangle
} from 'lucide-react';

export interface IconWrapperProps {
  children: React.ReactNode;
  gradient: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const IconWrapper: React.FC<IconWrapperProps> = ({ children, gradient, size = 'lg', className = '' }) => {
  const sizeClasses = {
    lg: 'w-20 h-20',
    md: 'w-16 h-16',
    sm: 'w-10 h-10'
  }[size];
  
  return (
    <div className={`relative ${sizeClasses} rounded-2xl bg-gradient-to-br ${gradient} p-[1px] group-hover:scale-110 transition-transform duration-300 ${className}`}>
      <div className="absolute inset-0 bg-black/40 rounded-2xl backdrop-blur-xl" />
      <div className="relative h-full w-full bg-gradient-to-br from-white/10 to-transparent rounded-2xl flex items-center justify-center overflow-hidden">
        {/* Glossy overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        {children}
      </div>
    </div>
  );
};

// -- Interview Type Icons (Large) --

interface IconProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const TechnicalIcon: React.FC<IconProps> = ({ size = 'lg', className }) => (
  <IconWrapper gradient="from-blue-500 to-cyan-500" size={size} className={className}>
    <div className="relative">
      <Laptop className={`${size === 'lg' ? 'w-10 h-10' : size === 'md' ? 'w-8 h-8' : 'w-5 h-5'} text-blue-200`} />
      <Code2 className={`absolute -bottom-2 -right-2 ${size === 'lg' ? 'w-6 h-6' : size === 'md' ? 'w-5 h-5' : 'w-3.5 h-3.5'} text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]`} />
      <Terminal className={`absolute -top-3 -left-3 ${size === 'lg' ? 'w-5 h-5' : size === 'md' ? 'w-4 h-4' : 'w-3 h-3'} text-blue-400 opacity-50`} />
    </div>
  </IconWrapper>
);

export const BehavioralIcon: React.FC<IconProps> = ({ size = 'lg', className }) => (
  <IconWrapper gradient="from-emerald-500 to-teal-500" size={size} className={className}>
    <div className="relative">
      <Target className={`${size === 'lg' ? 'w-10 h-10' : size === 'md' ? 'w-8 h-8' : 'w-5 h-5'} text-emerald-200`} />
      <Brain className={`absolute -bottom-2 -right-2 ${size === 'lg' ? 'w-6 h-6' : size === 'md' ? 'w-5 h-5' : 'w-3.5 h-3.5'} text-teal-400 drop-shadow-[0_0_8px_rgba(45,212,191,0.5)]`} />
      <Lightbulb className={`absolute -top-3 -left-3 ${size === 'lg' ? 'w-5 h-5' : size === 'md' ? 'w-4 h-4' : 'w-3 h-3'} text-emerald-400 opacity-50`} />
    </div>
  </IconWrapper>
);

export const HRIcon: React.FC<IconProps> = ({ size = 'lg', className }) => (
  <IconWrapper gradient="from-amber-500 to-orange-500" size={size} className={className}>
    <div className="relative">
      <HeartHandshake className={`${size === 'lg' ? 'w-10 h-10' : size === 'md' ? 'w-8 h-8' : 'w-5 h-5'} text-amber-200`} />
      <Users className={`absolute -bottom-2 -right-2 ${size === 'lg' ? 'w-6 h-6' : size === 'md' ? 'w-5 h-5' : 'w-3.5 h-3.5'} text-orange-400 drop-shadow-[0_0_8px_rgba(251,146,60,0.5)]`} />
      <MessageCircle className={`absolute -top-3 -left-3 ${size === 'lg' ? 'w-5 h-5' : size === 'md' ? 'w-4 h-4' : 'w-3 h-3'} text-amber-400 opacity-50`} />
    </div>
  </IconWrapper>
);

export const SystemDesignIcon: React.FC<IconProps> = ({ size = 'lg', className }) => (
  <IconWrapper gradient="from-purple-500 to-pink-500" size={size} className={className}>
    <div className="relative">
      <Server className={`${size === 'lg' ? 'w-10 h-10' : size === 'md' ? 'w-8 h-8' : 'w-5 h-5'} text-purple-200`} />
      <Database className={`absolute -bottom-2 -right-2 ${size === 'lg' ? 'w-6 h-6' : size === 'md' ? 'w-5 h-5' : 'w-3.5 h-3.5'} text-pink-400 drop-shadow-[0_0_8px_rgba(244,114,182,0.5)]`} />
      <Cloud className={`absolute -top-3 -left-3 ${size === 'lg' ? 'w-4 h-4' : size === 'md' ? 'w-3 h-3' : 'w-2.5 h-2.5'} text-purple-400 opacity-50`} />
    </div>
  </IconWrapper>
);

// -- Feature Icons (Medium) --

export const AiFeatureIcon: React.FC<IconProps> = ({ size = 'md', className }) => (
  <IconWrapper gradient="from-indigo-500 to-violet-500" size={size} className={className}>
    <div className="relative">
      <Bot className={`${size === 'lg' ? 'w-10 h-10' : size === 'md' ? 'w-8 h-8' : 'w-5 h-5'} text-indigo-200`} />
      <Sparkles className={`absolute -bottom-1 -right-1 ${size === 'lg' ? 'w-6 h-6' : size === 'md' ? 'w-5 h-5' : 'w-3.5 h-3.5'} text-violet-400 drop-shadow-[0_0_8px_rgba(167,139,250,0.5)]`} />
      <Zap className={`absolute -top-2 -left-2 ${size === 'lg' ? 'w-5 h-5' : size === 'md' ? 'w-4 h-4' : 'w-3 h-3'} text-indigo-400 opacity-50`} />
    </div>
  </IconWrapper>
);

export const VideoFeatureIcon: React.FC<IconProps> = ({ size = 'md', className }) => (
  <IconWrapper gradient="from-blue-500 to-indigo-500" size={size} className={className}>
    <div className="relative">
      <Video className={`${size === 'lg' ? 'w-10 h-10' : size === 'md' ? 'w-8 h-8' : 'w-5 h-5'} text-blue-200`} />
      <ScanFace className={`absolute -bottom-1 -right-1 ${size === 'lg' ? 'w-6 h-6' : size === 'md' ? 'w-5 h-5' : 'w-3.5 h-3.5'} text-indigo-400 drop-shadow-[0_0_8px_rgba(129,140,248,0.5)]`} />
      <Eye className={`absolute -top-2 -left-2 ${size === 'lg' ? 'w-5 h-5' : size === 'md' ? 'w-4 h-4' : 'w-3 h-3'} text-blue-400 opacity-50`} />
    </div>
  </IconWrapper>
);

export const VoiceFeatureIcon: React.FC<IconProps> = ({ size = 'md', className }) => (
  <IconWrapper gradient="from-rose-500 to-pink-500" size={size} className={className}>
    <div className="relative">
      <Mic className={`${size === 'lg' ? 'w-10 h-10' : size === 'md' ? 'w-8 h-8' : 'w-5 h-5'} text-rose-200`} />
      <AudioLines className={`absolute -bottom-1 -right-1 ${size === 'lg' ? 'w-6 h-6' : size === 'md' ? 'w-5 h-5' : 'w-3.5 h-3.5'} text-pink-400 drop-shadow-[0_0_8px_rgba(244,114,182,0.5)]`} />
      <Volume2 className={`absolute -top-2 -left-2 ${size === 'lg' ? 'w-5 h-5' : size === 'md' ? 'w-4 h-4' : 'w-3 h-3'} text-rose-400 opacity-50`} />
    </div>
  </IconWrapper>
);

export const SecurityFeatureIcon: React.FC<IconProps> = ({ size = 'md', className }) => (
  <IconWrapper gradient="from-slate-500 to-zinc-500" size={size} className={className}>
    <div className="relative">
      <Shield className={`${size === 'lg' ? 'w-10 h-10' : size === 'md' ? 'w-8 h-8' : 'w-5 h-5'} text-slate-200`} />
      <Lock className={`absolute -bottom-1 -right-1 ${size === 'lg' ? 'w-6 h-6' : size === 'md' ? 'w-5 h-5' : 'w-3.5 h-3.5'} text-zinc-400 drop-shadow-[0_0_8px_rgba(161,161,170,0.5)]`} />
      <AlertTriangle className={`absolute -top-2 -left-2 ${size === 'lg' ? 'w-5 h-5' : size === 'md' ? 'w-4 h-4' : 'w-3 h-3'} text-slate-400 opacity-50`} />
    </div>
  </IconWrapper>
);
