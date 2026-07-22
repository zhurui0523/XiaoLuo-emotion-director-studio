import React from 'react';
import { useEmotionStore } from '../store/useEmotionStore';
import { Sparkles, SlidersHorizontal, Code2, RefreshCw, Wand2, Compass, Eye, Film, Layers } from 'lucide-react';

export const Header: React.FC = () => {
  const {
    renderQuality,
    setRenderQuality,
    analyzeCharacterWithAI,
    isAiAnalyzing,
    generatePrompts,
    isGeneratingPrompts,
    setIsSkillModalOpen,
    resetToDefault,
  } = useEmotionStore();

  return (
    <header className="bg-white border-b border-slate-200/80 px-4 md:px-8 py-3.5 flex items-center justify-between sticky top-0 z-40 shadow-xs">
      {/* Brand logo & title */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100 shadow-xs">
          <Layers className="w-5 h-5 text-indigo-600" />
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-slate-800 text-base md:text-lg tracking-tight flex items-center gap-1.5">
              <span>小逻-多视角与情绪编辑器</span>
            </h1>
            <span className="px-2 py-0.5 text-[10px] font-mono font-semibold bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-full">
              Studio Edition
            </span>
          </div>
          <p className="text-xs text-slate-400 hidden sm:block">
            XiaoLuo Emotion & Multi-View Director — AI Character Facial Performance Matrix
          </p>
        </div>
      </div>

      {/* Top Right Navigation Mode Pills (matching screenshot) */}
      <div className="flex items-center gap-3">
        <div className="hidden lg:flex items-center bg-slate-100/80 p-1 rounded-2xl border border-slate-200/60 text-xs font-medium text-slate-600 gap-1">
          <button className="px-3.5 py-1.5 rounded-xl bg-white text-indigo-600 font-semibold shadow-xs border border-slate-200/60 flex items-center gap-1.5 transition-all">
            <Compass className="w-3.5 h-3.5 text-indigo-600" />
            <span>3D 情绪空间</span>
          </button>
          <button className="px-3.5 py-1.5 rounded-xl hover:bg-slate-200/60 text-slate-600 flex items-center gap-1.5 transition-all">
            <Eye className="w-3.5 h-3.5 text-amber-500" />
            <span>面部微表情</span>
          </button>
          <button className="px-3.5 py-1.5 rounded-xl hover:bg-slate-200/60 text-slate-600 flex items-center gap-1.5 transition-all">
            <Film className="w-3.5 h-3.5 text-indigo-500" />
            <span>情绪 & 表演 联动</span>
          </button>
        </div>

        {/* Quality Selector */}
        <div className="bg-slate-100/80 border border-slate-200/60 rounded-xl p-0.5 flex items-center text-xs">
          {(['1K', '2K', '4K'] as const).map((q) => (
            <button
              key={q}
              onClick={() => setRenderQuality(q)}
              className={`px-2.5 py-1 rounded-lg transition-all font-mono font-semibold text-[11px] ${
                renderQuality === q
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {q}
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => analyzeCharacterWithAI()}
            disabled={isAiAnalyzing}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-700 text-xs font-medium flex items-center gap-1.5 transition-all disabled:opacity-50"
            title="Gemini AI 智能情绪识别"
          >
            <Sparkles className={`w-3.5 h-3.5 text-amber-500 ${isAiAnalyzing ? 'animate-spin' : ''}`} />
            <span className="hidden md:inline">{isAiAnalyzing ? '识别中...' : 'AI识别'}</span>
          </button>

          <button
            onClick={() => setIsSkillModalOpen(true)}
            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-600 transition-all"
            title="Skill 参数规范"
          >
            <Code2 className="w-4 h-4 text-slate-600" />
          </button>

          <button
            onClick={resetToDefault}
            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-500 hover:text-slate-800 transition-all"
            title="重置"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

