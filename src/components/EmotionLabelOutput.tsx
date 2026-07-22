import React, { useState } from 'react';
import { useEmotionStore } from '../store/useEmotionStore';
import { deriveEmotionLabelFromVector } from '../data/presets';
import { Tag, Copy, Check, Info, Sparkles } from 'lucide-react';

export const EmotionLabelOutput: React.FC = () => {
  const { vector, facialState } = useEmotionStore();
  const emotionInfo = deriveEmotionLabelFromVector(vector);
  const [copiedTag, setCopiedTag] = useState<string | null>(null);

  const handleCopyKeywords = () => {
    const text = emotionInfo.keywords.join(', ');
    navigator.clipboard.writeText(text);
    setCopiedTag('all');
    setTimeout(() => setCopiedTag(null), 2000);
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
      <div>
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-3">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-800">
              情绪标签与语义 (EMOTION LABELS)
            </h2>
          </div>

          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
            {emotionInfo.zoneName}
          </span>
        </div>

        {/* Emotion Title */}
        <div className="flex items-baseline justify-between mb-3">
          <div>
            <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
              {emotionInfo.title}
            </h3>
            <p className="text-xs text-slate-500 font-mono mt-0.5">{emotionInfo.subtitle}</p>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-400 font-mono block">VECTOR COORDS</span>
            <span className="text-xs font-mono font-bold text-indigo-600">
              V:{vector.valence} A:{vector.arousal} D:{vector.distance}
            </span>
          </div>
        </div>

        {/* Generated Human Keywords Chips */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
            <span>情绪表现关键词 (Keywords)</span>
            <button
              onClick={handleCopyKeywords}
              className="text-indigo-600 hover:text-indigo-700 flex items-center gap-1 text-[11px] font-medium transition-colors bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded-md"
            >
              {copiedTag === 'all' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              <span>{copiedTag === 'all' ? '已复制' : '复制标签'}</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {emotionInfo.keywords.map((kw, i) => (
              <span
                key={i}
                className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200/80 text-xs font-mono text-slate-700 font-medium flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3 text-indigo-600" />
                {kw}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Micro State Footnote */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-mono">
        <span>眼神: {facialState.eye.direction}</span>
        <span>嘴部: {facialState.mouth.state}</span>
        <span>头倾: {facialState.face.headTilt}°</span>
      </div>
    </div>
  );
};
