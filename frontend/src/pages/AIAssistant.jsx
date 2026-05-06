import { useState } from 'react';
import Layout from '../components/Layout';
import { Sparkles, FileText, Zap, BarChart3, ChevronRight } from 'lucide-react';
import JDParser from '../components/ai/JDParser';
import CoverLetterGenerator from '../components/ai/CoverLetterGenerator';
import ApplicationHealthAnalyzer from '../components/ai/ApplicationHealthAnalyzer';
import ResumeAnalyzer from '../components/ai/ResumeAnalyzer';

const tabs = [
  {
    id: 'health',
    label: 'App Health',
    icon: BarChart3,
    description: 'AI analysis of your application pipeline',
    color: 'text-info',
    bg: 'bg-info/10',
    border: 'border-info/30',
  },
  {
    id: 'jd-parser',
    label: 'JD Parser',
    icon: Zap,
    description: 'Auto-fill job details from any JD',
    color: 'text-warning',
    bg: 'bg-warning/10',
    border: 'border-warning/30',
  },
  {
    id: 'cover-letter',
    label: 'Message Gen',
    icon: Sparkles,
    description: 'Cover letters, referral DMs, cold emails',
    color: 'text-jobTracker',
    bg: 'bg-jobTracker/10',
    border: 'border-jobTracker/30',
  },
  {
    id: 'resume',
    label: 'Resume Match',
    icon: FileText,
    description: 'Score your resume against any JD',
    color: 'text-taskManager',
    bg: 'bg-taskManager/10',
    border: 'border-taskManager/30',
  },
];

export default function AIAssistant() {
  const [activeTab, setActiveTab] = useState('health');

  return (
    <Layout>
      <div className="space-y-6" data-testid="ai-assistant-page">
        {/* Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-4.5 h-4.5 text-primary" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-heading font-bold tracking-tight">AI Assistant</h1>
          </div>
          <p className="text-sm text-muted-foreground ml-11">
            Powered by Claude — your intelligent job search co-pilot
          </p>
        </div>

        {/* Tab Selector */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`p-4 rounded-xl border text-left transition-all duration-150 ${
                  isActive
                    ? `${tab.bg} ${tab.border} shadow-sm`
                    : 'border-white/5 bg-card/50 hover:border-white/10 hover:bg-card'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <Icon className={`w-4.5 h-4.5 mt-0.5 ${isActive ? tab.color : 'text-muted-foreground'}`} />
                  {isActive && <ChevronRight className={`w-3.5 h-3.5 ${tab.color}`} />}
                </div>
                <div className="mt-2.5">
                  <div className={`font-heading font-semibold text-sm ${isActive ? tab.color : 'text-foreground'}`}>
                    {tab.label}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    {tab.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Tab Content */}
        <div className="min-h-[400px]">
          {activeTab === 'health' && <ApplicationHealthAnalyzer />}
          {activeTab === 'jd-parser' && <JDParser />}
          {activeTab === 'cover-letter' && <CoverLetterGenerator />}
          {activeTab === 'resume' && <ResumeAnalyzer />}
        </div>
      </div>
    </Layout>
  );
}