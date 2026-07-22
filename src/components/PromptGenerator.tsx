import React, { useState } from 'react';
import { useEmotionStore } from '../store/useEmotionStore';
import { Terminal, Copy, Check, Wand2, Video, FileText, Film } from 'lucide-react';

interface TabItem {
  id: 'emotion' | 'video' | 'timeline';
  label: string;
  icon: any;
  text?: string;
  badge?: string;
}

export const PromptGenerator: React.FC = () => {
  const { generatedPrompts, generatePrompts, isGeneratingPrompts } = useEmotionStore();
  const [activeTab, setActiveTab] = useState<'emotion' | 'video' | 'timeline'>('timeline');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const handleCopy = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const tabs: TabItem[] = [
    {
      id: 'timeline',
      label: '时间轴连续演进 (Veo/Sora 30s)',
      icon: Film,
      text: generatedPrompts.timelineMotionPrompt || '暂无时间轴序列提示词',
      badge: '图1时间轴联动',
    },
    {
      id: 'video',
      label: '单帧视频指令 (Veo/Sora)',
      icon: Video,
      text: generatedPrompts.videoMotionPrompt,
    },
    {
      id: 'emotion',
      label: '单帧微表情描述',
      icon: FileText,
      text: generatedPrompts.emotionPrompt,
    },
  ];

  const currentTabObj = tabs.find((t) => t.id === activeTab) || tabs[0];

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-4 flex flex-col h-full shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-indigo-600" />
          <h2 className="text-sm font-bold text-slate-800">
            AI PROMPT & 视频表演参数 GENERATOR
          </h2>
        </div>

        <button
          onClick={() => generatePrompts()}
          disabled={isGeneratingPrompts}
          className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-600 text-xs font-bold flex items-center gap-1 transition-all disabled:opacity-50 shadow-2xs"
        >
          <Wand2 className="w-3.5 h-3.5" />
          <span>{isGeneratingPrompts ? '生成中...' : '同步时间轴并润色'}</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60 mb-3 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all ${
                isActive
                  ? 'bg-white text-indigo-600 shadow-xs border border-slate-200/60 font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="px-1.5 py-0.2 text-[9px] font-bold bg-indigo-100 text-indigo-700 rounded-full ml-0.5">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Code / Text Output Box */}
      <div className="relative flex-1 bg-slate-50 border border-slate-200/80 rounded-xl p-3 font-mono text-xs text-slate-800 min-h-[110px] max-h-[220px] overflow-y-auto leading-relaxed group">
        <div className="whitespace-pre-wrap select-all pr-16">
          {currentTabObj.text || '点击右上角“同步时间轴并润色”生成Prompt...'}
        </div>

        {/* Floating Copy Button */}
        <button
          onClick={() => handleCopy(currentTabObj.text || '', activeTab)}
          className="absolute top-2 right-2 px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 hover:text-slate-900 text-[11px] font-sans font-semibold flex items-center gap-1 transition-all shadow-xs"
        >
          {copiedSection === activeTab ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-emerald-600 font-bold">已复制</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-slate-400" />
              <span>复制此段</span>
            </>
          )}
        </button>
      </div>

      {/* Director Critique Note */}
      {generatedPrompts.directorNotes && (
        <div className="mt-2.5 p-2.5 rounded-xl bg-indigo-50/70 border border-indigo-100 text-[11px] text-indigo-900 flex items-start gap-1.5 font-medium">
          <span className="font-bold text-indigo-600 shrink-0">🎬 导演提示:</span>
          <span>{generatedPrompts.directorNotes}</span>
        </div>
      )}
    </div>
  );
};

