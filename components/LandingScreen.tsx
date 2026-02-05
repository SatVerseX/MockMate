import { useTheme } from '../context/ThemeContext';
import { 
  Bot, 
  Sparkles, 
  Shield, 
  Mic, 
  Video, 
  Brain,
  ArrowRight,
  Play,
  Star,
  Users,
  Clock,
  TrendingUp,
  CheckCircle2,
  Moon,
  Sun
} from 'lucide-react';

import { Button } from './Button';
import { 
  TechnicalIcon, 
  BehavioralIcon, 
  HRIcon, 
  SystemDesignIcon,
  AiFeatureIcon,
  VideoFeatureIcon,
  VoiceFeatureIcon,
  SecurityFeatureIcon
} from './RichIcons';
import { Navbar } from './Navbar';

interface LandingScreenProps {
  onStart: () => void;
  onViewHistory?: () => void;
  onOpenSettings?: () => void;
}

export const LandingScreen: React.FC<LandingScreenProps> = ({ 
  onStart, 
  onViewHistory,
  onOpenSettings 
}) => {
  const { theme, toggleTheme } = useTheme();
  
  const features = [
    {
      component: <AiFeatureIcon />,
      title: 'AI-Powered Questions',
      description: 'Dynamic questions tailored to your role and experience',
    },
    {
      component: <VideoFeatureIcon />,
      title: 'Real-time Video Analysis',
      description: 'Get feedback on body language and eye contact',
    },
    {
      component: <VoiceFeatureIcon />,
      title: 'Voice Recognition',
      description: 'Natural conversation with instant speech analysis',
    },
    {
      component: <SecurityFeatureIcon />,
      title: 'Anti-Cheating System',
      description: 'Ensures authentic interview practice experience',
    },
  ];

  const stats = [
    { value: '10K+', label: 'Interviews Conducted', icon: <Users className="w-4 h-4" /> },
    { value: '95%', label: 'Success Rate', icon: <TrendingUp className="w-4 h-4" /> },
    { value: '4.9', label: 'User Rating', icon: <Star className="w-4 h-4" /> },
    { value: '24/7', label: 'Available', icon: <Clock className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-white overflow-hidden relative selection:bg-emerald-500/30 transition-colors duration-300">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Gradient Orbs */}
        <div className="glow-orb glow-orb-purple w-[800px] h-[800px] -top-[300px] -left-[300px] opacity-10 dark:opacity-20" />
        <div className="glow-orb w-[600px] h-[600px] top-1/2 -right-[200px] opacity-10 dark:opacity-20" style={{ background: 'rgba(16, 185, 129, 0.2)' }} />
        
        {/* Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(${theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} 1px, transparent 1px),
              linear-gradient(90deg, ${theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-6 lg:px-12 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Bot className="w-6 h-6" />
          </div>
          <span className="text-xl font-bold tracking-tight">MockMate</span>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-12 pt-8 pb-20 lg:pt-16 lg:pb-32">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          
          {/* Left: Copy */}
          <div className="flex flex-col gap-8 text-center lg:text-left fade-in-up">
            <div className="space-y-6">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1]">
                Master Your <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 dark:from-emerald-400 dark:via-teal-200 dark:to-white">
                  Dream Job
                </span>
              </h1>
              
              <p className="text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-xl mx-auto lg:mx-0">
                Practice with an intelligent AI interviewer that adapts to your role, provides real-time feedback, and helps you build unshakeable confidence.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
              <Button 
                size="xl" 
                glow
                onClick={onStart}
                rightIcon={<ArrowRight className="w-5 h-5" />}
                className="min-w-[200px] h-14 text-lg"
              >
                Start Interview
              </Button>
              <Button 
                variant="outline" 
                size="xl"
                leftIcon={<Play className="w-5 h-5" />}
                className="min-w-[180px] h-14 text-lg border-zinc-200 dark:border-white/10 hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-900 dark:text-white"
              >
                See How It Works
              </Button>
            </div>


          </div>

          {/* Right: Hero Image */}
          <div className="relative fade-in-up" style={{ animationDelay: '0.2s' }}>
            <div className="relative rounded-2xl overflow-hidden">
              <div className="absolute" />
              <img 
                src="/landing-hero.png" 
                alt="Confident professionals taking an interview" 
                className="w-full h-full object-cover"
              />
            </div>
             </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 mt-20 fade-in-up border-t border-white/5 pt-12" style={{ animationDelay: '0.4s' }}>
          {stats.map((stat, index) => (
            <div 
              key={index}
              className="text-center group"
            >
              <div className="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-white mb-1 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors">
                {stat.value}
              </div>
              <div className="text-xs text-zinc-500 uppercase tracking-wider font-medium flex items-center justify-center gap-2">
                {stat.icon}
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Features Section */}
      <section id="features" className="relative z-10 px-6 py-24 lg:px-12 bg-black/[0.05] dark:bg-white/[0.02]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Why Choose MockMate?
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto text-lg">
              Experience the most advanced AI interview preparation platform with features 
              designed to provide a realistic and supportive environment.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="glass-card p-8 group hover:scale-[1.02] transition-all duration-300 bg-white/50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 hover:bg-white dark:hover:bg-white/10 hover:shadow-xl hover:shadow-emerald-500/5"
                style={{ animationDelay: `${0.1 * index}s` }}
              >
                <div className="flex justify-start mb-6 transform group-hover:-translate-y-1 transition-transform duration-300">
                  {feature.component}
                </div>
                <h3 className="text-xl font-bold mb-3 text-zinc-900 dark:text-white">{feature.title}</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interview Types Preview */}
      <section id="practice-modes" className="relative z-10 px-6 py-24 lg:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Practice Any Scenario
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto text-lg">
              Our AI is trained on thousands of real interviews across multiple domains.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { component: <TechnicalIcon />, title: 'Technical', desc: 'Coding & Algorithms' },
              { component: <BehavioralIcon />, title: 'Behavioral', desc: 'Leadership & Culture' },
              { component: <HRIcon />, title: 'HR Round', desc: 'Salary & Fit' },
              { component: <SystemDesignIcon />, title: 'System Design', desc: 'Architecture & Scale' },
            ].map((type, index) => (
              <div 
                key={index}
                className="glass-card p-6 text-center cursor-pointer transition-all duration-300 hover:scale-105 bg-white/50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 hover:bg-white dark:hover:bg-white/10 group"
              >
                <div className="flex justify-center mb-6 transform transition-transform group-hover:scale-110">
                  {type.component}
                </div>
                <h3 className="font-bold text-lg mb-1 text-zinc-900 dark:text-white">{type.title}</h3>
                <p className="text-xs text-zinc-500">{type.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="relative z-10 px-6 py-20 lg:px-12">
        <div className="max-w-5xl mx-auto">
          <div className="glass-card-elevated p-12 md:p-20 text-center relative overflow-hidden rounded-3xl border border-zinc-200 dark:border-white/10 shadow-2xl">
            {/* Background Glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-blue-50 dark:from-emerald-900/40 dark:via-black dark:to-blue-900/40 pointer-events-none" />
            
            <h2 className="text-3xl md:text-5xl font-bold mb-6 relative z-10 text-zinc-900 dark:text-white">
              Your Dream Job Awaits
            </h2>
            <p className="text-zinc-600 dark:text-zinc-300 mb-10 max-w-lg mx-auto relative z-10 text-lg">
              Join thousands of professionals who have mastered their interview skills mock interviews.
            </p>
            <Button 
                size="xl" 
                glow
                onClick={onStart}
                rightIcon={<ArrowRight className="w-5 h-5" />}
                className="min-w-[200px] h-14 text-lg "
              >
                Start Interview
              </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-zinc-200 dark:border-white/5 px-6 py-10 lg:px-12 bg-white/50 dark:bg-black/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-zinc-500">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-zinc-900 dark:text-zinc-300">MockMate AI</span>
            <span>© 2026</span>
          </div>
          <div className="flex items-center gap-8 font-medium">
            <a href="#" className="hover:text-black dark:hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-black dark:hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-black dark:hover:text-white transition-colors">Contact Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
