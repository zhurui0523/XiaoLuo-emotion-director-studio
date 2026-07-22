import React, { useState } from 'react';
import { useEmotionStore } from '../store/useEmotionStore';
import { Eye, Smile, Sliders, Wind, ChevronDown, Sparkles } from 'lucide-react';

export const FacialParameterPanel: React.FC = () => {
  const {
    facialState,
    updateEyeParam,
    updateEyebrowParam,
    updateMouthParam,
    updateFaceParam,
    generatePrompts,
    isGeneratingPrompts,
  } = useEmotionStore();

  const [activeTab, setActiveTab] = useState<'eye' | 'eyebrow' | 'mouth' | 'micro'>('eye');
  const [autoAddPrompt, setAutoAddPrompt] = useState(true);

  const tabs = [
    { id: 'eye', name: '眼睛眼神', icon: Eye },
    { id: 'eyebrow', name: '眉毛张力', icon: Sliders },
    { id: 'mouth', name: '嘴部表情', icon: Smile },
    { id: 'micro', name: '微表情&呼吸', icon: Wind },
  ] as const;

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-4 flex flex-col h-full shadow-xs justify-between">
      {/* Header (matching screenshot) */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-indigo-600" />
          <h2 className="text-sm font-bold text-slate-800 tracking-tight">
            精密面部微控参数 (FACIAL CONTROLS)
          </h2>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60 mb-3">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                isActive
                  ? 'bg-white text-indigo-600 shadow-xs border border-slate-200/60'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{tab.name}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <div className="space-y-3 flex-1 overflow-y-auto max-h-[220px] pr-1 text-xs">
        {/* 1. Eye Parameters */}
        {activeTab === 'eye' && (
          <div className="space-y-3">
            {/* Openness Slider Section */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-700">睁眼程度 (Eye Openness)</span>
                <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                  {facialState.eye.openness}%
                </span>
              </div>
              <input
                type="range"
                min="-50"
                max="50"
                value={facialState.eye.openness}
                onChange={(e) => updateEyeParam('openness', parseInt(e.target.value))}
                className="w-full cursor-pointer"
              />
              <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1 font-mono">
                <span>-50% (眯眼)</span>
                <div className="flex gap-1">
                  {[-30, 0, 30].map((val) => (
                    <button
                      key={val}
                      onClick={() => updateEyeParam('openness', val)}
                      className={`px-1.5 py-0.5 rounded ${
                        facialState.eye.openness === val
                          ? 'bg-indigo-600 text-white font-bold'
                          : 'bg-white border border-slate-200 text-slate-600'
                      }`}
                    >
                      {val > 0 ? `+${val}%` : `${val}%`}
                    </button>
                  ))}
                </div>
                <span>+50% (圆睁)</span>
              </div>
            </div>

            {/* Focus Intensity */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-700">视线强度/聚焦 (Focus)</span>
                <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                  {facialState.eye.focus}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={facialState.eye.focus}
                onChange={(e) => updateEyeParam('focus', parseInt(e.target.value))}
                className="w-full cursor-pointer"
              />
            </div>

            {/* Direction */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 space-y-1.5">
              <label className="font-semibold text-slate-700 block">眼神视线 (Gaze Direction)</label>
              <div className="relative">
                <select
                  value={facialState.eye.direction}
                  onChange={(e) => updateEyeParam('direction', e.target.value as any)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-800 text-xs font-medium focus:outline-none focus:border-indigo-500 appearance-none"
                >
                  <option value="direct gaze">直视镜头 / Direct Gaze</option>
                  <option value="avoid gaze">回避眼神 / Avoid Gaze</option>
                  <option value="cold stare">冷酷凝视 / Cold Stare</option>
                  <option value="soft gaze">温柔眼神 / Soft Gaze</option>
                  <option value="down">垂眸低头 / Lowered Down</option>
                  <option value="up">仰视 / Looking Up</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>
        )}

        {/* 2. Eyebrow Parameters */}
        {activeTab === 'eyebrow' && (
          <div className="space-y-3">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-700">眉毛紧张度 (Eyebrow Tension)</span>
                <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                  {facialState.eyebrow.tension}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={facialState.eyebrow.tension}
                onChange={(e) => updateEyebrowParam('tension', parseInt(e.target.value))}
                className="w-full cursor-pointer"
              />
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-700">眉毛高度 (Eyebrow Height)</span>
                <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                  {facialState.eyebrow.height}
                </span>
              </div>
              <input
                type="range"
                min="-50"
                max="50"
                value={facialState.eyebrow.height}
                onChange={(e) => updateEyebrowParam('height', parseInt(e.target.value))}
                className="w-full cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* 3. Mouth Parameters */}
        {activeTab === 'mouth' && (
          <div className="space-y-3">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-700">嘴角弧度 (Mouth Curve)</span>
                <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                  {facialState.mouth.curve > 0 ? `微笑 +${facialState.mouth.curve}` : `下垂 ${facialState.mouth.curve}`}
                </span>
              </div>
              <input
                type="range"
                min="-100"
                max="100"
                value={facialState.mouth.curve}
                onChange={(e) => updateMouthParam('curve', parseInt(e.target.value))}
                className="w-full cursor-pointer"
              />
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 space-y-1.5">
              <label className="font-semibold text-slate-700 block">嘴部状态 (Mouth State)</label>
              <div className="relative">
                <select
                  value={facialState.mouth.state}
                  onChange={(e) => updateMouthParam('state', e.target.value as any)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-800 text-xs font-medium focus:outline-none focus:border-indigo-500 appearance-none"
                >
                  <option value="neutral">自然闭合 / Neutral</option>
                  <option value="smile">微笑扬起 / Smile</option>
                  <option value="pressed lips">紧抿唇线 / Pressed Lips</option>
                  <option value="slight opening">微张吸气 / Slight Opening</option>
                  <option value="trembling">嘴唇颤抖 / Trembling</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>
        )}

        {/* 4. Micro Expressions */}
        {activeTab === 'micro' && (
          <div className="space-y-3">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-700">面部肌肉紧绷 (Muscle Tension)</span>
                <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                  {facialState.face.muscleTension}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={facialState.face.muscleTension}
                onChange={(e) => updateFaceParam('muscleTension', parseInt(e.target.value))}
                className="w-full cursor-pointer"
              />
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-700">头部倾斜 (Head Tilt)</span>
                <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                  {facialState.face.headTilt}°
                </span>
              </div>
              <input
                type="range"
                min="-30"
                max="30"
                value={facialState.face.headTilt}
                onChange={(e) => updateFaceParam('headTilt', parseInt(e.target.value))}
                className="w-full cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>

      {/* Auto Prompt Toggle Switch */}
      <div className="mt-3 bg-indigo-50/60 border border-indigo-100/80 rounded-xl p-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-600" />
          <span className="text-xs font-bold text-slate-700">生成时自动加入微表情提示词</span>
        </div>

        <button
          onClick={() => setAutoAddPrompt(!autoAddPrompt)}
          className={`w-10 h-5 rounded-full transition-colors relative flex items-center px-0.5 ${
            autoAddPrompt ? 'bg-indigo-600' : 'bg-slate-300'
          }`}
        >
          <div
            className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform ${
              autoAddPrompt ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
    </div>
  );
};

