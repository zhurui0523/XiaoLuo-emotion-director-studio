import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useEmotionStore } from '../store/useEmotionStore';
import { Compass, Move, Maximize2, ShieldAlert, Sparkles, HeartHandshake, Zap, Sliders } from 'lucide-react';
import { deriveEmotionLabelFromVector } from '../data/presets';

export const EmotionMap: React.FC = () => {
  const { vector, setVector } = useEmotionStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Convert Valence (-100 to 100) and Arousal (-100 to 100) to percentage (0% to 100%)
  // Valence X: -100 (left) to +100 (right)
  // Arousal Y: +100 (top) to -100 (bottom) -> so Y% = (100 - Arousal)/2
  const posX = ((vector.valence + 100) / 200) * 100;
  const posY = ((100 - vector.arousal) / 200) * 100;

  const handlePointerUpdate = useCallback(
    (e: React.PointerEvent<HTMLDivElement> | PointerEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
      const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));

      // Calculate valence (-100 to +100) and arousal (-100 to +100)
      const valPercent = x / rect.width;
      const aroPercent = y / rect.height;

      const newValence = Math.round(valPercent * 200 - 100);
      const newArousal = Math.round(100 - aroPercent * 200);

      setVector({
        valence: Math.max(-100, Math.min(100, newValence)),
        arousal: Math.max(-100, Math.min(100, newArousal)),
        distance: vector.distance,
      });
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

  const emotionInfo = deriveEmotionLabelFromVector(vector);

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-4 flex flex-col h-full shadow-xs relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-indigo-600 animate-spin-slow" />
          <h2 className="text-sm font-bold text-slate-800">
            情绪二维控制空间 (VALENCE-AROUSAL MATRIX)
          </h2>
        </div>

        <div className="flex items-center gap-1.5 font-mono text-xs">
          <span className="px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold">
            X: {vector.valence}
          </span>
          <span className="px-2 py-0.5 rounded-md bg-purple-50 border border-purple-100 text-purple-700 font-bold">
            Y: {vector.arousal}
          </span>
          <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-600 font-semibold">
            Z: {vector.distance}
          </span>
        </div>
      </div>

      {/* 5x5 Grid 2D Valence-Arousal Canvas */}
      <div className="relative flex-1 w-full min-h-[280px] max-h-[380px] bg-slate-50 rounded-2xl border border-slate-200/80 p-2 flex flex-col select-none">
        {/* Y Axis Top Label: 高度激活 Arousal +100 */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[10px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 z-10 flex items-center gap-1 shadow-xs">
          <Zap className="w-3 h-3 text-amber-600" />
          <span>+100 情绪激活 (激动/充沛)</span>
        </div>

        {/* Y Axis Bottom Label: 平静 Arousal -100 */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] font-medium text-slate-500 bg-white px-2.5 py-0.5 rounded-full border border-slate-200 z-10 shadow-xs">
          -100 平静沉寂 (静息/休眠)
        </div>

        {/* X Axis Left Label: 亲近 Valence -100 */}
        <div className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-2 rounded-xl border border-indigo-200 z-10 flex flex-col items-center gap-1 shadow-xs">
          <HeartHandshake className="w-3.5 h-3.5 text-indigo-600" />
          <span>-100 亲近</span>
        </div>

        {/* X Axis Right Label: 疏离 Valence +100 */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-2 rounded-xl border border-rose-200 z-10 flex flex-col items-center gap-1 shadow-xs">
          <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
          <span>+100 疏离</span>
        </div>

        {/* Interactive Matrix Area */}
        <div
          ref={containerRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="relative w-full h-full rounded-xl cursor-crosshair overflow-hidden touch-none bg-white"
          style={{
            backgroundImage: `
              radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.06) 0%, transparent 70%),
              linear-gradient(to right, rgba(203, 213, 225, 0.4) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(203, 213, 225, 0.4) 1px, transparent 1px)
            `,
            backgroundSize: '100% 100%, 20% 20%, 20% 20%',
          }}
        >
          {/* Axis Crosslines */}
          <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-indigo-300 border-r border-dashed border-indigo-400/50" />
          <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-indigo-300 border-b border-dashed border-indigo-400/50" />

          {/* 5x5 Grid Zone Labels background */}
          <div className="absolute inset-0 grid grid-cols-5 grid-rows-5 pointer-events-none p-2 text-[9px] font-mono opacity-40 text-slate-400 font-medium">
            <div className="flex items-start justify-start">狂喜/执念</div>
            <div className="flex items-start justify-center">兴奋/热烈</div>
            <div className="flex items-start justify-center">高能激活</div>
            <div className="flex items-start justify-center">怒火/警惕</div>
            <div className="flex items-start justify-end">压迫/反派</div>

            <div className="flex items-center justify-start">宠溺/病娇</div>
            <div className="flex items-center justify-center">欢愉</div>
            <div className="flex items-center justify-center">正向表达</div>
            <div className="flex items-center justify-center">克制/紧绷</div>
            <div className="flex items-center justify-end">霸总/冷漠</div>

            <div className="flex items-center justify-start">亲密无间</div>
            <div className="flex items-center justify-center">温情</div>
            <div className="flex items-center justify-center font-bold text-indigo-600">原点 (0,0)</div>
            <div className="flex items-center justify-center">距离</div>
            <div className="flex items-center justify-end">极度疏离</div>

            <div className="flex items-center justify-start">温柔期待</div>
            <div className="flex items-center justify-center">舒缓</div>
            <div className="flex items-center justify-center">淡然自若</div>
            <div className="flex items-center justify-center">沉思</div>
            <div className="flex items-center justify-end">寒心/避视</div>

            <div className="flex items-end justify-start">沉醉/释然</div>
            <div className="flex items-end justify-center">安宁</div>
            <div className="flex items-end justify-center">平静休眠</div>
            <div className="flex items-end justify-center">悲伤/落寞</div>
            <div className="flex items-end justify-end">绝望/冷酷</div>
          </div>

          {/* Draggable Control Ball Indicator */}
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 transition-transform duration-75 pointer-events-none z-20"
            style={{
              left: `${posX}%`,
              top: `${posY}%`,
            }}
          >
            {/* Ripple Animation Outer Rings */}
            <div className="w-10 h-10 -ml-2 -mt-2 rounded-full border border-indigo-500/50 animate-ping opacity-40" />
            <div className="w-6 h-6 rounded-full bg-indigo-600 border-2 border-white shadow-md flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-white" />
            </div>

            {/* Floating Coordinate Label Badge */}
            <div className="absolute top-7 left-1/2 -translate-x-1/2 whitespace-nowrap bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-[11px] text-slate-800 font-semibold shadow-md pointer-events-none flex items-center gap-1.5">
              <span className="text-indigo-600 font-bold">{emotionInfo.title}</span>
              <span className="text-slate-400 text-[10px]">({vector.valence}, {vector.arousal})</span>
            </div>
          </div>
        </div>
      </div>

      {/* Z-Axis Distance Slider (情绪心理距离) */}
      <div className="mt-3 bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 min-w-[120px]">
          <Sliders className="w-3.5 h-3.5 text-indigo-600" />
          <span className="font-semibold text-slate-700 text-xs">Z-心理疏离度:</span>
        </div>

        <input
          type="range"
          min="-100"
          max="100"
          value={vector.distance}
          onChange={(e) =>
            setVector({
              ...vector,
              distance: parseInt(e.target.value),
            })
          }
          className="flex-1 cursor-pointer"
        />

        <span className="font-mono text-indigo-600 font-bold w-8 text-right bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
          {vector.distance}
        </span>
      </div>
    </div>
  );
};
