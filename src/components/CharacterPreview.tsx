import React, { useState, useRef, useEffect } from 'react';
import { useEmotionStore } from '../store/useEmotionStore';
import { Character } from '../types';
import {
  Upload,
  UserCheck,
  Plus,
  Eye,
  Activity,
  Edit3,
  Check,
  Sparkles,
  Layers,
  Info,
} from 'lucide-react';

export const CharacterPreview: React.FC = () => {
  const {
    activeCharacter,
    characters,
    setActiveCharacterId,
    addCharacter,
    updateActiveCharacter,
    facialState,
    vector,
  } = useEmotionStore();

  const [showSelector, setShowSelector] = useState(false);
  const [showMesh, setShowMesh] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(activeCharacter.name);
  const [editStyle, setEditStyle] = useState(activeCharacter.style || '');
  const [editAge, setEditAge] = useState(activeCharacter.age || '');
  const [editGender, setEditGender] = useState(activeCharacter.gender || '');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditName(activeCharacter.name);
    setEditStyle(activeCharacter.style || '');
    setEditAge(activeCharacter.age || '');
    setEditGender(activeCharacter.gender || '');
  }, [activeCharacter]);

  const handleSaveProfile = () => {
    updateActiveCharacter({
      name: editName,
      style: editStyle,
      age: editAge,
      gender: editGender,
    });
    setIsEditing(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        const newChar: Character = {
          id: `custom-${Date.now()}`,
          name: file.name.replace(/\.[^/.]+$/, '') || '自定义角色',
          image: base64,
          gender: '未知',
          age: '25',
          style: '自定义上传',
          description: '用户自定义上传角色图片',
        };
        addCharacter(newChar);
        setShowSelector(false);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-4 flex flex-col h-full shadow-xs relative overflow-hidden">
      {/* Top Banner & Control */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-600" />
          <h2 className="text-sm font-bold text-slate-800">角色3D与情绪视口 Performance Viewport</h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Overlay Mesh Toggle */}
          <button
            onClick={() => setShowMesh(!showMesh)}
            className={`px-2.5 py-1 text-[11px] rounded-lg border flex items-center gap-1 transition-all ${
              showMesh
                ? 'bg-indigo-50 border-indigo-200 text-indigo-600 font-medium'
                : 'bg-slate-100 border-slate-200 text-slate-500'
            }`}
            title="显示/隐藏 面部微表情网络网格"
          >
            <Activity className="w-3 h-3" />
            <span>网格网控</span>
          </button>

          {/* Switch Character */}
          <button
            onClick={() => setShowSelector(!showSelector)}
            className="px-2.5 py-1 text-[11px] rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium flex items-center gap-1 transition-all shadow-xs"
          >
            <UserCheck className="w-3 h-3" />
            <span>切换角色</span>
          </button>
        </div>
      </div>

      {/* Main Preview Container with Image & Dynamic Facial Overlay */}
      <div className="relative flex-1 rounded-2xl bg-[#181924] border border-slate-800 overflow-hidden flex items-center justify-center min-h-[300px]">
        {/* Background Image */}
        <img
          src={activeCharacter.image}
          alt={activeCharacter.name}
          className="w-full h-full object-cover transition-transform duration-500"
          style={{
            transform: `rotate(${facialState.face.headTilt * 0.4}deg) scale(${1 + Math.abs(facialState.face.headTilt) * 0.005})`,
          }}
        />

        {/* Ambient Dark Gradient for HUD Contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/30 pointer-events-none" />

        {/* HUD Overlay Badges matching reference screenshot */}
        <div className="absolute top-3 left-3 flex items-center gap-2 z-10">
          <span className="bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-mono px-2.5 py-1 rounded-lg border border-slate-700/60 flex items-center gap-1.5 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            <span>3D Emotion Sphere</span>
          </span>
        </div>

        <div className="absolute top-3 right-3 z-10">
          <span className="bg-slate-900/80 backdrop-blur-md text-slate-300 text-[10px] font-mono px-2.5 py-1 rounded-lg border border-slate-700/60">
            按住拖拽 3D 旋转
          </span>
        </div>

        {/* Interactive Micro-Expression Visualizer Overlay */}
        {showMesh && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
            <defs>
              <radialGradient id="muscleGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#818cf8" stopOpacity={facialState.face.muscleTension / 200} />
                <stop offset="100%" stopColor="#818cf8" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Muscle Tension Heat Glow */}
            {facialState.face.muscleTension > 30 && (
              <circle
                cx="50%"
                cy="42%"
                r="35%"
                fill="url(#muscleGlow)"
                className="animate-pulse"
              />
            )}

            {/* Eyebrows Vector */}
            <g
              transform={`translate(0, ${facialState.eyebrow.height * -0.3}) rotate(${facialState.face.headTilt * 0.3}, 200, 150)`}
              className="transition-all duration-300"
            >
              {/* Left Eyebrow */}
              <path
                d={`M 35% ${38 + facialState.eyebrow.height * 0.05}% Q 42% ${
                  36 - facialState.eyebrow.tension * 0.08
                }% 48% ${39 + facialState.eyebrow.tension * 0.05}%`}
                fill="none"
                stroke={facialState.eyebrow.tension > 60 ? '#f43f5e' : '#818cf8'}
                strokeWidth="2.5"
                strokeLinecap="round"
                opacity="0.85"
              />
              {/* Right Eyebrow */}
              <path
                d={`M 52% ${39 + facialState.eyebrow.tension * 0.05}% Q 58% ${
                  36 - facialState.eyebrow.tension * 0.08
                }% 65% ${38 + facialState.eyebrow.height * 0.05}%`}
                fill="none"
                stroke={facialState.eyebrow.tension > 60 ? '#f43f5e' : '#818cf8'}
                strokeWidth="2.5"
                strokeLinecap="round"
                opacity="0.85"
              />
            </g>

            {/* Eye Dots & Gaze Rays */}
            <g className="transition-all duration-300">
              {/* Left Eye */}
              <ellipse
                cx="41%"
                cy="44%"
                rx="4%"
                ry={`${2 + facialState.eye.openness * 0.05}%`}
                fill="none"
                stroke="#38bdf8"
                strokeWidth="1.8"
              />
              <circle
                cx={`${41 + (facialState.eye.direction === 'avoid gaze' ? -1.5 : facialState.eye.direction === 'cold stare' ? 0 : 0)}%`}
                cy={`${44 + (facialState.eye.direction === 'down' ? 1.5 : 0)}%`}
                r="1.5%"
                fill="#38bdf8"
              />

              {/* Right Eye */}
              <ellipse
                cx="59%"
                cy="44%"
                rx="4%"
                ry={`${2 + facialState.eye.openness * 0.05}%`}
                fill="none"
                stroke="#38bdf8"
                strokeWidth="1.8"
              />
              <circle
                cx={`${59 + (facialState.eye.direction === 'avoid gaze' ? -1.5 : 0)}%`}
                cy={`${44 + (facialState.eye.direction === 'down' ? 1.5 : 0)}%`}
                r="1.5%"
                fill="#38bdf8"
              />

              {/* Tear shimmer if present */}
              {(facialState.face.tearLevel ?? 0) > 20 && (
                <circle cx="41%" cy="47%" r="2%" fill="#60a5fa" className="animate-ping" opacity="0.6" />
              )}
            </g>

            {/* Mouth Curve Arc */}
            <g className="transition-all duration-300">
              <path
                d={`M 42% 62% Q 50% ${62 + facialState.mouth.curve * 0.12}% 58% 62%`}
                fill="none"
                stroke={facialState.mouth.curve > 20 ? '#34d399' : facialState.mouth.curve < -20 ? '#f87171' : '#a78bfa'}
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </g>
          </svg>
        )}

        {/* Bottom HUD Bar matching screenshot */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between z-20">
          <div className="bg-slate-950/90 backdrop-blur-md px-3 py-1 rounded-lg border border-slate-800 text-[11px] font-mono text-indigo-300 font-semibold shadow-xs">
            VALENCE {vector.valence > 0 ? `+${vector.valence}` : vector.valence} | AROUSAL {vector.arousal > 0 ? `+${vector.arousal}` : vector.arousal}
          </div>

          <div className="bg-slate-950/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-300">
            {activeCharacter.gender} · {activeCharacter.age}岁 · {activeCharacter.style}
          </div>
        </div>
      </div>

      {/* Character Profile Info & Edit Bar */}
      <div className="mt-3 bg-slate-50 rounded-xl p-2.5 border border-slate-200/80">
        {!isEditing ? (
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-800">{activeCharacter.name}</h3>
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-slate-400 hover:text-indigo-600 text-xs p-1"
                  title="编辑角色信息"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-xs text-slate-500 line-clamp-1">
                {activeCharacter.description || '已设定当前角色情感状态表现'}
              </p>
            </div>

            <div className="text-right">
              <span className="text-[10px] uppercase font-mono text-slate-400 block">STATUS</span>
              <span className="text-xs font-semibold text-indigo-600 flex items-center gap-1 justify-end">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
                3D 驱动中
              </span>
            </div>
          </div>
        ) : (
          <div className="space-y-2 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="角色姓名"
                className="bg-white border border-slate-300 rounded p-1.5 text-slate-800"
              />
              <input
                type="text"
                value={editStyle}
                onChange={(e) => setEditStyle(e.target.value)}
                placeholder="风格/职业"
                className="bg-white border border-slate-300 rounded p-1.5 text-slate-800"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={editGender}
                onChange={(e) => setEditGender(e.target.value)}
                placeholder="性别"
                className="bg-white border border-slate-300 rounded p-1.5 text-slate-800"
              />
              <input
                type="text"
                value={editAge}
                onChange={(e) => setEditAge(e.target.value)}
                placeholder="年龄"
                className="bg-white border border-slate-300 rounded p-1.5 text-slate-800"
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => setIsEditing(false)}
                className="px-2.5 py-1 text-slate-500 hover:text-slate-800"
              >
                取消
              </button>
              <button
                onClick={handleSaveProfile}
                className="px-3 py-1 bg-indigo-600 text-white rounded font-medium flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" /> 保存
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Character Selector Modal / Dropdown */}
      {showSelector && (
        <div className="absolute inset-0 bg-white/95 backdrop-blur-md z-30 p-4 flex flex-col rounded-2xl animate-in fade-in duration-200 border border-slate-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-indigo-600" />
              选择角色档案 Select Character Profile
            </h3>
            <button
              onClick={() => setShowSelector(false)}
              className="text-slate-500 hover:text-slate-800 text-xs px-2.5 py-1 bg-slate-100 rounded-lg"
            >
              关闭
            </button>
          </div>

          {/* Grid of Characters */}
          <div className="grid grid-cols-2 gap-3 overflow-y-auto my-3 flex-1 pr-1">
            {characters.map((char) => (
              <div
                key={char.id}
                onClick={() => {
                  setActiveCharacterId(char.id);
                  setShowSelector(false);
                }}
                className={`group relative rounded-xl border p-2 cursor-pointer transition-all flex items-center gap-2.5 ${
                  activeCharacter.id === char.id
                    ? 'border-indigo-500 bg-indigo-50 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <img
                  src={char.image}
                  alt={char.name}
                  className="w-12 h-12 rounded-lg object-cover border border-slate-200"
                />
                <div className="overflow-hidden">
                  <h4 className="text-xs font-bold text-slate-800 truncate">{char.name}</h4>
                  <p className="text-[10px] text-slate-500 truncate">{char.style || '传统表现'}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Custom Upload Button */}
          <div className="pt-2 border-t border-slate-200">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2 bg-slate-50 hover:bg-slate-100 border border-dashed border-indigo-300 rounded-xl text-xs font-medium text-indigo-600 flex items-center justify-center gap-2 transition-all"
            >
              <Upload className="w-4 h-4 text-indigo-600" />
              上传自定义角色图片 Custom Character Upload
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />
          </div>
        </div>
      )}
    </div>
  );
};
