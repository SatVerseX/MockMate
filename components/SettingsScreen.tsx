import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { AppSettings, DEFAULT_SETTINGS } from '../types';
import { useTheme } from '../context/ThemeContext';
import {
  Settings,
  ArrowLeft,
  Moon,
  Sun,
  Monitor,
  Volume2,
  Mic,
  Video,
  Shield,
  ScanFace,
  MessageSquare,
  Save,
  RotateCcw,
  Info
} from 'lucide-react';

interface SettingsScreenProps {
  onBack: () => void;
  settings?: AppSettings;
  onSave?: (settings: AppSettings) => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ 
  onBack, 
  settings: initialSettings,
  onSave 
}) => {
  const [settings, setSettings] = useState<AppSettings>(initialSettings || DEFAULT_SETTINGS);
  const [hasChanges, setHasChanges] = useState(false);
  const { theme: currentTheme, toggleTheme } = useTheme();
  
  // Device enumeration
  const [audioInputDevices, setAudioInputDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioOutputDevices, setAudioOutputDevices] = useState<MediaDeviceInfo[]>([]);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);

  // Enumerate devices on mount
  useEffect(() => {
    const enumerateDevices = async () => {
      try {
        // Request permission first to get labeled devices
        await navigator.mediaDevices.getUserMedia({ audio: true, video: true }).then(stream => {
          stream.getTracks().forEach(track => track.stop());
        }).catch(() => {});
        
        const devices = await navigator.mediaDevices.enumerateDevices();
        setAudioInputDevices(devices.filter(d => d.kind === 'audioinput'));
        setAudioOutputDevices(devices.filter(d => d.kind === 'audiooutput'));
        setVideoDevices(devices.filter(d => d.kind === 'videoinput'));
      } catch (err) {
        console.error('Failed to enumerate devices:', err);
      }
    };
    enumerateDevices();
  }, []);

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
    
    // Apply theme change immediately
    if (key === 'theme') {
      const newTheme = value as 'dark' | 'light' | 'system';
      if (newTheme === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if ((prefersDark && currentTheme === 'light') || (!prefersDark && currentTheme === 'dark')) {
          toggleTheme();
        }
      } else if (newTheme !== currentTheme) {
        toggleTheme();
      }
    }
  };

  const handleSave = () => {
    onSave?.(settings);
    setHasChanges(false);
  };

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS);
    setHasChanges(true);
    // Reset theme to dark (default)
    if (currentTheme !== 'dark') {
      toggleTheme();
    }
  };

  const ToggleSwitch: React.FC<{ 
    enabled: boolean; 
    onChange: (value: boolean) => void;
    disabled?: boolean;
  }> = ({ enabled, onChange, disabled }) => (
    <button
      onClick={() => !disabled && onChange(!enabled)}
      disabled={disabled}
      className={`relative w-12 h-6 rounded-full transition-all duration-200 ${
        enabled ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-700'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-200 ${
        enabled ? 'left-7' : 'left-1'
      }`} />
    </button>
  );

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-white transition-colors duration-300">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="glow-orb glow-orb-purple w-[300px] h-[300px] top-0 right-0 opacity-10 dark:opacity-15" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-zinc-200 dark:border-white/5 px-6 py-4 lg:px-12 bg-white/50 dark:bg-black/50 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back</span>
          </button>
          
          <h1 className="text-lg font-semibold flex items-center gap-2 text-zinc-900 dark:text-white">
            <Settings className="w-5 h-5" />
            Settings
          </h1>

          <div className="w-16" />
        </div>
      </header>

      <main className="relative z-10 px-6 py-8 lg:px-12">
        <div className="max-w-3xl mx-auto space-y-6">
          
          {/* Appearance Section */}
          <div className="glass-card p-6 fade-in-up bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 shadow-sm">
            <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-4">
              Appearance
            </h2>
            
            <div className="space-y-4">
              {/* Theme Selection */}
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
                    <Moon className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
                  </div>
                  <div>
                    <div className="font-medium text-zinc-900 dark:text-white">Theme</div>
                    <div className="text-sm text-zinc-500">Choose your preferred theme</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  {([
                    { value: 'dark', icon: <Moon className="w-4 h-4" />, label: 'Dark' },
                    { value: 'light', icon: <Sun className="w-4 h-4" />, label: 'Light' },
                    { value: 'system', icon: <Monitor className="w-4 h-4" />, label: 'System' },
                  ] as const).map((option) => (
                    <button
                      key={option.value}
                      onClick={() => updateSetting('theme', option.value)}
                      className={`px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-all border ${
                        settings.theme === option.value
                          ? 'bg-zinc-900 dark:bg-white text-white dark:text-black border-zinc-900 dark:border-white'
                          : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700'
                      }`}
                    >
                      {option.icon}
                      <span className="hidden sm:inline">{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Audio & Video Section */}
          <div className="glass-card p-6 fade-in-up bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 shadow-sm" style={{ animationDelay: '0.1s' }}>
            <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-4">
              Audio & Video
            </h2>
            
            <div className="space-y-1">
              {/* AI Voice */}
              <div className="flex items-center justify-between py-4 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
                    <Volume2 className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
                  </div>
                  <div>
                    <div className="font-medium text-zinc-900 dark:text-white">AI Voice</div>
                    <div className="text-sm text-zinc-500">Interviewer voice preference</div>
                  </div>
                </div>
                <select
                  value={settings.aiVoice}
                  onChange={(e) => updateSetting('aiVoice', e.target.value)}
                  className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-300 dark:focus:border-white transition-colors"
                >
                  <option value="Kore">Kore (Default)</option>
                  <option value="Puck">Puck</option>
                  <option value="Charon">Charon</option>
                  <option value="Fenrir">Fenrir</option>
                </select>
              </div>

              {/* Microphone */}
              <div className="flex items-center justify-between py-4 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
                    <Mic className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
                  </div>
                  <div>
                    <div className="font-medium text-zinc-900 dark:text-white">Default Microphone</div>
                    <div className="text-sm text-zinc-500">Select input device</div>
                  </div>
                </div>
                <select
                  value={settings.audioInputDevice || 'default'}
                  onChange={(e) => updateSetting('audioInputDevice', e.target.value)}
                  className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-300 dark:focus:border-white max-w-[200px] truncate transition-colors"
                >
                  <option value="default">System Default</option>
                  {audioInputDevices.map(device => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label || `Microphone ${device.deviceId.slice(0, 8)}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Camera */}
              <div className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
                    <Video className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
                  </div>
                  <div>
                    <div className="font-medium text-zinc-900 dark:text-white">Default Camera</div>
                    <div className="text-sm text-zinc-500">Select video device</div>
                  </div>
                </div>
                <select
                  value={settings.videoDevice || 'default'}
                  onChange={(e) => updateSetting('videoDevice', e.target.value)}
                  className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-300 dark:focus:border-white max-w-[200px] truncate transition-colors"
                >
                  <option value="default">System Default</option>
                  {videoDevices.map(device => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label || `Camera ${device.deviceId.slice(0, 8)}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Interview Features Section */}
          <div className="glass-card p-6 fade-in-up bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 shadow-sm" style={{ animationDelay: '0.2s' }}>
            <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-4">
              Interview Features
            </h2>
            
            <div className="space-y-1">
              {/* Enable Transcript */}
              <div className="flex items-center justify-between py-4 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
                  </div>
                  <div>
                    <div className="font-medium text-zinc-900 dark:text-white">Live Transcript</div>
                    <div className="text-sm text-zinc-500">Show real-time transcript panel</div>
                  </div>
                </div>
                <ToggleSwitch 
                  enabled={settings.enableTranscript}
                  onChange={(value) => updateSetting('enableTranscript', value)}
                />
              </div>

              {/* Face Tracking */}
              <div className="flex items-center justify-between py-4 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
                    <ScanFace className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
                  </div>
                  <div>
                    <div className="font-medium text-zinc-900 dark:text-white">Face Tracking</div>
                    <div className="text-sm text-zinc-500">Monitor attention and eye contact</div>
                  </div>
                </div>
                <ToggleSwitch 
                  enabled={settings.enableFaceTracking}
                  onChange={(value) => updateSetting('enableFaceTracking', value)}
                />
              </div>

              {/* Anti-Cheat */}
              <div className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
                  </div>
                  <div>
                    <div className="font-medium text-zinc-900 dark:text-white">Anti-Cheat System</div>
                    <div className="text-sm text-zinc-500">Monitor for tab switches and focus loss</div>
                  </div>
                </div>
                <ToggleSwitch 
                  enabled={settings.enableAntiCheat}
                  onChange={(value) => updateSetting('enableAntiCheat', value)}
                />
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 flex items-start gap-3 fade-in-up" style={{ animationDelay: '0.3s' }}>
            <Info className="w-5 h-5 text-indigo-500 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-indigo-700 dark:text-indigo-200/80">
              <p className="font-medium text-indigo-900 dark:text-indigo-200 mb-1">Note about Anti-Cheat</p>
              <p>Disabling anti-cheat features will still allow you to practice, but the interview experience won't be as realistic. We recommend keeping these enabled for the best preparation.</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 fade-in-up" style={{ animationDelay: '0.4s' }}>
            <Button 
              variant="ghost" 
              onClick={handleReset}
              leftIcon={<RotateCcw className="w-4 h-4" />}
            >
              Reset to Default
            </Button>
            <div className="flex-1" />
            <Button 
              variant="secondary"
              onClick={onBack}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={!hasChanges}
              leftIcon={<Save className="w-4 h-4" />}
              glow={hasChanges}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};
