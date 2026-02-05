import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { Button } from './Button';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  Eye,
  Lightbulb,
  MessageSquare,
  Mic,
  Shield,
  Sparkles,
  Star,
  Target,
  ThumbsUp,
  Users,
  Video,
  AlertTriangle,
  Brain,
  Zap,
  Heart,
  TrendingUp,
  Award,
  Sun,
  Moon,
  Bot,
  Search,
  BarChart2,
  HeartHandshake,
  ClipboardList
} from 'lucide-react';
import { IconWrapper } from './RichIcons';

interface GuideSectionProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  accentColor?: string;
}

const GuideSection: React.FC<GuideSectionProps> = ({ icon, title, children, accentColor = 'emerald' }) => (
  <div className="p-6 md:p-8 rounded-2xl bg-white/50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 hover:bg-white dark:hover:bg-white/10 transition-all duration-300">
    <div className="flex items-start gap-4">
      <div className={`p-3 rounded-xl bg-${accentColor}-500/10 text-${accentColor}-600 dark:text-${accentColor}-400 flex-shrink-0`}>
        {icon}
      </div>
      <div className="flex-1">
        <h3 className="text-xl font-bold mb-4 text-zinc-900 dark:text-white">{title}</h3>
        <div className="space-y-3 text-zinc-600 dark:text-zinc-400 leading-relaxed">
          {children}
        </div>
      </div>
    </div>
  </div>
);

interface TipCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const TipCard: React.FC<TipCardProps> = ({ icon, title, description }) => (
  <div className="p-5 rounded-xl bg-gradient-to-br from-emerald-500/5 to-teal-500/5 border border-emerald-500/20 hover:border-emerald-500/40 transition-all duration-300 hover:scale-[1.02] group">
    <div className="mb-4">{icon}</div>
    <h4 className="font-semibold text-zinc-900 dark:text-white mb-2">{title}</h4>
    <p className="text-sm text-zinc-600 dark:text-zinc-400">{description}</p>
  </div>
);

interface ChecklistItemProps {
  checked?: boolean;
  children: React.ReactNode;
}

const ChecklistItem: React.FC<ChecklistItemProps> = ({ checked = true, children }) => (
  <div className="flex items-start gap-3 py-2">
    <CheckCircle2 className={`w-5 h-5 flex-shrink-0 mt-0.5 ${checked ? 'text-emerald-500' : 'text-zinc-400'}`} />
    <span className="text-zinc-700 dark:text-zinc-300">{children}</span>
  </div>
);

export const GuidePage: React.FC = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const starMethodSteps = [
    { letter: 'S', word: 'Situation', description: 'Set the context and background for your story', color: 'bg-blue-500' },
    { letter: 'T', word: 'Task', description: 'Explain your specific responsibility or challenge', color: 'bg-purple-500' },
    { letter: 'A', word: 'Action', description: 'Describe the steps you took to address the task', color: 'bg-emerald-500' },
    { letter: 'R', word: 'Result', description: 'Share the outcomes and what you learned', color: 'bg-amber-500' },
  ];

  const dosDonts = {
    dos: [
      "Practice out loud before your interview",
      "Research the company thoroughly",
      "Prepare specific examples from your experience",
      "Ask thoughtful questions about the role",
      "Follow up with a thank you note",
      "Maintain good posture and eye contact",
    ],
    donts: [
      "Don't badmouth previous employers",
      "Don't give one-word answers",
      "Don't interrupt the interviewer",
      "Don't forget to silence your phone",
      "Don't arrive unprepared or late",
      "Don't lie or exaggerate your experience",
    ],
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-white transition-colors duration-300">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="glow-orb glow-orb-purple w-[600px] h-[600px] -top-[200px] -right-[200px] opacity-10 dark:opacity-20" />
        <div className="glow-orb w-[500px] h-[500px] bottom-0 -left-[200px] opacity-10 dark:opacity-20" style={{ background: 'rgba(16, 185, 129, 0.2)' }} />
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-black/80 border-b border-zinc-200 dark:border-white/5">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<ArrowLeft className="w-4 h-4" />}
              onClick={() => navigate(-1)}
              className="text-zinc-600 dark:text-zinc-400"
            >
              Back
            </Button>
            <div className="h-6 w-px bg-zinc-200 dark:bg-white/10" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-sm">MockMate Guide</span>
            </div>
          </div>
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative z-10 px-6 py-16 md:py-24">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm font-medium mb-6">
            <BookOpen className="w-4 h-4" />
            Complete Interview Guide
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Master Your
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 dark:from-emerald-400 dark:via-teal-300 dark:to-emerald-400"> Interview Skills</span>
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Learn proven strategies, techniques, and best practices to ace your next job interview. 
            From preparation to follow-up, we've got you covered.
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 px-6 pb-20">
        <div className="max-w-5xl mx-auto space-y-16">

          {/* Quick Tips Grid */}
          <section>
            <h2 className="text-2xl md:text-3xl font-bold mb-8 flex items-center gap-3">
              <Lightbulb className="w-7 h-7 text-amber-500" />
              Quick Tips for Success
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <TipCard
                icon={
                  <IconWrapper gradient="from-emerald-500 to-teal-500" size="sm">
                    <Target className="w-5 h-5 text-emerald-200" />
                    <Lightbulb className="absolute -top-1 -left-1 w-3 h-3 text-emerald-400 opacity-50" />
                  </IconWrapper>
                }
                title="Know Your Why"
                description="Be ready to articulate why you want this specific role at this specific company."
              />
              <TipCard
                icon={
                  <IconWrapper gradient="from-blue-500 to-cyan-500" size="sm">
                    <BarChart2 className="w-5 h-5 text-blue-200" />
                    <TrendingUp className="absolute -bottom-1 -right-1 w-3 h-3 text-cyan-400 opacity-50" />
                  </IconWrapper>
                }
                title="Quantify Results"
                description="Use numbers and metrics to demonstrate your impact in previous roles."
              />
              <TipCard
                icon={
                  <IconWrapper gradient="from-amber-500 to-orange-500" size="sm">
                    <Search className="w-5 h-5 text-amber-200" />
                    <Lightbulb className="absolute -top-1 -left-1 w-3 h-3 text-orange-400 opacity-50" />
                  </IconWrapper>
                }
                title="Research Deeply"
                description="Study the company's products, culture, recent news, and competitors."
              />
              <TipCard
                icon={
                  <IconWrapper gradient="from-violet-500 to-purple-500" size="sm">
                    <Clock className="w-5 h-5 text-violet-200" />
                    <Zap className="absolute -bottom-1 -right-1 w-3 h-3 text-purple-400 opacity-50" />
                  </IconWrapper>
                }
                title="Time Your Answers"
                description="Keep responses between 1-2 minutes. Practice with a timer."
              />
              <TipCard
                icon={
                  <IconWrapper gradient="from-rose-500 to-pink-500" size="sm">
                    <HeartHandshake className="w-5 h-5 text-rose-200" />
                    <Users className="absolute -bottom-1 -right-1 w-3 h-3 text-pink-400 opacity-50" />
                  </IconWrapper>
                }
                title="Build Rapport"
                description="Find common ground and show genuine interest in your interviewer."
              />
              <TipCard
                icon={
                  <IconWrapper gradient="from-indigo-500 to-blue-500" size="sm">
                    <Zap className="w-5 h-5 text-indigo-200" />
                    <Shield className="absolute -top-1 -left-1 w-3 h-3 text-blue-400 opacity-50" />
                  </IconWrapper>
                }
                title="Stay Confident"
                description="Project confidence through eye contact, posture, and clear speech."
              />
            </div>
          </section>

          {/* STAR Method */}
          <section className="p-8 md:p-12 rounded-3xl bg-gradient-to-br from-zinc-900 to-zinc-800 dark:from-white/5 dark:to-white/[0.02] border border-zinc-700 dark:border-white/10">
            <div className="flex items-start gap-4 mb-8">
              <div className="p-3 rounded-xl bg-amber-500/20 text-amber-500">
                <Star className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">The STAR Method</h2>
                <p className="text-zinc-400">Structure your answers for behavioral questions using this proven framework.</p>
              </div>
            </div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {starMethodSteps.map((step, index) => (
                <div key={index} className="relative">
                  <div className={`${step.color} w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl font-bold mb-4`}>
                    {step.letter}
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{step.word}</h3>
                  <p className="text-sm text-zinc-400">{step.description}</p>
                  {index < 3 && (
                    <div className="hidden lg:block absolute top-6 -right-2 text-zinc-600">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-8 p-6 rounded-xl bg-white/5 border border-white/10">
              <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                Example Using STAR
              </h4>
              <p className="text-zinc-300 text-sm leading-relaxed">
                <span className="text-blue-400 font-medium">"(S)</span> At my previous company, we were facing a 40% drop in customer retention. 
                <span className="text-purple-400 font-medium"> (T)</span> I was tasked with identifying the root cause and developing a solution. 
                <span className="text-emerald-400 font-medium"> (A)</span> I conducted user interviews, analyzed data patterns, and implemented a new onboarding flow with personalized check-ins. 
                <span className="text-amber-400 font-medium"> (R)</span> Within 3 months, we improved retention by 28% and received positive feedback from 85% of new users."
              </p>
            </div>
          </section>

          {/* Interview Types */}
          <section>
            <h2 className="text-2xl md:text-3xl font-bold mb-8 flex items-center gap-3">
              <Target className="w-7 h-7 text-blue-500" />
              Types of Interview Questions
            </h2>
            <div className="grid gap-6">
              <GuideSection icon={<Brain className="w-5 h-5" />} title="Behavioral Questions">
                <p>These questions ask about past experiences to predict future behavior. They often start with "Tell me about a time when..." or "Give an example of..."</p>
                <div className="mt-4 space-y-2">
                  <p className="font-medium text-zinc-800 dark:text-zinc-200">Common examples:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Describe a challenging project and how you handled it</li>
                    <li>Tell me about a conflict with a coworker and its resolution</li>
                    <li>Share an example of when you showed leadership</li>
                  </ul>
                </div>
              </GuideSection>

              <GuideSection icon={<Zap className="w-5 h-5" />} title="Technical Questions">
                <p>These assess your industry-specific knowledge and problem-solving abilities. Prepare by reviewing fundamentals and practicing coding challenges if applicable.</p>
                <div className="mt-4 p-4 rounded-lg bg-zinc-100 dark:bg-white/5 text-sm">
                  <p className="font-medium text-zinc-800 dark:text-zinc-200 mb-2">💡 Pro Tip:</p>
                  <p>Think out loud during technical questions. Interviewers want to understand your thought process, not just see the final answer.</p>
                </div>
              </GuideSection>

              <GuideSection icon={<Heart className="w-5 h-5" />} title="Cultural Fit Questions">
                <p>These evaluate if you'll thrive in the company's environment. Research the company's values and prepare examples that align with their culture.</p>
                <div className="mt-4 space-y-2">
                  <p className="font-medium text-zinc-800 dark:text-zinc-200">Be ready to discuss:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Your preferred work style and environment</li>
                    <li>How you handle feedback and criticism</li>
                    <li>What motivates you in your career</li>
                  </ul>
                </div>
              </GuideSection>
            </div>
          </section>

          {/* Do's and Don'ts */}
          <section>
            <h2 className="text-2xl md:text-3xl font-bold mb-8 flex items-center gap-3">
              <Shield className="w-7 h-7 text-emerald-500" />
              Interview Do's and Don'ts
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
                <h3 className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mb-4 flex items-center gap-2">
                  <ThumbsUp className="w-5 h-5" />
                  Do's
                </h3>
                <div className="space-y-1">
                  {dosDonts.dos.map((item, index) => (
                    <ChecklistItem key={index}>{item}</ChecklistItem>
                  ))}
                </div>
              </div>
              <div className="p-6 rounded-2xl bg-red-500/5 border border-red-500/20">
                <h3 className="text-lg font-bold text-red-600 dark:text-red-400 mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Don'ts
                </h3>
                <div className="space-y-1">
                  {dosDonts.donts.map((item, index) => (
                    <ChecklistItem key={index} checked={false}>{item}</ChecklistItem>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Body Language */}
          <section>
            <h2 className="text-2xl md:text-3xl font-bold mb-8 flex items-center gap-3">
              <Video className="w-7 h-7 text-purple-500" />
              Body Language & Presentation
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-xl bg-white/50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-center">
                <Eye className="w-8 h-8 mx-auto mb-3 text-blue-500" />
                <h4 className="font-semibold mb-2">Eye Contact</h4>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">Maintain natural eye contact to show confidence and engagement</p>
              </div>
              <div className="p-5 rounded-xl bg-white/50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-center">
                <TrendingUp className="w-8 h-8 mx-auto mb-3 text-emerald-500" />
                <h4 className="font-semibold mb-2">Posture</h4>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">Sit up straight with shoulders back to project confidence</p>
              </div>
              <div className="p-5 rounded-xl bg-white/50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-center">
                <Mic className="w-8 h-8 mx-auto mb-3 text-amber-500" />
                <h4 className="font-semibold mb-2">Voice</h4>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">Speak clearly at a measured pace with varied intonation</p>
              </div>
              <div className="p-5 rounded-xl bg-white/50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-center">
                <Sparkles className="w-8 h-8 mx-auto mb-3 text-purple-500" />
                <h4 className="font-semibold mb-2">Energy</h4>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">Show enthusiasm and positivity throughout the interview</p>
              </div>
            </div>
          </section>

          {/* Before, During, After */}
          <section>
            <h2 className="text-2xl md:text-3xl font-bold mb-8 flex items-center gap-3">
              <Clock className="w-7 h-7 text-teal-500" />
              Interview Timeline
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="p-6 rounded-2xl bg-white/50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 group hover:border-emerald-500/30 transition-colors">
                <div className="mb-6">
                  <IconWrapper gradient="from-blue-500 to-cyan-500" size="md">
                    <ClipboardList className="w-8 h-8 text-blue-200" />
                    <Search className="absolute -bottom-2 -right-2 w-5 h-5 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
                  </IconWrapper>
                </div>
                <h3 className="text-lg font-bold mb-4">Before</h3>
                <ul className="space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    Research the company and role
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    Prepare your STAR stories
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    Practice with MockMate
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    Plan your outfit and route
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    Get a good night's sleep
                  </li>
                </ul>
              </div>
              <div className="p-6 rounded-2xl bg-white/50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 group hover:border-emerald-500/30 transition-colors">
                <div className="mb-6">
                  <IconWrapper gradient="from-emerald-500 to-teal-500" size="md">
                    <Target className="w-8 h-8 text-emerald-200" />
                    <Brain className="absolute -bottom-2 -right-2 w-5 h-5 text-teal-400 drop-shadow-[0_0_8px_rgba(45,212,191,0.5)]" />
                  </IconWrapper>
                </div>
                <h3 className="text-lg font-bold mb-4">During</h3>
                <ul className="space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    Arrive 10-15 minutes early
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    Greet everyone with a smile
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    Listen actively to questions
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    Take a moment to think before answering
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    Ask thoughtful questions
                  </li>
                </ul>
              </div>
              <div className="p-6 rounded-2xl bg-white/50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 group hover:border-emerald-500/30 transition-colors">
                <div className="mb-6">
                  <IconWrapper gradient="from-amber-500 to-orange-500" size="md">
                    <Sparkles className="w-8 h-8 text-amber-200" />
                    <MessageSquare className="absolute -bottom-2 -right-2 w-5 h-5 text-orange-400 drop-shadow-[0_0_8px_rgba(251,146,60,0.5)]" />
                  </IconWrapper>
                </div>
                <h3 className="text-lg font-bold mb-4">After</h3>
                <ul className="space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    Send a thank you email within 24 hours
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    Reflect on what went well
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    Note areas for improvement
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    Follow up appropriately
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    Practice more with MockMate
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="text-center p-8 md:p-12 rounded-3xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20">
            <Award className="w-12 h-12 mx-auto mb-6 text-emerald-500" />
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to Practice?</h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-8 max-w-lg mx-auto">
              Put these tips into action with MockMate's AI-powered interview simulator. 
              Get real-time feedback and build your confidence.
            </p>
            <Button
              size="xl"
              glow
              onClick={() => navigate('/setup')}
              rightIcon={<ArrowRight className="w-5 h-5" />}
              className="min-w-[200px] h-14 text-lg"
            >
              Start Practice Interview
            </Button>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-zinc-200 dark:border-white/5 px-6 py-8">
        <div className="max-w-5xl mx-auto text-center text-sm text-zinc-500">
          <p>© 2026 MockMate AI. Master your interviews with confidence.</p>
        </div>
      </footer>
    </div>
  );
};
