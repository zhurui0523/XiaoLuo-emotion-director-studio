import React, { useState } from 'react';
import { useEmotionStore } from '../store/useEmotionStore';
import { EMOTION_PRESETS } from '../data/presets';
import { BookmarkCheck, Sparkles, Heart, Frown, Shield, Search } from 'lucide-react';
import { ExpressionPresetThumbnail } from './MannequinHeadViewport';

export const EmotionPresets: React.FC = () => {
  const { activePresetId, applyPreset, vector, activeCharacter } = useEmotionStore();
  const [activeTab, setActiveTab] = useState<'all' | 'calm' | 'positive' | 'negative' | 'advanced'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const mannequinGender: 'male' | 'female' = activeCharacter.gender === '女' ? 'female' : 'male';

  const targetCol = Math.round((vector.valence + 100) / 50);
  const targetRow = Math.round((100 - vector.arousal) / 50);

  const categories = [
    { id: 'all', name: '全部预设', icon: BookmarkCheck },
    { id: 'calm', name: '平静类', icon: Sparkles },
    { id: 'positive', name: '正向类', icon: Heart },
    { id: 'negative', name: '负向类', icon: Frown },
    { id: 'advanced', name: '高级角色类', icon: Shield },
  ] as const;

  const filteredPresets = EMOTION_PRESETS.filter((p) => {
    const matchesTab = activeTab === 'all' || p.category === activeTab;
    const matchesSearch =
      p.name.includes(searchQuery) ||
      p.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.includes(searchQuery);
    return matchesTab && matchesSearch;
  });

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-4 flex flex-col h-full shadow-xs">
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 mb-3">
        <div className="flex items-center gap-2">
          <BookmarkCheck className="w-4 h-4 text-indigo-600" />
          <h2 className="text-sm font-bold text-slate-800">
            情绪预设库 (25 个演艺表演预设)
          </h2>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-52">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索情绪/角色预设..."
            className="w-full pl-8 pr-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 font-medium"
          />
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3 no-scrollbar">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeTab === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveTab(cat.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100/80 hover:bg-slate-200/80 text-slate-600 border border-slate-200/60'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>

      {/* Presets Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 overflow-y-auto max-h-[340px] pr-1">
        {filteredPresets.map((preset) => {
          const pCol = Math.round((preset.vector.valence + 100) / 50);
          const pRow = Math.round((100 - preset.vector.arousal) / 50);
          const isSelected = activePresetId === preset.id || (pCol === targetCol && pRow === targetRow);
          return (
            <button
              key={preset.id}
              onClick={() => applyPreset(preset.id)}
              className={`p-2.5 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between group ${
                isSelected
                  ? 'border-indigo-500 bg-indigo-50/80 shadow-xs'
                  : 'border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:bg-slate-100/60'
              }`}
            >
              <ExpressionPresetThumbnail
                emotionName={preset.nameEn}
                gender={mannequinGender}
                className="mb-2 h-16 w-full rounded-lg border border-slate-200/70"
              />
              <div>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <h3 className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                    {preset.name}
                  </h3>
                  <span className="text-[9px] font-mono text-slate-400">
                    ({preset.vector.valence},{preset.vector.arousal})
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 line-clamp-1">{preset.nameEn}</p>
              </div>

              <div className="mt-2 pt-1.5 border-t border-slate-200/60 flex items-center justify-between text-[9px] text-slate-400 font-mono">
                <span className="uppercase">{preset.category}</span>
                {isSelected && (
                  <span className="text-indigo-600 font-bold flex items-center gap-0.5">
                    ● ACTIVE
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
