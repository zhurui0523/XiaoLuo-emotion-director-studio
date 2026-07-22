import React, { useRef, useState, useCallback } from 'react';
import { useEmotionStore } from '../store/useEmotionStore';
import { deriveEmotionLabelFromVector } from '../data/presets';
import { BookmarkCheck, ChevronDown, ChevronUp, Film, Mars, ScanFace, Sliders, Venus, Wand2 } from 'lucide-react';
import { MannequinHeadViewport } from './MannequinHeadViewport';
import { FacialParameterPanel } from './FacialParameterPanel';
import { EmotionPresets } from './EmotionPresets';
import { PromptGenerator } from './PromptGenerator';
import { EmotionTimeline } from './EmotionTimeline';

export const MinimalMatrixStudio: React.FC = () => {
  const {
    vector,
    setVector,
    activeCharacter,
    characters,
    setActiveCharacterId,
    facialState,
  } = useEmotionStore();

  const [showMesh, setShowMesh] = useState(false);
  const [expandedSection, setExpandedSection] = useState<'none' | 'sliders' | 'presets' | 'prompt' | 'timeline'>('none');

  const emotionInfo = deriveEmotionLabelFromVector(vector);
  const mannequinGender = activeCharacter.gender === '女' ? 'female' : 'male';

  const handleGenderChange = (gender: '男' | '女') => {
    const matchingCharacter = characters.find((character) => character.gender === gender);
    if (matchingCharacter) setActiveCharacterId(matchingCharacter.id);
  };

  // Map 5x5 Grid Positions
  // Grid Cols: 0 -> Valence -100 (亲近), 1 -> -50, 2 -> 0, 3 -> 50, 4 -> +100 (疏离)
  // Grid Rows: 0 -> Arousal +100 (激动), 1 -> 50, 2 -> 0, 3 -> -50, 4 -> -100 (平静)

  // Determine current active grid indices (0 to 4)
  const activeCol = Math.max(0, Math.min(4, Math.round((vector.valence + 100) / 50)));
  const activeRow = Math.max(0, Math.min(4, Math.round((100 - vector.arousal) / 50)));

  const matrixRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleSelectGrid = (row: number, col: number) => {
    const newValence = Math.round((col - 2) * 50);
    const newArousal = Math.round((2 - row) * 50);
    setVector({
      valence: newValence,
      arousal: newArousal,
      distance: vector.distance,
    });
  };

  const handlePointerUpdate = useCallback(
    (e: React.PointerEvent<HTMLDivElement> | PointerEvent) => {
      if (!matrixRef.current) return;
      const rect = matrixRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
      const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));

      const col = Math.max(0, Math.min(4, Math.floor((x / rect.width) * 5)));
      const row = Math.max(0, Math.min(4, Math.floor((y / rect.height) * 5)));

      handleSelectGrid(row, col);
    },
    [setVector, vector.distance]
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    handlePointerUpdate(e);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      handlePointerUpdate(e);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
  };

  return (
    <div className="w-full space-y-4">
      {/* Main Minimal Dark Layout matching user screenshot */}
      <div className="bg-[#121319] border border-slate-800/80 rounded-3xl p-5 md:p-6 shadow-2xl text-slate-100 relative overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
          
          {/* Left Side: 3D Mannequin Head Viewport (col-span-7) */}
          <div className="md:col-span-7 flex flex-col justify-between space-y-4">
            <div className="relative w-full h-[280px] md:h-[320px] rounded-2xl bg-[#0d0e14] border border-slate-800/80 overflow-hidden flex items-center justify-center group shadow-inner">
              <button
                type="button"
                aria-pressed={showMesh}
                onClick={() => setShowMesh((current) => !current)}
                className={`absolute right-3 top-3 z-20 flex items-center gap-1.5 rounded-lg border px-2.5 py-2 text-[11px] font-semibold shadow-lg backdrop-blur-md transition-all ${
                  showMesh
                    ? 'border-blue-300/40 bg-blue-500/25 text-blue-100'
                    : 'border-white/10 bg-black/45 text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <ScanFace className="h-3.5 w-3.5" />
                {showMesh ? '隐藏网格' : '显示网格'}
              </button>

              {/* Realistic clay mannequin with dynamic facial morphing */}
              <MannequinHeadViewport
                facialState={facialState}
                gender={mannequinGender}
                emotionName={emotionInfo.subtitle}
                showMesh={showMesh}
              />
            </div>

            {/* Bottom Text matching screenshot: 情绪定位 淡然自若 */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-1">
              <div className="flex items-baseline gap-3">
                <span className="text-slate-400 font-medium text-sm md:text-base tracking-wider">
                  情绪定位
                </span>
                <span className="text-white font-extrabold text-xl md:text-2xl tracking-wide">
                  {emotionInfo.title}
                </span>
              </div>
              <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-slate-900/80 p-1 text-[11px] text-slate-300 shadow-lg">
                <span className="flex items-center gap-1 px-1.5 font-medium text-slate-400">
                  <ScanFace className="h-3.5 w-3.5" />
                  模型
                </span>
                <button
                  type="button"
                  aria-pressed={mannequinGender === 'male'}
                  onClick={() => handleGenderChange('男')}
                  className={`flex items-center gap-1 rounded-lg px-2 py-1.5 font-semibold transition-all ${
                    mannequinGender === 'male'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Mars className="h-3.5 w-3.5" />
                  男性
                </button>
                <button
                  type="button"
                  aria-pressed={mannequinGender === 'female'}
                  onClick={() => handleGenderChange('女')}
                  className={`flex items-center gap-1 rounded-lg px-2 py-1.5 font-semibold transition-all ${
                    mannequinGender === 'female'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Venus className="h-3.5 w-3.5" />
                  女性
                </button>
              </div>
            </div>
          </div>

          {/* Right Side: 5x5 Dot Matrix Controller (col-span-5) matching user reference screenshot */}
          <div className="md:col-span-5 flex flex-col">
            <div className="bg-[#1a1b26] border border-slate-800/80 rounded-2xl p-5 flex-1 flex flex-col justify-between relative shadow-lg">
              
              {/* Matrix Label: Top (激动) */}
              <div className="text-center font-bold text-slate-300 text-sm tracking-wider py-1 select-none">
                激动
              </div>

              {/* Middle Row containing Left Label (亲近), 5x5 Grid, and Right Label (疏离) */}
              <div className="flex items-center justify-between my-2">
                {/* Left Label: 亲近 */}
                <div className="w-10 text-center font-bold text-slate-300 text-sm tracking-wider select-none shrink-0">
                  亲近
                </div>

                {/* 5x5 Matrix Area */}
                <div
                  ref={matrixRef}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  className="flex-1 max-w-[280px] aspect-square mx-2 bg-[#12131a] rounded-2xl border border-slate-800/80 p-4 grid grid-cols-5 grid-rows-5 gap-3 items-center justify-items-center cursor-pointer select-none touch-none shadow-inner"
                >
                  {[0, 1, 2, 3, 4].map((r) =>
                    [0, 1, 2, 3, 4].map((c) => {
                      const isSelected = r === activeRow && c === activeCol;
                      const isCrosshair = r === activeRow || c === activeCol;

                      return (
                        <div
                          key={`${r}-${c}`}
                          onClick={() => handleSelectGrid(r, c)}
                          className="w-full h-full flex items-center justify-center relative group"
                        >
                          {isSelected ? (
                            /* Large Glowing White Center Dot */
                            <div className="w-5 h-5 rounded-full bg-white shadow-[0_0_18px_rgba(255,255,255,1)] transform scale-125 transition-all duration-150 relative z-10 flex items-center justify-center">
                              <div className="w-2 h-2 rounded-full bg-slate-900/20" />
                            </div>
                          ) : isCrosshair ? (
                            /* Active Crosshair Dot (Glowing Medium White) */
                            <div className="w-3.5 h-3.5 rounded-full bg-white/90 shadow-[0_0_8px_rgba(255,255,255,0.6)] transition-all duration-150" />
                          ) : (
                            /* Muted Off-grid Dot */
                            <div className="w-2.5 h-2.5 rounded-full bg-slate-700/60 group-hover:bg-slate-500 transition-all duration-150" />
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Right Label: 疏离 */}
                <div className="w-10 text-center font-bold text-slate-300 text-sm tracking-wider select-none shrink-0">
                  疏离
                </div>
              </div>

              {/* Matrix Label: Bottom (平静) */}
              <div className="text-center font-bold text-slate-300 text-sm tracking-wider py-1 select-none">
                平静
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Accordion / Drawer Tabs for Detailed Controls */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800 tracking-wider">
            参数面板
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setExpandedSection(expandedSection === 'sliders' ? 'none' : 'sliders')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                expandedSection === 'sliders'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>面部微表情解剖</span>
              {expandedSection === 'sliders' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={() => setExpandedSection(expandedSection === 'presets' ? 'none' : 'presets')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                expandedSection === 'presets'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700'
              }`}
            >
              <BookmarkCheck className="w-3.5 h-3.5" />
              <span>25个演员情绪预设</span>
              {expandedSection === 'presets' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={() => setExpandedSection(expandedSection === 'prompt' ? 'none' : 'prompt')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                expandedSection === 'prompt'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700'
              }`}
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>AI Prompt生成</span>
              {expandedSection === 'prompt' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={() => setExpandedSection(expandedSection === 'timeline' ? 'none' : 'timeline')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                expandedSection === 'timeline'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              <span>表演动画时间轴</span>
              {expandedSection === 'timeline' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Dynamic Expanded Panel Content */}
        {expandedSection === 'sliders' && (
          <div className="pt-2 animate-in fade-in duration-200">
            <FacialParameterPanel />
          </div>
        )}

        {expandedSection === 'presets' && (
          <div className="pt-2 animate-in fade-in duration-200">
            <EmotionPresets />
          </div>
        )}

        {expandedSection === 'prompt' && (
          <div className="pt-2 animate-in fade-in duration-200">
            <PromptGenerator />
          </div>
        )}

        {expandedSection === 'timeline' && (
          <div className="pt-2 animate-in fade-in duration-200">
            <EmotionTimeline />
          </div>
        )}
      </div>
    </div>
  );
};
