import React, { useState } from 'react';
import { useEmotionStore } from '../store/useEmotionStore';
import { Code2, X, Copy, Check, Sparkles, Clapperboard, Monitor, Palette } from 'lucide-react';
import { deriveEmotionLabelFromVector } from '../data/presets';

export const SkillSandboxModal: React.FC = () => {
  const {
    isSkillModalOpen,
    setIsSkillModalOpen,
    vector,
    facialState,
    activeCharacter,
    generatedPrompts,
    keyframes,
  } = useEmotionStore();

  const [activeRole, setActiveRole] = useState<'drama' | 'ad' | 'concept'>('drama');
  const [copied, setCopied] = useState(false);

  if (!isSkillModalOpen) return null;

  const emotionInfo = deriveEmotionLabelFromVector(vector);

  const skillData = {
    skillName: 'Emotion Director Skill (小逻演员情绪导演技能)',
    version: 'v1.0',
    invokedBy:
      activeRole === 'drama'
        ? 'AI短剧导演 Agent (Short Drama Director)'
        : activeRole === 'ad'
        ? '广告导演 Agent (Commercial Ad Director)'
        : '角色设计 Agent (Character Concept Designer)',
    inputs: {
      characterImage: activeCharacter.image ? '[Base64/URL Character Reference]' : null,
      characterProfile: {
        name: activeCharacter.name,
        gender: activeCharacter.gender,
        age: activeCharacter.age,
        style: activeCharacter.style,
      },
      targetEmotion: emotionInfo.title,
      vectorCoordinates: vector,
    },
    outputs: {
      emotionState: {
        label: emotionInfo.title,
        labelEn: emotionInfo.subtitle,
        zone: emotionInfo.zoneName,
        keywords: emotionInfo.keywords,
      },
      facialParameters: facialState,
      prompts: generatedPrompts,
      animationTimelineCurve: keyframes,
    },
  };

  const jsonString = JSON.stringify(skillData, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200/80 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Emotion Director Skill 参数规范导出
              </h3>
              <p className="text-xs text-slate-500">
                标准 Skill 协议格式，可供下游 Agent（如 AI短剧/广告/概念图 Agent）调用
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsSkillModalOpen(false)}
            className="p-1 rounded-lg bg-white hover:bg-slate-100 text-slate-400 hover:text-slate-700 border border-slate-200 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Role Scenarios */}
        <div className="px-4 pt-3 pb-2 bg-white border-b border-slate-100 flex items-center gap-2">
          <span className="text-xs text-slate-500 font-semibold">调用场景:</span>
          {[
            { id: 'drama', name: 'AI短剧导演 Agent', icon: Clapperboard },
            { id: 'ad', name: '广告导演 Agent', icon: Monitor },
            { id: 'concept', name: '角色设计 Agent', icon: Palette },
          ].map((role) => {
            const Icon = role.icon;
            const isActive = activeRole === role.id;
            return (
              <button
                key={role.id}
                onClick={() => setActiveRole(role.id as any)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{role.name}</span>
              </button>
            );
          })}
        </div>

        {/* JSON Display Area */}
        <div className="p-4 flex-1 overflow-y-auto bg-slate-900 font-mono text-xs text-indigo-200">
          <pre className="whitespace-pre-wrap">{jsonString}</pre>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">
            已生成全套面部肌肉、微表情与情绪时间轴参数
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSkillModalOpen(false)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              关闭
            </button>
            <button
              onClick={handleCopy}
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? '已复制JSON' : '复制 Skill JSON'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
